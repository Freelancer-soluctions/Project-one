// Servidor educativo standalone para demostrar funcionalidad offline con Socket.IO
// Puerto 3006 - Simula entrega de backlog de menciones cuando usuario se reconecta

import http from 'http';
import { Server } from 'socket.io';

// Creamos servidor HTTP para Socket.IO
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  },
  // Habilitamos connectionStateRecovery para restaurar estado tras reconexión breve
  // maxDisconnectionDuration: 120000ms = 2 minutos (valor por defecto de Socket.IO v4+)
  connectionStateRecovery: {}
});

// Puerto del servidor educativo
const PORT = 3006;

// Almacenamiento en memoria para simular menciones pendientes
// Estructura: { userId: [{ mention objeto }, ...] }
const mentionStore = new Map();

// Contador para generar IDs únicos de menciones
let mentionIdCounter = 1;

/**
 * Simula la creación de menciones mientras el cliente está offline
 * Esta función sería llamada por un servicio o proceso externo en una app real
 */
function simulateOfflineMentions() {
  // Simulamos que llegan menciones para usuarios específicos mientras están desconectados
  // En una app real, esto vendría de la base de datos o de eventos del sistema
  
  // Ejemplo: crear una mention para el usuario 1 cada 5 segundos
  setInterval(() => {
    const userId = 1; // Usuario de ejemplo
    
    // Crear objeto de mention simulado
    const fakeMention = {
      id: mentionIdCounter++,
      mentionedUserId: userId,
      mentionedByUserId: 2, // Otro usuario que mencionó
      noteId: 101,
      createdOn: new Date(),
      isRead: false
    };
    
    // Almacenar mention pendiente para este usuario
    if (!mentionStore.has(userId)) {
      mentionStore.set(userId, []);
    }
    mentionStore.get(userId).push(fakeMention);
    
    console.log(`📝 Simulando mention creada para usuario ${userId} mientras estaba offline`);
  }, 5000); // Cada 5 segundos
}

// Manejamos el evento de conexión cuando un cliente se conecta
io.on('connection', (socket) => {
  console.log(`🟢 Cliente conectado: ${socket.id}`);

  // Obtener ID de usuario desde los datos del socket (provisto por middleware de auth)
  // En este ejemplo educativo, simulamos un usuario autenticado
  const userId = socket.data.user?.id || 1; // Valor por defecto para demostración
  
  // Unir al usuario a su sala personal para recibir notificaciones dirigidas
  socket.join(`user:${userId}`);

  // Emitir mensaje de bienvenida
  socket.emit('welcome', {
    message: 'Bienvenido al servidor educativo de WebSocket nivel 08 (offline)',
    timestamp: new Date().toISOString(),
    info: 'Este servidor demuestra connectionStateRecovery y entrega de backlog'
  });

  // socket.recovered es true si Socket.IO restauró estado exitosamente
  // (salas, datos) tras una reconexión dentro del tiempo límite (2 minutos por defecto).
  // Si es false, significa recovery falló (reconexión tardía o reinicio del servidor)
  // y debemos entregar el backlog desde nuestro almacenamiento en memoria.
  if (!socket.recovered) {
    console.log(`🔄 Recovery falló para usuario ${userId}, verificando backlog...`);
    
    // Obtener menciones pendientes para este usuario desde nuestro almacén en memoria
    const pendingMentions = mentionStore.get(userId) || [];
    
    if (pendingMentions.length > 0) {
      console.log(`📦 Entregando backlog de ${pendingMentions.length} menciones a usuario ${userId}`);
      
      // Formatear menciones para enviar al cliente (similar formato al del handler real)
      const formattedMentions = pendingMentions.map(mention => ({
        id: mention.id,
        actor: {
          id: mention.mentionedByUserId,
          name: `Usuario ${mention.mentionedByUserId}`, // En app real vendría de DB
          picture: `https://i.pravatar.cc/150?u=${mention.mentionedByUserId}`
        },
        note: {
          id: mention.noteId,
          title: `Nota ${mention.noteId}` // En app real vendría de DB
        },
        excerpt: `Esta es una mención simulada creada mientras estabas offline`,
        createdAt: mention.createdOn.toISOString()
      }));
      
      // Emitir backlog al cliente
      socket.emit('mention:backlog', { mentions: formattedMentions });
      
      // Limpiar menciones entregadas para evitar duplicados en futuras reconexiones
      mentionStore.delete(userId);
    } else {
      console.log(`📭 No hay menciones pendientes para usuario ${userId}`);
    }
  } else {
    console.log(`✅ Recovery exitoso para usuario ${userId}, estado restaurado`);
  }

  // Manejamos el evento de desconexión cuando el cliente se desconecta
  socket.on('disconnect', (reason) => {
    console.log(`🔴 Cliente desconectado: ${socket.id}, razón: ${reason}`);
  });

  // Manejamos cualquier error que ocurra en la conexión del socket
  socket.on('error', (error) => {
    console.log(`⚠️ Error en el socket ${socket.id}:`, error);
  });

  // Ejemplo de cómo manejar eventos de mention:read (simplificado para demo)
  socket.on('mention:read', (data) => {
    console.log(`📖 Usuario ${userId} marcó mention como leída:`, data);
    // En una app real, aquí actualizaríamos la base de datos
    socket.emit('mention:read:success', { mentionId: data.mentionId });
  });
});

// Iniciamos el servidor HTTP en el puerto especificado
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor Socket.IO nivel 08 (offline) escuchando en http://localhost:${PORT}`);
  console.log(`💡 Consejo: Abra múltiples pestañas del cliente y desconéctese/reconéctese para ver el backlog`);
  
  // Iniciar simulación de menciones offline
  simulateOfflineMentions();
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