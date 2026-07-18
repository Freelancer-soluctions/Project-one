## Why

Service layer (`notes/service.js`) should NOT import `io` directly — this creates a circular dependency, breaks tests, and couples business logic to transport. An EventEmitter bus pattern decouples them, allowing the service layer to emit events without knowing about Socket.IO.

## What Changes

- **New**: `apps/server/src/socket/notificationBus.js` — shared EventEmitter singleton with exported event name constants
- **New**: `apps/server/src/socket/levels/level-07-integration.js` — educational demo simulating the full mention flow via the bus
- **Capability introduced**: `websocket-service-integration` — decoupled event-driven communication between service and socket layers
- No changes to existing `service.js` yet (that's the next level)

## Capabilities

### New Capabilities
- `websocket-service-integration`: Decoupled event-driven bridge between Prisma-based service layer and Socket.IO transport layer via an EventEmitter notification bus

### Modified Capabilities
- *(None — no existing spec requirements are changing)*

## Impact

- **New module**: `notificationBus.js` — zero-dependency EventEmitter singleton
- **New demo**: `level-07-integration.js` — standalone educational server on port 3005
- **No breaking changes**: existing service and socket code untouched
- **Testing impact**: services can now be tested by mocking the bus instead of mocking Socket.IO entirely
