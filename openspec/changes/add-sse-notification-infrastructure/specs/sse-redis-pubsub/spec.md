## ADDED Requirements

### Requirement: Cross-Instance Event Publishing
When an SSE event is delivered locally, the system SHALL publish the event to Redis Pub/Sub so other server instances can deliver it to their local connections.

#### Scenario: Publish event to Redis
- **WHEN** `SseManager` delivers an event to local connections
- **THEN** the `redisBridge` SHALL publish the event to a Redis channel prefixed with `sse:<eventType>`

#### Scenario: Publish includes full event payload
- **WHEN** an event is published to Redis
- **THEN** the message SHALL include the event type, target channels/users, and JSON payload

#### Scenario: Apply origin flag to cross-instance messages
- **WHEN** `redisBridge` publishes an event to Redis
- **THEN** it SHALL include an `_origin: 'redis'` flag in the published message to identify it as cross-instance

#### Scenario: Do not republish Redis-originated events
- **WHEN** an event originates from a Redis Pub/Sub message (i.e., was already published by another instance)
- **THEN** the system SHALL NOT republish it back to Redis to avoid infinite loops

### Requirement: Cross-Instance Event Subscription
Each server instance SHALL subscribe to Redis Pub/Sub channels to receive events published by other instances.

#### Scenario: Subscribe to Redis pattern
- **WHEN** the server starts
- **THEN** `redisBridge` SHALL create a Redis Pub/Sub connection and subscribe to the pattern `sse:*`

#### Scenario: Deliver cross-instance event to local connections
- **WHEN** a Redis message is received on a subscribed `sse:*` channel
- **THEN** `redisBridge` SHALL parse the message and call `SseManager.deliverToUser` or `SseManager.deliverToChannel` for local delivery only

#### Scenario: Deliver directly to SseManager without notificationBus
- **WHEN** `redisBridge` receives a Redis message
- **THEN** it SHALL deliver directly to `SseManager.deliverToUser` or `SseManager.deliverToChannel` and MUST NOT emit to `notificationBus`

#### Scenario: Gracefully ignore events with no local subscribers
- **WHEN** a Redis message is received but no local connections match the target user/channel
- **THEN** the message SHALL be silently ignored

### Requirement: Dual Redis Connections
The `redisBridge` SHALL maintain separate Redis connections for publishing and subscribing.

#### Scenario: Separate Pub/Sub and publisher connections
- **WHEN** `redisBridge` initializes
- **THEN** it SHALL create one Redis connection for Pub/Sub (subscriptions) and a separate connection for publishing

#### Scenario: Handle Redis connection errors
- **WHEN** a Redis connection fails or drops
- **THEN** `redisBridge` SHALL log the error and attempt to reconnect with exponential backoff

### Requirement: ioredis Dependency
The system SHALL use `ioredis` as the Redis client library.

#### Scenario: ioredis import
- **WHEN** `redisBridge` is initialized
- **THEN** it SHALL import `ioredis` and use its Pub/Sub API for subscribing and publishing

#### Scenario: Graceful shutdown of Redis connections
- **WHEN** the server shuts down gracefully
- **THEN** both Redis connections SHALL be unsubscribed and closed cleanly
