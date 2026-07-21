## 1. Production Auth Middleware

- [x] 1.1 Create `apps/server/src/socket/auth.js` with JWT verification middleware
- [x] 1.2 Import `jsonwebtoken`, `dotenv` from `../../config/dotenv.js`, and logger from `../../logger/index.js`
- [x] 1.3 Export `createAuthMiddleware()` function returning `io.use()` middleware
- [x] 1.4 Verify token from `socket.handshake.auth.token` using HS256 with same `SECRETKEY` as Express `verifyToken.js`
- [x] 1.5 On success: store decoded payload in `socket.data.user` and call `next()`
- [x] 1.6 On failure: log warning with client IP and call `next(new Error('UNAUTHORIZED'))`
- [x] 1.7 Add JSDoc documentation to exported function

## 2. Educational Level File

- [x] 2.1 Create `apps/server/src/socket/levels/level-04-auth.js` as standalone executable on port 3002
- [x] 2.2 Include inline JWT utility to generate test tokens (development only)
- [x] 2.3 Implement `io.use()` middleware with `jwt.verify` for handshake auth
- [x] 2.4 On connect: log authenticated user info
- [x] 2.5 On auth failure: log warning
- [x] 2.6 Comment EVERY LINE in Spanish explaining:
  - What `io.use()` does and when it runs
  - Why auth during handshake (not after)
  - How `socket.handshake.auth` works
  - Why NOT to use query params for tokens
  - Token refresh pattern concept

## 3. Level Documentation

- [x] 3.1 Update `apps/server/src/socket/levels/README.md` with Level 3: JWT Authentication section
- [x] 3.2 Add text-based auth flow diagram
- [x] 3.3 Document how to generate test JWT for development
- [x] 3.4 Add token refresh pattern explanation
- [x] 3.5 Include security warning about query params

## 4. Integración: Conectar middleware al servidor principal

- [x] Abrir `apps/server/src/socket/levels/level-02-server.js`
- [x] Importar la fábrica: `import { createAuthMiddleware } from "../auth.js"`
- [x] Aplicar middleware después de crear `io`:
  ```js
  const io = new Server(httpServer, { /* ... */ })
  io.use(authMiddleware())  // <-- nueva línea
  ```
- [x] Agregar comentario: "authMiddleware verifica JWT en cada conexión. Rechaza tokens expirados o inválidos con error UNAUTHORIZED"
- [x] Verificar: middleware se ejecuta en cada conexión, no solo en la primera
- [x] Nota: `level-02-server.js` ahora es el servidor productivo. El archivo educativo `level-04-auth.js` en puerto 3002 queda como referencia aislada.

## 5. Verification

- [x] 5.1 Verify production middleware loads without errors
- [x] 5.2 Verify educational level starts on port 3002
- [x] 5.3 Verify level README renders correctly

## 6. Client-side — useSocket hook with JWT auth

- [x] 6.1 Update `apps/client/src/hooks/useSocket.js`:
  - Import `{ useSelector }` from `'react-redux'`
  - Get token from Redux store: `useSelector((state) => state.auth.user?.data?.accessToken)`
  - Pass token in socket connection: `io(WS_URL, { auth: { token } })`
  - If no user logged in, DON'T connect (return disconnected state)
  - Add `socket.auth.token = newToken` update capability for token refresh
- [x] 6.2 Implementar token refresh en connect_error:
  - Importar `refreshTokenFecth` y `logout` de `@/modules/auth/slice/authSlice`
  - Importar `useDispatch` de `react-redux`
  - En 'connect_error' con mensaje 'UNAUTHORIZED':
    1. dispatch(refreshTokenFecth()) → obtiene nuevo token
    2. En éxito: `socket.auth.token = newToken` (mutar antes de reconectar)
    3. `socket.connect()` — Socket.IO v4: socket.auth mutable solo antes de connect()
    4. En fallo: dispatch(logout())

## 7. Client-side — environment variables

- [x] 7.1 Add `VITE_WS_URL=http://localhost:3001` to `apps/client/.env`
- [x] 7.2 Add `VITE_WS_URL=` to `apps/client/.env.example`