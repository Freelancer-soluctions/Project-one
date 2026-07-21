// ============================================================
// socketService.js — Constantes y helpers de eventos Socket.IO
// ============================================================
// Centraliza los nombres de eventos para mantener sincronizados
// el servidor y el cliente en un solo lugar.
// ============================================================

// Eventos del servidor → cliente (server emits, client listens)
export const SERVER_EVENTS = {
  MENTION_NEW: 'mention:new',
  MENTION_READ: 'mention:read',
  MENTION_BACKLOG: 'mention:backlog',
  ERROR_VALIDATION: 'error:validation',
  ERROR_UNKNOWN: 'error:unknown',
  ERROR_SERVER: 'error:server',
  ERROR_RATE_LIMIT: 'error:rate_limit',
  ERROR_AUTH: 'error:auth',
  WELCOME: 'welcome',
}

// Legacy alias para retrocompatibilidad con hooks existentes
export const EVENTS = SERVER_EVENTS

// Eventos del cliente → servidor (client emits, server listens)
export const CLIENT_EVENTS = {
  ROOM_JOIN: 'room:join',
  MENTION_READ: 'mention:read',
}

/**
 * Crea payload para evento de mención usable desde el servicio de notas.
 * @param {Object} params
 * @param {number} params.noteId - ID de la nota
 * @param {string} params.noteTitle - Título de la nota
 * @param {number} params.mentionedByUserId - ID del usuario que mencionó
 * @param {number} params.mentionedUserId - ID del usuario mencionado
 * @param {string} params.excerpt - Extracto del contenido (máx 200 chars)
 * @returns {Object} Payload formateado para emitir via socket
 */
export const createMentionPayload = ({
  noteId,
  noteTitle,
  mentionedByUserId,
  mentionedUserId,
  excerpt,
}) => ({
  type: SERVER_EVENTS.MENTION_NEW,
  payload: { noteId, noteTitle, mentionedByUserId, mentionedUserId, excerpt },
})
