## ADDED Requirements

### Requirement: useNotificationStream React Hook
The system SHALL provide a React hook `useNotificationStream` that uses the native `EventSource` API to connect to the SSE endpoint.

#### Scenario: Establish SSE connection
- **WHEN** `useNotificationStream` is called with a list of channels
- **THEN** it SHALL create an `EventSource` connection to `/api/v1/sse/subscribe?channels=<list>` with `{ withCredentials: true }`

#### Scenario: Handle incoming notification events
- **WHEN** the `EventSource` receives an `event: notification` message
- **THEN** the hook SHALL parse the JSON data and pass it to the registered callback

#### Scenario: Handle typed event listeners
- **WHEN** a client registers a listener for a specific event type
- **THEN** `useNotificationStream` SHALL use `eventSource.addEventListener(eventType, handler)` for type-specific routing

#### Scenario: Connection lifecycle on mount/unmount
- **WHEN** the component mounts
- **THEN** the hook SHALL create the EventSource connection
- **WHEN** the component unmounts
- **THEN** the hook SHALL call `eventSource.close()` to cleanly terminate the connection

### Requirement: Auto-Reconnection Support
The hook SHALL rely on the native `EventSource` auto-reconnection behavior and send `Last-Event-ID` on reconnect for backlog delivery.

#### Scenario: Browser auto-reconnects on connection drop
- **WHEN** the SSE connection drops
- **THEN** the browser's native `EventSource` SHALL automatically attempt to reconnect with the `Last-Event-ID` header

#### Scenario: Handle reconnection errors
- **WHEN** the `EventSource` emits an `error` event after repeated reconnection failures
- **THEN** the hook SHALL surface the error state to the consuming component

#### Scenario: Stop reconnection after 3 consecutive errors
- **WHEN** 3 or more consecutive `EventSource` error events occur
- **THEN** the hook SHALL assume a permanent failure (auth or unrecoverable), stop reconnecting, and surface `{ status: 'error', permanent: true }` to the consuming component

#### Scenario: Never reconnect on 401
- **WHEN** the server responds with HTTP 401
- **THEN** the hook SHALL never attempt to reconnect and surface `{ status: 'error', permanent: true }`

### Requirement: Event Buffer for Reconnection
The hook SHALL buffer the last 50 received events per connection for replay via `Last-Event-ID`.

#### Scenario: Buffer received events
- **WHEN** a notification event is received
- **THEN** the hook SHALL append it to an in-memory buffer of up to 50 events

#### Scenario: Evict oldest events
- **WHEN** the buffer exceeds 50 events
- **THEN** the oldest events SHALL be evicted to maintain capacity

### Requirement: Event Callback Registration
The hook SHALL accept a callback for incoming events and return connection status.

#### Scenario: Callback receives parsed events
- **WHEN** a notification event is received
- **THEN** the hook SHALL invoke the registered callback with the parsed event object `{ type, data, id }`

#### Scenario: Return connection status
- **WHEN** the hook is active
- **THEN** it SHALL return the current connection status: `connecting`, `open`, `closed`, or `error`
