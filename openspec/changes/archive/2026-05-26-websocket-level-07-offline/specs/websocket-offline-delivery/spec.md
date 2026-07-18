## ADDED Requirements

### Requirement: Offline mention delivery on reconnect
The system SHALL deliver missed mention events to users upon reconnection after disconnection, using Socket.IO connectionStateRecovery for brief outages and database fallback for longer absences.

#### Scenario: Connection recovery within 2-minute window
- **WHEN** user reconnects within 2 minutes AND server has in-memory state
- **THEN** socket.recovered SHALL be true AND missed events SHALL be replayed automatically by Socket.IO

#### Scenario: Database backlog after long disconnect or server restart
- **WHEN** user reconnects after 2+ minutes OR server has restarted (socket.recovered = false)
- **THEN** server SHALL query unread mentions from the database AND emit 'mention:backlog' event with the data

### Requirement: Backlog pagination
The system SHALL limit the backlog query to the 50 most recent unread mentions to ensure fast response times.

#### Scenario: Large unread mention count
- **WHEN** user has 100+ unread mentions AND backlog query runs
- **THEN** only the 50 most recent unread mentions SHALL be returned in the backlog

### Requirement: Empty backlog response
The system SHALL handle the case where a user has no unread mentions without error.

#### Scenario: Zero unread mentions
- **WHEN** user has zero unread mentions AND connection handler runs
- **THEN** server SHALL emit 'mention:backlog' with an empty array []

### Requirement: Cross-tab mention read synchronization
When a user marks a mention as read on one client, all other connected clients SHALL be notified in real-time.

#### Scenario: Mention read on one tab reflects on other tabs
- **WHEN** user marks a mention as read via API (sets is_read = true)
- **THEN** server SHALL broadcast 'mention:read' event with mention ID to all other connected tabs in the user's room
