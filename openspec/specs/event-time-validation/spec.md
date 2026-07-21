## Purpose

Time-format validation, cross-field `startTime < endTime` check, and Time(0) DB column migration for the events module.

## Requirements

### Requirement: HH:mm Time Format Validation
The system SHALL validate that `startTime` and `endTime` values match the 24-hour HH:mm format using the regex `/^([01]\d|2[0-3]):[0-5]\d$/` in Joi create and update schemas.

#### Scenario: Valid HH:mm time accepted
- **WHEN** the user provides `startTime` or `endTime` with a value matching HH:mm format (e.g., `"09:00"`, `"23:59"`, `"00:00"`)
- **THEN** the system SHALL accept the value and proceed with validation

#### Scenario: Invalid hour rejected
- **WHEN** the user provides `startTime` or `endTime` with an hour outside 00–23 (e.g., `"25:00"`, `"99:00"`)
- **THEN** the system SHALL reject the value with a validation error indicating invalid time format

#### Scenario: Invalid minute rejected
- **WHEN** the user provides `startTime` or `endTime` with minutes outside 00–59 (e.g., `"09:60"`, `"09:99"`)
- **THEN** the system SHALL reject the value with a validation error indicating invalid time format

#### Scenario: Missing leading zero rejected
- **WHEN** the user provides `startTime` or `endTime` without a leading zero (e.g., `"9:00"`, `"7:30"`)
- **THEN** the system SHALL reject the value with a validation error indicating invalid time format

#### Scenario: Non-time string rejected
- **WHEN** the user provides `startTime` or `endTime` with a non-time value (e.g., `"abc"`, `"noon"`, `""`)
- **THEN** the system SHALL reject the value with a validation error indicating invalid time format

### Requirement: Cross-Field startTime < endTime Validation
The system SHALL enforce that `startTime` is chronologically earlier than `endTime` using a Joi `.custom()` validator on both create and update schemas.

#### Scenario: Valid time range accepted
- **WHEN** the user provides `startTime: "09:00"` and `endTime: "17:00"`
- **THEN** the system SHALL accept the values and proceed with validation

#### Scenario: Equal times rejected
- **WHEN** the user provides `startTime: "09:00"` and `endTime: "09:00"`
- **THEN** the system SHALL reject with error `"startTime must be earlier than endTime"`

#### Scenario: Reversed times rejected
- **WHEN** the user provides `startTime: "17:00"` and `endTime: "09:00"`
- **THEN** the system SHALL reject with error `"startTime must be earlier than endTime"`

#### Scenario: Cross-field validation skipped on partial update
- **WHEN** the user updates an event and provides only `startTime` (without `endTime`) or only `endTime` (without `startTime`)
- **THEN** the system SHALL skip the cross-field validation for that field pair

### Requirement: Database Column Migration to Time(0)
The system SHALL migrate the `events.startTime` and `events.endTime` columns from `VarChar(5)` to PostgreSQL `Time(0)` type via Prisma migration, with a pre-migration data integrity check.

#### Scenario: Pre-migration invalid data detection
- **WHEN** running the migration
- **THEN** the system SHALL first execute a SQL query to detect rows where `startTime` or `endTime` do not match the HH:mm regex, and report any invalid values

#### Scenario: Invalid data remediation
- **WHEN** invalid `startTime` or `endTime` values are found during the pre-migration check
- **THEN** the system SHALL set invalid values to `"00:00"` before running the column type change

#### Scenario: Column type change
- **WHEN** the pre-migration check and remediation complete
- **THEN** the Prisma migration SHALL alter `events.startTime` and `events.endTime` from `VarChar(5)` to `DateTime @db.Time(0)`

#### Scenario: Prisma client regeneration
- **WHEN** the migration completes
- **THEN** the Prisma client SHALL be regenerated so that `startTime` and `endTime` are typed as `Date` objects instead of `string`

### Requirement: Speaker Field Optional
The system SHALL change the `speaker` field from `Joi.string().max(20).allow('')` to `Joi.string().max(20).optional()` in the create schema, allowing clients to omit the field entirely.

#### Scenario: Speaker omitted from request
- **WHEN** the user creates or updates an event without including the `speaker` field
- **THEN** the system SHALL accept the request and store `null` in the database

#### Scenario: Speaker provided as empty string
- **WHEN** the user sends `speaker: ""` in create or update
- **THEN** the system SHALL accept the request (empty string passes `.max(20)`) and store `null` in the database

### Requirement: Service-Layer Time Conversion
The system SHALL provide two helper functions in the service layer to convert between HH:mm strings and Date objects (`timeStrToDate`) and from Date objects back to HH:mm strings (`formatTime`).

#### Scenario: timeStrToDate converts valid string to Date
- **WHEN** `timeStrToDate("09:00")` is called
- **THEN** it SHALL return a Date object representing time 09:00 on a fixed epoch date (1970-01-01)

#### Scenario: formatTime converts Date to HH:mm string
- **WHEN** `formatTime(new Date("1970-01-01T09:00:00.000Z"))` is called
- **THEN** it SHALL return the string `"09:00"`

#### Scenario: Service applies conversion on create
- **WHEN** `service.createEvent()` is called with `startTime: "09:00"` and `endTime: "17:00"` as strings
- **THEN** the service SHALL convert both to Date objects via `timeStrToDate` before passing to the DAO

#### Scenario: Service applies conversion on update
- **WHEN** `service.updateEventById()` is called with `startTime` and/or `endTime` as strings
- **THEN** the service SHALL convert the provided time fields to Date objects via `timeStrToDate` before passing to the DAO

#### Scenario: Service formats times in response
- **WHEN** `service.getAllEvents()` retrieves events from the DAO
- **THEN** the service SHALL format `startTime` and `endTime` from Date objects back to HH:mm strings via `formatTime` in the response

### Requirement: Zod Schema Mirror
The system SHALL create a Zod-equivalent schema in `schemas/events.zod.js` with the same validation rules (HH:mm regex, startTime < endTime cross-field, speaker optional) for future reference.

#### Scenario: Zod schema defines HH:mm pattern
- **WHEN** the Zod schema validates `startTime` or `endTime`
- **THEN** it SHALL enforce the same `/^([01]\d|2[0-3]):[0-5]\d$/` regex pattern

#### Scenario: Zod schema defines cross-field validation
- **WHEN** the Zod schema validates both `startTime` and `endTime`
- **THEN** it SHALL enforce `startTime < endTime` with a `.refine()` or `.superRefine()` custom validator

#### Scenario: Zod schema speaker is optional
- **WHEN** the Zod schema validates the `speaker` field
- **THEN** it SHALL be defined as `.optional()` (not `.allow('')`)
