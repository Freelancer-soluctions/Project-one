## Context

The events module currently supports CRUD operations (create, read, update, delete) via a REST API at `/api/v1/events`. Events have fields: title, description, speaker, startTime, endTime, eventDate, type (linked to `eventTypes`). Users interact with events inside the platform but have no way to sync them into personal calendar applications (Google Calendar, Apple Calendar, Outlook).

The existing architecture follows a layered pattern:
- **routes.js** — Express router with middleware (auth, permission checks, validation)
- **controller.js** — Thin handlers delegating to service layer
- **service.js** — Business logic and data transformation
- **dao.js** — Prisma ORM queries

No iCal/calendar export infrastructure exists today. The `ical-generator` npm package (RFC 5545 compliant) will be introduced to handle `.ics` file generation.

## Goals / Non-Goals

**Goals:**
- Expose a new authenticated endpoint `GET /api/v1/events/export/ical` returning an `.ics` file
- Support optional `startDate` and `endDate` query parameters to filter exported events by date range
- Support optional `eventType` query parameter to filter by event type code
- Return RFC 5545 compliant iCalendar output with `Content-Type: text/calendar` and `Content-Disposition: attachment` headers
- Follow existing events module patterns (routes → controller → service → dao)
- Include integration and unit tests for the new functionality

**Non-Goals:**
- No database schema changes — existing `events` and `eventTypes` models are sufficient
- No recurring event logic — exported events are individual instances
- No calendar sync/push — this is a one-time download, not a subscription/auto-sync mechanism
- No WebCal or CalDAV support
- No UI changes in this scope (the frontend download button is a separate concern)

## Decisions

1. **Separate export service file over inline logic** — A new `exportService.js` file will be created rather than adding iCal logic to the existing `service.js`. This keeps calendar-specific concerns isolated and makes the code easier to test and maintain. The existing `service.js` is already 162 lines and focused on CRUD.
   - *Alternative considered*: Adding `exportIcalEvents` method to existing `service.js` — rejected because it mixes concerns and would bloat the file.

2. **`ical-generator` library over manual `.ics` string construction** — RFC 5545 is complex and error-prone to implement manually (timezone handling, line folding, escape sequences). `ical-generator` is a mature, well-maintained library that handles all RFC compliance.
   - *Alternative considered*: `node-ical` — this is a parser, not a generator.
   - *Alternative considered*: Manual string template — rejected due to high risk of RFC violations.

3. **New DAO method for filtered event retrieval** — A dedicated `getEventsForExport` DAO method will retrieve events with date-range and event-type filters, returning only the fields needed for iCal generation (`id`, `title`, `description`, `speaker`, `startTime`, `endTime`, `eventDate`, `eventTypes`). This avoids overloading `getAllEvents` which has pagination logic irrelevant to exports.
   - *Alternative considered*: Reusing `getAllEvents` with pagination params — rejected because pagination doesn't make sense for a file download.

4. **Query parameter validation via Joi schema** — A new `EventsExportSchema` Joi schema will validate `startDate`, `endDate`, and `eventType` query parameters, consistent with existing validation patterns (`EventsFilters` Joi schema for the list endpoint).
   - *Alternative considered*: Inline validation in controller — rejected to maintain consistency with the existing validation middleware pattern.

5. **Permission-gated access** — The export endpoint will use the existing `canViewEvents` permission, consistent with the `GET /api/v1/events` list endpoint, since exporting is a read operation.

## Risks / Trade-offs

- **Large payload risk**: Exporting many events without pagination could produce large `.ics` files or cause memory pressure. *Mitigation*: Enforce a maximum date range (e.g., 365 days) and log warnings for exports exceeding a threshold (e.g., 1000 events). The DAO query includes a reasonable row limit.
- **Timezone ambiguity**: `eventDate` is stored as a timestamp, `startTime`/`endTime` as Time(0) columns (no timezone). *Mitigation*: In the iCal output, combine `eventDate` + `startTime`/`endTime` and mark as `DATE-TIME` with a floating time (no UTC conversion) to match the platform's existing behavior. Document this as a known limitation.
- **RFC 5545 compliance**: The `ical-generator` library handles most compliance, but edge cases (special characters in titles/descriptions, long lines) need testing. *Mitigation*: Add unit tests with known edge cases (accents, HTML entities, very long strings).
- **Dependency addition**: Adding `ical-generator` increases the dependency footprint slightly (~30KB). The library is stable and well-maintained, so this is low risk.
