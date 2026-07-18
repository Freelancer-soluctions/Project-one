## Why

The ERP system needs a lightweight, scalable notification delivery mechanism for non-interactive updates (order confirmations, status changes, alerts). Existing Socket.IO is used for mentions and future chat, but SSE is a better fit for one-way server-to-client notifications — simpler protocol, native browser reconnection, lower overhead, and no WebSocket upgrade cost. Adding SSE alongside Socket.IO provides topic-level routing where notifications go through SSE and interactive messaging stays on WebSocket.

## What Changes

- Add `/api/v1/sse/subscribe` endpoint to establish SSE connections
- Implement `SseManager` — an in-memory connection registry managing Map<userId, Set<Response>> and Map<channel, Set<Response>>
- Create `busBridge.js` to subscribe `notificationBus` events and forward them to SseManager
- Create `redisBridge.js` for cross-instance SSE delivery via Redis Pub/Sub (requires `ioredis`)
- Add auth middleware for SSE endpoints validating JWT from HTTP-only cookies
- Implement channel validation and authorization rules
- Add keepAlive heartbeat (`:keepalive\n\n` every 30s)
- Create React `useNotificationStream` hook using `EventSource` with `{ withCredentials: true }`
- Add `Last-Event-ID` counter for reconnection backlog delivery
- Add Prometheus metrics for SSE connections, events, errors
- Add Nginx config template: `proxy_buffering off; proxy_read_timeout 24h;`
- Add `ioredis` as the only new npm dependency
- **No modifications** to Socket.IO, existing services, or existing specs

## Capabilities

### New Capabilities
- `sse-server-core`: SseManager connection registry, keepAlive heartbeat, connection limits, idle timeout, graceful shutdown, and config
- `sse-auth`: JWT authentication for SSE endpoint via HTTP-only cookie validation
- `sse-channels`: Channel subscription model with validation and authorization rules
- `sse-bus-bridge`: notificationBus EventEmitter bridge — subscribes to bus events and forwards to SseManager
- `sse-redis-pubsub`: Cross-instance SSE delivery via Redis Pub/Sub using `ioredis`
- `sse-client-hook`: React `useNotificationStream` hook using native EventSource API
- `sse-monitoring`: Prometheus metrics (active connections, events delivered, errors)

### Modified Capabilities
<!-- No existing specs are modified — SSE is entirely additive, no spec-level behavior changes -->

## Impact

- **New server files**: `src/sse/` directory with 8 modules (~200 lines for SseManager, plus auth, routes, channels, bridges, keepAlive, config)
- **New client file**: `apps/client/src/hooks/useNotificationStream.js`
- **notificationBus.js**: Gets new `BUS_EVENTS` constants but no structural changes
- **Dependencies**: `ioredis` (new), `ws` stays, Socket.IO stays
- **Nginx**: New config template required for SSE support
- **package.json**: All new files under `src/sse/` will be in server workspace
