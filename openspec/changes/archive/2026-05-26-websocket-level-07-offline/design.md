## Context

The application uses Socket.IO for real-time notifications. When a user is mentioned in a note, a `mention:new` event is emitted. However, if the user is temporarily disconnected (network blip, tab closed, etc.), these events are silently lost.

The existing `mentions` table in PostgreSQL already persists mention data, including an `is_read` boolean field. The challenge is to bridge the gap between in-memory Socket.IO events and persistent DB state so that users receive missed mentions on reconnection.

The change targets Level 07 of the educational socket demo, introducing offline delivery as the next capability.

## Goals / Non-Goals

**Goals:**
- Deliver missed mentions when a user reconnects after disconnection
- Use Socket.IO built-in `connectionStateRecovery` for brief disconnects (< 2 minutes, no server restart)
- Use database fallback query for long disconnects or server restarts
- Paginate backlog to 50 most recent unread mentions
- Broadcast `mention:read` events across all tabs when a mention is marked read
- Create a standalone educational demo (level-08-offline) on port 3006

**Non-Goals:**
- Delivery of non-mention events on reconnect (e.g., typing indicators, presence changes)
- Persistent Socket.IO state across server restarts (in-memory recovery only)
- Redis adapter compatibility (connectionStateRecovery is incompatible)
- Delivery confirmation / read receipts beyond the existing `is_read` flag
- Message ordering guarantees beyond per-query `orderBy createdOn desc`

## Decisions

### Decision 1: Socket.IO connectionStateRecovery for brief disconnects
- **Choice**: Enable `connectionStateRecovery: { maxDisconnectionDuration: 120000 }` in the server options
- **Rationale**: Socket.IO v4.6+ provides this built-in, saving us from implementing custom event buffering. It stores socket ID, rooms, and data in memory during unexpected disconnects. On reconnect within 2 minutes, `socket.recovered = true` and missed events are replayed automatically.
- **Alternatives considered**:
  - *Custom event buffer in Redis*: More complex, requires Redis dependency, but survives server restarts. Rejected because server restart is already handled by DB fallback.

### Decision 2: Database fallback for long disconnects or restarts
- **Choice**: On every connection, if `socket.recovered` is false, query unread mentions from the database
- **Rationale**: Covers all cases connectionStateRecovery cannot handle — disconnects longer than 2 minutes, server restarts, and multi-device scenarios.
- **Database query**: `prisma.mentions.findMany({ where: { mentionedUserId, isRead: false }, take: 50, orderBy: { createdOn: 'desc' }, include: { mentionedByUser: { select: { id: true, name: true, picture: true } }, note: { select: { id: true, title: true } } } })`
- **Index strategy**: Composite index `@@index([mentionedUserId, createdOn(sort: Desc)])` on the mentions table for efficient querying.

### Decision 3: Connection flow
- **Choice**: Sequential flow on connection — join user room → check `socket.recovered` → if false, query DB → emit `mention:backlog` if mentions exist
- **Rationale**: Simple, deterministic, single-responsibility handler. The `socket.recovered` check avoids redundant DB queries when Socket.IO already has the state.

### Decision 4: Cross-tab mention:read broadcast
- **Choice**: When a client calls the API to mark a mention as read, the server broadcasts `mention:read` with the mention ID to all other tabs in the user's room
- **Rationale**: Keeps multiple tabs in sync without polling. Uses existing Socket.IO room mechanism.

### Decision 5: Standalone demo (level-08-offline)
- **Choice**: Create `apps/server/src/socket/levels/level-08-offline.js` as an independent Socket.IO server on port 3006 with in-memory mention store
- **Rationale**: Educational — allows testing the offline delivery flow without running the full application. Every line commented in Spanish for the workshop audience.

## Risks / Trade-offs

- **[Risk] connectionStateRecovery is in-memory only**: Lost on server restart → Mitigation: DB fallback handles this case.
- **[Risk] connectionStateRecovery incompatible with Redis adapter**: If the project switches to Redis adapter for horizontal scaling, this mechanism breaks → Mitigation: DB fallback remains functional. Future enhancement can implement a custom Redis-based event buffer.
- **[Risk] DB query on every connection adds latency**: Each connect triggers a mentions query → Mitigation: `take: 50` pagination and composite index keep query fast (< 5ms).
- **[Trade-off] 50-mention limit**: Users with more than 50 unread mentions only see the 50 most recent → Acceptable for MVP. Future work could add pagination or scroll.
- **[Trade-off] No delivery guarantees**: If the socket disconnects between the backlog emit and client processing, those mentions are silently lost → Mitigation: Client can request backlog on demand using an API endpoint as a fallback.
