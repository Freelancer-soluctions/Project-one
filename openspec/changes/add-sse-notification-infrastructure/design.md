## Context

The ERP system currently delivers real-time notifications via Socket.IO, which is a full-duplex WebSocket protocol. While suitable for interactive features (mentions, future chat), Socket.IO adds unnecessary overhead for one-way server-to-client notification delivery (order confirmations, status changes, alerts).

Server-side, `notificationBus.js` acts as a local EventEmitter — services emit events, and listeners (currently Socket.IO) deliver them to connected clients. This works within a single process but does not natively handle multiple server instances. No cross-instance delivery mechanism exists.

The frontend uses the `useSocket` hook for all real-time communication. There is no dedicated notification stream hook.

**Constraints:**
- No modifications to existing Socket.IO infrastructure or its specs
- Must support horizontal scaling (multiple server instances)
- Must coexist gracefully alongside Socket.IO connections
- Must use existing JWT auth (HTTP-only cookies)
- Must use existing `notificationBus.js` as the event source

## Goals / Non-Goals

**Goals:**
- Implement `SseManager` — in-memory connection registry with Map-based topology
- Define SSE wire format with standard event/data/id framing plus keepalive
- Cross-instance delivery via Redis Pub/Sub using `ioredis`
- Full connection lifecycle management (open → heartbeat → reconnect → close)
- Channel naming convention: `user:<id>`, `event:<id>`, `global`
- Bridge `notificationBus.js` events into SSE delivery pipeline
- Authenticate SSE connections via JWT from HTTP-only cookie
- Provide Nginx configuration template for SSE support
- Implement graceful shutdown (drain connections, unsubscribe Redis)
- Ensure Socket.IO and SSE coexist via shared bus with separate delivery paths

**Non-Goals:**
- No modifications to Socket.IO code, configuration, or behavior
- No changes to existing `notificationBus.js` beyond adding `BUS_EVENTS` constants
- No persistent message store or history (backlog limited to reconnection window)
- No client-side reconnection logic beyond native `EventSource` behavior
- No message prioritization or QoS guarantees
- No SSR or server-side rendering support for the `useNotificationStream` hook
- No entity-level access control for `event:<id>` channels (trust boundary, see below)

## Decisions

### 1. SseManager Connection Registry Design

**Decision:** Dual-Map topology: `Map<userId, Set<Response>>` for user-routed delivery, `Map<channel, Set<Response>>` for channel-routed broadcast.

**Rationale:**
- User-scoped Map enables O(1) lookup when delivering notifications tied to a specific user (the most common case: "order X for user Y is confirmed")
- Channel-scoped Map enables efficient fan-out for broadcast channels like `global` or `event:<id>` where multiple users listen to the same topic
- Using `Set<Response>` prevents duplicate registrations of the same connection
- When a connection closes, it must be removed from both maps — the `Response` object itself carries a `userId` and set of subscribed `channels` for efficient cleanup

**Alternatives considered:**
- Single Map with channel-only indexing: Rejected because user-targeted delivery would require iterating all channels to find matching user connections
- WeakRef-based auto-cleanup: Rejected due to non-deterministic GC timing; explicit cleanup on `close` is more reliable

#### Backpressure & Flow Control

`res.write()` returns `false` when the internal stream buffer is full (client consuming slowly). Without handling this, Node.js buffers data unboundedly in kernel memory, leading to OOM under sustained load.

**Design:**
- Per-connection send queue with configurable high-water mark (default: 1000 queued events)
- When `res.write()` returns `false`, the event is enqueued; subsequent events are enqueued until the high-water mark is reached
- When high-water mark exceeded → close connection with `event: overflow` → client `onerror` fires → reconnect via `Last-Event-ID` (if within ring buffer window)
- Metric: `sse_connections_overflowed_total` (counter)

#### Stream Error Handling

When a client disconnects mid-write, `res.write()` throws `EPIPE` or `ERR_STREAM_DESTROYED`. A single failed write inside a multi-user delivery loop can crash the entire fan-out.

