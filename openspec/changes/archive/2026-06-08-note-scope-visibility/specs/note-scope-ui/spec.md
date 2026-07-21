## ADDED Requirements

### Requirement: NotesFilters has 2-state scope toggle
The NotesFilters component SHALL render a segmented-button group with two scope options: "Mine" (scope=mine) and "All accessible" (scope=mixed). The toggle SHALL follow the same pattern as the existing isFavorite filter.

#### Scenario: Scope toggle displays two options
- **WHEN** the NotesFilters component renders
- **THEN** it SHALL display a button group with "Mine" and "All accessible" labels

#### Scenario: Default selection is "Mine"
- **WHEN** no scope has been previously set
- **THEN** the "Mine" button SHALL be selected/active

#### Scenario: Clicking a scope option updates the filter
- **WHEN** a user clicks "All accessible"
- **THEN** the GET /notes query SHALL include `scope=mixed` and the notes list SHALL refetch

#### Scenario: Scope resets when filters are cleared
- **WHEN** a user clicks "Clear filters"
- **THEN** the scope SHALL reset to `mine` (default)

### Requirement: Scope is set from navigation state
The system SHALL read initial scope from `location.state?.scope` when navigating to the notes page, allowing external navigation (e.g., from mention notifications) to set the scope.

#### Scenario: Navigation with scope in location state sets initial scope
- **WHEN** a user navigates to the notes page with `location.state = { scope: 'mixed', fromBadge: true }`
- **THEN** the NotesFilters scope SHALL initialize to "All accessible"

#### Scenario: No scope in location state uses default
- **WHEN** a user navigates to the notes page without `location.state`
- **THEN** the NotesFilters scope SHALL initialize to "Mine" (default)

### Requirement: NotesCard is read-only for non-owners
When `isOwner` is `false`, the NotesCard SHALL render in read-only mode: no drag handle, no edit button, no delete button, no favorite toggle. The card body SHALL still be visible and clickable for viewing.

#### Scenario: Non-owner card hides edit button
- **WHEN** a note has `isOwner: false`
- **THEN** the edit button SHALL NOT be rendered on the card

#### Scenario: Non-owner card hides delete button
- **WHEN** a note has `isOwner: false`
- **THEN** the delete button SHALL NOT be rendered on the card

#### Scenario: Non-owner card is not draggable
- **WHEN** a note has `isOwner: false`
- **THEN** the card `draggable` attribute SHALL be `false`
- **AND** the `onDragStart` handler SHALL NOT fire for non-owner cards

#### Scenario: Non-owner card hides favorite toggle
- **WHEN** a note has `isOwner: false`
- **THEN** the favorite/star toggle SHALL NOT be rendered on the card

#### Scenario: Non-owner mention card has left blue border accent
- **WHEN** a note has `isOwner: false` AND `isMentioned: true`
- **THEN** the card SHALL have a left blue border accent (`border-l-4 border-l-blue-400`)

### Requirement: Non-owner cards show "Mark as read" button
When a note has `isOwner: false` and `isMentioned: true`, the card SHALL display a "Mark as read" action that marks the user's mentions in that note as read.

#### Scenario: "Mark as read" appears on mentioned cards
- **WHEN** a note has `isMentioned: true`
- **THEN** a "Mark as read" button SHALL be visible on the card

#### Scenario: "Mark as read" emits mention:read event
- **WHEN** a user clicks "Mark as read"
- **THEN** the system SHALL emit a `mention:read` WebSocket event for the current user's mentions on that note

### Requirement: NotesSummary displays scoped counts
The NotesSummary component in the sidebar SHALL reflect the currently active scope filter when displaying column counts (Backlog, Active, Completed).

#### Scenario: Summary shows scoped counts when scope is active
- **WHEN** a user has `scope=mine` selected
- **THEN** NotesSummary SHALL display counts matching only the user's own notes

#### Scenario: Summary shows all counts when no scope filter
- **WHEN** no scope filter is active (default mine)
- **THEN** NotesSummary SHALL display counts for the default scope
