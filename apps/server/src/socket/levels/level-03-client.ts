// Importamos el cliente de Socket.IO para Node.js
import { io } from 'socket.io-client';

// Creamos una instancia del socket que se conectará al servidor en localhost:3001
const socket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
});

// Manejamos el evento de conexión exitoso
socket.on('connect', () => {
  console.log('🟢 Conectado al servidor Socket.IO');
});

// Manejamos el evento de desconexión
socket.on('disconnect', (reason) => {
  console.log(`🔴 Desconectado del servidor: ${reason}`);
});

// Manejamos errores de conexión
socket.on('connect_error', (err) => {
  console.log(`⚠️ Error de conexión: ${err.message}`);
});

// Manejamos intentos de reconexión
socket.on('reconnect', (attemptNumber) => {
  console.log(`🔄 Reconectado en el intento #${attemptNumber}`);
});

// Manejamos cada intento de reconexión (antes de que ocurra)
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`🔄 Intento de reconexión #${attemptNumber}...`);
});

// Manejamos el evento 'welcome' que envía el servidor
socket.on('welcome', (data) => {
  console.log(`📨 Mensaje de bienvenida recibido:`, data);
});

// Configuramos un intervalo para enviar un ping cada 5 segundos
const pingInterval = setInterval(() => {
  console.log('📡 Enviando ping al servidor...');
  socket.emit('client:ping', {
    timestamp: new Date().toISOString(),
    message: 'Ping desde el cliente Node.js',
  });
}, 5000);

// Manejamos la señal de interrupción (SIGINT) para un apagado graceful
process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT. Cerrando cliente...');

  // Limpiamos el intervalo de ping
  clearInterval(pingInterval);

  // Desconectamos el socket
  socket.disconnect();

  process.exit(0);
});

// También manejamos SIGTERM para entornos de producción
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM. Cerrando cliente...');

  // Limpiamos el intervalo de ping
  clearInterval(pingInterval);

  // Desconectamos el socket
  socket.disconnect();

  process.exit(0);
});