**Design:**
- Register `res.on('error', ...)` handler at subscription time
- In `sendToUser` / `sendToChannel` write loop: wrap `res.write()` in try-catch
- On error: remove `Response` from both Maps (`userId` and `channel`), increment `sse_delivery_errors_total`
- Error handler and write-loop catch share the same cleanup path to prevent duplicate removal

### 2. SSE Wire Format

**Decision:** Standard `text/event-stream` format with `event:`, `data:`, `id:` fields plus `:keepalive` heartbeat.

```
event: notification
id: 42
data: {"type":"order_confirmed","payload":{"orderId":"ORD-123","status":"confirmed"}}

:keepalive

```

- **event:** names the notification type for client-side `EventSource` `addEventListener` routing
- **data:** JSON payload — exactly one `data:` line per event (no multi-line), `\n\n` terminates
- **id:** Monotonic counter per-connection for `Last-Event-ID` reconnection support
- **`:keepalive`** : Comment-only line sent every 30s to prevent proxy/NAT timeouts; ignored by browser `EventSource` per spec

### 3. Redis Pub/Sub Cross-Instance Architecture

**Decision:** Use `ioredis` (already in the project dependency orbit) for Redis Pub/Sub with a dedicated `sse:` channel prefix.

**Architecture:**
- Each server instance creates two Redis connections: one for Pub/Sub (subscribe), one for publishing
- On receiving a `notificationBus` event, the local SseManager delivers it immediately to local connections AND publishes it to Redis channel `sse:<eventType>`
- Other instances receive the message via their subscribed Redis channel and deliver to their local connections via SseManager
- Redis subscription uses pattern-based subscription `sse:*` for flexibility

```
Instance A                   Redis                       Instance B
    |                          |                             |
    |-- publish sse:order ---->|                             |
    |                          |-- broadcast to all sse:* ---|
    |                          |   subscribers               |-- deliver to local connections
    |                          |                             |
```

**Rationale:** Redis Pub/Sub is lightweight, fire-and-forget, and requires no message persistence. SSE is inherently ephemeral — if a message arrives for an instance with no interested connections, it's safely ignored.

#### Message Flow (Critical — Infinite Loop Prevention)

```
Redis message → redisBridge.onMessage()
                    ↓
              SseManager.deliverToUser() / deliverToChannel()
                    ✕ Does NOT call busBridge
                    ✕ Does NOT emit to notificationBus
```

- All cross-instance messages carry `_origin: 'redis'` flag
- `busBridge` SHALL inspect each event's origin flag
- If `_origin: 'redis'` → busBridge ignores the event entirely
- This prevents: Instance A publishes → Instance B receives → busBridge catches → re-publishes → infinite loop

### 4. Connection Lifecycle

```
[Open] → [Authenticate] → [Subscribe] → [Heartbeat] → [Close]
                        ↕                            ↕
                  [Authorization]           [Reconnection via Last-Event-ID]
```

- **Open:** Client opens `EventSource` to `/api/v1/sse/subscribe?channels=user:42,global`
- **Authenticate:** Express middleware validates JWT from `Cookie` header; 401 if invalid; client SHALL NOT reconnect on 401
- **Subscribe:** SseManager registers `Response` in both `userId` and `channel` maps; sends initial `id: 0` event as confirmation
- **Heartbeat:** Every 30s, `:keepalive\n\n` is written to each connection's response stream. Keepalive does NOT reset the idle timer — only application-level events reset it.
- **Reconnection:** On disconnect, browser `EventSource` automatically retries with `Last-Event-ID` header; server reads it and replays buffered events from an in-memory ring buffer (last 50 events per connection)
- **Close:** Client calls `eventSource.close()`, or TCP connection drops; SseManager removes from all maps

#### Memory Budget: Ring Buffer

