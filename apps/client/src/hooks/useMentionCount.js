import { createContext, useContext } from 'react'

const MentionCountContext = createContext({ unreadCount: 0, isLoaded: false })

export const useMentionCount = () => useContext(MentionCountContext)

export { MentionCountContext }