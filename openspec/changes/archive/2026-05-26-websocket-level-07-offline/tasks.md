## 1. Connection Handler

- [x] 1.1 Create `apps/server/src/socket/handler.js` with main connection handler: join user room on connect, check `socket.recovered`, query DB backlog if recovery failed, emit `mention:backlog` with paginated results
- [x] 1.2 Add Prisma query with composite index support: `findMany` on mentions table filtering by `mentionedUserId` and `isRead: false`, ordered by `createdOn desc`, limited to `take: 50`, including `mentionedByUser` and `note` relations
- [x] 1.3 Implement `mention:read` event handler: broadcast to other sockets in the user's room when a mention is marked as read via API
- [x] 1.4 Add JSDoc documentation to all exported functions and connection lifecycle hooks

## 2. Standalone Educational Demo

- [x] 2.1 Create `apps/server/src/socket/levels/level-08-offline.js` as standalone Socket.IO server on port 3006 with `connectionStateRecovery` enabled (`maxDisconnectionDuration: 120000`)
- [x] 2.2 Implement in-memory mention store with simulation: create mentions while client is offline, reconnect triggers backlog delivery
- [x] 2.3 Comment every line in Spanish for workshop audience comprehension

## 3. Documentation

- [x] 3.1 Update README.md with offline delivery flow description: connection recovery, DB fallback, backlog emit, and composite index strategy on mentions table

## 4. Client-side — Backlog on reconnect

- [x] 4.1 Update `useMentionNotifications.js` to handle 'mention:backlog' event:
  - Listen for 'mention:backlog' on socket connect
  - Payload is array of missed mentions: `[{ id, actor, note, excerpt, createdAt }]`
  - Show a single toast: "Tienes {count} menciones nuevas" if count > 0
  - Store backlog in local state for rendering
  - Mark as read: emit 'mention:read' when user clicks notification

- [x] 4.2 Update `apps/client/src/modules/notes/pages/Notes.jsx`:
  - Show backlog mentions as a notification badge/banner
  - Clicking a backlog item navigates to the note
  - "Mark all as read" button that emits mention:read for all

- [x] 4.3 Integrate with existing `useGetMentionsByNoteIdQuery` in NotesCard.jsx:
  - Uncomment the mentions query (currently commented out in NotesCard.jsx)
  - The query fetches mentions from REST API (GET /notes/:id/mentions)
  - Socket.IO supplements with push notifications
  - Both sources coexist: WS for real-time, REST for initial load
