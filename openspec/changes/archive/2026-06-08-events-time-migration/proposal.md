## Why

Event `startTime` and `endTime` are stored as `VarChar(5)` strings (e.g., `"09:00"`) with no time-format validation. This allows invalid data (e.g., `"25:00"`, `"9:00"`, `"abc"`) to be saved, and there is no check ensuring `startTime` precedes `endTime`. Additionally, the `speaker` field is always required at the Joi level despite being semantically optional. These issues reduce data integrity and force consumers to handle edge cases.

## What Changes

- **DB migration**: Change `startTime`/`endTime` columns from `VarChar(5)` → `Time(0)` in the `events` table
- **HH:mm format validation**: Add `Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/)` to both fields in create/update schemas
- **Cross-field validation**: Add a custom Joi validation requiring `startTime < endTime` on create and update
- **Speaker optional**: Change `speaker` from `.allow('')` (always sent) to truly optional (`.optional()`) with nullable DB support
- **Prisma type update**: Regenerate Prisma client to reflect `Time(0)` columns

## Capabilities

### New Capabilities
- `event-time-validation`: Time-format validation (HH:mm regex), cross-field `startTime < endTime` check, and Time(0) DB column migration for the events module

### Modified Capabilities
*(None — no existing event-related specs in `openspec/specs/` require updates)*

## Impact

- **Database**: Requires a Prisma migration altering `events.startTime` and `events.endTime` column types (VarChar → Time). No data loss expected — existing values like `"09:00"` are valid Time input. Rollback requires a reverse migration.
- **Prisma schema**: `startTime` and `endTime` types change from `String` to `DateTime` with `@db.Time(0)` — the Prisma client will return Date objects instead of strings, affecting any code that consumes these fields.
- **Joi schemas**: `EventsCreateSchema` and `EventsUpdateSchema` updated with pattern validation and `.custom()` cross-field check. `speaker` changed to `.optional()`.
- **Service/DAO layer**: No structural changes expected, but `startTime`/`endTime` values will be Date objects from Prisma rather than strings — serialization in API responses may need `toISOString()` or time-only formatting.
- **API responses**: `startTime` and `endTime` in JSON responses will change from `"09:00"` string format to ISO time strings (e.g., `"09:00:00.000Z"`) or may need explicit formatting in controller/serializer.
