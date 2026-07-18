## Context

The `GET /events` endpoint currently only supports `searchQuery` (text search) and pagination (`page`/`limit`). The controller JSDoc already documents `type`, `startDate`, `endDate` as planned params, but they were never wired up. The `EventsFilters` Joi schema rejects any unknown param with a 400 error.

The `GET /events` route serves the event list view in the frontend. As the event count grows, client-side filtering becomes wasteful. Adding server-side filtering reduces payload size, improves UX, and minimizes unnecessary database reads.

**Current architecture:**
- **Controller** (`controller.js`): Delegates `req.safeQuery` directly to service (after validation middleware strips unknown fields)
- **Service** (`service.js`): Extracts `searchQuery`, `page`, `limit` and calls DAO with pagination params
- **DAO** (`dao.js`): Builds a simple `where` object (just `searchQuery` OR block), calls `prisma.events.findMany` + `prisma.events.count`
- **Schemas** (`events.joi.js`, `events.zod.js`): Both define `EventsFilters`/`EventsFiltersSchema` with only `searchQuery`, `page`, `limit`

**Dependency**: Assumes `add-soft-delete-events` is implemented first — the `deletedAt`/`deletedBy` fields and `showDeleted` filter already exist in the DAO.

## Goals / Non-Goals

**Goals:**
- Add 5 new optional query params to `GET /events`: `type` (Int), `dateFrom` (ISO date), `dateTo` (ISO date), `speaker` (string), `status` (upcoming/past/all)
- All filters combine with AND logic via a composable `conditions[]` array in the DAO
- Backward compatible — existing `searchQuery`, `page`, `limit` params continue working unchanged
- Server-side only change (client ships these params, no frontend work in this change)

**Non-Goals:**
- No new API routes or middleware changes — existing auth, permissions, and validation chain unchanged
- No database schema changes — all filters operate on existing columns
- No sorting changes — existing `orderBy` (`eventDate DESC, startTime ASC`) unchanged
- No frontend UI work — this change is purely the API extension

## Decisions

### D1 — Composable `conditions[]` array pattern

**Decision**: Refactor the DAO's `where` builder from a flat spread to a `conditions[]` array pushed conditionally, then wrapped in `{ AND: conditions }`.

**Rationale**: Each filter is independent (search, type, date range, speaker, status, soft-delete). Using an array avoids nested ternaries, keeps each condition isolated, and makes adding/removing filters trivial. If no conditions exist, `where` is `{}` (no filtering).

```js
const conditions = []
if (searchQuery)  conditions.push({ OR: [...] })
if (type)         conditions.push({ eventTypeId: type })
if (dateFrom/To)  conditions.push({ eventDate: { gte: dateFrom, lte: dateToEndOfDay } }) // dateTo normalized to 23:59:59.999Z
if (speaker)      conditions.push({ speaker: { contains, mode: 'insensitive' } })
if (status)       conditions.push({ OR: [...] }) // upcoming/past derived
// deletedAt: null comes from soft-delete change
const where = conditions.length > 0 ? { AND: conditions } : {}
```

**Alternatives considered:**
- *Flat spread* (`...search, ...type, ...dateRange`): Works but becomes unwieldy as filter count grows; spread order matters and can produce invalid Prisma if overlapping keys exist.
- *Prisma `AND` as static object*: Fragile — adding a new filter requires remembering to update the static structure.

### D2 — `type` as exact match on `eventTypeId`

**Decision**: `type` is an integer mapped to `eventTypeId` (the column name in Prisma), not a string slug.

**Rationale**: The existing `eventTypes` table uses integer IDs. The JSDoc already references `type` as a numeric filter. Exact match is the expected UX — users pick from a dropdown of event types, not free-text.

### D3 — `dateFrom`/`dateTo` as inclusive ISO date strings

**Decision**: Both params are ISO date strings (`YYYY-MM-DD`), validated by Joi/Zod. The Prisma query uses `gte` (>=) for `dateFrom` and `lte` (<=) for `dateTo`. Both default to undefined (no filter). If only one is provided, only that bound applies.

**Rationale**: Inclusive date range is the most intuitive UX. ISO format is standard for API communication. The Prisma `DateTime` field stores full timestamps, but we compare against the date portion (midnight UTC).

### D4 — `speaker` as partial case-insensitive match

**Decision**: `speaker` is a string using Prisma `contains` + `mode: 'insensitive'` on the `speaker` column.

**Rationale**: Users may know part of a speaker's name. Case-insensitive matches real-world search expectations. The existing `searchQuery` already uses this pattern on speaker, title, and description — we reuse the same approach for the dedicated speaker filter.

### D5 — `status` derived from server UTC time

**Decision**: `status` accepts `upcoming`, `past`, or `all` (default: `all` = no filter). Upcoming means `eventDate > today OR (eventDate == today AND endTime > now)` in server UTC. Past means `eventDate < today OR (eventDate == today AND endTime <= now)`.

**Exact Prisma query** (for `upcoming`):
```js
const now = new Date()
const endOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
const currentTimeOnEpoch = new Date(Date.UTC(1970, 0, 1, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()))

{ OR: [
    { eventDate: { gt: endOfTodayUTC } },
    { AND: [
        { eventDate: { gte: startOfTodayUTC, lte: endOfTodayUTC } },
        { endTime: { gt: currentTimeOnEpoch } }
    ] }
] }
```

For `past`, reverse the comparisons (`lt` instead of `gt`, `lte` instead of `gt` for endTime).

**Rationale**: Timezone consistency — server UTC avoids client timezone ambiguity. The derived logic uses existing columns (`eventDate`, `endTime`). Both `upcoming` and `past` are mutually exclusive conditions pushed as `OR` groups when active.

### D6 — `searchQuery` and `speaker` are independent (AND)

**Decision**: Both filters coexist in the `conditions[]` array. If both are provided, they combine with AND — results must match the search term AND the speaker name.

**Rationale**: These serve different use cases. `searchQuery` is a broad text search (title, description, speaker), while `speaker` is a narrow filter on the speaker column alone. Combining them with AND allows a user to search for "workshop" by a specific speaker. The overlap in the speaker column is harmless — the result set is correctly restricted.

## Risks / Trade-offs

- **[Combined optional params]** 5 optional params × their combinations mean many test scenarios. Rely on the composable array structure to keep logic linear — each condition is independently testable.
- **[dateFrom/dateTo inclusive range]** If the `eventDate` column stores timestamps with time components, a `dateTo` of `2026-06-09` may exclude events at `2026-06-09T10:00:00Z` if the comparison is strict. → Mitigation: Ensure `dateTo` is normalized to end-of-day (`2026-06-09T23:59:59.999Z`) or use `<` next-day comparison.
- **[status filter performance]** The `status` filter uses `OR` with computed conditions (comparing dates/times). Prisma translates this to SQL effectively, but on very large datasets, adding function-based comparisons to the WHERE clause may impact index usage. → Mitigation: Ensure `eventDate` is indexed. Monitor query performance.
- **[Dependency on add-soft-delete-events]** The soft-delete change is a prerequisite. If not yet implemented, the `deletedAt: null` condition will be missing from the DAO, and soft-deleted events will appear in results. → Mitigation: This change order is explicit — implement `add-soft-delete-events` first.
