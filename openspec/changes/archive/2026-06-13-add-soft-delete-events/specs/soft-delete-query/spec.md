## ADDED Requirements

### Requirement: GET /events filters out soft-deleted events by default
The system SHALL automatically exclude soft-deleted events (`deletedAt IS NULL`) from the default `GET /events` response.

#### Scenario: List events excludes soft-deleted
- **WHEN** a user with `canViewEvents` permission calls `GET /events` with no special query parameters
- **THEN** the response SHALL contain only events where `deletedAt IS NULL`
- **AND** SHALL NOT include events where `deletedAt IS NOT NULL`

#### Scenario: Filtered search excludes soft-deleted
- **WHEN** a user calls `GET /events` with a search query parameter
- **THEN** the search SHALL only match non-deleted events (where `deletedAt IS NULL`)

#### Scenario: Paginated results exclude soft-deleted
- **WHEN** a user calls `GET /events` with pagination parameters (page, limit)
- **THEN** the pagination count SHALL reflect only non-deleted events
- **AND** the results SHALL NOT include soft-deleted events

### Requirement: ADMIN can view soft-deleted events with ?showDeleted=true
The system SHALL allow ADMIN users to bypass the soft-delete filter by providing the `?showDeleted=true` query parameter.

#### Scenario: ADMIN views all events including deleted
- **WHEN** an ADMIN user calls `GET /events?showDeleted=true`
- **THEN** the response SHALL include both active and soft-deleted events
- **AND** the `deletedAt` and `deletedBy` fields SHALL be visible in the response

#### Scenario: Non-ADMIN using showDeleted returns 403
- **WHEN** a MANAGER or USER role calls `GET /events?showDeleted=true`
- **THEN** the system SHALL reject the request with HTTP 403 Forbidden

#### Scenario: showDeleted=false behaves as default
- **WHEN** a user calls `GET /events?showDeleted=false`
- **THEN** the response SHALL behave identically to `GET /events` with no parameter
- **AND** SHALL exclude soft-deleted events

### Requirement: showDeleted is validated by Joi schema
The system SHALL validate the `showDeleted` query parameter through the existing Joi validation layer.

#### Scenario: Invalid showDeleted value returns 400
- **WHEN** a user calls `GET /events?showDeleted=invalid`
- **THEN** the system SHALL return HTTP 400 Bad Request with a validation error message

### Requirement: DAO conditionally applies deletedAt filter
The DAO SHALL conditionally include or omit the `deletedAt: null` filter based on the `showDeleted` flag.

#### Scenario: DAO adds deletedAt null filter by default
- **WHEN** `getAllEvents` is called with `showDeleted = false`
- **THEN** the DAO SHALL add `deletedAt: null` to the Prisma `where` clause

#### Scenario: DAO omits deletedAt filter for admin override
- **WHEN** `getAllEvents` is called with `showDeleted = true` by an ADMIN user
- **THEN** the DAO SHALL omit the `deletedAt: null` filter from the Prisma `where` clause
