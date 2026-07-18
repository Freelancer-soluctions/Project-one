## 1. Install socket.io dependency

- [x] 1.1 Run `npm install socket.io` in `apps/server/`
- [x] 1.2 Verify the dependency appears in `package.json` (socket.io@4.8.3)

## 2. Create folder structure

- [x] 2.1 Create directory `apps/server/src/socket/levels/`
- [x] 2.2 Create `apps/server/src/socket/levels/README.md` with:
  - Purpose of the levels system
  - Prerequisites (Node.js, npm install socket.io)
  - How to run each level: `node src/socket/levels/level-02-server.js`
  - How to test from browser console (provide the exact JS code to paste)
  - Learning path overview (levels 1-10 summary)

## 3. Create level-01-conceptos.js

- [x] 3.1 Create `apps/server/src/socket/levels/level-01-conceptos.js`
- [x] 3.2 This file is ONLY comments (zero executable code)
- [x] 3.3 Explain in Spanish line-by-line:
  - What is WebSocket (analogy: restaurant - HTTP is order/pay/leave, WS is sit at counter and chat with chef)
  - HTTP vs WebSocket comparison (request/response vs full-duplex persistent connection)
  - What is Socket.IO (abstraction layer over WebSocket with auto-reconnection, rooms, fallback)
  - Engine.IO architecture (transport negotiation, starts with HTTP polling, upgrades to WS)
  - Connection lifecycle: connect → handshake → open → message → close
  - io.emit vs socket.emit vs socket.broadcast (who receives what)
  - Client-server event model (emit/listen pattern)

## 4. Create level-02-server.js (functional server)

- [x] 4.1 Create `apps/server/src/socket/levels/level-02-server.js`
- [x] 4.2 This is an independent executable file (run with `node`)
- [x] 4.3 Import `http` from 'http' and `Server` from 'socket.io'
- [x] 4.4 Create http.Server (EXPLAIN in comments why http.createServer, not app.listen)
- [x] 4.5 Configure CORS for 'http://localhost:5173'
- [x] 4.6 Create new Server(httpServer, { cors, options })
- [x] 4.7 Listen on port 3001
- [x] 4.8 Implement io.on('connection', socket => { ... })
- [x] 4.9 Log "🟢 Cliente conectado: {socket.id}" on connection
- [x] 4.10 Emit socket.emit('welcome', { message, timestamp })
- [x] 4.11 Handle socket.on('disconnect', reason => { ... }) — log "🔴 Cliente desconectado: {reason}"
- [x] 4.12 Handle socket.on('error', err => { ... }) — log "⚠️ Error: {err.message}"
- [x] 4.13 Handle SIGINT/SIGTERM for graceful shutdown
- [x] 4.14 EVERY LINE must have a Spanish comment explaining WHAT it does and WHY

## 5. Verify it works

- [x] 5.1 Run `node src/socket/levels/level-02-server.js`
- [x] 5.2 Open browser console on http://localhost:5173
- [x] 5.3 Paste the connection code from README
- [x] 5.4 Verify "🟢 Cliente conectado" appears in server terminal
- [x] 5.5 Verify browser receives 'welcome' event
- [x] 5.6 Close browser tab
- [x] 5.7 Verify "🔴 Cliente desconectado" appears in server terminal
- [x] 5.8 Press Ctrl+C on server
- [x] 5.9 Verify "🛑 Cerrando servidor WebSocket..." appears

> **Nota sobre nomenclatura**: El número en `level-XX-*.js` corresponde al nivel educativo, NO al número de change. Change 01 contiene niveles 1 (conceptos) y 2 (servidor mínimo).