- Per-connection ring buffer: last 50 events
- Global ring buffer memory limit: `SSE_RING_BUFFER_MEMORY_MAX` env var (default 200MB)
- When global limit exceeded → oldest events evicted across ALL connections (not per-connection)
- Metric: `sse_ring_buffer_memory_bytes` (gauge)

### 5. Channel Naming Convention

| Channel Pattern | Example | Purpose |
|---|---|---|
| `user:<id>` | `user:42` | Notifications addressed to a single user |
| `event:<id>` | `event:order-123` | Notifications about a specific entity/resource |
| `global` | `global` | Broadcast to all connected clients |

**Authorization rules:**
- `user:<id>`: Only the authenticated user whose ID matches `<id>` may subscribe. Unauthorized attempt → full connection rejection with HTTP 403
- `event:<id>`: Any authenticated user may subscribe (entity-level visibility)
- `global`: Any authenticated user may subscribe (system-wide broadcast)

**Trust Boundary:** `event:<id>` subscriptions grant access to ALL notifications for that entity ID, regardless of user permissions. Entity-level authorization is deferred. If a user can guess a valid `event:<id>`, they will receive all notifications for that entity.

### 6. Integration with notificationBus.js

**Decision:** Create `busBridge.js` as an intermediary module that subscribes to `notificationBus` events and forwards them to `SseManager`.

**Flow:**
```
Service → notificationBus.emit('order.confirmed', payload)
              ↓
        busBridge.js (listens)
              ↓
        SseManager.deliverToUser(userId, event, payload)
        SseManager.deliverToChannel(channel, event, payload)
              ↓
        redisBridge.js (cross-instance delivery)
```

- `busBridge.js` imports `BUS_EVENTS` constants from `notificationBus.js`
- For each event: determines target user(s) and channel(s), then calls SseManager
- `BUS_EVENTS` constant addition to `notificationBus.js` is the **only** modification to existing files
- busBridge SHALL inspect `_origin` flag and ignore events with `_origin: 'redis'`
- busBridge MUST NOT emit back to notificationBus when forwarding events to SseManager

#### Listener Cleanup (Hot-Reload Safety)

- On `SseManager.destroy()` or hot-reload: MUST remove all busBridge listeners before re-registering
- Call `notificationBus.removeAllListeners('sse:*')` or track listener references explicitly
- Without cleanup, each hot-reload accumulates duplicate listeners → duplicate delivery + memory leak

### 7. Auth Flow: JWT from HTTP-only Cookie

**Decision:** SSE endpoint validates JWT from the `Cookie` header (not query params or Authorization header).

**Configuration:** Cookie name defined by `SSE_COOKIE_NAME` env var (default: `"token"`). Must match the existing auth cookie set by the login endpoint.

**Rationale:**
- HTTP-only cookies are more secure (not accessible to JS) and align with existing app auth
- `EventSource` supports `{ withCredentials: true }` which sends cookies automatically
- No JWT leak risk from URLs (query params appear in server logs)

**Flow:**
1. Client creates `new EventSource(url, { withCredentials: true })` — browser attaches Cookie header automatically
2. Express middleware: `parseCookies(req)` → extract JWT from cookie `SSE_COOKIE_NAME` → `jwt.verify(token, SECRET)`
3. If missing/expired/invalid → 401 response; EventSource fires `onerror`; client hook SHALL detect and stop reconnecting
4. If valid → extract `userId` from JWT payload → attach to `req.sseUser` → continue to route handler
5. Route handler subscribes to requested channels (validates `user:<id>` matches `req.sseUser.id`)

**Known Limitation — JWT expiry during long-lived SSE connections:**

