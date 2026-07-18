## 1. Backend: Color Mapping Utility

- [ ] 1.1 Create `apps/server/src/utils/colorMapper.js` with `computeColorFromCode(code)` — a pure function mapping C01→gray, C02→amber, C03→emerald. Include JSDoc.
- [ ] 1.2 Export the function and verify it is importable as a named export.

## 2. Backend: DAO — Missing Lookup Methods + getAllNotesCount keys

- [ ] 2.1 Add `getNoteById(id)` to the DAO if not already present.
- [ ] 2.2 Add `getColumnById(id)` to the DAO if not already present.
- [ ] 2.3 Verify both methods return the correct entities or `null` when not found.
- [ ] 2.4 Rename `getAllNotesCount` return keys from `{ low, medium, high }` to `{ backlog, active, completed }`.

## 3. Backend: Service — Color Computation on Create/Update

- [ ] 3.1 Update `service.js` `createNote`: import `computeColorFromCode`, look up `columnId` via DAO, compute color, include it in the create payload. Remove `color` from expected client input.
- [ ] 3.2 Update `service.js` `updateNoteById`: when `columnId` is present in the update body, look up the column, compute the new color, and update it.
- [ ] 3.3 Update `service.js` `updateNoteColumId`: compute color from the target column's code using `colorMapper` and persist the color alongside the column change.
- [ ] 3.4 Add JSDoc to `deleteById`, `getAllNotesCount`, and `getMentionsByNoteId` in `service.js`.

## 4. Backend: Joi Schemas

- [ ] 4.1 Update `NoteCreate` schema: remove `color`, add `columnId` as required. Add JSDoc.
- [ ] 4.2 Update `NoteUpdate` schema: add `columnId` as required field. Add JSDoc.
- [ ] 4.3 Update `NoteColumnUpdate` schema: remove `color`. Add JSDoc.
- [ ] 4.4 Add JSDoc to each schema definition describing its purpose and fields.

## 5. Backend: Seed Data

- [ ] 5.1 Update `seed.js`: rename note column titles from Low→Backlog, Medium→Active, High→Completed.
- [ ] 5.2 Run the seed script and verify columns display the new titles in the database.

## 6. Backend: Routes & Controller — JSDoc

- [ ] 6.1 Add JSDoc blocks to all route definitions in `routes.js` describing method, path, params, and response.
- [ ] 6.2 Update JSDoc in `controller.js`: remove `color` param from `createNote` and `updateNoteById` docs.

## 7. Client: StatusColumn Enum

- [ ] 7.1 Rename `StatusColumn` enum values: `LOW→BACKLOG`, `MEDIUM→ACTIVE`, `HIGH→COMPLETED`.
- [ ] 7.2 Update any existing references to the old enum values throughout the client codebase.

## 8. Client: NotesColumn.jsx CSS Classes

- [ ] 8.1 Update CSS class mappings in `NotesColumn.jsx`: green→gray (Backlog), yellow→amber (Active), red→emerald (Completed).

## 8.5 Client: NotesColor Enum + Style Map + NotesCard.jsx

- [ ] 8.5.1 Rename `NotesColor` enum values: `GREEN→GRAY`, `YELLOW→AMBER`, `RED→EMERALD`.
- [ ] 8.5.2 Create `apps/client/src/modules/notes/utils/noteStyles.js` with `NOTE_CARD_STYLES` and `COLUMN_STYLES` style map objects (maps color string → Tailwind class pairs). No conditional logic in components.
- [ ] 8.5.3 Refactor `NotesCard.jsx`: replace hardcoded `note.color === NotesColor.X && 'bg-...'` with lookup from `NOTE_CARD_STYLES[note.color]`.

## 9. Client: useGetNoteColumns Custom Hook

- [ ] 9.1 Create `apps/client/src/modules/notes/hooks/useGetNoteColumns.js` wrapping `useGetAllNotesColumnsQuery` and returning `{ dataColumns, isLoading, isError }`.
- [ ] 9.2 Update `apps/client/src/modules/notes/hooks/index.js` to export `useGetNoteColumns`.

## 10. Client: Remove dataStatus Prop — NotesFilters

- [ ] 10.1 Refactor `NotesFilters.jsx`: import and use `useGetNoteColumns()`, remove `dataStatus` prop dependency.

## 11. Client: Remove dataStatus Prop — NotesCreateDialog

- [ ] 11.1 Refactor `NotesCreateDialog.jsx`: import and use `useGetNoteColumns()`, remove `dataStatus` prop from component and callers.

## 12. Client: Add Status Select — NotesEditDialog

- [ ] 12.1 Refactor `NotesEditDialog.jsx`: import and use `useGetNoteColumns()`, remove `dataStatus` prop.
- [ ] 12.2 Add status `<Select>` populated with `dataColumns` to the edit form.
- [ ] 12.3 Update form reset logic: default status to `dataColumns.find(c => c.id === note.columnId)`.

## 13. Client: Form Schema — notesEditDialogSchema

- [ ] 13.1 Update `utils/schema.js`: add `status` field (shape: `{ id, code, title }`) to `notesEditDialogSchema`.

## 14. Client: Notes.jsx — Parent Cleanup

- [ ] 14.1 Update `Notes.jsx`: remove `dataStatus` from child component props (NotesFilters, NotesCreateDialog, NotesEditDialog).
- [ ] 14.2 Update `handleEditNote` to send `columnId` in the update payload.
- [ ] 14.3 Remove the `setColor()` function from `Notes.jsx` — color is now computed server-side.
- [ ] 14.4 Update `handleDrop` in `Notes.jsx`: remove `color` from the drag-and-drop payload — backend computes it from `columnId` via `updateNoteColumId`.
- [ ] 14.5 Update locale files if any status/column-related labels changed.

## 15. Verification

- [ ] 15.1 Test: create a note — verify color is computed server-side and rendered correctly on the board.
- [ ] 15.2 Test: edit a note's status — verify the color updates and the correct columnId is sent.
- [ ] 15.3 Test: board displays Backlog (gray), Active (amber), Completed (emerald) columns.
- [ ] 15.4 Test: NotesEditDialog status Select loads and resets with the note's current column.
- [ ] 15.5 Run full test suite: `npm run test` (client + server).
- [ ] 15.6 Run lint: `npm run lint` to verify no regressions.
