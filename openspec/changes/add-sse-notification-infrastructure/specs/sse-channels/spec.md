## ADDED Requirements

### Requirement: Channel Subscription Model
The SSE endpoint SHALL accept a `channels` query parameter specifying which channels the client wants to subscribe to.

#### Scenario: Subscribe to valid channels
- **WHEN** a client connects to `/api/v1/sse/subscribe?channels=user:42,global`
- **THEN** SseManager SHALL register the connection in each specified channel's Response Set

#### Scenario: Subscribe to single channel
- **WHEN** a client connects to `/api/v1/sse/subscribe?channels=global`
- **THEN** SseManager SHALL register the connection in the `global` channel only

#### Scenario: Subscribe with no channels parameter
- **WHEN** a client connects without a `channels` query parameter
- **THEN** the system SHALL default to subscribing the user to `user:<userId>` and `global` channels

### Requirement: Channel Naming Convention
The system SHALL support a predefined channel naming convention for structured routing.

#### Scenario: User-scoped channel
- **WHEN** a channel name matches the pattern `user:<id>`
- **THEN** the channel SHALL deliver events exclusively to the user whose ID matches `<id>`

#### Scenario: Entity-scoped channel
- **WHEN** a channel name matches the pattern `event:<id>`
- **THEN** the channel SHALL deliver events to any user subscribed to that entity

#### Scenario: Global broadcast channel
- **WHEN** a channel name is `global`
- **THEN** the channel SHALL deliver events to all connected clients

### Requirement: Channel Authorization
The system SHALL enforce authorization rules per channel type.

#### Scenario: Authorize user-scoped channel subscription
- **WHEN** a user attempts to subscribe to `user:<id>`
- **THEN** the system SHALL only allow subscription if the authenticated user's ID matches `<id>`

#### Scenario: Reject unauthorized user-scoped channel
- **WHEN** user A attempts to subscribe to `user:42` where user A's ID is not 42
- **THEN** the system SHALL reject the ENTIRE connection with HTTP 403 Forbidden

#### Scenario: Authorize entity-scoped channel for any user
- **WHEN** any authenticated user attempts to subscribe to `event:<id>`
- **THEN** the system SHALL allow the subscription

#### Scenario: Authorize global channel for any user
- **WHEN** any authenticated user attempts to subscribe to `global`
- **THEN** the system SHALL allow the subscription

### Requirement: Channel Validation
The system SHALL reject unknown or malformed channel names.

#### Scenario: Reject malformed channel name
- **WHEN** a channel name does not match any known pattern (`user:*`, `event:*`, `global`)
- **THEN** the system SHALL reject the ENTIRE connection with HTTP 400 Bad Request and an error describing the invalid channel
