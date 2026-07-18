## Context

The `events` module manages event scheduling with `startTime` and `endTime` fields. Currently both fields are stored as `VarChar(5)` strings (e.g., `"09:00"`) in PostgreSQL and validated only by `Joi.string().max(5)` — no format enforcement. This permits invalid data like `"25:00"`, `"9:00"`, or `"abc"` to be persisted. Additionally, there is no cross-field validation ensuring `startTime < endTime`, and the `speaker` field is effectively required (sent as empty string) but semantically optional.

**Current state:**
- **Prisma schema:** `startTime String @db.VarChar(5)`, `endTime String @db.VarChar(5)`, `speaker String? @db.VarChar(20)`
- **Joi create schema:** `startTime: Joi.string().max(5).required()`, `endTime: Joi.string().max(5).required()`, `speaker: Joi.string().max(20).allow('')`
- **Joi update schema:** Same fields as `.optional()`
- **DAO:** `orderBy: [{ startTime: 'asc' }]` — currently sorts alphabetically on the string
- **Service layer:** Passes `startTime`/`endTime` as strings to Prisma; no transformation
- **API responses:** Return raw string values — consumers expect `"09:00"` format

**Stakeholders:** Events module API consumers (frontend, mobile), database administrators.

## Goals / Non-Goals

**Goals:**
- Migrate `startTime`/`endTime` from `VarChar(5)` to PostgreSQL `Time(0)` type for native time storage
- Add HH:mm regex validation (`/^([01]\d|2[0-3]):[0-5]\d$/`) on Joi create/update schemas
- Add cross-field validation ensuring `startTime < endTime` in Joi schemas
- Make `speaker` truly optional in Joi (`.empty('').optional()` instead of `.allow('')` — converts `""` to `undefined`)
- Add a service-layer helper to convert `"HH:mm"` strings to Date objects for Prisma and format Date objects back to `"HH:mm"` for API responses
- Update Prisma schema, generate migration, and regenerate client
- Create a Zod-equivalent schema mirroring the same validation rules (for future use)

**Non-Goals:**
- No changes to the `events` API route structure or controller signatures
- No changes to other modules (despite `attendance` model also having VarChar(5) time fields — left for future work)
- No introduction of timezone handling — `Time(0)` is time-of-day only, timezone-agnostic
- No changes to the `eventDate` field (already `DateTime @db.Timestamp(3)`)
- No changes to frontend validation — Joi/Zod validation lives server-side only

## Decisions

### 1. Database Type: PostgreSQL `Time(0)` over `VarChar(5)`

**Decision:** Change columns to `DateTime @db.Time(0)` in Prisma schema.

**Rationale:**
- `Time(0)` stores only hours:minutes:seconds with zero fractional precision, matching the HH:mm domain
- Enforces format at the database level — invalid time strings are rejected by PostgreSQL
- Enables native time ordering in queries (`ORDER BY startTime` becomes chronologically correct instead of lexicographic)
- Prisma maps `@db.Time(0)` to JavaScript `Date` objects, simplifying serialization
- Existing `"09:00"` values are valid PostgreSQL time input — migration is safe

**Alternatives considered:**
- Keep `VarChar(5)` + app-level regex: Lighter migration but misses DB-level enforcement and loses native ordering
- Use `Integer` (minutes since midnight): Requires conversion logic at every read/write, less readable in raw DB queries

### 2. Validation: Joi `.pattern()` with explicit regex

**Decision:** Use `/^([01]\d|2[0-3]):[0-5]\d$/` in Joi `.pattern()` on both create and update schemas.

**Rationale:**
- Explicit regex is self-documenting and testable
- Covers all valid 24-hour format times: `00:00`–`23:59`
- Rejects leading-zero violations (`9:00`), invalid hours (`25:00`), invalid minutes (`09:60`)
- Joi `.pattern()` returns a clear validation error message

### 3. Cross-field Validation: Joi `.custom()` for `startTime < endTime`

**Decision:** Add a `.custom()` validator at the object level that compares `startTime` and `endTime` as parsed time-of-day values.

**Rationale:**
- `startTime < endTime` is a fundamental business rule — an event cannot end before it starts
- `.custom()` receives the full validated object, allowing access to both fields
- Runs after individual field validation, so both values are guaranteed to be valid HH:mm strings
- Applied on both create and update schemas (for update, only when both fields are present)
- Error message: `"startTime must be earlier than endTime"`

