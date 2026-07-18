## 1. Setup

- [x] 1.1 Install `socket.io-client` as a dependency in `apps/server/`

## 2. Node.js Client

- [x] 2.1 Create `apps/server/src/socket/levels/level-03-client.js` with Socket.IO client that connects to `http://localhost:3001`, handles connect/disconnect/reconnect/connect_error events, receives `welcome`, emits `client:ping` every 5s, and performs graceful shutdown on SIGINT — every line commented in Spanish

## 3. Browser Client

- [x] 3.1 Create `apps/server/src/socket/levels/test-client.html` — self-contained page with CDN socket.io-client, connect/disconnect button, connection status indicator, and message log area

## 4. Documentation

- [x] 4.1 Update `levels/README.md` with Level 2 instructions covering how to run the Node.js client, open the browser test page, and expected behaviors

## 5. Client-side — Socket connection in React

- [x] 5.1 Install `socket.io-client` in `apps/client/`: `cd apps/client && npm install socket.io-client`
- [x] 5.2 Create `apps/client/src/hooks/useSocket.js`:
  - Import `{ io }` from 'socket.io-client'
  - Create hook that returns socket instance
  - Connect to `http://localhost:3001` (hardcoded for now, env var later)
  - Only create ONE connection (singleton pattern, not per render)
  - Handle 'connect' event: `console.log('🟢 Socket conectado')`
  - Handle 'disconnect' event: `console.log('🔴 Socket desconectado', reason)`
  - Handle 'connect_error': `console.log('⚠️ Error de conexión', err.message)`
  - Return `{ socket, isConnected, isError }`
  - EVERY LINE commented in Spanish
  - Use `useRef` to prevent multiple connections on re-render
  - Use `useEffect` cleanup to disconnect on unmount
- [x] 5.3 Integrate `useSocket` in `apps/client/src/modules/notes/pages/Notes.jsx`:
  - Import `useSocket` from `@/hooks/useSocket`
  - Call `const { isConnected } = useSocket()` in the Notes component
  - Show connection status indicator in the UI (small colored dot: green=connected, red=disconnected)
- [x] 5.4 Add barrel export in `apps/client/src/hooks/index.js`:
  - Append `export * from './useSocket'` to the barrel file
  - Consumers import: `import { useSocket } from '@/hooks'`
  - Namespaced: same pattern as existing `useFetch`, `useUserSettings`
