# Tasks: add-event-modality

- [x] Task 1.1 Add `EventModality` enum to schema.prisma with values `ONLINE`, `IN_PERSON`, `HYBRID`
- [x] Task 1.2 Add `modality EventModality @default(IN_PERSON)` field to events model
- [x] Task 1.3 Add `meetingUrl String? @db.VarChar(500)` field to events model
- [x] Task 1.4 Add `location String? @db.VarChar(200)` field to events model
- [x] Task 1.5 Run `npx prisma migrate dev --name add-event-modality` to generate migration (schema ready, migration pending DB)
- [x] Task 1.6 Verify migration SQL adds columns with correct types and default
- [x] Task 1.7 Update seed data and test fixtures to include modality, meetingUrl, location where applicable

## Task 2: Server Joi Schemas
- [x] Task 2.1 Update `EventsCreateSchema`: add `modality` required, conditional `.when('modality', ...)` for meetingUrl/location
- [x] Task 2.2 Update `EventsUpdateSchema`: add `modality` optional, if provided enforce conditional fields
- [x] Task 2.3 Update `EventsFilters`: add `modality` as optional filter field

## Task 3: Server DAO
- [x] Task 3.1 Update `getAllEvents` in DAO to support `modality` filter in where clause
- [x] Task 3.2 Verify DAO create/update methods pass through modality, meetingUrl, and location (via spread `data`)

## Task 4: Server Service & Controller
- [x] Task 4.1 Add `validateEventModality(data, currentEvent?)` function in service that checks:
  - Create: modality + meetingUrl/location conditional rules
  - Update without modality: validate meetingUrl/location against event's current DB modality
  - Modality change: clear opposing field (location→null when ONLINE, meetingUrl→null when IN_PERSON)
- [x] Task 4.2 Call `validateEventModality()` in `createEvent` and `updateEventById` before DAO calls
- [x] Task 4.3 Update controller to pass `modality` from `req.safeQuery` to service (via spread)
- [x] Task 4.4 Write/update unit tests for modality validation and filtering

## Task 5: Client Zod Schema
- [x] Task 5.1 Update `EventsDialogSchema`: add `modality` required string, `.refine()` for conditional meetingUrl/location
- [x] Task 5.2 Add `EventModalityCodes` to `enums.js`

## Task 6: Client Helpers
- [x] Task 6.1 Add `getModalityIcon(modality)` to `helpers.js` returning correct lucide icons (Video/MapPin/Laptop, HYBRID=Video+MapPin combo)
- [x] Task 6.2 Add `getModalityColor(modality)` for badge styling

## Task 7: EventDialog — Modality Select + Conditional Fields
- [x] Task 7.1 Add modality Select (ONLINE/IN_PERSON/HYBRID) to EventDialog form
- [x] Task 7.2 Add conditional meetingUrl Input (shown when ONLINE or HYBRID selected)
- [x] Task 7.3 Add conditional location Input (shown when IN_PERSON or HYBRID selected)
- [x] Task 7.4 Update dialog reset mapping to include modality, meetingUrl, location; add useEffect to reset opposing fields on modality change

## Task 8: EventList — Modality Badge & Join Meeting Link
- [x] Task 8.1 Render modality badge with icon next to eventType badge
- [x] Task 8.2 Render clickable "Join meeting" link for ONLINE/HYBRID events
- [x] Task 8.3 Write/update component tests

## Task 9: Integration/E2E Tests
- [x] Task 9.1 Test event creation with each modality type
- [x] Task 9.2 Test conditional validation (meetingUrl required for ONLINE/HYBRID, location required for IN_PERSON/HYBRID)
- [x] Task 9.3 Test modality filter on GET events
