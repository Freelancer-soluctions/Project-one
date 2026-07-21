## Implementation Tasks

### Task: Add deleteRow to Prisma DAO
- [x] Add `deleteRow(tableName, where)` export to `apps/server/src/utils/prisma/dao.js`
- [x] Function accepts positional params `(tableName, where)` to match existing `updateRow`/`createRow`
- [x] Returns the deleted record (Prisma's `.delete()` behavior)
- [x] Add JSDoc documenting hard-delete behavior

### Task: Create sanitizePrismaMessage utility
- [x] Create `apps/server/src/utils/prisma/sanitizePrismaMessage.js`
- [x] Define `SAFE_MESSAGES` object mapping codes P2000-P2037 to safe human-readable messages
- [x] Export `sanitizePrismaMessage(err, includeOriginal = false)` function
- [x] Function returns safe message by default, appends original when `includeOriginal` is true
- [x] Unknown codes fall back to `"An unexpected database error occurred."`
- [x] Add null/undefined guard `if (!err || typeof err !== 'object')` (reviewer finding M1)

### Task: Rewrite errorHandler with type dispatch and code mapping
- [x] Rewrite `apps/server/src/middleware/errorHandler.js`
- [x] Import `Prisma` from `../config/db.js` for `instanceof` checks (not constructor.name)
- [x] Import `sanitizePrismaMessage` from new utility
- [x] Import `ClientError` from existing errors module
- [x] Define `PRISMA_CODE_HTTP_MAP` grouped by HTTP status category (400/404/409/500/503)
- [x] Dispatch by `instanceof`:
  - `PrismaClientKnownRequestError` → look up code in map, sanitize message
  - `PrismaClientValidationError` → 400, code `VALIDATION_ERROR`
  - `PrismaClientInitializationError` → 503, code `DATABASE_INIT_ERROR`
  - `PrismaClientRustPanicError` → 500, code `DATABASE_ENGINE_CRASH`, set `process.exitCode = 1`
  - `ClientError` → use `err.statusCode`, preserve `err.code` or fallback to `CLIENT_ERROR`
  - Others → 500, `INTERNAL_ERROR` (never leak system codes like ECONNRESET)
- [x] Implement NODE_ENV gating:
  - Production/unset: sanitized message only
  - Development: sanitized message, stack trace in `details` field (guarded against undefined stack)
- [x] Single unified `logger.error` call per error (no duplicate logging)
- [x] Inline response via `res.status().json()` (does not call globalErrorResponse)

### Task: Update globalErrorResponse format
- [x] Modify `apps/server/src/utils/responses&Errors/globalErrorResponse.js`
- [x] Change `error: true` → `success: false`
- [x] Add `statusCode` field to response body
- [x] Keep `code` and `message` fields
- [x] Add defaults for code and message (reviewer finding M6)

### Task: Update globalResponse format
- [x] Modify `apps/server/src/utils/responses&Errors/globalResponse.js`
- [x] Change `error: false` → `success: true`
- [x] Fix empty string handling: `message !== null` instead of `message &&` (reviewer finding M7)

### Task: Create errorHandler unit tests
- [x] Create `apps/server/tests/unit/errorHandler.test.js`
- [x] Mock logger to avoid side effects
- [x] Implement 12 test cases:
  - P2002 → 409 with code P2002
  - P2025 → 404 with code P2025
  - P2003 → 409 with code P2003
  - P2024 → 503 with code P2024
  - PrismaClientValidationError → 400 with code VALIDATION_ERROR
  - PrismaClientInitializationError → 503 with code DATABASE_INIT_ERROR
  - PrismaClientRustPanicError → 500 + exitCode = 1
  - ClientError → custom statusCode
  - Generic Error → 500, INTERNAL_ERROR
  - Production message sanitization (no schema details, no details field)
  - Dev message includes stack in details field
  - Unknown Prisma code → 500 fallback
- [x] Add `afterEach` NODE_ENV cleanup for test isolation (reviewer finding H5)

### Task: Create sanitizePrismaMessage unit tests
- [x] Create `apps/server/tests/unit/sanitizePrismaMessage.test.js`
- [x] Test key code mappings (P2000, P2002, P2025, P2034)
- [x] Test unknown code returns default message
- [x] Test `includeOriginal=true` appends original message
- [x] Test `includeOriginal=false` returns only safe message
- [x] Test missing code property

### Task: Run tests and verify
- [x] Run `npm run test:unit` from `apps/server/` directory
- [x] Verify all 20 new tests pass (12 errorHandler + 8 sanitizePrismaMessage)
- [x] Verify no regressions in existing tests (16 pre-existing pass)
- [x] Fix pre-existing notes-mentions test issues found during implementation

## Post-Review Fixes (applied after code review)
- [x] H1 — Fix system code leak: generic else branch always uses `INTERNAL_ERROR` code
- [x] H2 — Preserve ClientError original `err.code` if present
- [x] H3 — Remove duplicate logging: single unified `logger.error` per error
- [x] H4 — Guard `err.stack` against undefined in dev details
- [x] H5 — Add `afterEach` NODE_ENV cleanup in tests
- [x] M1 — Add null/undefined guard in sanitizePrismaMessage
- [x] M6 — Add defaults for code and message in globalErrorResponse
- [x] M7 — Fix empty string falsy issue in globalResponse
