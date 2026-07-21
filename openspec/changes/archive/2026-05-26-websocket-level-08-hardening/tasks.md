## 1. Rate Limiter Module

- [x] 1.1 Create `apps/server/src/socket/rateLimiter.js` with TokenBucket class (configurable capacity, refill rate, consume method)
- [x] 1.2 Implement `createSocketRateLimiter` middleware factory for Socket.IO (connection rate, event rate, broadcast rate tiers)
- [x] 1.3 Add JSDoc type annotations to all exported functions and classes
- [x] 1.4 Implement per-user bucket cleanup on socket `disconnect`

## 2. Prometheus Monitoring

- [x] 2.1 Create `apps/server/src/socket/monitor/metrics.js` with prom-client setup and default metrics
- [x] 2.2 Define 5 custom WebSocket metrics: `ws_connected_users` (Gauge), `ws_events_total` (Counter), `ws_event_duration_ms` (Histogram), `ws_errors_total` (Counter), `ws_reconnections_total` (Counter)
- [x] 2.3 Create Express `GET /metrics` endpoint serving `client.register.metrics()`
- [x] 2.4 Create `apps/server/src/socket/monitor/middleware.js` for per-event metrics collection and latency tracking

## 3. Level 9 Demo Server

- [x] 3.1 Create `apps/server/src/socket/levels/level-09-hardening-server.js` on port 3007 with rate limiting, metrics, and input validation — EVERY LINE commented in Spanish
- [x] 3.2 Create `apps/server/src/socket/levels/level-09-hardening-client.js` as a load simulation client exercising rate limiting and metrics

## 4. Documentation

- [x] 4.1 Update `README.md` with WebSocket hardening guide covering rate limiting, monitoring, and error handling
