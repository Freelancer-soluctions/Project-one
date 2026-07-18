// Handler principal de conexión para Socket.IO.
// Agrupa la lógica de lifecycle: conexión, recuperación de estado,
// entrega de backlog de menciones perdidas durante desconexión.

import { joinUserRoom } from './rooms.js'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Maneja la conexión de un socket: une a sala personal, verifica
 * recovery state, y entrega backlog si es necesario.
 * 
 * Socket.IO v4 reintroduce connectionStateRecovery: cuando un cliente
 * se desconecta brevemente (<2 min), el servidor intenta restaurar
 * su estado (salas, datos). Si recovery falla (reconexión tardía o
 * reinicio del servidor), consultamos DB como fallback.
 * 
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {Function} getBacklogFn — async (userId) => mention[]
 */
export const handleConnection = async (io, socket, getBacklogFn) => {
  const userId = socket.data.user?.id

  if (!userId) {
    // Sin usuario autenticado → no hay salas ni backlog
    return
  }

  // Unir a sala personal (por si auth middleware no lo hizo)
  joinUserRoom(io, socket, userId)

  // socket.recovered es true si Socket.IO restauró estado exitosamente
  // (rooms, data) tras una reconexión dentro del tiempo límite.
  // Si es false, significa recovery falló y debemos entregar backlog.
  if (!socket.recovered) {
    try {
      // getBacklogFn es inyectada para permitir mock en tests
      // y también para que este handler funcione sin Prisma (demo)
      const backlog = await getBacklogFn(userId)

      if (backlog && backlog.length > 0) {
        console.log(`📦 Entregando backlog de ${backlog.length} menciones a usuario ${userId}`)
        socket.emit('mention:backlog', { mentions: backlog })
      }
    } catch (err) {
      console.error(`❌ Error obteniendo backlog para usuario ${userId}:`, err.message)
    }
  }
}

/**
 * Obtiene el backlog de menciones no leídas para un usuario desde la base de datos.
 * Utiliza el índice compuesto (mentioned_user_id, is_read, created_on) para optimizar la consulta.
 * 
 * @param {number} userId - ID del usuario para obtener menciones
 * @returns {Promise<Array>} Array de menciones con datos del usuario que mencionó y la nota
 */
export const getMentionsBacklog = async (userId) => {
  try {
    const mentions = await prisma.mentions.findMany({
      where: {
        mentionedUserId: userId,
        isRead: false
      },
      orderBy: {
        createdOn: 'desc'
      },
      take: 50,
      include: {
        mentionedByUser: {
          select: {
            id: true,
            name: true,
            picture: true
          }
        },
        note: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })
    
    // Transformar a formato esperado por el cliente
    return mentions.map(mention => ({
      id: mention.id,
      actor: {
        id: mention.mentionedByUser.id,
        name: mention.mentionedByUser.name,
        picture: mention.mentionedByUser.picture
      },
      note: {
        id: mention.note.id,
        title: mention.note.title
      },
      excerpt: mention.note.title.substring(0, 100) + (mention.note.title.length > 100 ? '...' : ''),
      createdAt: mention.createdOn.toISOString()
    }))
  } catch (error) {
    console.error('Error fetching mentions backlog:', error)
    throw error
  }
}

