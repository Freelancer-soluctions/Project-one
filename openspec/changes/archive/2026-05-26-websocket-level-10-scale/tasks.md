## 1. PM2 Cluster Configuration

- [x] 1.1 Create `apps/server/ecosystem.config.js` with PM2 cluster mode, `instances: max`, `exec_mode: cluster`, and graceful shutdown settings (`kill_timeout: 5000`, `listen_timeout: 3000`)

## 2. Redis Adapter Setup

- [x] 2.1 Create `apps/server/src/socket/adapter.js` with conditional Redis adapter setup — import `@socket.io/redis-adapter` and `ioredis` only when `REDIS_URL` env var is set
- [x] 2.2 Implement `createAdapter(server)` factory function that returns the appropriate adapter (Redis adapter when `REDIS_URL` is set, built-in in-memory adapter otherwise)
- [x] 2.3 Add comprehensive JSDoc documentation to `adapter.js`

## 3. Educational Multi-Instance Demo

- [x] 3.1 Create `apps/server/src/socket/levels/level-11-scale.js` with educational demo of Redis pub/sub, cross-instance events, room broadcasting, and the scaling decision framework — EVERY LINE commented in Spanish

## 4. Scaling Guide Documentation

- [x] 4.1 Update README.md with scaling guide covering decision tree (when to scale), migration path (single → PM2 cluster → Redis → K8s), and environment variable reference
