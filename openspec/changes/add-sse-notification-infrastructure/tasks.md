## 1. Core: SseManager + keepAlive + Config

- [ ] 1.1 Create `server/lib/sse/SseManager.js` with dual-Map data structure (`Map<userId, Set<Response>>` and `Map<channel, Set<Response>>`)
- [ ] 1.2 Implement `subscribe(response, userId, channels)` — register connection in both user and channel Maps
- [ ] 1.3 Implement `unsubscribe(response)` — remove connection from userId Map and all subscribed channel Maps
- [ ] 1.4 Implement `sendToUser(userId, event, data)` — O(1) lookup via user Map, write event to all associated Response streams
- [ ] 1.5 Implement `sendToChannel(channel, event, data)` — O(1) lookup via channel Map, write event to all subscribed Response streams
- [ ] 1.6 Implement `broadcast(event, data)` — iterate all connected users, send to all
- [ ] 1.7 Implement SSE wire format helper — write `event:`, `data:`, `id:`, double-newline framing per spec
- [ ] 1.8 Implement per-connection monotonic event ID counter for `Last-Event-ID` support
- [ ] 1.9 Implement in-memory ring buffer (last 50 events per connection) for reconnection backlog replay
- [ ] 1.10 Implement connection limits: configurable max per-user and per-instance limits; reject with 503 or close oldest
- [ ] 1.11 Implement idle timeout — close connections inactive for configurable duration, cleanup Maps
- [ ] 1.12 Create `server/lib/sse/keepAlive.js` — setInterval helper sending `:keepalive\n\n` every 30s to all connections
- [ ] 1.13 Implement graceful shutdown — stop accepting new connections, send `event: shutdown`, close all streams, clean up Maps
- [ ] 1.14 Create `server/lib/sse/config.js` with defaults: maxConnectionsPerUser, maxConnectionsTotal, idleTimeoutMs, keepAliveIntervalMs, ringBufferSize, drainTimeoutMs
- [ ] 1.15 Create `server/lib/sse/index.js` barrel export for SseManager, keepAlive, config
- [ ] 1.16 Add stream error handler `res.on('error')` on each connection at subscription time
- [ ] 1.17 Add backpressure: per-connection send queue with configurable high-water mark
- [ ] 1.18 When send queue saturated → close connection with `event: overflow`
- [ ] 1.19 Global ring buffer memory limit: evict oldest across connections when > limit
- [ ] 1.20 idle timeout: heartbeats do NOT reset timer

## 2. Auth + Routes + Channels

