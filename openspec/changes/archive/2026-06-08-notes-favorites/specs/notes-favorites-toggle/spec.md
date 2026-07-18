## ADDED Requirements

### Requirement: Toggle favorite status
The system SHALL provide a lightweight `PATCH /notes/:id/fav` endpoint that toggles the favorite status of a note for the authenticated user.

#### Scenario: Toggle favorite on non-favorited note
- **WHEN** user sends PATCH /notes/:id/fav and the note is NOT currently favorited by the user
- **THEN** the system SHALL insert a record into `user_notes_favorites`
- **AND** return 200 with `{ "favorited": true }`

#### Scenario: Toggle favorite on already favorited note
- **WHEN** user sends PATCH /notes/:id/fav and the note IS currently favorited by the user
- **THEN** the system SHALL delete the record from `user_notes_favorites`
- **AND** return 200 with `{ "favorited": false }`

#### Scenario: Toggle favorite on non-existent note
- **WHEN** user sends PATCH /notes/:id/fav with a note ID that does not exist
- **THEN** the system SHALL return a 404 error

#### Scenario: Any user can toggle favorite on any note
- **WHEN** any authenticated user sends PATCH /notes/:id/fav for any note (regardless of ownership)
- **THEN** the system SHALL toggle the current user's favorite status for that note
- **AND** the note's owner is not checked — scoping notes per user is deferred to a future change

#### Scenario: Toggle endpoint ignores request body
- **WHEN** user sends PATCH /notes/:id/fav with a request body payload
- **THEN** the system SHALL ignore the body
- **AND** proceed with the toggle operation based solely on the note ID and authenticated user

#### Scenario: Unauthenticated toggle favorite
- **WHEN** an unauthenticated request sends PATCH /notes/:id/fav
- **THEN** the system SHALL return a 401 error

### Requirement: Update note with favorite status change
The system SHALL accept an optional `isFavorite` boolean field on `PATCH /notes/:id` to set favorite status during note update.

#### Scenario: Update note and set isFavorite=true
- **WHEN** user sends PATCH /notes/:id with `isFavorite: true`
- **THEN** the note is updated
- **AND** if not already favorited, a record is inserted into `user_notes_favorites`

#### Scenario: Update note and set isFavorite=false
- **WHEN** user sends PATCH /notes/:id with `isFavorite: false`
- **THEN** the note is updated
- **AND** if currently favorited, the record is deleted from `user_notes_favorites`

#### Scenario: Update note without isFavorite field
- **WHEN** user sends PATCH /notes/:id without the `isFavorite` field
- **THEN** the note is updated
- **AND** the favorite status is unchanged
