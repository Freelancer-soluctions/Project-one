## Context

The current `errorHandler` middleware at `apps/server/src/middleware/errorHandler.js` provides no Prisma-specific error handling. Prisma errors bubble up as generic `Error` instances, causing all database errors to return 500 Internal Server Error — even when the correct semantic status is 404 (not found), 409 (conflict), or 400 (bad request). Production environments leak Prisma schema details (field names, table names, constraint names) through error messages, creating a security surface for API consumers.

Application-level errors (`AppError` / `ClientError`) are handled, but the Prisma error gap means routine database operations produce confusing, inconsistent API responses. Additionally, the `deleteRow` function is missing from the DAO layer, forcing DELETE operations to use raw `prisma.model.delete()` calls that bypass any future centralized error wrapping.

Response envelopes are inconsistent: some endpoints return `{ error: true/false }` while others use different shapes, creating client integration friction.

## Goals / Non-Goals

**Goals:**
- Implement type-based dispatch in `errorHandler` for all Prisma error classes (`PrismaClientKnownRequestError`, `PrismaClientValidationError`, `PrismaClientInitializationError`, `PrismaClientRustPanicError`)
- Map all Prisma error codes (P2000-P2037) to appropriate HTTP status codes with human-readable messages
- Sanitize Prisma error messages in production (NODE_ENV=production) while preserving full detail in development
- Standardize API response envelopes: `{ success: Boolean, statusCode: Number, code: String|null, message: String }`
- Add `deleteRow` to the DAO layer to complete the CRUD interface (`createRow`, `updateRow`, `deleteRow`)
- Provide comprehensive unit test coverage for all error mapping and sanitization logic

**Non-Goals:**
- Not a rewrite of the entire error handling system — `ClientError` patterns remain unchanged
- No changes to existing Prisma query logic beyond adding `deleteRow`
- No changes to existing API route handlers
- No automatic retry logic for transient Prisma errors
- No database-level changes or migrations

## Decisions

### Decision 1: Type-based dispatch via instanceof
**Choice:** Import `Prisma` from `../../config/db.js` and use `instanceof` checks to dispatch Prisma error types.

**Rationale:** `instanceof` is the canonical pattern documented by Prisma and is type-safe. This project uses npm workspaces with a single hoisted `@prisma/client` dependency — duplicate instances are impossible. The `dao.js` module already imports `{ prisma, Prisma }` from `config/db.js`, making this pattern consistent with existing codebase conventions.

**Alternatives considered:**
- `constructor.name` string comparison — works but is stringly-typed and less reliable
- Duck-typing (`error.code` matching `/^P(\d/)`) — too loose, could match non-Prisma errors
- Centralized error class registry — over-engineered for the current scope

### Decision 2: Static error code mapping table
**Choice:** Define a hardcoded `PRISMA_CODE_HTTP_MAP` object mapping each known Prisma error code to its HTTP status.

**Rationale:** Prisma's error codes are stable across versions. A static map is zero-latency, requires no database queries, and is trivially testable. The map covers P2000 through P2037.

**Alternatives considered:**
- Database lookup table — flexible but adds latency and complexity
- Dynamic regex-based grouping — fragile and harder to maintain

### Decision 3: Dedicated sanitization module
**Choice:** Create `utils/prisma/sanitizePrismaMessage.js` as a separate module.

**Rationale:** Separating sanitization from dispatch keeps each module single-responsibility. The message map can be unit-tested independently.

### Decision 4: NODE_ENV gating at middleware level
**Choice:** Check `process.env.NODE_ENV` inside `errorHandler` after message sanitization: in production, use sanitized message; in development, append the original Prisma error detail.

**Rationale:** This keeps environment awareness in a single location (the handler) rather than scattering it across utility modules. Missing/undefined NODE_ENV defaults to production-safe behavior.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Constructor name check breaks if Prisma changes class names | Pin @prisma/client major version; integration tests catch failures at upgrade time |
| New Prisma error codes (P2038+) fall through to generic 500 | Static map logs warning for unmapped codes; generic fallback returns 500 |
| Changing `error: true/false` to `success: false/true` is breaking for existing clients | Coordinate with frontend team on deployment order; separate frontend change planned |
| `NODE_ENV` may not be set in some environments | Default to production-safe behavior (treat missing as production) |
| `deleteRow` uses positional params like `updateRow` | JSDoc documents signature; consistent with existing patterns |

## Error Code -> HTTP Status Mapping

