## ADDED Requirements

### Requirement: Error handler dispatches by Prisma error type
The system SHALL dispatch Prisma errors by type in the error handler middleware before applying code-level mapping.

#### Scenario: Known request error routes through code lookup
- **WHEN** a `PrismaClientKnownRequestError` with code `P2025` is thrown
- **THEN** the error handler SHALL look up the code in the HTTP mapping table and return HTTP 404

#### Scenario: Validation error returns 400
- **WHEN** a `PrismaClientValidationError` is thrown
- **THEN** the error handler SHALL return HTTP 400 with code `VALIDATION_ERROR`

#### Scenario: Initialization error returns 503
- **WHEN** a `PrismaClientInitializationError` is thrown
- **THEN** the error handler SHALL return HTTP 503 with code `DATABASE_INIT_ERROR`

#### Scenario: Rust panic error returns 500 with exit code signal
- **WHEN** a `PrismaClientRustPanicError` is thrown
- **THEN** the error handler SHALL return HTTP 500 with code `DATABASE_ENGINE_CRASH` and SHALL set `process.exitCode = 1`

### Requirement: Prisma error codes map to appropriate HTTP statuses
The system SHALL map all known Prisma error codes (P2000-P2037) to correct HTTP status codes using a static lookup table.

#### Scenario: P2025 record not found returns 404
- **WHEN** a `PrismaClientKnownRequestError` with code `P2025` is caught
- **THEN** the error handler SHALL respond with HTTP 404

#### Scenario: P2002 unique constraint returns 409
- **WHEN** a `PrismaClientKnownRequestError` with code `P2002` is caught
- **THEN** the error handler SHALL respond with HTTP 409

#### Scenario: P2003 foreign key violation returns 409
- **WHEN** a `PrismaClientKnownRequestError` with code `P2003` is caught
- **THEN** the error handler SHALL respond with HTTP 409

#### Scenario: P2024 connection pool timeout returns 503
- **WHEN** a `PrismaClientKnownRequestError` with code `P2024` is caught
- **THEN** the error handler SHALL respond with HTTP 503

#### Scenario: P2034 transaction conflict returns 409
- **WHEN** a `PrismaClientKnownRequestError` with code `P2034` is caught
- **THEN** the error handler SHALL respond with HTTP 409

#### Scenario: Validation-type codes (P2000, P2006, P2011) return 400
- **WHEN** a `PrismaClientKnownRequestError` with code `P2000`, `P2006`, or `P2011` is caught
- **THEN** the error handler SHALL respond with HTTP 400

#### Scenario: Infrastructure codes (P2021, P2022) return 500
- **WHEN** a `PrismaClientKnownRequestError` with code `P2021` or `P2022` is caught
- **THEN** the error handler SHALL respond with HTTP 500

#### Scenario: Unmapped Prisma code returns 500 fallback
- **WHEN** a `PrismaClientKnownRequestError` with an unmapped code (e.g., `P9999`) is caught
- **THEN** the error handler SHALL respond with HTTP 500 and a generic error message

#### Scenario: Generic non-Prisma Error returns 500
- **WHEN** a plain `Error` object is thrown
- **THEN** the error handler SHALL respond with HTTP 500

#### Scenario: ClientError uses its own statusCode
- **WHEN** a `ClientError` with custom `statusCode` (e.g., 422) is thrown
- **THEN** the error handler SHALL respond with the ClientError's statusCode

### Requirement: Error messages are sanitized for production safety
The system SHALL sanitize Prisma error messages to prevent leaking database schema internals to API consumers.

#### Scenario: Production uses safe sanitized message
- **WHEN** `NODE_ENV` is `production` and a P2002 error is thrown
- **THEN** the response message SHALL be `"A record with this value already exists."` and SHALL NOT contain any table or column names

#### Scenario: Development includes original message
- **WHEN** `NODE_ENV` is `development` and a P2002 error is thrown
- **THEN** the response message SHALL include the safe message prefixed with `[DEV]` and the original Prisma message in parentheses

#### Scenario: Missing NODE_ENV defaults to production
- **WHEN** `NODE_ENV` is not set and a P2002 error is thrown
- **THEN** the response message SHALL use the production-safe sanitized message

#### Scenario: Development includes stack trace
- **WHEN** `NODE_ENV` is `development` and any error is thrown
- **THEN** the response SHALL include a `details` field with the error stack trace

### Requirement: deleteRow is added to DAO layer
The system SHALL add a `deleteRow` function to `utils/prisma/dao.js` to complete the CRUD interface.

#### Scenario: deleteRow deletes record by where clause
- **WHEN** `deleteRow('events', { id: 1 })` is called and the record exists
- **THEN** the record SHALL be permanently deleted and the deleted record SHALL be returned

#### Scenario: deleteRow throws P2025 for non-existent record
- **WHEN** `deleteRow('events', { id: 999 })` is called and the record does not exist
- **THEN** Prisma SHALL throw a `PrismaClientKnownRequestError` with code `P2025`
