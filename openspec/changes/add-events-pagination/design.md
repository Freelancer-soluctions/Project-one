## Context

The `GET /api/v1/events` endpoint in the Events module currently returns all events unfiltered and unpaginated. The DAO uses raw SQL via `prisma.$queryRaw` with no LIMIT/OFFSET clause. The client page fetches all events on mount via `useGetAllEventsQuery` and renders them in cards grouped by date.

As the event count grows, this creates:
- **Performance bottleneck**: Large payloads increase network transfer and rendering time
- **Data exposure risk**: All event data returned in a single response (OWASP A03)
- **Inconsistent pattern**: 15+ other modules (providers, news, users) already use pagination

This design covers both server-side changes (migrating the DAO to Prisma `findMany` + `count` with pagination) and client-side changes (lazy query + pagination controls using shadcn/ui).

## Goals / Non-Goals

**Goals:**
- Add `page` and `limit` query parameters to `GET /api/v1/events`
- Migrate Events DAO from raw SQL to Prisma `findMany` + `count` with `take`/`skip`
- Integrate the existing `getSafePagination` utility from the shared pagination module
- Add `page` and `limit` fields to the EventsFilters Joi schema for validation
- Add pagination controls to the client Events page using shadcn/ui Pagination components
- Return paginated response in `{ data, total, page, pageSize }` format

**Non-Goals:**
- No changes to the controller or route definitions — the existing `validateQueryParams(EventsFilters)` middleware already whitelists query params
- No new API routes — the existing `GET /api/v1/events` route is reused
- No changes to event creation, update, or deletion endpoints
- No filtering enhancements beyond the existing `searchQuery` param
- No breaking changes — existing calls without `page`/`limit` params remain backward-compatible

## Decisions

### 1. DAO Migration: Raw SQL → Prisma `findMany` + `count`

**Decision**: Migrate from `prisma.$queryRaw` with raw SQL to `prisma.events.findMany()` with `prisma.events.count()`.

**Rationale**:
- Prisma's ORM methods are type-safe and composable — adding `where`, `include`, `orderBy`, `take`, and `skip` is declarative and less error-prone than raw SQL string concatenation
- `findMany` with `include` handles JOINs for `eventTypes` and `userEventCreated` automatically, eliminating the manual result mapping currently needed after raw SQL
- `count` with the same `where` filter gives the total for pagination metadata
- Using `Promise.all` for concurrent `findMany` + `count` avoids sequential await overhead

**Alternatives considered**:
- Keep raw SQL with `LIMIT`/`OFFSET` appended — rejected because the raw SQL already uses string interpolation for filters and would become harder to maintain with dynamic pagination
- Use `prisma.$transaction` with raw queries — unnecessary complexity; `Promise.all` with `findMany` and `count` is the idiomatic Prisma pattern

### 2. Pagination Utility: `getSafePagination`

**Decision**: Use the existing `getSafePagination` utility from `../../utils/pagination/pagination.js`.

**Rationale**:
- Already used by 15+ other modules — consistent behavior for clamping `page`/`limit` to safe ranges
- Returns `{ take, skip }` that maps directly to Prisma's `findMany` parameters
- Avoids reinventing pagination logic with edge cases (negative values, overflow, etc.)

### 3. Client Data Fetching: Lazy Query + useEffect

**Decision**: Replace `useGetAllEventsQuery` (auto-fetch on mount) with `useLazyGetAllEventsQuery` and trigger via `useEffect` when `pageIndex`, `pageSize`, or `searchQuery` change.

**Rationale**:
- Lazy query gives explicit control over when to fetch — necessary for pagination where the page/limit params change
- `useEffect` with dependency array ensures refetch only when relevant state changes
- Matches the existing pattern used by the providers/news modules

### 4. Pagination Component: shadcn/ui Pagination

**Decision**: Create a standalone `PaginationControls` component using shadcn/ui `Pagination` primitives from `@/components/ui/pagination`.

**Rationale**:
- shadcn/ui Pagination is already available in the project — no new dependency
- Consistent visual language with the rest of the app
- Renders below the EventList for intuitive navigation

### 5. Response Format

**Decision**: Return `globalResponse(res, 200, { data, total, page, pageSize })`.

**Rationale**:
- Matches the existing API response format used across all paginated endpoints
- Client can read `dataEvents.data.data` (array), `dataEvents.data.total` (count), `dataEvents.data.page`, and `dataEvents.data.pageSize`

### 6. Ordering Strategy: eventDate + startTime

**Decision**: Sort results by `eventDate: 'desc'` then `startTime: 'asc'`.

**Rationale**:
- The client EventList groups events by date — server-side ordering by eventDate ensures pagination boundaries align with date groups
- Within the same date, events sort by startTime (earliest first) for a natural reading order
- Client no longer needs a `sortedEvents` derived state — the server returns data already sorted for the UI

**Alternatives considered**:
- `createdOn` ordering — rejected because it doesn't align with date-grouped UI rendering; pagination boundaries could split date groups
- Client-side sorting only — rejected because it could produce incomplete date groups on paginated pages (a page may have events from multiple dates)

## Risks / Trade-offs

- **[Risk] Backward compatibility**: Existing API consumers not sending `page`/`limit` params must still get all results.
  → **Mitigation**: `getSafePagination` with undefined `page`/`limit` defaults to sensible values; the service throws only if `take` is invalid, not if omitted.

- **[Risk] Performance regression**: Adding `count` query doubles DB round-trips on every paginated request.
  → **Mitigation**: `Promise.all` runs both queries concurrently; `count` on indexed columns is fast; the `where` clause is identical for both queries so the DB can cache the plan.

- **[Risk] Client state complexity**: `pageIndex`, `pageSize`, `searchQuery`, and the lazy query create multiple state variables that must stay in sync.
  → **Mitigation**: Single `useEffect` dependency array handles all triggers; `pageIndex` is reset to 0 when `searchQuery` changes.

- **[Risk] Old raw SQL removal**: Removing raw SQL could cause issues if the new Prisma query doesn't return identical results.
  → **Mitigation**: The old raw SQL is preserved in git history — use `git diff` to compare results during testing if the new query behaves differently.
