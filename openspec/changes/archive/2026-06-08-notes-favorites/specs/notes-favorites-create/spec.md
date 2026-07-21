## ADDED Requirements

### Requirement: Create note with favorite status
When creating a new note, the system SHALL accept an optional `isFavorite` boolean field. If `isFavorite` is true, the system SHALL insert a record into `user_notes_favorites` for the created note and the authenticated user.

#### Scenario: Create note with isFavorite=true
- **WHEN** user sends POST /notes with `isFavorite: true` and valid note body
- **THEN** a note is created
- **AND** a record is inserted into `user_notes_favorites` with the new noteId and current userId

#### Scenario: Create note with isFavorite=false
- **WHEN** user sends POST /notes with `isFavorite: false` and valid note body
- **THEN** a note is created
- **AND** no record is inserted into `user_notes_favorites`

#### Scenario: Create note without isFavorite field
- **WHEN** user sends POST /notes without the `isFavorite` field
- **THEN** a note is created
- **AND** no record is inserted into `user_notes_favorites`

#### Scenario: Create note with isFavorite=true and missing required fields
- **WHEN** user sends POST /notes with `isFavorite: true` but missing required note fields
- **THEN** the system SHALL return a 400 validation error
- **AND** no note is created
- **AND** no record is inserted into `user_notes_favorites`

### Requirement: Validate isFavorite field type
The system SHALL validate that `isFavorite` is a boolean when provided in POST /notes body.

#### Scenario: Invalid isFavorite type
- **WHEN** user sends POST /notes with `isFavorite: "yes"`
- **THEN** the system SHALL return a 400 validation error
