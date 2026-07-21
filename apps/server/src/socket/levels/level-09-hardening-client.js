// ============================================================
// level-09-hardening-client.js - Cliente de carga para pruebas de rate limiting
// ============================================================
// Este cliente simula carga envíando muchos mensajes para disparar el rate limiting.
// Útil para probar y demostrar el comportamiento del limiter.
// ============================================================

import { io } from 'socket.io-client';

// Configuración del cliente
const SOCKET_URL = 'http://localhost:3007'; // Puerto del servidor de hardening
const USER_ID = Math.floor(Math.random() * 1000); // ID de usuario aleatorio
const TOKEN = 'test-token'; // En producción, obtén un JWT real

// Creamos la conexión Socket.IO
const socket = io(SOCKET_URL, {
  auth: {
    token: TOKEN
  }
});

// Variables para estadísticas
let messagesSent = 0;
let messagesRejected = 0;
let startTime = Date.now();

// Cuando nos conectamos exitosamente
socket.on('connect', () => {
  console.log(`✅ Conectado al servidor: ${socket.id}`);
  
  // Unirnos a nuestra sala de usuario
  socket.emit('room:join', { userId: USER_ID });
  
  // Iniciar envío masivo de mensajes para probar rate limiting
  console.log('🚀 Iniciando envío de mensajes para probar rate limiting...');
  
  // Enviar mensajes lo más rápido posible durante 10 segundos
  const intervalId = setInterval(() => {
    // Enviar un mensaje de mención nueva
    socket.emit('message', {
      type: 'mention:new',
      payload: {
        noteId: Math.floor(Math.random() * 100),
        noteTitle: `Nota de prueba ${Math.floor(Math.random() * 1000)}`,
        mentionedByUserId: USER_ID,
        excerpt: 'Este es un extracto de prueba para generar carga en el servidor.',
        timestamp: new Date().toISOString()
      }
    });
    
    messagesSent++;
    
    // Detener después de 10 segundos
    if (Date.now() - startTime > 10000) {
      clearInterval(intervalId);
      console.log('⏱️ Tiempo límite alcanzado. Deteniendo envío de mensajes.');
      socket.disconnect();
    }
  }, 10); // Enviar cada 10ms (100 mensajes/segundo teórico)
});

// Manejar eventos del servidor
socket.on('welcome', (data) => {
  console.log('📩 Mensaje de bienvenida:', data.message);
});

// Manejar errores de validación (incluyendo rate limiting)
socket.on('error:validation', (data) => {
  console.log('❌ Error de validación:', data.errors);
  messagesRejected++;
});

// Manejar errores de rate limiting específicos
socket.on('error:rate_limit', (data) => {
  console.log('🚫 Rate limit alcanzado:', data.message);
  messagesRejected++;
});

// Manejar errores desconocidos
socket.on('error:unknown', (data) => {
  console.log('❓ Error desconocido:', data);
});

// Manejar errores de servidor
socket.on('error:server', (data) => {
  console.log('💥 Error del servidor:', data.message);
});

// Manejar desconexión
socket.on('disconnect', (reason) => {
  console.log(`🔌 Desconectado del servidor. Razón: ${reason}`);
  
  // Mostrar estadísticas finales
  const duration = (Date.now() - startTime) / 1000;
  console.log('\n📊 Estadísticas finales:');
  console.log(`   - Mensajes enviados: ${messagesSent}`);
  console.log(`   - Mensajes rechazados: ${messagesRejected}`);
  console.log(`   - Duración: ${duration.toFixed(2)} segundos`);
  console.log(`   - Tasa efectiva: ${(messagesSent / duration).toFixed(2)} msgs/seg`);
  
  // Salir del proceso
  process.exit(0);
});

// Manejar errores de conexión
socket.on('connect_error', (err) => {
  console.log('❌ Error de conexión:', err.message);
  process.exit(1);
});