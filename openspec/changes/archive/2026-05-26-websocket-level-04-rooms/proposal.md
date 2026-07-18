## Why

Messages must reach specific users, not everyone connected to the server. Rooms are the correct abstraction for user-targeted messaging — they provide built-in isolation, automatic cleanup on disconnect, and avoid manual socket tracking.

## What Changes

- **Create `level-05-rooms.js`**: Standalone demo on port 3003 demonstrating room-based messaging with 3 simulated authenticated users (IDs 5, 7, 42). Every line commented in Spanish for learning purposes.
- **Create `rooms.js`**: Production helper module with `joinUserRoom`, `leaveUserRoom`, `getActiveUserSockets`, `isUserOnline`, `getActiveRoomCount` — all with JSDoc annotations.
- **Update `levels/README.md`**: Document room strategy, naming conventions, and usage patterns.

## Capabilities

### New Capabilities
- `websocket-room-routing`: Room-based message routing for WebSocket connections — automatic room join on authenticated connection, isolated per-user channels, multi-tab support, and in-memory room lifecycle management.

### Modified Capabilities
- *(None — no existing spec requirements are changing)*

## Impact

- **New utility module**: `apps/server/src/socket/rooms.js` — no breaking changes to existing code.
- **New demo level**: `apps/server/src/socket/levels/level-05-rooms.js` — standalone, not integrated with the main server.
- **Documentation**: Updated `levels/README.md` with room strategy.
- **Dependencies**: None — pure Socket.io built-in room API, no additional packages.
