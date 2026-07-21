## ADDED Requirements

### Requirement: Server-side pagination parameters
The system SHALL accept `page` and `limit` query parameters on `GET /api/v1/events` to enable paginated responses. The SHALL use `getSafePagination` from the shared pagination utility to enforce safe bounds (maximum `take` limit of 100), preventing OWASP A03 mass data exposure.

#### Scenario: Valid pagination request returns paginated results
- **WHEN** client sends `GET /api/v1/events?page=2&limit=20`
- **THEN** the system SHALL return only 20 events from page 2 (offset 20-39)
- **AND** the system SHALL use `prisma.events.findMany({ take: 20, skip: 20 })` with the same `where` and `include` clauses
- **AND** the system SHALL concurrently execute `prisma.events.count()` with the same `where` filter

#### Scenario: Missing pagination params applies defaults
- **WHEN** client sends `GET /api/v1/events` without `page` or `limit` params
- **THEN** the system SHALL apply `getSafePagination` defaults (page=1, limit=20)
- **AND** the response SHALL contain the first 20 events

#### Scenario: Limit exceeds maximum safe threshold
- **WHEN** client sends `GET /api/v1/events?limit=1000`
- **THEN** `getSafePagination` SHALL clamp `take` to the configured maximum (100)
- **AND** the system SHALL return a maximum of 100 events per page

#### Scenario: Negative or invalid pagination params (fail-fast validation)
- **WHEN** client sends `GET /api/v1/events?page=0&limit=-5`
- **THEN** the Joi `EventsFilters` schema SHALL reject `page=0` and `limit=-5` with `.positive()` validation
- **AND** the system SHALL return HTTP 400 with a validation error message
- **NOTE**: This is intentional fail-fast behavior — invalid input (zero, negative, non-integer) is rejected at the validation layer with HTTP 400 rather than being silently normalized. The `getSafePagination` utility handles normalization only for valid positive integers that exceed safe bounds (e.g., `limit=1000` clamped to 100).

### Requirement: Paginated response format
The system SHALL return paginated responses in the `{ data, total, page, pageSize }` format, consistent with the existing pagination pattern used across all other paginated modules.

#### Scenario: Response contains pagination metadata
- **WHEN** client sends `GET /api/v1/events?page=3&limit=10`
- **THEN** the response body SHALL contain:
  - `data`: array of event objects
  - `total`: total number of matching events (number)
  - `page`: current page number (3)
  - `pageSize`: number of items per page (10)

#### Scenario: Empty result set returns empty data array
- **WHEN** client sends `GET /api/v1/events?page=999&limit=10`
- **AND** no events exist on that page
- **THEN** the system SHALL return `{ data: [], total: 0, page: 999, pageSize: 10 }`
- **AND** the response status SHALL be 200

### Requirement: Search and pagination interaction
When the `searchQuery` filter is combined with pagination, the system SHALL reset the page to 1 whenever the search query changes. This prevents the user from seeing an empty page when their search matches fewer results than the current page.

#### Scenario: Search while on a later page resets to page 1
- **WHEN** client is on page 5 of the full event list
- **AND** client enters a new search term
- **THEN** the system SHALL reset `pageIndex` to 0 (page 1)
- **AND** fetch results with the new search query starting from page 1

#### Scenario: Pagination preserved within the same search
- **WHEN** client searches for "conference" (page 1)
- **AND** client navigates to page 2
- **THEN** the system SHALL return page 2 of results matching "conference"
- **AND** the search query SHALL remain unchanged

### Requirement: Client lazy query with useEffect trigger
The client SHALL replace the auto-fetching `useGetAllEventsQuery` with `useLazyGetAllEventsQuery` and trigger data fetching via a `useEffect` hook that depends on `pageIndex`, `pageSize`, and `searchQuery` state variables.

#### Scenario: Component mount triggers initial fetch
- **WHEN** the Events page component mounts
- **THEN** `useEffect` SHALL call the lazy query trigger function
- **AND** SHALL pass `{ page: pageIndex + 1, limit: pageSize, search: searchQuery }`

#### Scenario: Page change triggers refetch
- **WHEN** user clicks "Next Page" in pagination controls
- **AND** `pageIndex` state increments by 1
- **THEN** `useEffect` SHALL fire again due to dependency change
- **AND** SHALL fetch the next page with the same `pageSize` and `searchQuery`

#### Scenario: Data fetching guard against stale responses
- **WHEN** multiple rapid pagination requests occur
- **THEN** the system SHALL handle stale responses gracefully (e.g., using `abort` or ignoring outdated promise resolutions)
- **AND** the UI SHALL display results from the most recent request only

### Requirement: Pagination controls using shadcn/ui
The client SHALL render shadcn/ui Pagination components below the EventList to allow users to navigate between pages. The controls SHALL display the current page, total pages, and navigation buttons (previous, next).

#### Scenario: Pagination controls render at bottom
- **WHEN** events are loaded with pagination
- **THEN** the page SHALL render `PaginationContent`, `PaginationItem`, `PaginationPrevious`, `PaginationLink`, `PaginationNext`, and `PaginationEllipsis` components below the `EventList`
- **AND** the controls SHALL display the current page number and total page count derived from `total / pageSize`

#### Scenario: Previous button disabled on first page
- **WHEN** `pageIndex` is 0 (page 1)
- **THEN** the "Previous" button SHALL be disabled or visually inactive
- **AND** clicking it SHALL NOT change the page

#### Scenario: Next button disabled on last page
- **WHEN** `pageIndex + 1` equals `Math.ceil(total / pageSize)`
- **THEN** the "Next" button SHALL be disabled or visually inactive
- **AND** clicking it SHALL NOT change the page

#### Scenario: Pagination hides when data has single page
- **WHEN** `total <= pageSize`
- **THEN** the pagination controls SHALL NOT be rendered
- **AND** only the event cards SHALL be displayed

### Requirement: DAO migration from raw SQL to Prisma ORM
The Events DAO SHALL migrate from `prisma.$queryRaw` with raw SQL to `prisma.events.findMany()` and `prisma.events.count()` to support composable pagination parameters (`take`, `skip`) while maintaining type safety and the existing JOIN behavior for `eventTypes` and `userEventCreated`.

#### Scenario: findMany uses same filters as original raw SQL
- **WHEN** the DAO `findAll` method is called with filters
- **THEN** `prisma.events.findMany` SHALL include:
  - `where`: Same search conditions as the original raw SQL (`title`, `description`, or `speaker` contains the search term)
  - `include`: `{ eventTypes: true, userEventCreated: true }`
  - `orderBy`: `[{ eventDate: 'desc' }, { startTime: 'asc' }]`
  - `take` and `skip`: From `getSafePagination` result

#### Scenario: count query shares the same where filter
- **WHEN** the DAO `findAll` method executes
- **THEN** `prisma.events.count()` SHALL receive the identical `where` object as `findMany`
- **AND** both queries SHALL be executed concurrently via `Promise.all`
