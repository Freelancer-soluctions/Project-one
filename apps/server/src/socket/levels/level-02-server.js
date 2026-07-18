import { Server } from 'socket.io';
import { createAuthMiddleware } from '../auth.js';
import { joinUserRoom } from '../rooms.js';
import { validateMessage, mentionNewSchema, mentionReadSchema } from '../events/schemas.js'
import { handleMentionNew, handleMentionRead } from '../events/mentionEvents.js'
import { getBus, BUS_EVENTS } from '../notificationBus.js'
import { handleConnection, getMentionsBacklog } from '../handler.js'
import { createSocketRateLimiter } from '../rateLimiter.js'
import { setupMetricsMiddleware, setupSocketMetrics } from '../monitor/middleware.js'
import { createAdapter } from '../adapter.js'

/**
 * Attaches Socket.IO to an existing HTTP server from Express.
 * @param {import('http').Server} httpServer - The shared HTTP server
 * @returns {import('socket.io').Server} The Socket.IO server instance
 */
export function attachSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  // Configurar adapter (Redis para multi-instancia o memoria por defecto)
  createAdapter(io);

  // Aplicamos el middleware de autenticación JWT
  io.use(createAuthMiddleware());

  // Aplicar rate limiting por conexión
  const rateLimiter = createSocketRateLimiter();
  io.use(rateLimiter.connection);

  // Manejamos el evento de conexión cuando un cliente se conecta
  io.on('connection', (socket) => {
    console.log(`🟢 Cliente conectado: ${socket.id}`);

    socket.emit('welcome', {
      message: 'Bienvenido al servidor de WebSocket',
      timestamp: new Date().toISOString(),
    });

    if (socket.data.user?.id) {
      joinUserRoom(io, socket, socket.data.user.id);
    }

    rateLimiter.event(socket);
    setupSocketMetrics(socket);

    socket.on('room:join', ({ userId }) => {
      const currentUserId = socket.data.user?.id;
      if (!currentUserId || userId !== currentUserId) {
        console.log(`⚠️ Intento de room:join no autorizado: ${currentUserId} → ${userId}`);
        return socket.emit('error:auth', { message: 'FORBIDDEN: No puedes unirte a la sala de otro usuario' });
      }
      joinUserRoom(io, socket, userId);
    });

    handleConnection(io, socket, getMentionsBacklog);

    socket.on('disconnect', (reason) => {
      console.log(`🔴 Cliente desconectado: ${socket.id}, razón: ${reason}`);
      rateLimiter.cleanup(socket);
    });

    socket.on('error', (error) => {
      console.log(`⚠️ Error en el socket ${socket.id}:`, error);
    });

    socket.on('message', async (data) => {
      try {
        const { type, payload } = data;
        switch (type) {
          case 'mention:new': {
            const validation = validateMessage({ type, payload }, mentionNewSchema);
            if (!validation.valid) {
              return socket.emit('error:validation', { errors: validation.error });
            }
            handleMentionNew(io, socket, validation.value.payload);
            break;
          }
           case 'mention:read': {
             const validation = validateMessage({ type, payload }, mentionReadSchema);
             if (!validation.valid) {
               return socket.emit('error:validation', { errors: validation.error });
             }
             await handleMentionRead(io, socket, validation.value.payload);
             break;
           }
           case 'mention:backlog:request': {
             try {
               const userId = socket.data.user?.id;
               if (!userId) {
                 socket.emit('mention:backlog', { mentions: [] });
                 break;
               }
               const backlog = await getMentionsBacklog(userId);
               if (backlog && backlog.length > 0) {
                 socket.emit('mention:backlog', { mentions: backlog });
               } else {
                 socket.emit('mention:backlog', { mentions: [] });
               }
             } catch (err) {
               console.error('❌ Error getting mentions backlog:', err.message);
               socket.emit('mention:backlog', { mentions: [] });
             }
             break;
           }
           default:
             console.log(`⚠️ Tipo de evento desconocido: ${type}`);
             socket.emit('error:unknown', { type });
        }
      } catch (err) {
        console.error('❌ Error procesando mensaje:', err.message);
        socket.emit('error:server', { message: 'Error interno del servidor' });
      }
    });
  });

  // Configurar métricas Prometheus en el servidor
  setupMetricsMiddleware(io);

  // ============================================================
  // Bus de eventos — Conectar EventEmitter a Socket.IO
  // ============================================================
  const bus = getBus();

  bus.on(BUS_EVENTS.MENTION_CREATED, (payload) => {
    console.log('📢 Bus → WS: mención creada para usuario', payload.mentionedUserId);
    io.to(`user:${payload.mentionedUserId}`).emit('mention:new', {
      type: 'mention:new',
      payload: {
        noteId: payload.noteId,
        noteTitle: payload.noteTitle,
        mentionedByUserId: payload.mentionedByUserId,
        excerpt: payload.excerpt,
        timestamp: new Date().toISOString(),
      },
    });
  });

  bus.on(BUS_EVENTS.MENTION_READ, (payload) => {
    console.log('📖 Bus → WS: menciones leídas por usuario', payload.userId);
  });

  return io;
}