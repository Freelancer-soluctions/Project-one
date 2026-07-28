## ADDED Requirements

### Requirement: GET /notes accepts scope query parameter
The system SHALL accept an optional `scope` query parameter on `GET /notes` with values `mine` or `mixed`. When omitted, `mine` SHALL be the default.

#### Scenario: Default scope is mine
- **WHEN** a user calls `GET /notes` without a `scope` query parameter
- **THEN** the response SHALL contain only notes where `createdBy === userId`

#### Scenario: Scope=mine returns only user-created notes
- **WHEN** a user calls `GET /notes?scope=mine`
- **THEN** the response SHALL contain only notes where the authenticated user is the creator (`createdBy === userId`)

#### Scenario: Scope=mixed returns owned and mentioned notes
- **WHEN** a user calls `GET /notes?scope=mixed`
- **THEN** the response SHALL contain notes where the user is the creator OR notes where the user is mentioned (has a mention record in the `mentions` table)

#### Scenario: Invalid scope value returns 400
- **WHEN** a user calls `GET /notes?scope=invalid`
- **THEN** the response SHALL return a 400 validation error

### Requirement: GET /notes returns isOwner and isMentioned per note
The system SHALL include `isOwner` (boolean), `isMentioned` (boolean), and `mentionIds` (number[]) fields on each note object in the `GET /notes` response.

#### Scenario: isOwner is true when user created the note
- **WHEN** a note was created by the authenticated user
- **THEN** the note object SHALL have `isOwner: true`

#### Scenario: isOwner is false when another user created the note
- **WHEN** a note was created by a different user
- **THEN** the note object SHALL have `isOwner: false`

#### Scenario: isMentioned is true when user has a mention in the note
- **WHEN** the authenticated user has a mention record referencing the note
- **THEN** the note object SHALL have `isMentioned: true`

#### Scenario: isMentioned is false when user has no mention in the note
- **WHEN** the authenticated user has no mention record referencing the note
- **THEN** the note object SHALL have `isMentioned: false`

#### Scenario: mentionIds contains the IDs of the user's mentions in the note
- **WHEN** the authenticated user has mention records in the note
- **THEN** the note object SHALL include `mentionIds` as an array of mention record IDs
- **AND** `mentionIds` SHALL be an empty array when `isMentioned` is false

### Requirement: Self-mentions are filtered at creation
The system SHALL NOT create mention records where `mentionedUserId === mentionedByUserId`.

#### Scenario: Self-mention in content is ignored
- **WHEN** a user creates or updates a note with content containing a self-mention (e.g., @self)
- **THEN** the system SHALL NOT create a mention record for that user

#### Scenario: Other-user mentions still create records
- **WHEN** a user creates or updates a note with content mentioning another user
- **THEN** the system SHALL create mention records for those other users normally

### Requirement: getAllNotesCount respects scope parameter
The system SHALL accept an optional `scope` query parameter on `GET /notes/count` with the same enum values and filtering logic as `GET /notes`.

#### Scenario: Count without scope returns all notes count
- **WHEN** a user calls `GET /notes/count` without a scope parameter
- **THEN** the response SHALL return counts for all notes (backlog, active, completed)

#### Scenario: Count with scope=mine returns user's own notes count
- **WHEN** a user calls `GET /notes/count?scope=mine`
- **THEN** each column count SHALL reflect only notes created by the authenticated user

#### Scenario: Count with scope=mixed returns owned+mentioned notes count
- **WHEN** a user calls `GET /notes/count?scope=mixed`
- **THEN** each column count SHALL reflect notes created by the user OR notes where the user is mentioned

### Requirement: NotesFilters Joi schema includes scope
The system SHALL validate the `scope` query parameter in the `NotesFilters` Joi schema as an enum with values `mine`, `mixed`.

#### Scenario: Valid scope passes validation
- **WHEN** a request includes `scope=mine` or `scope=mixed`
- **THEN** the `NotesFilters` schema SHALL validate successfully

#### Scenario: Invalid scope fails validation
- **WHEN** a request includes `scope` with a value other than `mine` or `mixed`
- **THEN** the `NotesFilters` schema SHALL return a validation error
