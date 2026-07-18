## Context

The project uses Socket.IO for real-time WebSocket communication on the Express backend (`apps/server/`). Currently operating as a single Node.js process, it has inherent capacity limits. Previous levels (1–9) have established the WebSocket infrastructure, event handling, middleware, authentication, rooms, error handling, monitoring, and connection state recovery.

Level 10 adds horizontal scaling — the final architectural layer needed for production-grade WebSocket deployments handling >10K concurrent connections across multiple CPU cores and server instances.

## Goals / Non-Goals

**Goals:**
- Enable Socket.IO to span multiple Node.js processes via PM2 cluster mode
- Provide Redis adapter for cross-process event routing (pub/sub)
- Ensure room membership and broadcast work identically across instances
- Create clear migration path: single process → PM2 cluster + Redis → container orchestration
- Document scaling decision triggers (when to scale up)

**Non-Goals:**
- Docker/Kubernetes deployment config — that's a future concern
- Sharded Redis adapter (`@socket.io/redis-streams-adapter`) — documented but not implemented yet
- Load balancer setup (NGINX, HAProxy) — covered in migration guide but config not created
- Auto-scaling policies or dynamic cluster sizing

## Decisions

### Decision 1: PM2 Cluster Mode vs Child Process / Worker Threads

- **Chosen**: PM2 cluster mode
- **Alternatives considered**:
  - `child_process.fork()`: Manual process management, no built-in load balancing, no graceful restart
  - `worker_threads`: Shared memory but no port sharing; requires manual IPC for socket distribution
  - PM2 cluster: Auto port sharing, built-in load balancing (round-robin), graceful reload, process monitoring, battle-tested in production
- **Rationale**: PM2 handles the hard parts — port conflict resolution, SIGINT propagation, automatic restart, log management. It's the standard for Node.js production deployments.

### Decision 2: Redis Adapter vs Socket.IO Native Clustering

- **Chosen**: `@socket.io/redis-adapter` with `ioredis`
- **Alternatives considered**:
  - Built-in in-memory adapter: Doesn't work across processes; rooms are local
  - MongoDB adapter: Higher latency, not pub/sub native
  - NATS adapter: Added infra complexity for current scale needs
  - Redis Streams adapter (`@socket.io/redis-streams-adapter`): Better for Redis 7.0+ but adds operational complexity; documented as future path
- **Rationale**: Redis adapter is the official, well-tested solution. Pub/sub is Redis's native pattern. Low latency (~1ms). Conditional import ensures zero overhead when Redis is not configured.

### Decision 3: Sticky Sessions — Polling Fallback vs WebSocket-Only

- **Chosen**: Sticky sessions required (documented), but app should prefer WebSocket transport
- **Rationale**: Socket.IO defaults to polling first then upgrades to WebSocket. Without sticky sessions, polling requests may land on different instances, breaking session affinity. NGINX `ip_hash` or cookie-based routing solves this. In WebSocket-only mode (no polling fallback), sticky sessions are unnecessary.
- **Trade-off**: Sticky sessions reduce load-balancing evenness. The recommended production setup is NGINX with `ip_hash` + WebSocket upgrade support.

### Decision 4: Conditional Adapter Setup vs Always-On

- **Chosen**: Adapter auto-detects Redis via `REDIS_URL` env var; falls back to built-in adapter
- **Rationale**: Same codebase works for development (no Redis needed) and production (Redis enabled). Simplifies local dev while enabling seamless production scaling.

### Decision 5: Graceful Shutdown Configuration

- **Chosen**: `kill_timeout: 5000`, `listen_timeout: 3000` in PM2 config
- **Rationale**: 5 seconds allows in-flight messages to complete before forced kill. 3 seconds listen timeout prevents stalled deployments. PM2's `graceful reload` (`pm2 reload <app>`) executes this without downtime.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Redis becomes single point of failure | Use Redis Sentinel or Redis Cluster for HA in production |
| Sticky sessions cause uneven load distribution | Use `instances: max` to spread across all cores; NGINX `ip_hash` provides reasonable distribution |
| `connectionStateRecovery` incompatible with Redis adapter | Use the existing DB-based recovery from Level 9; document the limitation |
| Redis adapter v6+ required for `fetchSockets()` across instances | Pin `@socket.io/redis-adapter` to v6+ in package.json |
| Cluster mode complicates file uploads (Multer disk storage) | Use in-memory or S3-based storage; avoid local disk for multi-instance |
| Broadcast storm with many rooms on many instances | Use Redis adapter's built-in deduplication; avoid emitting to large wildcard rooms |

## Migration Plan

1. **Standalone mode** (current) — single `node` process, no Redis
2. **PM2 cluster, no Redis** — multiple instances, each with in-memory adapter (rooms per-instance only). Good for CPU-bound workloads.
3. **PM2 cluster + Redis** — full horizontal scaling. Set `REDIS_URL`, start with PM2. Cross-instance rooms and events.
4. **Docker Compose** — containerize app + Redis, use `depends_on` for ordering
5. **Kubernetes** — use `socket.io` StatefulSet + Redis Deployment/StatefulSet, Headless Service for sticky sessions, Ingress Controller with WebSocket support

Rollback: Unset `REDIS_URL` → restart → back to in-memory adapter (rooms per-instance only). No data migration needed.

## Open Questions

- Should we configure Redis Sentinel connection string format in adapter.js now, or when HA is needed? → When HA is needed; document in README.
- Do we need `@socket.io/redis-streams-adapter` (Redis 7.0+)? → Document as optional upgrade path; not implemented now.
