// ============================================================
// level-06-events.js — Demostración independiente de eventos con validación Joi
// ============================================================
// Servidor Socket.IO independiente en puerto 3004
// Incluye autenticación JWT simulada para demostrar el flujo completo
// Demuestra eventos de mención:new y mention:read con validación de esquemas
// Cada línea está comentada en español explicando el flujo de eventos WebSocket
// ============================================================

import http from 'http';
import { Server } from 'socket.io';
import Joi from 'joi';

// Simulamos un usuario autenticado para la demostración
// En un entorno real, esto vendría del middleware de autenticación JWT
const SIMULATED_USER = { id: 1, username: 'demoUser' };

// Definimos los esquemas de validación Joi idénticos a los del servidor principal
// Schema de envoltura delgada (thin envelope):
// Todo evento cliente → servidor debe cumplir este formato.
// Mantiene mensajes pequeños y predecibles.
const envelopeSchema = Joi.object({
  // type: nombre del evento con namespace (ej: 'mention:new')
  type: Joi.string()
    .pattern(/^[a-z]+:[a-z]+$/)
    .required(),
  // payload: datos específicos del evento (validado por schema individual)
  payload: Joi.object().required(),
  // meta: metadatos opcionales (timestamp, traceId, etc.)
  meta: Joi.object({
    timestamp: Joi.date().iso(),
    clientId: Joi.string().max(64),
  }).optional(),
});

// Schema para mención en nota
const mentionNewSchema = Joi.object({
  // ID de la nota donde ocurrió la mención
  noteId: Joi.number().integer().positive().required(),
  // ID del usuario que mencionó
  mentionedByUserId: Joi.number().integer().positive().required(),
  // ID del usuario mencionado
  mentionedUserId: Joi.number().integer().positive().required(),
  // Extracto del contenido donde aparece la mención (máx 200 chars)
  excerpt: Joi.string().max(200).required(),
  // Título de la nota para mostrar en notificación
  noteTitle: Joi.string().max(100).required(),
});

// Schema para marcar menciones como leídas
const mentionReadSchema = Joi.object({
  mentionIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required(),
});

// Validador genérico: recibe mensaje completo (envelope) y valida contra envelope + schema específico
const validateMessage = (message, payloadSchema) => {
  const { error: envelopeError, value: envelopeValue } =
    envelopeSchema.validate(message, {
      stripUnknown: true,
      abortEarly: false,
    });
  if (envelopeError) {
    return { valid: false, error: envelopeError.details.map((d) => d.message) };
  }

  const { error: payloadError, value: payloadValue } = payloadSchema.validate(
    envelopeValue.payload,
    {
      stripUnknown: true,
      abortEarly: false,
    }
  );
  if (payloadError) {
    return { valid: false, error: payloadError.details.map((d) => d.message) };
  }

  return { valid: true, value: { ...envelopeValue, payload: payloadValue } };
};

// Manejadores de eventos relacionados con menciones en notas.
// Cada handler recibe (io, socket, payload) y ejecuta la lógica del evento.
const handleMentionNew = (io, socket, payload) => {
  // io.to() envía el evento a TODOS los sockets en la sala del usuario mencionado
  // (incluyendo múltiples pestañas del mismo usuario)
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
};

const handleMentionRead = (io, socket, payload) => {
  // En este nivel educativo, simulamos marcar menciones como leídas
  // En una implementación real, esto haría una actualización en la base de datos vía Prisma
  console.log(
    `📖 Usuario ${socket.data.user?.id} marcó como leídas:`,
    payload.mentionIds
  );
  // Emitimos confirmación al cliente
  socket.emit('mention:read:confirmed', { count: payload.mentionIds.length });
};

// Creamos un servidor HTTP que será utilizado por Socket.IO
const httpServer = http.createServer();
// Configuramos el servidor de Socket.IO con CORS para permitir conexiones desde el cliente
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware de autenticación simulada
// En un entorno real, esto verificaría el JWT y poblaría socket.data.user
io.use((socket, next) => {
  // Simulamos que el usuario está autenticado
  socket.data.user = SIMULATED_USER;
  next();
});

const PORT = 3004;

// Manejamos el evento de conexión cuando un cliente se conecta
io.on('connection', (socket) => {
  // Logueamos cuando un cliente se conecta, mostrando su ID de socket
  console.log(
    `🟢 Cliente conectado: ${socket.id} (usuario: ${socket.data.user?.username})`
  );

  // Emitimos un evento 'welcome' al cliente recién conectado con un mensaje y timestamp
  socket.emit('welcome', {
    message:
      'Bienvenido al servidor de WebSocket nivel 06 - Eventos con validación Joi',
    timestamp: new Date().toISOString(),
  });

  // Auto-join user room after auth middleware has populated socket.data.user
  if (socket.data.user?.id) {
    const userRoom = `user:${socket.data.user.id}`;
    socket.join(userRoom);
    console.log(`   Unido a sala personal: ${userRoom}`);
  }

  // Procesar eventos entrantes con validación de esquema Joi
  socket.on('message', async (data) => {
    try {
      // El mensaje debe tener formato: { type, payload }
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
          handleMentionRead(io, socket, validation.value.payload);
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

  // Manejamos el evento de desconexión cuando el cliente se desconecta
  socket.on('disconnect', (reason) => {
    console.log(`🔴 Cliente desconectado: ${socket.id}, razón: ${reason}`);
  });

  // Manejamos cualquier error que ocurra en la conexión del socket
  socket.on('error', (error) => {
    console.log(`⚠️ Error en el socket ${socket.id}:`, error);
  });
});

// Iniciamos el servidor HTTP en el puerto especificado
httpServer.listen(PORT, () => {
  console.log(
    `🚂 Servidor Socket.IO nivel 06 escuchando en http://localhost:${PORT}`
  );
  console.log(`   Demostrando eventos de mención con validación Joi`);
  console.log(
    `   Prueba conectando un cliente y enviando eventos mention:new y mention:read`
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
