## Context

The service layer (`notes/service.js`) currently has no way to notify the socket layer when mentions are created. The naive approach — importing `io` directly into the service — creates a circular dependency (service → socket → service), couples business logic to transport, and makes testing harder (you must mock Socket.IO rather than a lightweight event bus).

This design introduces a decoupled notification bus using Node.js's built-in `EventEmitter`, allowing the service layer to emit named events without knowing anything about Socket.IO or the transport layer.

## Goals / Non-Goals

**Goals:**
- Decouple service layer from socket layer — no direct imports between them
- Enable services to emit events (e.g., `mention:created`) via a shared bus
- Allow socket handlers to subscribe to bus events and forward them via Socket.IO
- Keep EventEmitter as the only shared dependency between layers
- Provide error isolation — bus listener failures must not affect service execution

**Non-Goals:**
- Replace existing Socket.IO setup in level-06
- Modify existing `notes/service.js` (that's the next level)
- Add persistence, queues, or message brokers (EventEmitter is intentionally fire-and-forget)
- Guarantee delivery (intentionally at-most-once semantics)

## Decisions

### Decision 1: Node.js EventEmitter over a custom pub/sub library

| Alternative | Verdict |
|---|---|
| **EventEmitter** (chosen) | Built-in, zero dependencies, well-understood pattern |
| `eventemitter3` | Faster but adds dependency; perf not needed here |
| Redis pub/sub | Overkill for single-process scenario |
| Custom Observer pattern | Re-inventing the wheel |

### Decision 2: Singleton module pattern

Export a single `EventEmitter` instance from `notificationBus.js`. Both service and socket handler import the same instance — no dependency injection container needed.

### Decision 3: Event name constants

Export event names as named constants (`MENTION_CREATED`, `MENTION_READ`) from the bus module. This prevents typos and enables IDE autocompletion.

### Decision 4: Error isolation

Wrap `bus.emit()` in `try/catch` inside socket handlers. A listener throwing must not propagate to the service. `EventEmitter.setMaxListeners(50)` prevents warnings for multiple handlers.

### Decision 5: Capability boundary

The new capability is `websocket-service-integration` — it covers only the bus bridge between layers. The socket transport itself and the service logic remain separate capabilities.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Unhandled listener exception propagates to service | Wrap all bus.emit() calls in try/catch in socket handlers |
| EventEmitter memory leak if listeners accumulate | Call `setMaxListeners(50)`; document cleanup in tasks |
| No delivery guarantee (fire-and-forget) | Acceptable for real-time notifications; persistent state lives in DB |
| Tests could still couple to EventEmitter internals | Test at the integration boundary — verify event payload shape, not emitter internals |
