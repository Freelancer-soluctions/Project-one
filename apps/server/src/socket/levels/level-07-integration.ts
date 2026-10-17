import { EventEmitter } from 'events';
import http from 'http';
import { Server } from 'socket.io';

// ============================================================
// LEVEL 07: Integración — Bus de eventos (EventEmitter)
// ============================================================
// Simula el flujo completo: controller → service → bus → socket
//
// FLUJO:
//   1. Simulamos un "controller HTTP" que recibe una solicitud
//   2. El "servicio" procesa y emite evento en el bus
//   3. El bus reenvía a Socket.IO
//   4. Socket.IO entrega a la sala del usuario mencionado
//
// BENEFICIOS DEL BUS:
//   - Servicios no importan Socket.IO (cero acoplamiento)
//   - Podemos testear servicios con bus.mock en lugar de socket.mock
//   - Múltiples consumidores pueden escuchar un mismo evento
// ============================================================

// --- INICIO: Simulación del bus (igual que notificationBus.js) ---
const bus = new EventEmitter();
bus.setMaxListeners(50);

const BUS_EVENTS = {
  MENTION_CREATED: 'mention:created',
};
// --- FIN: Simulación del bus ---

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// --- Capa Socket.IO: escuchar el bus y reenviar a clientes ---
bus.on(BUS_EVENTS.MENTION_CREATED, (payload) => {
  console.log(
    `📢 Bus → WS: entregando mención a usuario ${payload.mentionedUserId}`
  );
  io.to(`user:${payload.mentionedUserId}`).emit('mention:new', {
    type: 'mention:new',
    payload,
  });
});

io.on('connection', (socket) => {
  console.log(`🟢 Cliente conectado: ${socket.id}`);

  // Simular autenticación — el cliente envía su userId al conectar
  socket.on('auth:simulate', ({ userId }) => {
    socket.join(`user:${userId}`);
    socket.data.userId = userId;
    console.log(`🔑 Usuario ${userId} unido a sala user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Cliente desconectado: ${socket.id}`);
  });
});

// --- Capa Servicio: simula el service.js que emite eventos ---
const simulateMention = (payload) => {
  console.log(
    `📝 Servicio: mención creada por usuario ${payload.mentionedByUserId} para usuario ${payload.mentionedUserId}`
  );
  // El servicio NO sabe que Socket.IO existe. Solo emite en el bus.
  bus.emit(BUS_EVENTS.MENTION_CREATED, payload);
};

// --- Capa Controller: simula el endpoint HTTP ---
setTimeout(() => {
  console.log('\n=== Simulando mención desde controller HTTP ===');
  simulateMention({
    noteId: 1,
    noteTitle: 'Bienvenida al equipo',
    mentionedByUserId: 5,
    mentionedUserId: 42,
    excerpt: 'Hola @usuario42, bienvenido al equipo de desarrollo',
  });
}, 2000);

const PORT = 3005;
httpServer.listen(PORT, () => {
  console.log(`🔌 Servidor de integración Level 07 en puerto ${PORT}`);
  console.log(
    '   Conecta un cliente como usuario 42 para recibir la mención simulada'
  );
  console.log(
    '   Cliente: io("http://localhost:3005").emit("auth:simulate", { userId: 42 })'
  );
});
