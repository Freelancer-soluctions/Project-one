# websocket-room-routing Specification

## Purpose
TBD - created by archiving change websocket-level-04-rooms. Update Purpose after archive.
## Requirements
### Requirement: User joins personal room on authenticated connection

The system SHALL automatically join an authenticated WebSocket connection into a room named `user:<userId>` immediately after auth verification succeeds.

#### Scenario: Authenticated user joins their room

- **WHEN** a WebSocket connection is established with `auth_token` containing a valid JWT for user ID 5
- **THEN** the socket SHALL be joined to room `user:5`

#### Scenario: Multiple tabs for same user

- **WHEN** user with ID 5 opens two browser tabs, establishing two WebSocket connections
- **THEN** both sockets SHALL be joined to room `user:5`

### Requirement: Messages are routed to specific user rooms

The system SHALL support sending messages to a specific user via `io.to('user:<userId>').emit()`, reaching all sockets in that room.

#### Scenario: Message reaches all user sockets

- **WHEN** the server emits `io.to('user:5').emit('message', { text: 'Hello' })`
- **THEN** all sockets in room `user:5` SHALL receive the message
- **AND** sockets in other rooms (e.g., `user:7`) SHALL NOT receive the message

#### Scenario: User isolation between different users

- **WHEN** the server emits `io.to('user:5').emit('message', { text: 'Private' })`
- **THEN** user 7's sockets SHALL NOT receive this message

#### Scenario: Global broadcast still works

- **WHEN** the server emits `io.emit('broadcast', { text: 'All' })`
- **THEN** all connected clients SHALL receive the message regardless of room membership

### Requirement: Room auto-cleanup on disconnect

The system SHALL automatically remove a socket from all rooms when it disconnects, and Socket.io SHALL clean up empty rooms.

#### Scenario: Room cleanup after disconnect

- **WHEN** user 5 has a single socket that disconnects
- **THEN** room `user:5` SHALL be empty and automatically removed by Socket.io

### Requirement: Active session querying

The system SHALL provide helper functions to query active user sessions and room state.

#### Scenario: Get active sockets for a user

- **WHEN** `getActiveUserSockets(io, 5)` is called while user 5 has 2 active sockets
- **THEN** it SHALL return an array of 2 Socket objects

#### Scenario: Check user online status

- **WHEN** `isUserOnline(io, 5)` is called while user 5 has at least one active socket
- **THEN** it SHALL return `true`

#### Scenario: Check user offline status

- **WHEN** `isUserOnline(io, 5)` is called and user 5 has no active sockets
- **THEN** it SHALL return `false`

#### Scenario: Get active room count

- **WHEN** `getActiveRoomCount(io)` is called with 3 active user rooms
- **THEN** it SHALL return `3`

