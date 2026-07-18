## Why

A single Node.js process has hard limits on CPU, memory, and file descriptors. When traffic grows beyond single-process capacity — sustained CPU >70%, >10K concurrent sockets, event loop lag >100ms, or memory >500MB — horizontal scaling is required. The Redis adapter enables cross-process communication so Socket.IO events (emits, rooms, fetchSockets) work seamlessly across multiple instances.

## What Changes

- **New file**: `apps/server/ecosystem.config.js` — PM2 cluster configuration with auto-detected CPU cores, sticky session support, and graceful shutdown settings
- **New file**: `apps/server/src/socket/adapter.js` — Conditional Redis adapter setup (imports `@socket.io/redis-adapter` + `ioredis` only when `REDIS_URL` is set; falls back to built-in adapter)
- **New file**: `apps/server/src/socket/levels/level-11-scale.js` — Educational multi-instance demo showcasing Redis pub/sub, cross-instance events, room broadcasting, and the scaling decision framework
- **Updated dependency**: `package.json` in `apps/server/` — added `@socket.io/redis-adapter`, `ioredis`, `pm2`

## Capabilities

### New Capabilities
- `websocket-scaling`: Horizontal scaling for Socket.IO — Redis adapter setup, PM2 cluster mode, sticky sessions, multi-instance communication patterns, and migration path from single instance to Kubernetes

### Modified Capabilities
- *(No existing spec requirements are changing; this is a new capability)*

## Impact

- **New infrastructure dependencies**: Redis server required for multi-instance communication
- **New npm dependencies**: `@socket.io/redis-adapter`, `ioredis`, `pm2` (dev)
- **Process management**: PM2 cluster mode replaces `node` direct invocation for production
- **Deployment change**: Must ensure Redis is available; `REDIS_URL` env var must be set for scaled mode
- **Limitation**: `connectionStateRecovery` is NOT compatible with Redis adapter (DB fallback handles reconnection)
