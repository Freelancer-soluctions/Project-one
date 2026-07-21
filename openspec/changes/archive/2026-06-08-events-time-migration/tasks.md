## 1. Database Migration & Prisma Updates

- [x] 1.1 Run pre-migration SQL query to detect rows with invalid `startTime`/`endTime` values
- [x] 1.2 Fix any invalid rows by setting invalid `startTime`/`endTime` to `'00:00'`
- [x] 1.3 Update Prisma schema: change `startTime` and `endTime` from `String @db.VarChar(5)` to `DateTime @db.Time(0)`
- [x] 1.4 Generate Prisma migration and apply to database
- [x] 1.5 Regenerate Prisma client (`npx prisma generate`)

## 2. Joi Schema Validation Updates

- [x] 2.1 Add HH:mm regex pattern validation `/^([01]\d|2[0-3]):[0-5]\d$/` to `startTime` and `endTime` in `EventsCreateSchema`
- [x] 2.2 Add `startTime < endTime` cross-field `.custom()` validator to `EventsCreateSchema`
- [x] 2.3 Add HH:mm regex pattern validation to `startTime` and `endTime` in `EventsUpdateSchema`
- [x] 2.4 Add `startTime < endTime` cross-field `.custom()` validator to `EventsUpdateSchema` (skip when only one field present)
- [x] 2.5 Change `speaker` from `.allow('')` to `.empty('').optional()` in `EventsCreateSchema` — converts `""` to `undefined`

## 3. Service-Layer Time Conversion Helpers

- [x] 3.1 Implement `timeStrToDate(timeStr: string): Date` — converts `"HH:mm"` to Date on fixed epoch date
- [x] 3.2 Implement `formatTime(date: Date): string` — extracts HH:mm from Date object
- [x] 3.3 Export both helpers from the service module

## 4. Service Integration

- [x] 4.1 Update `service.createEvent()` to convert `startTime`/`endTime` strings to Date objects via `timeStrToDate` before passing to DAO
- [x] 4.2 Update `service.updateEventById()` to convert `startTime`/`endTime` strings to Date objects via `timeStrToDate` before passing to DAO
- [x] 4.3 Update `service.getAllEvents()` to format `startTime`/`endTime` from Date back to `"HH:mm"` via `formatTime` in response data
- [x] 4.4 Update `service.createEvent()` to format `startTime`/`endTime` in the created-event response via `formatTime` (controller returns raw event — Date would serialize as ISO string)
- [x] 4.5 Update DAO JSDoc: change `@param {string} data.startTime` / `data.endTime` to `@param {Date}` to reflect new Prisma return type

## 5. Zod Schema Mirror

- [x] 5.1 Create `schemas/events.zod.js` with HH:mm regex pattern on `startTime`/`endTime`
- [x] 5.2 Add `startTime < endTime` cross-field validation using `.refine()` or `.superRefine()`
- [x] 5.3 Define `speaker` as `.optional()` in the Zod schema

## 6. Testing

- [x] 6.1 Write unit tests for Joi validation rules (HH:mm regex, cross-field start<end, speaker `.empty('').optional()`)
- [x] 6.2 Write unit tests for `timeStrToDate` and `formatTime` helpers
- [x] 6.3 Write integration tests for API endpoint validation (POST/PUT events with invalid times, reversed times, missing speaker)
- [x] 6.4 Run full test suite to verify no regressions
