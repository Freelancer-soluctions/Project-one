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

import type { Server, Socket } from 'socket.io';

/**
 * Une un socket a la sala personal del usuario.
 * Socket.IO permite que múltiples sockets (pestañas) estén en la misma sala.
 * @param _io - Instancia del servidor Socket.IO (se acepta por simetría de API)
 * @param socket - Socket a unir a la sala
 * @param userId - ID del usuario (numérico o string)
 */
export const joinUserRoom = (
  _io: Server,
  socket: Socket,
  userId: number | string
) => {
  // Convención: prefijo "user:" + ID numérico del usuario.
  // String template para evitar ambigüedad entre IDs numéricos.
  const roomName = `user:${userId}`;
  // socket.join() hace que el socket reciba eventos emitidos a esta sala
  // via io.to(roomName).emit(). Es segura de llamar múltiples veces.
  socket.join(roomName);
};

/**
 * Remueve un socket de su sala personal.
 * Útil cuando el usuario cierra sesión pero el socket sigue vivo.
 * @param socket - Socket a remover de la sala
 * @param userId - ID del usuario
 */
export const leaveUserRoom = (socket: Socket, userId: number | string) => {
  const roomName = `user:${userId}`;
  socket.leave(roomName);
};

/**
 * Obtiene todos los sockets activos en la sala de un usuario.
 * fetchSockets() (Socket.IO v4+) es async — obtener sockets via Promise.
 * @param io - Instancia del servidor Socket.IO
 * @param userId - ID del usuario
 * @returns Sockets activos en la sala del usuario
 */
export const getActiveUserSockets = async (
  io: Server,
  userId: number | string
) => {
  const roomName = `user:${userId}`;
  // fetchSockets() reemplaza a in() + clients() de versiones anteriores.
  // Devuelve sockets reales (no solo IDs) — permite inspeccionar data, handshake, etc.
  const sockets = await io.in(roomName).fetchSockets();
  return sockets;
};

/**
 * Verifica si un usuario tiene al menos un socket conectado.
 * @param io - Instancia del servidor Socket.IO
 * @param userId - ID del usuario
 * @returns true si el usuario tiene al menos un socket conectado
 */
export const isUserOnline = async (io: Server, userId: number | string) => {
  const sockets = await getActiveUserSockets(io, userId);
  return sockets.length > 0;
};

/**
 * Cuenta cuántas salas de usuario están activas actualmente.
 * io.sockets.adapter.rooms contiene TODAS las salas del servidor.
 * Filtramos solo las que comienzan con "user:". Socket.IO añade
 * una sala automática por socket ID — las ignoramos.
 * @param io - Instancia del servidor Socket.IO
 * @returns Número de salas de usuario activas
 */
export const getActiveRoomCount = (io: Server) => {
  const rooms = io.sockets.adapter.rooms;
  let count = 0;
  for (const roomName of rooms.keys()) {
    // Saltar salas automáticas (nombres = socket IDs)
    if (roomName.startsWith('user:')) {
      count++;
    }
  }
  return count;
};
