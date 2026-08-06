import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// ============================================================
// LEVEL 04: Autenticación JWT en WebSocket
// ============================================================
// Servidor educativo independiente en puerto 3002 que demuestra
// el patrón io.use() para verificar JWT durante el handshake.
// ============================================================

const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

// io.use() registra middleware que se ejecuta en CADA conexión ANTES
// de emitir el evento 'connection'. Es el único lugar para rechazar
// conexiones no autenticadas — después de 'connection' el socket ya
// está aceptado.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    console.log('❌ Conexión rechazada: sin token');
    return next(new Error('UNAUTHORIZED'));
  }

  try {
    // SOLO para desarrollo: esta clave debe coincidir con SECRETKEY de produccion
    const decoded = jwt.verify(token, 'secret-key-dev-only', {
      algorithms: ['HS256'],
    });
    socket.data.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Conexión rechazada: token inválido', err.message);
    return next(new Error('UNAUTHORIZED'));
  }
});

io.on('connection', (socket) => {
  console.log(
    `🟢 Usuario autenticado conectado: ${socket.data.user?.id || 'desconocido'}`
  );

  socket.on('disconnect', (reason) => {
    console.log(
      `🔴 Usuario desconectado: ${socket.data.user?.id}, razón: ${reason}`
    );
  });
});

const PORT = 3002;
httpServer.listen(PORT, () => {
  console.log(`🔐 Servidor WS con autenticación en puerto ${PORT}`);
  console.log(
    `   Conectar con: io('http://localhost:${PORT}', { auth: { token: '...' } })`
  );
  console.log('   (usa el generador de tokens en tests/token-generator.js)');
});
