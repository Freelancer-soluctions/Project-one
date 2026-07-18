## 1. NGINX Configuration

- [x] 1.1 Create apps/server/nginx.conf with full WSS + TLS reverse proxy config including security headers, proxy_http_version 1.1, Upgrade/Connection header forwarding, and proxy_read_timeout 86400s

## 2. Docker Setup

- [x] 2.1 Create apps/server/Dockerfile using Node 18 alpine with efficient layer caching (dependencies installed before copying source code), EXPOSE 3000, CMD node src/bin/index.js
- [x] 2.2 Update apps/server/docker-compose.yml adding API service, NGINX, Prometheus, and Grafana services alongside existing PostgreSQL and pgAdmin

## 3. Educational Content

- [x] 3.1 Create apps/server/src/socket/levels/level-10-wss.js as an educational demo showing WebSocket server behind NGINX reverse proxy, with EVERY LINE commented in Spanish
- [x] 3.2 Update apps/server/src/socket/levels/README.md with Level 9 deployment guide including TLS certificate generation, Docker build/run instructions, and health check verification

## 4. Client-side — WSS connection

- [x] 4.1 Update environment configuration:
  - In production, `VITE_WS_URL` should be `wss://api.tudominio.com/socket.io`
  - In development, keep `http://localhost:3001`
  - The socket.io-client automatically detects wss:// from URL

- [x] 4.2 Update useSocket.js to support production WSS:
  - Read WS_URL from `import.meta.env.VITE_WS_URL`
  - Add `secure: true` option when using wss://
  - Add `transports: ['websocket', 'polling']` for graceful degradation
  - Document: in production behind NGINX, path is /socket.io/ (default)

- [x] 4.3 Update apps/client/.env.example with production WS URL example:
  ```
  VITE_WS_URL=http://localhost:3001
  VITE_WS_URL_PROD=wss://api.tudominio.com
  ```
