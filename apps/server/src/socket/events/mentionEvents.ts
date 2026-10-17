// Manejadores de eventos relacionados con menciones en notas.
// Cada handler recibe (io, socket, payload) y ejecuta la lógica del evento.

import { prisma } from '../../config/db.js';
import type { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../auth.js';

/** Payload aceptado por `mention:new`. */
type MentionNewPayload = {
  noteId: number;
  noteTitle: string;
  mentionedByUserId: number;
  mentionedUserId: number;
  excerpt: string;
};

/** Payload aceptado por `mention:read` (opcional = marcar todas). */
type MentionReadPayload = {
  mentionIds?: number[];
};

export const handleMentionNew = (
  io: Server,
  socket: AuthenticatedSocket,
  payload: MentionNewPayload
) => {
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

export const handleMentionRead = async (
  io: Server,
  socket: AuthenticatedSocket,
  payload: MentionReadPayload
) => {
  const { mentionIds } = payload;

  // Si mentionIds es undefined/null → marcar TODAS como leídas
  // Si mentionIds es array vacío → no hacer nada (early return)
  if (Array.isArray(mentionIds) && mentionIds.length === 0) return;

  try {
    const where = mentionIds
      ? { id: { in: mentionIds }, mentionedUserId: socket.data.user.id }
      : { mentionedUserId: socket.data.user.id, isRead: false };

    await prisma.mentions.updateMany({
      where,
      data: { isRead: true },
    });

    // Broadcast a TODOS los sockets del mismo usuario (incluyendo el sender)
    io.to(`user:${socket.data.user.id}`).emit('mention:read', { mentionIds });

    console.log(
      `📖 Usuario ${socket.data.user?.id} marcó como leídas:`,
      mentionIds || 'todas'
    );
  } catch (err) {
    console.error(
      '❌ Error marcando menciones como leídas:',
      err instanceof Error ? err.message : String(err)
    );
    socket.emit('error:unknown', {
      message: 'Error al marcar menciones como leídas',
    });
  }
};

// Payload builder functions that construct thin envelope payloads
// following the standard schema format
export const createMentionNewPayload = ({
  noteId,
  noteTitle,
  mentionedByUserId,
  mentionedUserId,
  excerpt,
}: MentionNewPayload) => ({
  type: 'mention:new',
  payload: { noteId, noteTitle, mentionedByUserId, mentionedUserId, excerpt },
});

export const createMentionReadPayload = (mentionIds?: number[]) => ({
  type: 'mention:read',
  payload: { mentionIds },
});
