## 1. Validation Schemas

- [x] 1.1 Create `apps/server/src/socket/events/schemas.js` with Joi schemas for envelope payload, mention events, notification badge events, and batch payloads
- [x] 1.2 Implement validation middleware function that validates incoming client → server messages against the schemas and returns error events on failure

## 2. Event Handlers

- [x] 2.1 Create `apps/server/src/socket/events/mentionEvents.js` with event handler definitions for `mention:new` and `mention:read` events
- [x] 2.2 Implement payload builder functions that construct thin envelope payloads following the standard schema format

## 3. Demo Server (Level 06)

- [x] 3.1 Create `apps/server/src/socket/levels/level-06-events.js` — a standalone WebSocket server on port 3004 that demonstrates the complete event flow
- [x] 3.2 Implement valid payload demo: client sends a properly formatted `mention:new` event and receives notification
- [x] 3.3 Implement malformed payload demo: client sends invalid payload and receives `error:validation` event
- [x] 3.4 Implement batch limit demo: client sends payload exceeding 50KB and server demonstrates chunked delivery
- [x] 3.5 Implement unknown event type demo: client sends unknown event type and server logs warning
- [x] 3.6 EVERY LINE of level-06-events.js MUST be commented in Spanish explaining the WebSocket event flow

## 4. Documentation

- [x] 4.1 Update README.md with an event catalog table listing all registered event types with their namespaces, descriptions, and payload shapes

## 5. Client-side — Mention notification listener

- [x] 5.1 Create `apps/client/src/hooks/useMentionNotifications.js`:
  - Import useSocket from '@/hooks/useSocket'
  - Listen for 'mention:new' event from socket
  - On receive, log the payload and show shadcn toast
  - Use the existing `<Toaster />` in App.jsx (already configured)
  - Toast content: "Te mencionaron en {noteTitle}" with actor name
  - Toast action: navigate to /home/notes on click
  - Format: `toast({ title: `${actor.name} te mencionó`, description: excerpt })`
  - EVERY LINE commented in Spanish

- [x] 5.2 Integrate `useMentionNotifications` in `apps/client/src/modules/notes/pages/Notes.jsx`:
  - Import and call `useMentionNotifications()` hook
  - Add a mentions badge/indicator showing unread count

- [x] 5.3 Create `apps/client/src/services/socketService.js`:
  - Centralized event name constants (MENTION_NEW, MENTION_READ, MENTION_BACKLOG)
  - Helper functions for socket event payload validation
  - Reusable across all hooks
