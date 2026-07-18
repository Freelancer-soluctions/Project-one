## Context

The WebSocket notification system has been built across Levels 1–4, establishing bidirectional communication, authentication, and room-based subscriptions. However, no standardized event naming convention or payload schema exists yet. As more event types are added (mentions, notifications, system alerts), the system risks becoming inconsistent and unmaintainable.

Level 5 (this change) defines the architectural conventions and validation that all future WebSocket events will follow, drawing from industry standards like Slack's event API and Pusher's event format.

## Goals / Non-Goals

**Goals:**
- Define a `namespace:action` event naming convention for all WebSocket events
- Create a thin envelope payload schema (~500 bytes per notification) with standardized fields
- Implement Joi-based validation for incoming events (client → server)
- Enforce payload size budgets: 1KB per message, 50KB per batch
- Build a standalone demo server (level-06-events) showing the complete event flow
- Document the event catalog in README

**Non-Goals:**
- Persisting events to a database (future level)
- Implementing event fan-out or delivery guarantees (future level)
- Retrofitting existing levels 1–4 to use the new schema (additive only)
- Full user objects or binary data transmission
- Event replay or history

## Decisions

### 1. Event naming: `namespace:action` pattern
- **Chosen**: `mention:new`, `mention:read`, `notification:badge`
- **Rationale**: Matches industry convention (Slack, Pusher). Namespace groups related events, action describes the operation. Easy to extend with new namespaces (e.g., `room:join`, `file:upload`).
- **Alternatives considered**: `event.mention.new` (dotted) — more verbose; `MENTION_NEW` (screaming snake) — less readable in JS; `EventType.MentionNew` (enum) — requires imports everywhere

### 2. Thin envelope pattern with lazy REST loading
- **Chosen**: Envelope carries only metadata (~500 bytes). Full content (e.g., note body) fetched via REST GET endpoint when needed.
- **Rationale**: WebSocket frames stay small and fast. Clients don't download content they never read. Fits the existing REST architecture.
- **Alternatives considered**: Full payload in event — bloats every notification; Two-channel pattern (metadata via WS, content via separate WS stream) — over-engineered for current needs

### 3. Payload schema: standardized envelope
- **Chosen**: `{ id, type, version, createdAt, actor, target, resource, summary, metadata }`
- **Rationale**: Provides enough context for the recipient to decide "do I need to fetch the full resource?" without over-engineering. `metadata` is extensible per event type.
- **Alternatives considered**: Minimal `{ type, data }` — too vague, forces every consumer to know the shape; Full GraphQL fragment — overkill for notifications

### 4. Joi validation for incoming events
- **Chosen**: Joi schemas in `schemas.js`, validation middleware applied to client → server messages
- **Rationale**: Joi is already in the project. Declarative schemas are testable and composable. Validation runs at the edge before any handler logic.
- **Alternatives considered**: JSON Schema — heavier, no native JS integration; TypeScript type guards — runtime-only, no schema enforcement; Manual validation — error-prone

### 5. Size limits: 1KB per message, 50KB per batch
- **Chosen**: Soft limits with server-side enforcement (reject/truncate)
- **Rationale**: Prevents abuse and keeps WebSocket frames performant. 1KB covers typical notification metadata. 50KB allows batch delivery of ~50 notifications.
- **Alternatives considered**: No limits — risk of DDoS via bloated messages; 512B per message — too restrictive for notifications with excerpts

## Risks / Trade-offs

- **[Thin envelope adoption]** Clients must implement lazy loading via REST if they need full content → Mitigation: Document pattern clearly, provide example fetch code
- **[Namespace proliferation]** Without governance, new teams might create overlapping namespaces → Mitigation: Event catalog in README, code review requirement for new namespaces
- **[Batch size edge case]** If a user has 60 notifications, the 50KB batch limit could split mid-batch → Mitigation: Server paginates into chunks; client reassembles by `id`
- **[Validation overhead]** Joi validation on every incoming event adds ~0.1ms latency → Acceptable: far below the 1ms network jitter threshold
- **[Unknown event types]** Forward compatibility: older clients receive events they don't understand → Mitigation: Server ignores unknown types with a warning log; clients SHOULD ignore unknown event types gracefully
