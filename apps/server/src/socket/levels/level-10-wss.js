// ============================================================
// LEVEL 10: WebSocket Seguro (WSS) detrás de NGINX
// ============================================================
// Este archivo es educativo. Muestra cómo configurar un servidor
// Socket.IO para funcionar detrás de NGINX con TLS.
//
// DIFERENCIA ENTRE WS Y WSS:
//   ws://   → plano (sin cifrar) — solo desarrollo local
//   wss://  → cifrado con TLS — obligatorio en producción
//
// El código del servidor NO cambia entre WS y WSS.
// NGINX maneja el TLS y el proxy al servidor Express.
//
// Para probar:
//   1. docker-compose up -d
//   2. Cliente: io("wss://localhost", { transports: ['websocket'] })
// ============================================================

import http from 'http'
import { Server } from 'socket.io'

const httpServer = http.createServer()

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  // Permitir que NGINX reenvíe correctamente el protocolo
  // Sin esto, req.headers['x-forwarded-proto'] no se propaga
})

io.on('connection', (socket) => {
  console.log(`🟢 Cliente conectado via NGINX: ${socket.id}`)

  socket.emit('welcome', {
    message: 'Conexión segura establecida via NGINX + WSS',
    timestamp: new Date().toISOString(),
  })

  socket.on('disconnect', (reason) => {
    console.log(`🔴 Cliente desconectado: ${reason}`)
  })
})

const PORT = 3000
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor listo para WSS detrás de NGINX en puerto ${PORT}`)
  console.log('   NGINX proxy: wss://localhost (puerto 443)')
  console.log('   Asegúrate de tener docker-compose corriendo con NGINX + TLS')
})