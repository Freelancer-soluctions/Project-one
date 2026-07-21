import React, { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { EVENTS } from '@/services/socketService'
import { MentionCountContext } from './useMentionCount'

export const MentionCountProvider = ({ children }) => {
  const { socket, isConnected } = useSocket()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNew = () => setUnreadCount(c => c + 1)

    const handleBacklog = (data) => {
      const count = data?.mentions?.length ?? data?.mentionIds?.length ?? 0
      setUnreadCount(count)
      setIsLoaded(true)
    }

    const handleRead = (data) => {
      const readCount = data?.mentionIds?.length
      if (readCount) {
        setUnreadCount(c => Math.max(0, c - readCount))
      } else {
        setUnreadCount(0)
      }
    }

    socket.on(EVENTS.MENTION_NEW, handleNew)
    socket.on(EVENTS.MENTION_BACKLOG, handleBacklog)
    socket.on(EVENTS.MENTION_READ, handleRead)

    // Request backlog explicitly to handle race condition where server
    // sent mention:backlog before this provider registered its listener
    socket.emit('message', { type: 'mention:backlog:request' })

    return () => {
      socket.off(EVENTS.MENTION_NEW, handleNew)
      socket.off(EVENTS.MENTION_BACKLOG, handleBacklog)
      socket.off(EVENTS.MENTION_READ, handleRead)
    }
  }, [socket, isConnected])

  return (
    <MentionCountContext.Provider value={{ unreadCount, isLoaded }}>
      {children}
    </MentionCountContext.Provider>
  )
}