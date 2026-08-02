// ============================================================
// level-09-hardening-server.js - Servidor WebSocket nivel 09: Producción Hardening
// ============================================================
// Este servidor demuestra las características de nivel 08 (rate limiting y métricas)
// y agrega validación de entrada para proteger contra ataques comunes.
// ============================================================

// Importamos los módulos necesarios
import http from 'http';
import { Server } from 'socket.io';
import { createAuthMiddleware } from '../auth.js';
import { joinUserRoom } from '../rooms.js';
import {
  validateMessage,
  mentionNewSchema,
  mentionReadSchema,
} from '../events/schemas.js';
import {
  handleMentionNew,
  handleMentionRead,
} from '../events/mentionEvents.js';
import { getBus, BUS_EVENTS } from '../notificationBus.js';
import { handleConnection } from '../handler.js';
// Rate limiting y métricas
import { createSocketRateLimiter } from '../rateLimiter.js';
import {
  setupMetricsMiddleware,
  setupSocketMetrics,
} from '../monitor/middleware.js';

// Creamos un servidor HTTP que será utilizado por Socket.IO
const httpServer = http.createServer();
// Configuramos el servidor de Socket.IO con CORS para permitir conexiones desde el cliente en localhost:5173
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Aplicamos el middleware de autenticación JWT - se ejecuta en cada conexión ANTES de 'connection'
// authMiddleware verifica JWT en cada conexión. Rechaza tokens expirados o inválidos con error UNAUTHORIZED
io.use(createAuthMiddleware());

// Aplicar rate limiting por conexión
const rateLimiter = createSocketRateLimiter();
io.use(rateLimiter.connection);

// Definimos el puerto en el que el servidor escuchará
const PORT = 3007;

// Manejamos el evento de conexión cuando un cliente se conecta
io.on('connection', (socket) => {
  // Logueamos cuando un cliente se conecta, mostrando su ID de socket
  console.log(`🟢 Cliente conectado: ${socket.id}`);

  // Emitimos un evento 'welcome' al cliente recién conectado con un mensaje y timestamp
  socket.emit('welcome', {
    message: 'Bienvenido al servidor de WebSocket nivel 09 (Hardening)',
    timestamp: new Date().toISOString(),
  });

  // Auto-join user room after auth middleware has populated socket.data.user
  if (socket.data.user?.id) {
    joinUserRoom(io, socket, socket.data.user.id);
  }

  // Aplicar rate limiting por evento para este socket
  rateLimiter.event(socket);
  // Configurar recolección de métricas para este socket
  setupSocketMetrics(socket);

  // Handler para unirse manualmente a una sala de usuario
  socket.on('room:join', ({ userId }) => {
    joinUserRoom(io, socket, userId);
  });

  // Al conectar, entregar backlog de menciones perdidas durante desconexión
  handleConnection(io, socket, async () => {
    // En servidor educativo, devolver array vacío (demo en level-08-offline.js)
    // En producción: consultar DB con Prisma:
    // const prisma = getPrisma()
    // return prisma.mentions.findMany({ where: { mentioned_user_id: userId, is_read: false }, ... })
    return [];
  });

  // Manejamos el evento de desconexión cuando el cliente se desconecta
  socket.on('disconnect', (reason) => {
    console.log(`🔴 Cliente desconectado: ${socket.id}, razón: ${reason}`);
    // Limpiar rate limiter buckets para evitar memory leak
    rateLimiter.cleanup(socket);
  });

  // Manejamos cualquier error que ocurra en la conexión del socket
  socket.on('error', (error) => {
    console.log(`⚠️ Error en el socket ${socket.id}:`, error);
  });

  // Procesar eventos entrantes con validación de esquema Joi
  socket.on('message', async (data) => {
    try {
      const { type, payload } = data;

      switch (type) {
        case 'mention:new': {
          const validation = validateMessage(
            { type, payload },
            mentionNewSchema
          );
          if (!validation.valid) {
            return socket.emit('error:validation', {
              errors: validation.error,
            });
          }
          handleMentionNew(io, socket, validation.value.payload);
          break;
        }
        case 'mention:read': {
          const validation = validateMessage(
            { type, payload },
            mentionReadSchema
          );
          if (!validation.valid) {
            return socket.emit('error:validation', {
              errors: validation.error,
            });
          }
          await handleMentionRead(io, socket, validation.value.payload);
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

// ============================================================
// Bus de eventos — Conectar EventEmitter a Socket.IO
// ============================================================
// Escuchamos eventos del bus de notificaciones y los reenviamos
// a los clientes correspondientes via Socket.IO. Esto desacopla
// la capa de servicios (controllers, DAOs) de la capa de WS.
// ============================================================

const bus = getBus();

// Cuando un servicio emite MENTION_CREATED, reenviar al usuario mencionado
bus.on(BUS_EVENTS.MENTION_CREATED, (payload) => {
  console.log(
    '📢 Bus → WS: mención creada para usuario',
    payload.mentionedUserId
  );
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

// Cuando un servicio emite MENTION_READ, loguear acción
bus.on(BUS_EVENTS.MENTION_READ, (payload) => {
  console.log('📖 Bus → WS: menciones leídas por usuario', payload.userId);
});

// Configurar métricas Prometheus en el servidor
setupMetricsMiddleware(io);

// Iniciamos el servidor HTTP en el puerto especificado
httpServer.listen(PORT, () => {
  console.log(
    `🚀 Servidor Socket.IO nivel 09 escuchando en http://localhost:${PORT}`
  );
});

// Manejamos la señal de interrupción (SIGINT) para un apagado graceful
process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT. Cerrando servidor...');
  // Cerramos el servidor de Socket.IO
  io.close(() => {
    console.log('🔌 Servidor Socket.IO cerrado.');
    // Cerramos el servidor HTTP
    httpServer.close(() => {
      console.log('🛑 Servidor HTTP cerrado.');
      process.exit(0);
    });
  });
});

// Manejamos la señal de terminación (SIGTERM) para un apagado graceful
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM. Cerrando servidor...');
  // Cerramos el servidor de Socket.IO
  io.close(() => {
    console.log('🔌 Servidor Socket.IO cerrado.');
    // Cerramos el servidor HTTP
    httpServer.close(() => {
      console.log('🛑 Servidor HTTP cerrado.');
      process.exit(0);
    });
  });
});
