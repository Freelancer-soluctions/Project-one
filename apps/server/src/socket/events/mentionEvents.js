// Manejadores de eventos relacionados con menciones en notas.
// Cada handler recibe (io, socket, payload) y ejecuta la lógica del evento.

import { prisma } from '../../config/db.js'

export const handleMentionNew = (io, socket, payload) => {
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
  })
}

export const handleMentionRead = async (io, socket, payload) => {
  const { mentionIds } = payload

  // Si mentionIds es undefined/null → marcar TODAS como leídas
  // Si mentionIds es array vacío → no hacer nada (early return)
  if (Array.isArray(mentionIds) && mentionIds.length === 0) return

  try {
    const where = mentionIds
      ? { id: { in: mentionIds }, mentionedUserId: socket.data.user.id }
      : { mentionedUserId: socket.data.user.id, isRead: false }

    await prisma.mentions.updateMany({
      where,
      data: { isRead: true },
    })

    // Broadcast a TODOS los sockets del mismo usuario (incluyendo el sender)
    io.to(`user:${socket.data.user.id}`).emit('mention:read', { mentionIds })

    console.log(`📖 Usuario ${socket.data.user?.id} marcó como leídas:`, mentionIds || 'todas')
  } catch (err) {
    console.error('❌ Error marcando menciones como leídas:', err.message)
    socket.emit('error:unknown', { message: 'Error al marcar menciones como leídas' })
  }
}

// Payload builder functions that construct thin envelope payloads
// following the standard schema format
export const createMentionNewPayload = ({ noteId, noteTitle, mentionedByUserId, mentionedUserId, excerpt }) => ({
  type: 'mention:new',
  payload: { noteId, noteTitle, mentionedByUserId, mentionedUserId, excerpt },
})

export const createMentionReadPayload = (mentionIds) => ({
  type: 'mention:read',
  payload: { mentionIds },
})