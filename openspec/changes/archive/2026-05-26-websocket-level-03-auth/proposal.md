## Why

Currently, WebSocket connections in the project have no authentication layer — anyone with the server address can connect. In production, only authenticated users should establish WebSocket connections. This change adds JWT-based authentication to Socket.IO using the same `jwt.verify` pattern already used by the Express `verifyToken.js` middleware.

## What Changes

- Create `apps/server/src/socket/auth.js` — production-grade Socket.IO authentication middleware using `io.use()`, `jwt.verify` with HS256, and the existing Winston logger
- Create `apps/server/src/socket/levels/level-04-auth.js` — standalone educational file with every line commented in Spanish, demonstrating JWT auth flow on a separate port (3002)
- Update `apps/server/src/socket/levels/README.md` with JWT auth flow documentation

## Capabilities

### New Capabilities
- `websocket-jwt-auth`: Socket.IO authentication via JWT tokens validated through `socket.handshake.auth.token`, with token refresh on `connect_error`

### Modified Capabilities
- *(None — no existing spec capabilities are changing)*

## Impact

- **New middleware module**: `apps/server/src/socket/auth.js`
- **New educational file**: `apps/server/src/socket/levels/level-04-auth.js`
- **Documentation update**: `apps/server/src/socket/levels/README.md`
- **Dependencies used**: `jsonwebtoken` (already installed), Winston logger (already configured), `dotenv.js` config (already exists)
- No existing code is modified — only new files added
