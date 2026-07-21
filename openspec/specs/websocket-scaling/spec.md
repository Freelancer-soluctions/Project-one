# websocket-scaling Specification

## Purpose
TBD - created by archiving change websocket-level-10-scale. Update Purpose after archive.
## Requirements
### Requirement: Cross-instance event delivery with Redis adapter
The system SHALL deliver Socket.IO events across Node.js instances when the Redis adapter (`@socket.io/redis-adapter`) is configured, enabling horizontal scaling.

#### Scenario: Cross-instance room emission via Redis adapter
- **WHEN** two Node.js instances share a Redis adapter and instance 1 emits `io.to('user:5')`
- **THEN** instance 2 delivers that event to the socket(s) joined in room `user:5`

### Requirement: Graceful degradation on Redis connection failure
The system SHALL fall back to the built-in in-memory adapter when the Redis adapter connection drops, ensuring per-instance functionality is preserved.

#### Scenario: Fallback to in-memory adapter on Redis disconnect
- **WHEN** the Redis connection drops and the adapter fails
- **THEN** Socket.IO falls back to the in-memory adapter (per-instance only, no cross-instance event delivery)

### Requirement: PM2 cluster mode with multi-instance socket binding
The system SHALL start the configured number of Socket.IO instances when running in PM2 cluster mode, each listening on its assigned port.

#### Scenario: PM2 cluster starts multiple instances
- **WHEN** PM2 cluster mode is configured with 4 instances and all start
- **THEN** 4 Socket.IO processes listen on their assigned ports

### Requirement: Sticky session routing for polling transport
The system SHALL route all HTTP polling requests from a single client to the same Socket.IO instance when sticky sessions are enabled, preventing message loss during transport negotiation.

#### Scenario: Sticky session routes polling to same instance
- **WHEN** sticky sessions are enabled and a client uses polling transport
- **THEN** all polling requests from that client route to the same Socket.IO instance

### Requirement: connectionStateRecovery incompatibility with Redis adapter
The system SHALL NOT use `connectionStateRecovery` when the Redis adapter is active, and SHALL instead use the database fallback for reconnection state.

#### Scenario: Reconnection without recovery when Redis adapter is active
- **WHEN** `connectionStateRecovery` is enabled alongside the Redis adapter and a client reconnects
- **THEN** recovery via Socket.IO's built-in mechanism is NOT available and the DB fallback handles reconnection state

