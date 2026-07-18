## ADDED Requirements

### Requirement: notificationBus Event Subscription
The `busBridge.js` module SHALL subscribe to `notificationBus` events and forward them to `SseManager` for SSE delivery.

#### Scenario: Forward bus event to user channel
- **WHEN** `notificationBus` emits an event with a target userId
- **THEN** `busBridge` SHALL call `SseManager.deliverToUser(userId, eventName, payload)` with the appropriate event name and payload

#### Scenario: Forward bus event to channel
- **WHEN** `notificationBus` emits an event with a target channel
- **THEN** `busBridge` SHALL call `SseManager.deliverToChannel(channel, eventName, payload)` with the appropriate channel name, event name, and payload

#### Scenario: Map bus event names to SSE event types
- **WHEN** `busBridge` receives a bus event
- **THEN** it SHALL map the bus event name to an SSE event type string for the `event:` field in the SSE wire format

#### Scenario: Ignore Redis-originated events
- **WHEN** an event from `notificationBus` has an `_origin: 'redis'` flag
- **THEN** `busBridge` SHALL ignore the event and NOT forward it to `SseManager`

#### Scenario: Prevent emit back to notificationBus
- **WHEN** `busBridge` forwards an event to `SseManager`
- **THEN** `busBridge` MUST NOT emit the event back to `notificationBus`

### Requirement: BUS_EVENTS Constants
The `notificationBus.js` file SHALL expose `BUS_EVENTS` constants for event names used by the SSE bridge.

#### Scenario: BUS_EVENTS constant defined for each event
- **WHEN** `notificationBus.js` is loaded
- **THEN** it SHALL export a `BUS_EVENTS` object with string constants for each event type that SSE delivers

#### Scenario: Existing notificationBus structure unchanged
- **WHEN** `BUS_EVENTS` constants are added
- **THEN** no other structural changes SHALL be made to `notificationBus.js`

### Requirement: Error Handling and Logging
The `busBridge` SHALL handle errors gracefully and log failures without crashing the event loop.

#### Scenario: Log delivery failure
- **WHEN** `SseManager.deliverToUser` or `SseManager.deliverToChannel` throws an error
- **THEN** `busBridge` SHALL log the error and continue processing subsequent events
