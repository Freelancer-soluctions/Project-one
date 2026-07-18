## ADDED Requirements

### Requirement: Rate limiting with token bucket
The system SHALL enforce per-user rate limits using a token bucket algorithm to prevent abuse and traffic spikes.

#### Scenario: Rate limiter rejects excessive events
- **WHEN** user exceeds 30 events per second
- **THEN** the socket receives an `'error'` event with `{ code: 'RATE_LIMITED', retryAfter: <seconds> }`

#### Scenario: Rate limit resets and accepts events again
- **WHEN** rate limit resets after 1 second and the user waits for `retryAfter` seconds
- **THEN** events are accepted again without errors

### Requirement: Prometheus metrics exposure
The system SHALL expose WebSocket operational metrics via Prometheus for observability and alerting.

#### Scenario: Connected users gauge reflects current count
- **WHEN** Prometheus scrapes `GET /metrics` and the server has 100 connected users
- **THEN** the `ws_connected_users` gauge returns `100`

#### Scenario: Event latency histogram records processing time
- **WHEN** `GET /metrics` is scraped and an event took 150ms to process
- **THEN** the `ws_event_duration_ms` histogram includes that sample in the appropriate bucket

### Requirement: Socket-level error tracking
The system SHALL track and classify errors at the socket middleware level for diagnostics and alerting.

#### Scenario: Malformed event increments error counter
- **WHEN** a malformed event payload is received and validation fails
- **THEN** the `ws_errors_total` counter increments with the `event` and `error_type` labels
