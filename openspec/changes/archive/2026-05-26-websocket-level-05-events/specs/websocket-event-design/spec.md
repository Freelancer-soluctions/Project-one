## ADDED Requirements

### Requirement: Valid messages are delivered to recipients
The system SHALL validate incoming WebSocket messages against the thin envelope schema and deliver them to the intended recipient.

#### Scenario: Valid payload delivers notification
- **WHEN** a client sends a valid envelope payload with all required fields (id, type, version, createdAt, actor, target, resource, summary)
- **THEN** the server SHALL deliver the notification to the recipient specified in `target.id`
- **AND** the payload SHALL NOT exceed 1KB in size

### Requirement: Malformed messages return error events
The system SHALL validate all incoming messages using Joi schemas and reject messages that fail validation.

#### Scenario: Missing required fields returns error
- **WHEN** a client sends a payload missing required fields (e.g., no `type` or no `actor`)
- **THEN** the server SHALL return an error event with `type: "error:validation"`
- **AND** the error event SHALL include a `details` array describing each missing field

### Requirement: Batch payloads respect size limits
The system SHALL enforce a 50KB maximum on batch message payloads.

#### Scenario: Batch exceeds 50KB is paginated
- **WHEN** a client sends a batch payload whose serialized size exceeds 50KB
- **THEN** the server SHALL split the batch into chunks of 50KB or less
- **AND** each chunk SHALL be sent as a separate message with a `batchIndex` field

### Requirement: Unknown event types are handled gracefully
The system SHALL handle unknown or unrecognized event types without crashing.

#### Scenario: Unknown event type logs warning
- **WHEN** the server receives a message with an event type not in the registered handler list
- **THEN** the server SHALL log a warning with the unknown event type
- **AND** the server SHALL NOT crash or disconnect the client
- **AND** the server MAY ignore the message

### Requirement: Prohibited content is rejected
The system SHALL reject payloads containing raw HTML or binary data.

#### Scenario: Raw HTML in payload is rejected
- **WHEN** a client sends a payload containing raw HTML tags or binary content
- **THEN** the server SHALL reject the message with an error event of type `error:validation`
- **AND** the server SHALL log a security warning