| Prisma Code | HTTP Status | Reason |
|-------------|------------|--------|
| P2000 | 400 | Value too long for column |
| P2001 | 404 | Record does not exist (query condition) |
| P2002 | 409 | Unique constraint violation |
| P2003 | 409 | Foreign key constraint violation |
| P2004 | 400 | Constraint failed on field |
| P2005 | 400 | Invalid value for field type |
| P2006 | 400 | Invalid value for field |
| P2007 | 400 | Validation error |
| P2008 | 400 | Query parsing error |
| P2009 | 400 | Query validation error |
| P2010 | 500 | Raw query failed |
| P2011 | 400 | Null constraint violation |
| P2012 | 400 | Missing required value |
| P2013 | 400 | Missing required argument |
| P2014 | 409 | Required relation violation |
| P2015 | 404 | Related record not found |
| P2016 | 500 | Query interpretation error |
| P2017 | 409 | Relation not connected |
| P2018 | 404 | Required connected record not found |
| P2019 | 400 | Input error |
| P2020 | 400 | Value out of range |
| P2021 | 500 | Table does not exist |
| P2022 | 500 | Column does not exist |
| P2023 | 500 | Inconsistent column data |
| P2024 | 503 | Connection pool timeout |
| P2025 | 404 | Record not found (update/delete) |
| P2026 | 500 | Unsupported feature |
| P2027 | 500 | Multiple database errors |
| P2028 | 500 | Transaction API error |
| P2029 | 400 | Too many query parameters |
| P2030 | 500 | Full-text index missing |
| P2033 | 400 | Number out of range |
| P2034 | 409 | Transaction write conflict / deadlock |
| P2035 | 500 | Assertion violation |
| P2036 | 500 | External connector error |
| P2037 | 503 | Too many database connections |
| Unmapped | 500 | Fallback for unknown codes |

## Response Format Specification

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 404,
  "code": "P2025",
  "message": "The record you are trying to modify was not found."
}
```

### Development Enrichment
When NODE_ENV=development, error responses include additional fields:
```json
{
  "success": false,
  "statusCode": 404,
  "code": "P2025",
  "message": "The record you are trying to modify was not found.",
  "details": "(stack trace string)"
}
```

## Sanitization Strategy

### Production (`NODE_ENV=production` or unset)
- Error messages are mapped to safe, generic equivalents
- No Prisma table names, column names, or constraint names are exposed
- No stack traces

### Development (`NODE_ENV=development`)
- Sanitized message is prepended with `[DEV]` prefix
- Original Prisma error message is appended in parentheses
- Stack trace is included in `details` field

### Sanitization Map (excerpt)
Each Prisma error code maps to a safe message:
- P2002 → "A record with this value already exists."
- P2003 → "Cannot perform this operation due to a related record constraint."
- P2025 → "The record you are trying to modify was not found."
- P2034 → "A transaction conflict occurred. Please retry the operation."
- default → "An unexpected database error occurred."

## Error Handler Architecture

```
Request → Route Handler → Prisma Error
                                ↓
                     errorHandler(err, req, res, next)
                                ↓
              ┌─── constructor.name check ───┐
              │                               │
     PrismaClientKnownRequestError      Other types
              │                          (Validation,
              │                      Initialization, Rust)
              ↓                               ↓
     Lookup code in                  Map to appropriate
     PRISMA_CODE_HTTP_MAP             HTTP status (400/503/500)
              │                               │
              └──────────┬────────────────────┘
                         ↓
              Sanitize message via
              sanitizePrismaMessage()
                         ↓
              NODE_ENV check:
                production → safe message
                development → safe + original + stack
                         ↓
              globalErrorResponse(res, statusCode, code, message)
```

## deleteRow Implementation

```js
/**
 * Deletes a database row by its unique identifier.
 * Hard delete — permanently removes the record.
 * Returns the deleted record for audit/confirmation purposes.
 *
 * @param {string} tableName - Prisma model name (singular, e.g. 'events')
 * @param {Object} where - Prisma where clause to identify the record
 * @returns {Promise<Object>} The deleted record
 */
export const deleteRow = async (tableName, where) => {
  return prisma[tableName].delete({ where });
};
```

Positional params to match existing `updateRow(tableName, data, where)` and `createRow(tableName, data)`. Soft delete is explicitly out of scope for this change.

## File-by-File Change Map

| File | Action | Description |
|------|--------|-------------|
| `apps/server/src/utils/prisma/dao.js` | Modify | Add `deleteRow` export |
| `apps/server/src/utils/prisma/sanitizePrismaMessage.js` | Create | Code→message map + sanitization function |
| `apps/server/src/middleware/errorHandler.js` | Rewrite | Type dispatch + code table + sanitization + NODE_ENV gating |
| `apps/server/src/utils/responses&Errors/globalErrorResponse.js` | Modify | `error: true` → `success: false`, add `statusCode` |
| `apps/server/src/utils/responses&Errors/globalResponse.js` | Modify | `error: false` → `success: true` |
| `apps/server/tests/unit/errorHandler.test.js` | Create | 12 test cases for error handler |
| `apps/server/tests/unit/sanitizePrismaMessage.test.js` | Create | Test each code mapping + NODE_ENV gates |