### 4. Speaker Field: Truly Optional

**Decision:** Change `speaker` from `Joi.string().max(20).allow('')` to `Joi.string().max(20).empty('').optional()` (create) and keep `.optional()` (update, already correct).

**Rationale:**
- `.allow('')` forces the client to send `speaker: ""` even when there is no speaker — `.empty('').optional()` allows omitting the field entirely AND accepts `""` by converting it to `undefined`
- Prisma already has `speaker String?` (nullable), so `undefined` maps to `null` in the DB correctly
- The controller already handles partial body via `req.body` — no change needed there
- `.empty('')` converts `""` → `undefined` before `.optional()` checks, so existing clients sending `speaker: ""` will still work without validation errors

### 5. Service Layer: `timeStrToDate()` Helper and `format()` Serialization

**Decision:** Add two pure functions in the service layer:
- `timeStrToDate(timeStr: string): Date` — converts `"HH:mm"` to a Date object (using a fixed epoch date) for Prisma input
- `formatTime(date: Date): string` — extracts HH:mm from a Date object for API response serialization

**Rationale:**
- Prisma expects `Date` objects for `DateTime @db.Time(0)` columns
- API consumers expect `"HH:mm"` string format — raw Date serialization would produce ISO strings like `"2026-06-07T09:00:00.000Z"`
- The helper isolates the conversion logic, making it unit-testable
- Fixed epoch date (e.g., `1970-01-01`) is used as the date portion since only time-of-day matters

**Usage points:**
- `service.createEvent()` — convert `startTime`/`endTime` from strings to Dates before passing to DAO
- `service.updateEventById()` — same conversion for update input
- `service.getAllEvents()` — format `startTime`/`endTime` from Date back to `"HH:mm"` in the response data
- The DAO's `orderBy: [{ startTime: 'asc' }]` no longer needs changes — after migration, Prisma will order by `Time(0)` natively (chronologically correct)

### 6. Zod Schema (for future use)

**Decision:** Create a Zod mirror of the Joi schema with equivalent rules.

**Rationale:**
- User confirmed Zod validation with the same regex pattern
- Zod is increasingly used across the project; having a ready schema enables future migration
- Not wired into routes — created as a reference/side-by-side artifact

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Prisma `@db.Time(0)` returns Date objects** — existing code that treats `startTime` as a string will break | Service layer must format all outgoing times via `formatTime()`. All callers of `getAllEvents` already go through the service. |
| **Migration may fail on invalid existing data** — if any row has a non-time string like `"abc"` in `startTime`/`endTime` | Run a pre-migration query to detect invalid values. If found, set them to `"00:00"` as fallback. |
| **Rollback requires reverse migration** — reverting `Time(0)` to `VarChar(5)` may lose milliseconds if any code writes non-zero seconds | Use `Time(0)` (zero fractional seconds). Migration script truncates to HH:mm. |
| **Breaking change for API consumers** — if any client relies on raw string format from the API | The service layer formats output back to `"HH:mm"`, so the API contract is preserved. |
| **orderBy behavior change** — `startTime` sorts lexicographically as string vs chronologically as time | This is a *fix*, not a regression. After migration, `"09:00"` < `"10:00"` will sort correctly. Document in changelog. |

## Migration Plan

1. **Pre-migration check:** Run SQL to find rows with invalid `startTime`/`endTime` values:
   ```sql
   SELECT id, startTime, endTime FROM events
   WHERE startTime !~ '^([01]\d|2[0-3]):[0-5]\d$'
      OR endTime   !~ '^([01]\d|2[0-3]):[0-5]\d$';
   ```
2. **Fix invalid values:** Update any invalid rows to `'00:00'`.
3. **Update Prisma schema:** Change `startTime` and `endTime` from `String @db.VarChar(5)` to `DateTime @db.Time(0)`.
4. **Generate migration:** `npx prisma migrate dev --name migrate_events_start_end_time`
5. **Regenerate client:** `npx prisma generate`
6. **Update Joi schemas:** Add HH:mm regex, cross-field validation, make speaker optional via `.empty('').optional()`.
7. **Add service helpers:** Implement `timeStrToDate()` and `formatTime()`.
8. **Update service functions:** Convert strings → Date on input, format Date → string on output for all CRUD operations.
9. **Run tests:** Write unit tests for Joi validation rules and time conversion helpers.
