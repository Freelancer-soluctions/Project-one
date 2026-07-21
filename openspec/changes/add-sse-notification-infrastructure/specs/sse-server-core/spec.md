## ADDED Requirements

### Requirement: SSE Connection Registry
The system SHALL maintain an in-memory connection registry (`SseManager`) using dual-Map topology: `Map<userId, Set<Response>>` for user-routed delivery and `Map<channel, Set<Response>>` for channel-routed broadcast.

#### Scenario: Register new SSE connection
- **WHEN** a client establishes an SSE connection and authenticates successfully
- **THEN** the SseManager SHALL register the connection's Response object in both the user and channel Maps

#### Scenario: Prevent duplicate connection registration
- **WHEN** the same Response object is registered multiple times
- **THEN** the Set<Response> SHALL prevent duplicate entries

#### Scenario: Deliver event to specific user
- **WHEN** an event targets a specific userId
- **THEN** SseManager SHALL look up the user in O(1) time via the user Map and write the event to all associated Response streams

#### Scenario: Deliver event to channel
- **WHEN** an event targets a specific channel
- **THEN** SseManager SHALL look up the channel in O(1) time via the channel Map and write the event to all subscribed Response streams

#### Scenario: Remove connection on close
- **WHEN** a client connection closes or the TCP connection drops
- **THEN** SseManager SHALL remove the Response from both the userId Map and all channel Maps using the Response's stored userId and subscribed channels list

#### Scenario: Handle stream write failure
- **WHEN** writing to an SSE stream fails with EPIPE or ERR_STREAM_DESTROYED
- **THEN** the error handler SHALL remove the Response from all Maps (userId and channel) and increment the `sse_delivery_errors_total` counter

### Requirement: KeepAlive Heartbeat
The system SHALL send a keepalive heartbeat (`:keepalive\n\n`) to every connected SSE client every 30 seconds to prevent proxy and NAT timeouts.

#### Scenario: Send keepalive on schedule
- **WHEN** 30 seconds have elapsed since the last keepalive
- **THEN** SseManager SHALL write `:keepalive\n\n` to every connected Response stream

#### Scenario: Keepalive does not trigger client events
- **WHEN** the browser EventSource receives `:keepalive\n\n`
- **THEN** it SHALL be ignored per the SSE specification (comment-only line)

#### Scenario: Keepalive does not reset idle timer
- **WHEN** the keepAlive interval fires and sends `:keepalive\n\n`
- **THEN** the idle timer SHALL NOT be reset; only application events reset the idle timer

### Requirement: Connection Limits
The system SHALL enforce configurable maximum concurrent SSE connections per user and per server instance.

#### Scenario: Enforce per-user connection limit
- **WHEN** a user attempts to open more than the configured max connections per user
- **THEN** the oldest connection for that user SHALL be closed, or the new connection SHALL be rejected with a 503 status

#### Scenario: Enforce per-instance connection limit
- **WHEN** the total number of SSE connections across all users exceeds the configured per-instance limit
- **THEN** the new connection SHALL be rejected with a 503 status

### Requirement: Backpressure Handling
The system SHALL handle backpressure when `res.write()` returns false, indicating the internal buffer is full.

#### Scenario: Activate send queue on backpressure
- **WHEN** `res.write()` returns false
- **THEN** SseManager SHALL activate a send queue for that connection and buffer outgoing events

#### Scenario: Close connection on queue overflow
- **WHEN** the send queue exceeds the configured high-water mark
- **THEN** SseManager SHALL close the connection and emit an `event: overflow` event

### Requirement: Idle Timeout
The system SHALL close SSE connections that have been idle (no events delivered) for a configurable duration.

#### Scenario: Close idle connection
- **WHEN** no events have been delivered to a connection for the configured idle timeout period
- **THEN** SseManager SHALL close the connection and clean up its Maps

### Requirement: Graceful Shutdown
The system SHALL support graceful shutdown of all SSE connections, allowing in-flight events to complete.

#### Scenario: Drain connections on shutdown
- **WHEN** the server receives a shutdown signal (SIGTERM/SIGINT)
- **THEN** SseManager SHALL stop accepting new connections, send a final `event: shutdown` event to all connections, close all Response streams, and unsubscribe from Redis channels

#### Scenario: Shutdown timeout
- **WHEN** the configured drain timeout is exceeded during graceful shutdown
- **THEN** remaining connections SHALL be forcibly closed

### Requirement: Reconnection Backlog
The system SHALL maintain an in-memory ring buffer of the last 50 events per connection for reconnection delivery via `Last-Event-ID`.

#### Scenario: Deliver buffered events on reconnect
- **WHEN** a client reconnects with a `Last-Event-ID` header
- **THEN** SseManager SHALL replay all buffered events with IDs greater than the provided `Last-Event-ID`

#### Scenario: Ring buffer capacity
- **WHEN** the ring buffer exceeds 50 events
- **THEN** the oldest events SHALL be evicted

#### Scenario: Global ring buffer memory limit
- **WHEN** the total memory used by all ring buffers exceeds `SSE_RING_BUFFER_MEMORY_MAX`
- **THEN** the oldest events SHALL be evicted globally across all connections to free memory
