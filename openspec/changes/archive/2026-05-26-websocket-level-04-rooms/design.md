## Context

The WebSocket server currently supports connections with authentication via `auth_token` query parameter. However, there is no mechanism to route messages to specific users — all `io.emit()` calls reach every connected client. This design introduces Socket.io rooms as the standard abstraction for user-targeted messaging.

Socket.io provides built-in room primitives (`socket.join()`, `io.to()`) that handle membership, automatic cleanup on disconnect, and efficient broadcast — eliminating the need for manual socket tracking.

## Goals / Non-Goals

**Goals:**
- Provide a room-based routing mechanism where each authenticated user is placed in `user:<id>` room
- Support multi-tab scenarios (multiple sockets per user) with no extra effort
- Expose production helper functions (`joinUserRoom`, `leaveUserRoom`, `getActiveUserSockets`, `isUserOnline`, `getActiveRoomCount`)
- Auto-clean rooms when all sockets disconnect
- Create a standalone demo (level-05-rooms.js) for learning and verification

**Non-Goals:**
- Persisting rooms across server restarts (rooms are in-memory by design)
- Implementing private messaging between arbitrary users (rooms provide the foundation, not the feature)
- Replacing `io.emit()` for global broadcast (both patterns coexist)
- Cluster/shared session store for multi-instance deployments

## Decisions

| Decision | Choice | Rationale | Alternatives Considered |
|---|---|---|---|
| Room naming convention | `user:<numeric_id>` | Industry standard, self-documenting, matches JWT payload | `room-<id>` (ambiguous), `user-<id>` (less standard) |
| Room join timing | `socket.join()` immediately after auth verification | Guarantees room membership before any message handler fires | Lazy join on first message (race condition risk) |
| Multi-tab support | Each socket joins independently; `io.to()` emits to all | Built-in Socket.io behavior, zero additional code | Manual socket tracking per user (brittle, leaks) |
| Message targeting | `io.to('user:5').emit()` for user-specific messages | Clear intent, works identically in single/multi-tab scenarios | `socket.broadcast` (doesn't reach sender) |
| Room lifecycle | In-memory, auto-cleaned by Socket.io on disconnect | Zero maintenance, native behavior | Custom cleanup hooks (redundant, error-prone) |
| Active session checks | `io.fetchSockets()` with room filter | Official Socket.io API, returns live socket objects | Manual tracking map (race conditions, memory leaks) |
| Socket ID storage | NEVER store socket IDs manually | Socket IDs are ephemeral (change on reconnect), rooms are the stable abstraction | Storing socket IDs in a Map (stale references) |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| [In-memory] Rooms lost on server restart | Clients reconnect and re-join rooms automatically via auth flow |
| [In-memory] No cross-instance room sharing in cluster | Would need Redis adapter for Socket.io — out of scope for this change |
| [fetchSockets] Performance with very large rooms (10k+) | `fetchSockets()` is async and creates socket instances — benchmark if needed; alternative: use `adapter.sockets()` |
| [Security] User ID in room name leaks to client | Room names are server-side only; client never sees `user:5` — they only know their own socket ID |
