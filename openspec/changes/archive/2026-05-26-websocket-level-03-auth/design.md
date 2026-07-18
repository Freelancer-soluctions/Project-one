## Context

Currently, Socket.IO connections are unauthenticated — any client can connect to the server without providing credentials. The Express REST API already uses JWT authentication via `verifyToken.js` middleware, which validates tokens using `jwt.verify` with HS256 algorithm, the `SECRETKEY` from environment config (`dotenv.js`), and logs warnings via the Winston logger. The WebSocket layer needs equivalent authentication.

## Goals / Non-Goals

**Goals:**
- Add authentication middleware for Socket.IO using the existing JWT infrastructure
- Validate tokens from `socket.handshake.auth.token` (not query params — security best practice)
- Store decoded JWT payload in `socket.data.user` for downstream event handlers
- Support token refresh flow: client receives `connect_error` → obtains new token → calls `socket.connect()`
- Reuse existing `dotenv.js` config for `SECRETKEY` and Winston logger for audit logging
- Use same HS256 algorithm and issuer/audience as Express middleware

**Non-Goals:**
- Not changing the existing Express JWT middleware
- Not adding database-level session management
- Not implementing OAuth or third-party auth providers
- Not modifying existing Socket.IO event handlers beyond providing `socket.data.user`

## Decisions

1. **`socket.handshake.auth.token` over query params**: The Socket.IO handshake supports an `auth` object passed by the client during connection. This avoids exposing tokens in URLs (which get logged by proxies/servers) and follows official Socket.IO authentication best practices.

2. **`io.use()` middleware pattern**: Socket.IO provides an `io.use()` registration for middleware that runs during the handshake before any event handler. This mirrors Express middleware patterns the team already knows.

3. **Same `jwt.verify` configuration as Express**: Reusing HS256, issuer `mi-api`, audience `mi-front` ensures consistency across HTTP and WebSocket auth. No new JWT configuration surface to maintain.

4. **`socket.data.user` for decoded payload**: Socket.IO 4+ provides `socket.data` as the recommended namespace for attaching custom data (analogous to `req.user` in Express). Event handlers access it via `socket.data.user`.

5. **Separate educational file (`level-04-auth.js`)**: Following the existing level pattern, a standalone file on port 3002 with every line commented in Spanish helps juniors learn the auth flow without production complexity.

## Risks / Trade-offs

- **[Risk] Token expiration during long-lived connections**: WebSocket connections may remain open longer than a token's TTL.
  → **Mitigation**: Client-side token refresh flow — on `connect_error` with auth error, client requests new token and calls `socket.connect()`.
- **[Risk] No token revocation**: If a user is banned mid-session, the WebSocket stays open because JWT is stateless.
  → **Trade-off**: Acceptable for now. Future iteration could add a token blacklist or per-socket event to force disconnect.
- **[Risk] Same SECRETKEY for WebSocket and HTTP**: If compromised, both layers are affected.
  → **Mitigation**: Acceptable for now as they run in the same process. Future iteration could use separate keys.
