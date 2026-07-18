## Why

Users who are offline when mentioned must receive notifications when they reconnect. Socket.IO connectionStateRecovery handles brief disconnects; DB query handles server restarts and long absences. Without this, mentions during downtime are silently lost.

## What Changes

- **New**: `apps/server/src/socket/handler.js` — main Socket.IO connection handler with backlog delivery logic
- **New**: `apps/server/src/socket/levels/level-08-offline.js` — standalone educational demo for offline delivery
- **Capability introduced**: `websocket-offline-delivery` — offline message backlog, connection state recovery, and unread mention delivery on reconnect
- No breaking changes

## Capabilities

### New Capabilities
- `websocket-offline-delivery`: Reliable delivery of missed mention events when users reconnect after disconnection, using Socket.IO connectionStateRecovery for brief outages and database fallback for longer absences

### Modified Capabilities
- *(None — no existing spec requirements are changing)*

## Impact

- **New module**: `handler.js` — Socket.IO connection handler that queries unread mentions from DB on connect
- **New demo**: `level-08-offline.js` — standalone educational server on port 3006
- **Dependency**: reads from existing `mentions` table via Prisma
- **Performance**: composite index `(mentionedUserId, createdOn DESC)` recommended on `mentions` table
- **No breaking changes**: existing socket and service code untouched