- [ ] 2.1 Create `server/lib/sse/auth.js` middleware — extract JWT from `Cookie` header, verify, attach decoded `userId` to `req`
- [ ] 2.2 Handle auth failures — return 401 for missing, expired, or invalid JWT; close connection immediately
- [ ] 2.3 Create `server/lib/sse/channels.js` — validate channel names against known patterns (`user:*`, `event:*`, `global`)
- [ ] 2.4 Implement channel authorization — allow `user:<id>` only if authenticated userId matches; allow `event:*` and `global` for any authenticated user
- [ ] 2.5 Return 400 for unknown/malformed channel patterns with descriptive error
- [ ] 2.6 Implement default channel subscription (`user:<userId>`, `global`) when no `channels` query param provided
- [ ] 2.7 Create SSE route at `GET /api/v1/sse/subscribe` — wire auth middleware, channel validation, SseManager subscription, set headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`)
- [ ] 2.8 Send initial `id: 0` confirmation event on successful subscription
- [ ] 2.9 Integrate SSE routes into Express app (mount in server bootstrap or route registration)
- [ ] 2.10 Define `SSE_COOKIE_NAME` env var (default: "token") in config.js
- [ ] 2.11 Verify/update CORS config for SSE endpoint (credentials: true, explicit origin)

## 3. Bus Bridge

- [ ] 3.1 Add `BUS_EVENTS` constants object to `server/lib/notificationBus.js` with string constants for each event type
- [ ] 3.2 Create `server/lib/sse/busBridge.js` — subscribe to `notificationBus` events via `BUS_EVENTS`
- [ ] 3.3 Implement event-to-channel mapping — determine target userId and/or channel from each bus event payload
- [ ] 3.4 Forward mapped events to `SseManager.deliverToUser()` and/or `SseManager.deliverToChannel()`
- [ ] 3.5 Implement error handling — log delivery failures without crashing the event loop
- [ ] 3.6 Register `busBridge` in server bootstrap (create and attach to SseManager)

## 4. Redis Bridge

- [ ] 4.1 Install `ioredis` dependency in `apps/server/package.json`
- [ ] 4.2 Create `server/lib/sse/redisBridge.js` — initialize with two separate ioredis connections (pub + sub)
- [ ] 4.3 Implement Redis publish — after local SseManager delivery, publish event to `sse:<eventType>` channel
- [ ] 4.4 Implement Redis subscribe — pattern subscribe to `sse:*`, parse messages, deliver to local SseManager connections
- [ ] 4.5 Add `origin` flag to events — tag local events vs Redis-originated events to prevent infinite publish loops
- [ ] 4.6 Implement reconnection with exponential backoff for both Redis connections
- [ ] 4.7 Implement graceful shutdown — unsubscribe from Redis, close both connections cleanly
- [ ] 4.8 Integrate `redisBridge` into server bootstrap alongside `busBridge`

## 5. Client: React Hook + SSE Client

- [ ] 5.1 Create `apps/client/src/lib/sseClient.js` — `EventSource` wrapper with `{ withCredentials: true }`, emits parsed events
- [ ] 5.2 Implement connection states: `connecting`, `open`, `closed`, `error`
- [ ] 5.3 Implement typed event listeners via `eventSource.addEventListener(eventType, handler)`
- [ ] 5.4 Implement auto-reconnection — rely on native `EventSource` behavior with `Last-Event-ID`
- [ ] 5.5 Surface reconnection errors to caller after repeated failures
- [ ] 5.6 Create `apps/client/src/hooks/useNotificationStream.js` — React hook wrapping sseClient
- [ ] 5.7 Accept channels list and event callback params; return `{ status, lastEvent, error }`
- [ ] 5.8 Handle component mount/unmount lifecycle — create EventSource on mount, `close()` on unmount
- [ ] 5.9 Implement failure detection: 3+ consecutive errors → stop reconnecting, surface permanent error
- [ ] 5.10 Distinguish 401 from network error (never reconnect on auth failure)

## 6. Nginx Configuration

- [ ] 6.1 Document Nginx requirements for SSE support: disable buffering (`proxy_buffering off`), set `proxy_cache off`, configure `Connection: keep-alive`, increase `proxy_read_timeout`
- [ ] 6.2 Create or update Nginx configuration template in project docs with SSE-specific settings
- [ ] 6.3 Add notes about WebSocket vs SSE coexistence in nginx config comments

## 7. Tests

- [ ] 7.1 Write unit tests for `SseManager` — subscribe, unsubscribe, sendToUser, sendToChannel, broadcast, duplicate prevention, cleanup on close
- [ ] 7.2 Write unit tests for connection limits — per-user limit enforcement, per-instance limit enforcement
- [ ] 7.3 Write unit tests for idle timeout and graceful shutdown
- [ ] 7.4 Write unit tests for ring buffer — event storage, eviction, replay via Last-Event-ID
- [ ] 7.5 Write unit tests for channels.js — valid channel patterns, unknown pattern rejection, default subscription
- [ ] 7.6 Write unit tests for auth middleware — valid JWT, missing cookie, expired JWT, malformed JWT
- [ ] 7.7 Write unit tests for channel authorization — user-scoped, entity-scoped, global, cross-user rejection
- [ ] 7.8 Write integration tests for `GET /api/v1/sse/subscribe` — full connection lifecycle with mocked JWT
- [ ] 7.9 Write unit tests for `busBridge` — event forwarding, error handling
- [ ] 7.10 Write unit tests for `redisBridge` — publish, subscribe, loop prevention, reconnection
- [ ] 7.11 Write unit tests for `keepAlive` — interval scheduling, connection write
- [ ] 7.12 Create k6 load test script in `e2e/` — simulate concurrent SSE connections, measure delivery latency and throughput

## 8. Documentation

- [ ] 8.1 Add Swagger/OpenAPI docs for GET /api/v1/sse/subscribe endpoint
- [ ] 8.2 Update README with SSE architecture overview

## 9. Monitoring

- [ ] 9.1 Add Prometheus gauge `sse_active_connections` — current number of active SSE connections
- [ ] 9.2 Add Prometheus counter `sse_events_delivered_total` with `event_type` label
- [ ] 9.3 Add Prometheus counter `sse_delivery_errors_total` with `error_type` label
- [ ] 9.4 Ad
