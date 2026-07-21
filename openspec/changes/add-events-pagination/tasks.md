# Tasks: Add Events Pagination

## 1. Server: Joi Schema & OpenAPI

- [x] 1.1 Add `page` and `limit` fields to the `EventsFilters` Joi schema in `apps/server/src/modules/events/events.joi.js`
- [x] 1.2 Configure `page` as a positive integer (default: 1) and `limit` as a positive integer (default: 20)
- [x] 1.3 Update OpenAPI spec in routes.js to document `page` and `limit` query parameters on GET /api/v1/events

## 2. Server: Service

- [x] 2.1 Import `getSafePagination` from the shared pagination utility (`../../utils/pagination/pagination.js`)
- [x] 2.2 Call `getSafePagination(page, limit)` in the service `getAll` method to compute `{ take, skip }`
- [x] 2.3 Pass the pagination parameters to the DAO `findAll` method

## 3. Server: DAO — Migrate to Prisma findMany + count

- [x] 3.1 Replace `prisma.$queryRaw` with `prisma.events.findMany()` using the same `where` filter for search query — must include `title`, `description`, AND `speaker` fields
- [x] 3.2 Add `include: { eventTypes: true, userEventCreated: true }` to `findMany` to preserve JOIN behavior
- [x] 3.3 Add `orderBy: [{ eventDate: 'desc' }, { startTime: 'asc' }]` to `findMany` (chronological ordering aligns pagination boundaries with date-grouped UI)
- [x] 3.4 Add `take` and `skip` from pagination params to `findMany`
- [x] 3.5 Add `prisma.events.count()` with the identical `where` filter for total count
- [x] 3.6 Execute `findMany` and `count` concurrently via `Promise.all`
- [x] 3.7 Remove the old raw SQL block — it's preserved in git history for rollback comparison
- [x] 3.8 Return `{ data, total, page, pageSize }` from the DAO

## 4. Client: Events API

- [x] 4.1 Replace `useGetAllEventsQuery` with `useLazyGetAllEventsQuery` in `apps/client/src/modules/events/api/eventsAPI.js`. Retain `useGetAllEventsQuery` export for cross-module compat (`UpcomingEvents.jsx` consumes it).
- [x] 4.2 Verify the lazy query accepts `{ page, limit, search }` parameters

## 5. Client: Events Page

- [x] 5.1 Replace `useGetAllEventsQuery` with `useLazyGetAllEventsQuery` in the Events page component
- [x] 5.2 Add `pageIndex` and `pageSize` state variables
- [x] 5.3 Add `useEffect` that triggers the lazy query when `pageIndex`, `pageSize`, or `searchQuery` change (note: `pageIndex` is 0-based — convert to 1-based via `page: pageIndex + 1` when sending to API)
- [x] 5.4 Wire search input to reset `pageIndex` to 0 on new search
- [x] 5.5 Pass pagination state and response data (`dataEvents.data.data`, `dataEvents.data.total`, etc.) to `EventList`
- [x] 5.6 Add stale-response guard in `useEffect`: use a cleanup flag (e.g., `let ignore = false`) to discard outdated promise resolutions when dependencies change rapidly

## 6. Client: PaginationControls Component

- [x] 6.1 Create `apps/client/src/components/PaginationControls.jsx`
- [x] 6.2 Import shadcn/ui Pagination components (`Pagination`, `PaginationContent`, `PaginationItem`, `PaginationPrevious`, `PaginationLink`, `PaginationNext`, `PaginationEllipsis`) from `@/components/ui/pagination`
- [x] 6.3 Accept props: `pageIndex`, `pageSize`, `total`, `onPageChange`
- [x] 6.4 Compute total pages as `Math.ceil(total / pageSize)`
- [x] 6.5 Render Previous button (disabled when `pageIndex === 0`)
- [x] 6.6 Render page number links
- [x] 6.7 Render Next button (disabled on last page)
- [x] 6.8 Hide controls when `total <= pageSize` (single page)

## 7. Client: EventList — Integrate PaginationControls

- [x] 7.1 Import `PaginationControls` in `EventList.jsx`
- [x] 7.2 Accept pagination props: `pageIndex`, `pageSize`, `total`, `onPageChange`
- [x] 7.3 Render `PaginationControls` below the event cards list
- [x] 7.4 Pass pagination props through to `PaginationControls`
- [x] 7.5 Remove the `sortedEvents` derived state — server now returns data pre-sorted by `eventDate`/`startTime`
- [x] 7.6 Verify no breaking changes to the EventList rendering for non-paginated usage (backward compatible)

## 8. Review Findings — Fix Items

- [x] 8.1 Update spec scenario 4 (negative/invalid params) to describe Joi `.positive()` rejection → HTTP 400, or relax Joi to let negatives through to `getSafePagination`. See `specs/events-api/spec.md`
- [x] 8.2 Remove redundant default logic in `service.js:100-101`: `Number(page) || 1` and `Number(limit) || 20` — `getSafePagination` already normalizes, Joi already applies defaults
- [x] 8.3 Extract `pageSize = 20` in `Events.jsx:23` to a shared `DEFAULT_PAGE_SIZE` constant to prevent silent drift if server default changes
