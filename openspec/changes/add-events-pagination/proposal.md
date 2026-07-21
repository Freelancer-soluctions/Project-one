## Why

The Events module's `GET /api/v1/events` endpoint currently returns ALL events without pagination. The DAO uses raw SQL (`prisma.$queryRaw`) with no LIMIT/OFFSET, and the client renders every event in cards grouped by date. As event count grows, this creates a performance bottleneck (large payloads, slow rendering) and an OWASP A03 data exposure risk. Pagination aligns with the pattern already used by 15+ other modules (providers, news, users, etc.), making the API consistent and efficient.

## What Changes

- **Server-side pagination**: Add `page` and `limit` query params to `GET /api/v1/events`
- **DAO migration**: Migrate from raw `prisma.$queryRaw` to Prisma `findMany` + `count` with proper pagination (`take`, `skip`)
- **Joi validation**: Add `page` and `limit` fields to `EventsFilters` schema
- **Service**: Integrate `getSafePagination` utility from shared pagination module
- **Client pagination UI**: Replace `useGetAllEventsQuery` with `useLazyGetAllEventsQuery`, add pagination state management, and render shadcn/ui `Pagination` controls below event cards
- **Response format**: Return `{ data, total, page, pageSize }` following existing pattern

## Capabilities

### New Capabilities
- _None_ — This change adds pagination to the existing events API without introducing new capabilities.

### Modified Capabilities
- `events-api`: The existing `GET /api/v1/events` endpoint gains pagination support. The DAO migrates from raw SQL to Prisma `findMany` + `count`. The client adds pagination controls and lazy query triggers.

## Impact

- **Server**: `apps/server/src/modules/events/` — Joi schema (`events.joi.js`), service (`service.js`), DAO (`dao.js`)
- **Client**: `apps/client/src/` — Events API slice (`eventsAPI.js`), Events page (`Events.jsx`), EventList component (`EventList.jsx`)
- **New component**: Pagination controls using shadcn/ui `Pagination` primitives
- **No route changes**: Controller and routes stay the same — `validateQueryParams(EventsFilters)` already whitelists params
- **No breaking changes**: Backward-compatible — existing calls without `page`/`limit` params will continue working (defaults applied)
