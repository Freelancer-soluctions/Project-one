## ADDED Requirements

### Requirement: Prometheus Metrics Collection
The system SHALL expose Prometheus metrics for SSE connection and event statistics.

#### Scenario: Count active connections
- **WHEN** Prometheus scrapes the metrics endpoint
- **THEN** the system SHALL expose a gauge `sse_active_connections` with the current number of active SSE connections

#### Scenario: Count total events delivered
- **WHEN** an SSE event is delivered to a client
- **THEN** the system SHALL increment a counter `sse_events_delivered_total` with labels for event type

#### Scenario: Count delivery errors
- **WHEN** an SSE event fails to deliver (e.g., write error to a closed connection)
- **THEN** the system SHALL increment a counter `sse_delivery_errors_total` with labels for error type

#### Scenario: Count connections opened
- **WHEN** a new SSE connection is successfully established
- **THEN** the system SHALL increment a counter `sse_connections_opened_total`

#### Scenario: Count connections closed
- **WHEN** an SSE connection is closed
- **THEN** the system SHALL increment a counter `sse_connections_closed_total` with labels for close reason (client_disconnect, idle_timeout, shutdown, error)

### Requirement: Per-User Connection Stats
The system SHALL track concurrent SSE connections per user for monitoring purposes.

#### Scenario: Gauge per-user connections
- **WHEN** a user establishes or closes an SSE connection
- **THEN** the system SHALL update a gauge `sse_connections_per_user` with a label for userId

### Requirement: Redis Pub/Sub Metrics
The system SHALL collect metrics for Redis cross-instance event delivery.

#### Scenario: Count Redis messages published
- **WHEN** an event is published to Redis
- **THEN** the system SHALL increment a counter `sse_redis_published_total` with a label for event type

#### Scenario: Count Redis messages received
- **WHEN** an event is received from Redis Pub/Sub
- **THEN** the system SHALL increment a counter `sse_redis_received_total` with a label for event type

### Requirement: Health Check Integration
The SSE module SHALL expose a health status for the SSE subsystem.

#### Scenario: SSE health endpoint
- **WHEN** the health check endpoint queries SSE status
- **THEN** it SHALL report whether SseManager is initialized, number of active connections, and Redis connection status
