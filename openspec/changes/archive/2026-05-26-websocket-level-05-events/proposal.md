## Why

Without standardized event naming and payload structure, the WebSocket notification system becomes unmaintainable as new event types are added. Levels 1-4 established server→client communication, auth, and rooms. Level 5 defines the conventions and validation schemas that ensure all future events follow a consistent pattern.

Industry standard: `namespace:action` event naming with thin envelope payloads (~500 bytes) and lazy-loaded full content via REST.

## What Changes

- Define event naming convention (`namespace:action` pattern) for all WebSocket events
- Create thin envelope payload schema with standardized fields (id, type, version, createdAt, actor, target, resource, summary, metadata)
- Implement Joi validation schemas for incoming events (client → server)
- Create event handler definitions for mention and notification events
- Build educational standalone demo server showing the complete event flow
- Enforce payload size budgets (1KB per notification, 50KB batch max)
- Add event catalog documentation to README

## Capabilities

### New Capabilities
- `websocket-event-design`: Event naming conventions, thin envelope payload patterns, payload schema definition, and incoming event validation for the WebSocket layer

### Modified Capabilities
- *(No existing spec requirements are changing – this adds new capability)*

## Impact

- **New files**: `apps/server/src/socket/events/schemas.js`, `apps/server/src/socket/events/mentionEvents.js`, `apps/server/src/socket/levels/level-06-events.js`
- **Modified files**: `README.md` (event catalog table)
- **Dependencies**: Joi validation library (already in project)
- **No existing code changes**: All level-05 additions are additive, no refactoring of existing socket code
