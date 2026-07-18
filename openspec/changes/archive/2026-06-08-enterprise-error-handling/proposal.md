## Why

Prisma errors leak database schema internals to API consumers and produce inconsistent HTTP status codes. Specifically, Prisma error P2025 (record not found) returns a 500 Internal Server Error instead of the correct 404 Not Found, and no centralized Prisma error mapping exists. Response format is asymmetric — some responses use `error: true/false` while others use inconsistent shapes — creating client integration friction.

## What Changes

1. **Add `deleteRow` to `utils/prisma/dao.js`** — fixes broken DELETE operations on events, news, products, and providers modules. Signature: `(tableName, where)` positional, returns deleted record.
2. **Rewrite `middleware/errorHandler.js`** — full enterprise error handling with Prisma type dispatch (ClientKnownRequestError, ClientValidationError, ClientInitializationError, RustPanicError), error code → HTTP status mapping table, and NODE_ENV-gated message sanitization.
3. **Create `utils/prisma/sanitizePrismaMessage.js`** — maps Prisma error codes (P2000-P2037) to safe, human-readable messages suitable for production API responses.
4. **Update `utils/responses&Errors/globalErrorResponse.js`** — change `error: true` to `success: false`, add `statusCode` to response body, maintain `code` and `message` fields.
5. **Update `utils/responses&Errors/globalResponse.js`** — change `error: false` to `success: true` for consistency.
6. **Create `tests/unit/errorHandler.test.js`** — 12 test cases covering all Prisma error types, ClientError, generic errors, production/development message gating.
7. **Create `tests/unit/sanitizePrismaMessage.test.js`** — test each Prisma error code mapping and environment gates.

## Capabilities

### New Capabilities
- `prisma-error-handling`: Centralized Prisma error code mapping to HTTP status codes, error type dispatch, message sanitization for production safety, and developer-friendly detail in non-production environments.
- `response-format`: Standardized API response shape with `success: Boolean`, `statusCode: Number`, `code: String|null`, `message: String` across both success and error responses.

### Modified Capabilities
*(None — no existing capability specs have requirement changes.)*

## Impact

- **Middleware**: `apps/server/src/middleware/errorHandler.js` — full rewrite
- **Data Access**: `apps/server/src/utils/prisma/dao.js` — new `deleteRow` export
- **New Utility**: `apps/server/src/utils/prisma/sanitizePrismaMessage.js`
- **Response Format**: `globalErrorResponse.js` and `globalResponse.js` — `error` → `success` key rename + `statusCode` addition
- **Tests**: 2 new test files (errorHandler, sanitizePrismaMessage) at `apps/server/tests/unit/`
- **Production Behavior**: Prisma schema leaks eliminated in production; full detail retained in development
- **Breaking**: API response consumers must update from `error: true/false` to `success: false/true`
