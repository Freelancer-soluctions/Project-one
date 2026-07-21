# Spec: WebSocket Learning Level 01 - Hello WebSocket

## Capability
`websocket-learning-level-01`

## Scenarios

### Connection Handshake
- GIVEN the Socket.IO server is running on port 3001
- WHEN a browser connects using `socket.io-client` v4
- THEN the server logs "🟢 Cliente conectado: {socketId}"
- AND the server emits a "welcome" event
- AND the welcome payload contains `{ message: string, timestamp: string }`

### Welcome Event
- GIVEN a client is connected to the server
- WHEN the "welcome" event is received
- THEN the client console shows "🎉 Conectado al servidor WebSocket"
- AND the client console shows the welcome payload

### Disconnection Notification
- GIVEN a client is connected to the server
- WHEN the client disconnects (closes tab, navigates away, network drops)
- THEN the server logs "🔴 Cliente desconectado: {socketId}"
- AND the server log includes the disconnect reason

### Error Handling
- GIVEN the server is running
- WHEN a transport error occurs on any connection
- THEN the server logs "⚠️ Error en socket: {errorMessage}"

### CORS Validation
- GIVEN the server is configured with `cors.origin = ['http://localhost:5173']`
- WHEN a connection attempt comes from origin 'http://evil-site.com'
- THEN the connection is rejected
- AND the client receives a CORS error

### Graceful Shutdown
- GIVEN the server is running
- WHEN the process receives SIGINT or SIGTERM
- THEN the server logs "🛑 Cerrando servidor WebSocket..."
- AND all socket connections are closed gracefully
- AND the process exits with code 0
