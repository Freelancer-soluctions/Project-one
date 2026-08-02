// ============================================================
// level-05-rooms.js — Demostración independiente de salas
// ============================================================
// Servidor Socket.IO independiente en puerto 3003
// Sin autenticación JWT para simplificar la demostración
// Asigna IDs de usuario simulados (5, 7, 42) en round-robin
// Demuestra unirse a salas y enviar mensajes a usuarios específicos
// ============================================================

import http from 'http';
import { Server } from 'socket.io';

// IDs de usuario simulados para la demostración
const SIMULATED_USER_IDS = [5, 7, 42];
let userIndex = 0;

// Creamos servidor HTTP y Socket.IO
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Permitir cualquier origen para demo
    methods: ['GET', 'POST'],
  },
});

const PORT = 3003;

// Manejamos conexiones
io.on('connection', (socket) => {
  // Asignar usuario simulado en round-robin
  const userId = SIMULATED_USER_IDS[userIndex];
  userIndex = (userIndex + 1) % SIMULATED_USER_IDS.length;

  console.log(
    `🟢 Socket conectado: ${socket.id} → Usuario simulado: ${userId}`
  );

  // Unirse a la sala personal del usuario simulado
  const roomName = `user:${userId}`;
  socket.join(roomName);
  console.log(`   Unido a sala: ${roomName}`);

  // Enviar confirmación al cliente
  socket.emit('joined', {
    userId,
    room: roomName,
    message: `Unido a sala personal de usuario ${userId}`,
  });

  // Escuchar evento para enviar mensaje a sala específica
  socket.on('room:message', ({ targetUserId, message }) => {
    const targetRoom = `user:${targetUserId}`;
    console.log(`   Enviando mensaje a sala ${targetRoom}: ${message}`);

    // Emitir a todos los sockets en la sala del usuario objetivo
    io.to(targetRoom).emit('message', {
      from: userId,
      text: message,
      timestamp: new Date().toISOString(),
    });

    // También enviar confirmación al remitente
    socket.emit('message:sent', {
      to: targetUserId,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  // Manejar desconexión
  socket.on('disconnect', (reason) => {
    console.log(
      `🔴 Socket desconectado: ${socket.id} (usuario ${userId}), razón: ${reason}`
    );

    // Opcional: dejar la sala (Socket.IO lo hace automáticamente, pero podemos hacerlo explícito)
    socket.leave(roomName);

    // Mostrar cuántos sockets quedan en la sala
    io.in(roomName)
      .fetchSockets()
      .then((sockets) => {
        console.log(`   Quedan ${sockets.length} sockets en sala ${roomName}`);
      })
      .catch((err) => {
        console.log(`   Error al contar sockets en sala:`, err);
      });
  });
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(
    `🚀 Servidor de demostración de salas escuchando en http://localhost:${PORT}`
  );
  console.log(`   IDs de usuario simulados: ${SIMULATED_USER_IDS.join(', ')}`);
  console.log(
    `   Prueba uniendo múltiples clientes y enviando mensajes entre ellos`
  );
});

// Manejar shutdown graceful
process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT. Cerrando servidor de demostración...');
  io.close(() => {
    console.log('🔌 Servidor Socket.IO cerrado.');
    httpServer.close(() => {
      console.log('🛑 Servidor HTTP cerrado.');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  console.log(
    '🛑 Recibida señal SIGTERM. Cerrando servidor de demostración...'
  );
  io.close(() => {
    console.log('🔌 Servidor Socket.IO cerrado.');
    httpServer.close(() => {
      console.log('🛑 Servidor HTTP cerrado.');
      process.exit(0);
    });
  });
});
