## ADDED Requirements

### Requirement: Note columns are renamed to workflow stages
The system SHALL use Backlog, Active, and Completed as note column titles mapped to codes C01, C02, C03.

#### Scenario: Columns display new titles in the board
- **WHEN** a user views the notes board
- **THEN** column headers display "Backlog" (C01), "Active" (C02), and "Completed" (C03)

#### Scenario: Seed data creates renamed columns
- **WHEN** the database is seeded
- **THEN** `noteColumns` are created with titles "Backlog" (C01), "Active" (C02), "Completed" (C03)

### Requirement: Each column has a distinct color
The system SHALL map Backlog → gray, Active → amber, Completed → emerald for visual distinction.

#### Scenario: Backlog column uses gray color
- **WHEN** a note has column code C01
- **THEN** the note card SHALL display with gray styling

#### Scenario: Active column uses amber color
- **WHEN** a note has column code C02
- **THEN** the note card SHALL display with amber styling

#### Scenario: Completed column uses emerald color
- **WHEN** a note has column code C03
- **THEN** the note card SHALL display with emerald styling

### Requirement: Color is computed by the backend service layer
The system SHALL compute note card color on the server using `computeColorFromCode(code)` in `colorMapper.js`, not on the client.

#### Scenario: Creating a note computes color from columnId
- **WHEN** a note is created via `POST /notes` with a valid `columnId`
- **THEN** the backend SHALL look up the column by `columnId`, compute the color from its code, and persist the color

#### Scenario: Updating a note's column recomputes color
- **WHEN** a note's columnId is updated via `PUT /notes/:id/column` or `PUT /notes/:id`
- **THEN** the backend SHALL compute the new color from the target column's code and update the stored color

#### Scenario: Frontend no longer sends color in create payload
- **WHEN** the client creates a note
- **THEN** the request body SHALL include `columnId` (required) and SHALL NOT include `color`

### Requirement: Joi schemas reflect new column/color requirements
The system SHALL validate note data with updated Joi schemas.

#### Scenario: NoteCreate schema requires columnId and omits color
- **WHEN** validating a note creation request
- **THEN** `columnId` SHALL be required and `color` SHALL NOT be present in the schema

#### Scenario: NoteUpdate schema requires columnId
- **WHEN** validating a note update request
- **THEN** `columnId` SHALL be required in the schema

#### Scenario: NoteColumnUpdate schema omits color
- **WHEN** validating a column change request
- **THEN** `color` SHALL NOT be present in the schema

### Requirement: Custom hook provides note columns data
The system SHALL provide a `useGetNoteColumns()` custom hook wrapping `useGetAllNotesColumnsQuery()`.

#### Scenario: Hook returns columns, loading, and error states
- **WHEN** a component calls `useGetNoteColumns()`
- **THEN** it SHALL receive `{ dataColumns, isLoading, isError }`

#### Scenario: Hook is exported from hooks/index.js
- **WHEN** a module imports from `hooks/index.js`
- **THEN** `useGetNoteColumns` SHALL be available as a named export

### Requirement: NotesEditDialog includes status column selector
The system SHALL display a status `<Select>` in NotesEditDialog matching the pattern from NotesCreateDialog.

#### Scenario: Edit dialog shows status Select populated with columns
- **WHEN** a user opens NotesEditDialog for an existing note
- **THEN** a status Select SHALL display available columns loaded from `useGetNoteColumns()`

#### Scenario: Edit form resets with note's current status
- **WHEN** the edit dialog form initializes
- **THEN** the status field SHALL default to the note's current column matched from `dataColumns.find(c => c.id === note.columnId)`

#### Scenario: Updating note status sends columnId
- **WHEN** a user changes the status and submits the edit form
- **THEN** the update payload SHALL include `columnId: note.columnId`

### Requirement: Server code has JSDoc documentation
The system SHALL add JSDoc blocks to routes, service methods, and Joi schemas where missing.

#### Scenario: Routes have JSDoc
- **WHEN** examining `routes.js`
- **THEN** each route definition SHALL have a JSDoc block describing its method, path, params, and response

#### Scenario: Service methods have JSDoc
- **WHEN** examining `service.js`
- **THEN** `deleteById`, `getAllNotesCount`, and `getMentionsByNoteId` SHALL have JSDoc blocks

#### Scenario: Joi schemas have JSDoc
- **WHEN** examining `notes.joi.js`
- **THEN** each schema definition SHALL have a JSDoc block describing its purpose and fields
