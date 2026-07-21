## Why

The notes module currently uses vague Low/Medium/High status columns that don't communicate meaningful workflow states. Users need clear, actionable column names (Backlog, Active, Completed) with corresponding color cues. Additionally, color computation is duplicated on the frontend — moving it to the backend centralizes the logic, and adding a custom hook for note columns reduces prop-drilling. The NotesEditDialog also lacks a status Select, making it inconsistent with NotesCreateDialog.

## What Changes

1. **Rename note columns**: Low → Backlog (C01, gray), Medium → Active (C02, amber), High → Completed (C03, emerald) in seed.js, client enums, CSS classes, and frontend helpers.
2. **Move color computation to backend**: Create `colorMapper.js` in the server's notes utils, compute colors in `createNote`, `updateNoteById`, and `updateNoteColumId` services. Update Joi schemas (remove `color` from create/column-update, add `columnId` as required). Remove `setColor()` from Notes.jsx.
3. **Create custom hook `useGetNoteColumns()`**: Wraps `useGetAllNotesColumnsQuery()` for reuse across NotesFilters, NotesCreateDialog, NotesEditDialog, and Notes.jsx. Removes `dataStatus` prop drilling.
4. **Add status Select to NotesEditDialog**: Replicate the column selector pattern from NotesCreateDialog, add `status` field to edit form schema, wire `columnId` into the update payload.
5. **Add JSDoc documentation**: Document routes, missing service methods, Joi schemas.
6. **Note future refactoring opportunities**: `refactor-put-to-patch` and `refactor-hook-pattern-all-modules` in proposal context (do NOT implement now).

## Capabilities

### New Capabilities
- `note-columns`: Note column management — renaming status columns from Low/Medium/High to Backlog/Active/Completed with corresponding color mapping, backend color computation, and reusable frontend hook for column data.

### Modified Capabilities
- *(No existing specs require requirement changes — this is entirely within the notes module, which hasn't been spec'd yet.)*

## Impact

- **apps/client/src/utils/enums.js**: StatusColumn enum values change (Low→C01→BACKLOG, etc.)
- **apps/client/src/modules/notes/components/NotesColumn.jsx**: CSS classes change to gray/amber/emerald
- **apps/client/src/modules/notes/pages/Notes.jsx**: Remove `setColor()`, remove `dataStatus` prop passing, remove `color` from handleDrop payload
- **apps/client/src/modules/notes/components/NotesFilters.jsx**: Import `useGetNoteColumns()`, remove `dataStatus` prop
- **apps/client/src/modules/notes/components/NotesCreateDialog.jsx**: Import `useGetNoteColumns()`, remove `dataStatus` prop
- **apps/client/src/modules/notes/components/NotesEditDialog.jsx**: Add `useGetNoteColumns()`, add status `<Select>`, add `status` field to form schema
- **apps/client/src/modules/notes/hooks/**: New `useGetNoteColumns.js` hook file; update `index.js` exports
- **apps/server/src/modules/notes/**: New `utils/colorMapper.js`; update `service.js`, `routes.js`, `notes.joi.js`
- **database/seed.js**: `noteColumns` titles change
- **BREAKING**: Frontend no longer sends `color` in note create payload; backend now computes it from `columnId`. API consumers must include `columnId`.
