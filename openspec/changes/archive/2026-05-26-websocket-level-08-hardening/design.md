## Context

The project-one monorepo includes a WebSocket server demo suite under `apps/server/src/socket/` with educational levels (1–8) demonstrating progressive Socket.IO features. Level 8 currently lacks production hardening — there is no rate limiting (risk of abuse), no monitoring (blind to health/diagnostics), and no input validation at the socket level. Before Level 8 ships, these three pillars of production readiness must be added.

The existing codebase uses Express, Prisma, and standard Node.js patterns. The new hardening layer must integrate cleanly with the existing Socket.IO setup without breaking prior levels.

## Goals / Non-Goals

**Goals:**
- Token bucket rate limiter with three tiers: connection rate, event rate, broadcast rate
- Prometheus metrics endpoint (`GET /metrics`) with custom Socket.IO metrics
- Per-event latency tracking via Socket.IO middleware
- Socket-level error boundaries that classify and count errors
- A new Level 9 demo server (port 3007) and client to exercise rate limiting and metrics under load
- Clean integration — no breaking changes to existing levels

**Non-Goals:**
- Not a full API gateway rate limiter (only WebSocket connections)
- No persistent rate limit storage (in-memory only, resets on server restart)
- No authentication/authorization changes
- No frontend metrics dashboard (Prometheus data consumed externally)

## Decisions

### Rate Limiting: Token Bucket per user
- **Decision**: Implement a TokenBucket class with configurable capacity and refill rate. Attach middleware via `socket.use()` (before event handlers) so rate checks happen early.
- **Why**: Token bucket allows bursts up to capacity while enforcing a steady-state rate — ideal for real-time WebSocket communication where short spikes are natural.
- **Alternatives considered**: Sliding window log (memory-intensive for many users), fixed window (allows bursts at window boundaries), leaky bucket (less flexible for bursts).
- **Three tiers**:
  1. Connection rate: 10 connections/second per IP
  2. Event rate: 30 messages/second per user
  3. Broadcast rate: 1 broadcast/second per user
- **Per-user cleanup**: Buckets are deleted on socket disconnect to prevent memory leaks.
- **Error response**: Returns `'error'` event with `{ code: 'RATE_LIMITED', retryAfter: seconds }`.

### Monitoring: prom-client
- **Decision**: Use `prom-client` (the standard Prometheus client for Node.js) to expose default and custom metrics.
- **Why**: Prometheus is the organization's metrics standard, and prom-client is well-maintained with zero external dependencies beyond the library itself.
- **Alternatives considered**: OpenTelemetry SDK (heavier, more complex for this scope), custom StatsD client (would require a StatsD server), writing raw metrics manually (error-prone, not standards-compliant).
- **Default metrics**: CPU, memory, event loop lag (collected automatically by prom-client).
- **Custom WebSocket metrics**:
  - `ws_connected_users` (Gauge) — current connected user count
  - `ws_events_total` (Counter, labels: event, status) — total events processed
  - `ws_event_duration_ms` (Histogram, labels: event, buckets: 5,10,25,50,100,200,500) — event processing latency
  - `ws_errors_total` (Counter, labels: event, error_type) — error counts by type
  - `ws_reconnections_total` (Counter, labels: recovered) — reconnection attempts
- **Endpoint**: Express `GET /metrics` handler using `client.register.metrics()`.

### Alerting: Prometheus alert rule
- **Decision**: Define a Prometheus alert rule for p99 latency exceeding 200ms.
- **Why**: Latency degradation is the earliest symptom of WebSocket server issues; p99 captures tail latency that average metrics hide.
- **Rule**: `histogram_quantile(0.99, rate(ws_event_duration_ms_bucket[5m])) > 200`
- **Note**: The rule definition lives in the project's Prometheus config (deployed separately), not in application code.

### Input Validation at Socket Level
- **Decision**: Validate event payloads in socket middleware before reaching handlers. Malformed payloads increment `ws_errors_total` with appropriate labels and send an `'error'` event back to the client.
- **Why**: Prevents malformed data from crashing handlers and provides consistent error reporting.
- **Scope**: Structural validation (required fields, expected types), not business-rule validation.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| **Memory leak** from unbounded token bucket map | Delete user buckets on `disconnect` event; add periodic cleanup sweep |
| **prom-client memory growth** from high-cardinality label values | Limit label values (event names, error types) to a controlled set |
| **Rate limiter false positives** during legitimate bursts | Token bucket allows bursts up to capacity (30 tokens); tune refill rate based on observed traffic |
| **Metrics endpoint exposure** in production | Mount `/metrics` on a separate internal port or behind auth in production |
| **Synchronization issues** with async event handlers | Token bucket consume/refill is synchronous and non-blocking; histogram timing uses `startTimer()` callback pattern |
| **Existing levels regression** | Level 9 is a separate server on port 3007; levels 1–8 remain unchanged and independently testable |
