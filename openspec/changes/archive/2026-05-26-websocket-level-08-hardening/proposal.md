## Why

WebSocket connections need production hardening before Level 8 of 10 ships. Currently there is no rate limiting (risk of abuse/spikes), no monitoring (can't observe health or diagnose issues), and no input validation at the socket level (risk of malformed data crashing handlers). This level adds the three pillars of production readiness: rate limiting, Prometheus monitoring, and socket-level error boundaries.

## What Changes

- **Token bucket rate limiter** — Per-user rate limiting with three tiers: connection rate (10/s/IP), event rate (30/s/user), and emit rate (1 broadcast/s/user)
- **Prometheus metrics** — Custom Socket.IO metrics (connected users, event count, latency histogram, error count, reconnections) served at `GET /metrics`
- **Socket-level input validation** — Validate event payloads before they reach handlers
- **Error boundaries** — Catch and classify errors at the socket middleware level
- **Educational level demo** — New Level 9 server (port 3007) and client for testing rate limiting and metrics under load

## Capabilities

### New Capabilities
- `websocket-production-hardening`: Rate limiting, Prometheus metrics, input validation, and error boundaries for Socket.IO connections

### Modified Capabilities
<!-- No existing caps are modified -->

## Impact

- **New files** under `apps/server/src/socket/`:
  - `rateLimiter.js` — Token bucket rate limiter class + middleware
  - `monitor/metrics.js` — prom-client metric definitions and `/metrics` endpoint
  - `monitor/middleware.js` — Socket.IO middleware that collects metrics per event
  - `levels/level-09-hardening-server.js` — New demo server on port 3007
  - `levels/level-09-hardening-client.js` — Load-simulating client
- **Dependency added**: `prom-client` npm package
- **No breaking changes** — Existing levels continue to work unchanged
