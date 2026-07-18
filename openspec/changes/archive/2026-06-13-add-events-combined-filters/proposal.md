## Why

The `GET /events` endpoint currently supports only `searchQuery` (text search) and pagination (`page`/`limit`). Users cannot filter events by type, date range, speaker, or status (upcoming/past). This forces the frontend to fetch all events and filter client-side — wasteful as the event count grows.

The controller's JSDoc already documents `type`, `startDate`, `endDate` as planned query params, but they were never implemented. The Joi schema `EventsFilters` rejects any param outside `searchQuery`, `page`, `limit` with a 400.

Five new filter params extend the existing endpoint without breaking changes, using the same composable AND pattern.

## What Changes

- **Joi/Zod schemas**: Add `type` (Int), `dateFrom` (ISO date), `dateTo` (ISO date), `speaker` (string), `status` (enum: upcoming/past/all) to `EventsFilters`/`EventsFiltersSchema`
- **DAO `where` builder**: Refactored to composable `conditions[]` array → `{ AND: [search, type, dateRange, speaker, status, deletedAt: null] }`
- **Service**: Propagate new params from controller → DAO
- **Controller**: Read `req.safeQuery` (already validated by middleware) — minimal change
- **No new routes** — all existing middleware (auth, permissions) applies unchanged

## Capabilities

### New Capabilities
- `events-filter-type` — Filter events by event type ID
- `events-filter-date-range` — Filter events by date range (dateFrom/dateTo)
- `events-filter-speaker` — Filter events by speaker name (partial match)
- `events-filter-status` — Filter events by upcoming/past/all (derived from eventDate + endTime vs server UTC now)

### Modified Capabilities
- `events-api` — `GET /events` now accepts 5 additional query params. Backward compatible — existing params unchanged.
- `EventsFilters` schema — Extended with 5 optional fields.

## Impact

- **Server** (`apps/server/src/modules/events/`):
  - `schemas/events.joi.js` — `EventsFilters` gains 5 new fields
  - `schemas/events.zod.js` — `EventsFiltersSchema` gains 5 new fields  
  - `dao.js` — `getAllEvents` `where` builder refactored to composable array
  - `service.js` — pass new params to DAO
  - `controller.js` — reads `req.safeQuery` (no signature change)
  - No route changes — existing middleware chain applies
- **Dependency**: Assumes `add-soft-delete-events` is implemented first (provides `deletedAt`/`deletedBy` fields and `showDeleted` filter). The `deletedAt: null` condition integrates naturally into the composable `where` builder.
