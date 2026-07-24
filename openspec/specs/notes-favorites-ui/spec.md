## ADDED Requirements

### Requirement: FavoriteToggle component
The system SHALL provide a reusable `FavoriteToggle` component with a star icon that toggles favorite state. The component SHALL support PropTypes, i18n labels, loading state, and error handling.

#### Scenario: Render FavoriteToggle as unfavorited
- **WHEN** FavoriteToggle is rendered with `isFavorited: false`
- **THEN** the component SHALL display an outlined star icon
- **AND** show the tooltip label for "mark as favorite"

#### Scenario: Render FavoriteToggle as favorited
- **WHEN** FavoriteToggle is rendered with `isFavorited: true`
- **THEN** the component SHALL display a filled star icon
- **AND** show the tooltip label for "remove from favorites"

#### Scenario: Click FavoriteToggle
- **WHEN** user clicks the FavoriteToggle button
- **THEN** the component SHALL call the `onToggle` callback
- **AND** show a loading spinner while the request is in flight

#### Scenario: FavoriteToggle error state
- **WHEN** the toggle request fails
- **THEN** the component SHALL revert to the previous state
- **AND** show an error toast notification

### Requirement: NotesFilters favorite toggle
The `NotesFilters` component SHALL include an `isFavorite` toggle that filters the notes list to show only favorited notes.

#### Scenario: Toggle favorite filter on
- **WHEN** user activates the "Show favorites only" toggle in NotesFilters
- **THEN** the system SHALL call GET /notes?isFavorite=true
- **AND** display only favorited notes

#### Scenario: Toggle favorite filter off
- **WHEN** user deactivates the "Show favorites only" toggle
- **THEN** the system SHALL call GET /notes without the isFavorite parameter
- **AND** display all notes

#### Scenario: Favorite filter with active search
- **WHEN** user has an active search query and enables the favorite filter
- **THEN** the system SHALL call GET /notes?isFavorite=true&search=<query>

#### Scenario: Favorite filter returns no results
- **WHEN** the isFavorite filter is active and no notes match the filter criteria
- **THEN** the system SHALL display the existing empty state with the 'no_notes' message
- **AND** the behavior SHALL be identical to the existing empty state when no notes exist

### Requirement: NotesCard favorite integration
The `NotesCard` component SHALL display a star icon in its header area to allow quick favorite toggling.

#### Scenario: NotesCard shows favorite state
- **WHEN** NotesCard renders a note
- **THEN** the card SHALL display a FavoriteToggle icon in the header alongside edit/delete actions
- **AND** the icon SHALL reflect the note's current favorite state

#### Scenario: Toggle favorite from NotesCard
- **WHEN** user clicks the FavoriteToggle icon on a NotesCard
- **THEN** the system SHALL call PATCH /notes/:id/fav
- **AND** the icon SHALL update optimistically

### Requirement: NotesCreateDialog favorite field
The `NotesCreateDialog` SHALL include an optional `isFavorite` checkbox/switch to mark the new note as a favorite upon creation.

#### Scenario: Create note with favorite checked
- **WHEN** user checks "Mark as favorite" in NotesCreateDialog and submits
- **THEN** the system SHALL call POST /notes with `isFavorite: true`

#### Scenario: Create note with favorite unchecked
- **WHEN** user submits NotesCreateDialog without checking "Mark as favorite"
- **THEN** the system SHALL call POST /notes without the `isFavorite` field

### Requirement: NotesEditDialog favorite field
The `NotesEditDialog` SHALL display the current favorite state and allow the user to change it.

#### Scenario: Edit note and change favorite status
- **WHEN** user opens NotesEditDialog for a favorited note
- **THEN** the "Mark as favorite" switch SHALL reflect the current state (checked)
- **AND** changing the switch SHALL include `isFavorite` in the PATCH /notes/:id body

### Requirement: i18n translation keys
The system SHALL provide i18n translation keys for all favorite-related user-facing labels.

#### Scenario: i18n keys exist
- **WHEN** the application loads
- **THEN** the following i18n keys SHALL be available:
  - `favorite` — singular noun
  - `favorites` — plural noun
  - `mark_as_favorite` — tooltip/label for favoriting
  - `remove_from_favorites` — tooltip/label for unfavoriting
  - `show_favorites_only` — filter toggle label

### Requirement: RTK Query integration
The frontend SHALL integrate favorite operations via RTK Query.

#### Scenario: getAllNotes query with isFavorite param
- **WHEN** getAllNotes query is called with `isFavorite: true` parameter
- **THEN** the query SHALL append `?isFavorite=true` to the GET /notes request

#### Scenario: toggleFavorite mutation
- **WHEN** toggleFavorite mutation is called with a noteId
- **THEN** the system SHALL send PATCH /notes/:id/fav
- **AND** invalidate the notes cache on success
