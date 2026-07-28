## ADDED Requirements

### Requirement: Filter notes by favorite status
The system SHALL accept an optional `isFavorite` query parameter on `GET /notes`. When `isFavorite=true`, the system SHALL return only notes that are favorited by the authenticated user.

#### Scenario: Get notes with isFavorite=true
- **WHEN** user sends GET /notes?isFavorite=true
- **THEN** the system SHALL return only notes that have a record in `user_notes_favorites` for the current userId

#### Scenario: Get notes without isFavorite parameter
- **WHEN** user sends GET /notes without the `isFavorite` query parameter
- **THEN** the system SHALL return all notes (existing behavior unchanged)

#### Scenario: Get notes with isFavorite=false
- **WHEN** user sends GET /notes?isFavorite=false
- **THEN** the system SHALL return all notes (filter is ignored when false)

#### Scenario: Get notes with isFavorite=true when user has no favorites
- **WHEN** user sends GET /notes?isFavorite=true and the user has not favorited any notes
- **THEN** the system SHALL return an empty array

#### Scenario: Get notes with isFavorite=true and other query params
- **WHEN** user sends GET /notes?isFavorite=true&search=keyword&sortBy=createdOn&order=desc
- **THEN** the system SHALL return only favorited notes matching the search and sort criteria

### Requirement: Include isFavorited status per note in GET /notes response
The system SHALL include an `isFavorited` boolean field on each note in the GET /notes response, computed via batch lookup for the authenticated user.

#### Scenario: GET /notes includes isFavorited per note
- **WHEN** GET /notes is called with any params
- **THEN** each note in the response SHALL include an `isFavorited` boolean field indicating whether the current user has favorited that note

### Requirement: Validate isFavorite query parameter type
The system SHALL validate that `isFavorite` query parameter is a boolean when provided.

#### Scenario: Invalid isFavorite query parameter
- **WHEN** user sends GET /notes?isFavorite=invalid
- **THEN** the system SHALL return a 400 validation error
