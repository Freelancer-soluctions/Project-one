// ============================================================
// rooms.js — Gestión de salas (rooms) para notificaciones
// ============================================================
// Convención de nomenclatura: "user:<ID_DEL_USUARIO>"
// Cada usuario autenticado pertenece a su sala personal.
// Socket.IO maneja el cleanup automático: cuando un socket se
// desconecta, abandona todas sus salas automáticamente.
// NO almacenamos manualmente socket IDs — dejar que Socket.IO
// gestione el estado de las salas evita desincronización.
// ============================================================

/**
 * Une un socket a la sala personal del usuario.
 * Socket.IO permite que múltiples sockets (pestañas) estén en la misma sala.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {number|string} userId
 */
export const joinUserRoom = (io, socket, userId) => {
  // Convención: prefijo "user:" + ID numérico del usuario.
  // String template para evitar ambigüedad entre IDs numéricos.
  const roomName = `user:${userId}`
  // socket.join() hace que el socket reciba eventos emitidos a esta sala
  // via io.to(roomName).emit(). Es segura de llamar múltiples veces.
  socket.join(roomName)
}

/**
 * Remueve un socket de su sala personal.
 * Útil cuando el usuario cierra sesión pero el socket sigue vivo.
 * @param {import('socket.io').Socket} socket
 * @param {number|string} userId
 */
export const leaveUserRoom = (socket, userId) => {
  const roomName = `user:${userId}`
  socket.leave(roomName)
}

/**
 * Obtiene todos los sockets activos en la sala de un usuario.
 * fetchSockets() (Socket.IO v4+) es async — obtener sockets via Promise.
 * @param {import('socket.io').Server} io
 * @param {number|string} userId
 * @returns {Promise<import('socket.io').Socket[]>}
 */
export const getActiveUserSockets = async (io, userId) => {
  const roomName = `user:${userId}`
  // fetchSockets() reemplaza a in() + clients() de versiones anteriores.
  // Devuelve sockets reales (no solo IDs) — permite inspeccionar data, handshake, etc.
  const sockets = await io.in(roomName).fetchSockets()
  return sockets
}

/**
 * Verifica si un usuario tiene al menos un socket conectado.
 * @param {import('socket.io').Server} io
 * @param {number|string} userId
 * @returns {Promise<boolean>}
 */
export const isUserOnline = async (io, userId) => {
  const sockets = await getActiveUserSockets(io, userId)
  return sockets.length > 0
}

/**
 * Cuenta cuántas salas de usuario están activas actualmente.
 * io.sockets.adapter.rooms contiene TODAS las salas del servidor.
 * Filtramos solo las que comienzan con "user:". Socket.IO añade
 * una sala automática por socket ID — las ignoramos.
 * @param {import('socket.io').Server} io
 * @returns {number}
 */
export const getActiveRoomCount = (io) => {
  const rooms = io.sockets.adapter.rooms
  let count = 0
  for (const roomName of rooms.keys()) {
    // Saltar salas automáticas (nombres = socket IDs)
    if (roomName.startsWith('user:')) {
      count++
    }
  }
  return count
}