SSE connections can last hours. If the JWT expires mid-session, the connection continues (SSE doesn't re-authenticate after initial handshake). However:
- When EventSource reconnects (transient blip), it carries the expired cookie → 401 → permanent failure
- Silent token refresh for SSE is deferred: the client-side hook could refresh the cookie via `/auth/refresh` before JWT expiry, but this is out of scope for the initial implementation
- Workaround: use long-lived JWT for SSE (separate from short-lived API tokens), or keep the SSE session JWT valid for the max expected connection duration

**CORS Requirement:**

The SSE endpoint requires `{ withCredentials: true }`. The server's CORS config must:
- Set `Access-Control-Allow-Credentials: true`
- Set `Access-Control-Allow-Origin` to the exact client origin (cannot be `*`)
- Existing `corsOptions` in the Express app must be verified to not block the SSE path

### 8. Nginx Configuration

SSE requires specific Nginx directives to prevent buffering and connection termination:

```nginx
location /api/v1/sse/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;                         # Required for chunked transfer encoding
    proxy_set_header Connection '';                  # HTTP/1.1 keepalive to upstream
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_buffering off;                             # Disable response buffering
    proxy_cache off;                                 # Never cache SSE responses
    proxy_read_timeout 65s;                          # Matches keepAliveTimeout (60s + buffer)

    # SSE-specific
    proxy_set_header X-Accel-Buffering no;
}
```

**Note:** `proxy_read_timeout` is set to 65s (slightly above the 60s `keepAliveTimeout` in `index.js`). The keepalive heartbeat at 30s ensures the connection stays active well within this window.

### 9. Graceful Shutdown

**Sequence:**
1. Process receives `SIGTERM` / `SIGINT`
2. Set health check to unhealthy (load balancer stops routing new traffic)
3. Send `event: shutdown` to all connected SSE clients (so client hook can show "server going down for maintenance")
4. Drain SSE connections: wait up to `SSE_DRAIN_TIMEOUT` (default 10s) for clients to reconnect to another instance
5. Unsubscribe from Redis Pub/Sub
6. Remove all `notificationBus` listeners
7. Close all SSE response streams
8. Exit process

## Risks & Trade-offs

| Risk | Mitigation |
|---|---|
| Redis Pub/Sub message loss on network split | Acceptable: SSE is ephemeral; reconnect replays last 50 events |
| Memory exhaustion from ring buffers | Global `SSE_RING_BUFFER_MEMORY_MAX` limit; oldest evicted |
| Stream write errors crash delivery loop | Per-connection error handler + try-catch in write loop |
| Slow consumer memory pressure | Backpressure queue with high-water mark; overflow → disconnect |
| EventSource 401 ambiguity (onerror vs network error) | Client hook: 3+ consecutive errors → assume permanent, stop reconnect |
| Hot-reload listener leak | Explicit removeAllListeners on SseManager.destroy() |
| Nginx buffering kills SSE streaming | Explicit `proxy_buffering off; proxy_http_version 1.1;` |

## Migration Plan

1. Implement Phase 1 (SseManager core) + Phase 2 (auth/routes) — SSE endpoint exists but only local delivery
2. Implement Phase 3 (busBridge) — SSE begins receiving notificationBus events alongside Socket.IO
3. Implement Phase 4 (redisBridge) — cross-instance delivery enabled
4. Implement Phase 5 (client hook) — frontend can opt into SSE
5. Gradual adoption: new features use SSE; Socket.IO remains for interactive features
6. Monitoring and tuning: observe connection counts, delivery errors, memory usage

## Rollback Strategy

- **Per-task rollback:** Each task produces a single file or isolated change; revert individual commits
- **Feature flag:** SSE endpoint availability gated by `SSE_ENABLED` env var (default: `false`)
- **Full rollback:** Stop SSE endpoint → remove busBridge listeners → Socket.IO continues working unchanged

## Open Questions (Deferred)

| Question | Resolution |
|---|---|
| Should `event:<id>` support wildcard patterns (e.g., `event:order-*`)? | Post-MVP |
| Should SSE have its own rate limiter separate from API rate limits? | Post-MVP; initial impl reuses existing rate limiter |
| Should we implement a dedicated SSE test page in development mode? | Post-MVP |
| What is the exact `SSE_COOKIE_NAME` in production? | Must match existing login cookie. Configurable via env var. |
