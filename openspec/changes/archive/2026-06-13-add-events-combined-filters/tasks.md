> **⚠️ Prerequisite:** `add-soft-delete-events` must be implemented first. This change assumes `deletedAt`/`deletedBy` fields and `showDeleted` filter already exist in the DAO.

## 1. Schema Validation — Add New Filter Params

- [x] 1.1 Add `type` (Joi: `number().integer().optional()`, Zod: `z.number().int().optional()`) to `EventsFilters` / `EventsFiltersSchema`
- [x] 1.2 Add `dateFrom` (Joi: `date().iso().optional()`, Zod: `z.string().date().optional()`) to `EventsFilters` / `EventsFiltersSchema`
- [x] 1.3 Add `dateTo` (Joi: `date().iso().optional()`, Zod: `z.string().date().optional()`) to `EventsFilters` / `EventsFiltersSchema`
- [x] 1.4 Add `speaker` (Joi: `string().max(50).optional()`, Zod: `z.string().max(50).optional()`) to `EventsFilters` / `EventsFiltersSchema`
- [x] 1.5 Add `status` (Joi: `string().valid('upcoming','past','all').optional()`, Zod: `z.enum(['upcoming','past','all']).optional()`) to `EventsFilters` / `EventsFiltersSchema`

## 2. DAO — Refactor to Composable `conditions[]` Pattern

- [x] 2.1 Refactor `getAllEvents` `where` builder from flat spread to `conditions[]` array with `{ AND: conditions }` wrapper
- [x] 2.2 Add `searchQuery` condition to `conditions[]` array (existing OR block on title/description/speaker)
- [x] 2.3 Add `type` condition: exact match on `eventTypeId` when `type` param provided
- [x] 2.4 Add `dateFrom`/`dateTo` condition: `eventDate: { gte: dateFrom, lte: dateToEndOfDay }` — normalize `dateTo` to end-of-day for inclusive range
- [x] 2.5 Add `speaker` condition: `{ speaker: { contains: speaker, mode: 'insensitive' } }`
- [x] 2.6 Add `status` condition: derive `upcoming` (`eventDate > today OR (eventDate == today AND endTime > now)`) or `past` (`eventDate < today OR (eventDate == today AND endTime <= now)`) from server UTC time
- [x] 2.7 Integrate `deletedAt: null` condition from soft-delete change into `conditions[]` array — it should always be present unless `showDeleted=true`
- [x] 2.8 Update `getAllEvents` function signature to accept new filter params (`type`, `dateFrom`, `dateTo`, `speaker`, `status`)

## 3. Service — Pass Through New Filter Params

- [x] 3.1 Update `getAllEvents` service function signature to destructure `type`, `dateFrom`, `dateTo`, `speaker`, `status` from params
- [x] 3.2 Pass new filter params through to `eventDao.getAllEvents` call
- [x] 3.3 Update JSDoc for `getAllEvents` service function to document all filter params

## 4. Infrastructure

- [x] 4.1 Add `@@index([eventDate])` to the `events` Prisma model for date range query performance
- [x] 4.2 Generate and run Prisma migration for the new index (migration SQL generated, DB unavailable)
- [x] 4.3 Update OpenAPI JSDoc in `routes.js` to document new query params: `type`, `dateFrom`, `dateTo`, `speaker`, `status`

## 5. Testing

- [x] 5.1 Write unit tests for DAO `conditions[]` — verify each filter produces correct Prisma `where` block in isolation
- [x] 5.2 Write unit tests for DAO combined filters — verify AND logic when multiple filters are provided together
- [x] 5.3 Write unit tests for DAO empty conditions — verify `conditions[]` contains only `deletedAt: null` when no user filters provided
- [x] 5.4 Write integration tests for each new filter param (type, date range, speaker, status) via `GET /events`
- [x] 5.5 Write integration tests for combined filter scenarios (e.g., status=upcoming + dateFrom + speaker)
- [x] 5.6 Write validation tests — verify 400 error for invalid type, invalid date, invalid status value
- [x] 5.7 Verify backward compatibility — existing `searchQuery` and pagination params continue working unchanged
