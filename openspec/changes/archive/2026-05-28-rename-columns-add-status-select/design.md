## Context

The notes module uses three status columns (Low, Medium, High) to organize notes in a Kanban-like board. These names are non-descriptive — they sound like priority levels rather than workflow stages. The color mapping (Low→slate, Medium→orange, High→sky) is computed client-side in `Notes.jsx`'s `setColor()` function, creating duplication if other modules need similar logic. Additionally, the NotesEditDialog lacks a status column selector that NotesCreateDialog already has, and `dataStatus` is explicitly prop-drilled through multiple components.

Stakeholders: Frontend (React) and Backend (Express/Prisma) teams. No external dependencies change.

## Goals / Non-Goals

**Goals:**
- Rename note columns: Low → Backlog, Medium → Active, High → Completed in seed.js, enums, and UI
- Map Backlog → gray, Active → amber, Completed → emerald colors
- Move color computation from client (`setColor()`) to backend (`service.js` via `colorMapper.js`)
- Create `useGetNoteColumns()` custom hook wrapping `useGetAllNotesColumnsQuery()`
- Remove `dataStatus` prop from NotesFilters, NotesCreateDialog, Notes.jsx
- Add status `<Select>` to NotesEditDialog with edit form schema support
- Add JSDoc to routes, service, and Joi schemas on the server

**Non-Goals:**
- Refactoring PUT endpoints to PATCH (deferred to `refactor-put-to-patch`)
- Extending custom hook pattern to all 27 modules (deferred to `refactor-hook-pattern-all-modules`)
- Changing the note creation/update data flow beyond what column renaming and color computation require
- Altering the database schema (column IDs remain C01/C02/C03; only titles and color semantics change)
- Adding new API endpoints

## Decisions

1. **ColorMapper as a pure utility module** — A standalone `colorMapper.js` with a single `computeColorFromCode(code)` function. Stateless, no dependencies, easily testable. Alternative considered: inline mapping in service (rejected — hurts testability and reusability).

2. **Column ID as color key** — Use column code (C01/C02/C03) rather than column title for color resolution. More stable (titles may change, codes won't). Alternative considered: storing color in the column DB record (rejected — adds unnecessary DB column when a simple switch on code suffices).

3. **Custom hook extracted from existing query** — `useGetNoteColumns()` is a thin wrapper around `useGetAllNotesColumnsQuery()` that handles loading/error states and returns `{ dataColumns, isLoading, isError }`. Alternative considered: keeping `dataStatus` prop drilling (rejected — creates coupling, violates DRY).

4. **Edit dialog form schema includes status** — `notesEditDialogSchema` gains a `status` field with shape `{ id, code, title }`, matching the selected column. The form resets using `dataColumns.find(c => c.id === note.columnId)`. Alternative considered: sending raw columnId (rejected — form consistency with create dialog, user expects a labelled selector).

5. **JSDoc added inline rather than separate docs** — Documentation lives alongside code as JSDoc blocks. Alternative considered: separate .md docs files (rejected — drifts from code too easily).

6. **Style map for card/column visuals** — Create `utils/noteStyles.js` with pure data objects (`NOTE_CARD_STYLES`, `COLUMN_STYLES`) mapping color strings to Tailwind class pairs. Components look up styles by key instead of hardcoding conditional CSS. No backend call needed (3 static colors). Alternative considered: hardcoded if/switch in components (rejected — violates DRY, harder to maintain).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Existing notes reference old column codes (C01=C01 same) | Column codes stay the same; only titles and colors change. No data migration needed. |
| Frontend sends `color` in create payload during transition | Backend ignores `color` from frontend and computes from `columnId`. Graceful degradation. |
| NotesEditDialog form reset might not match if columns list loads late | Use loading state from hook; show spinner until dataColumns resolves. |
| JSDoc maintenance burden | Add lint rule to flag undocumented exports if desired; for now, JSDoc is best effort. |

## Migration Plan

1. Backend first: create `colorMapper.js`, update service methods, update Joi schemas
2. Seed.js: update note column titles
3. Client enums: update StatusColumn values
4. Client: create `useGetNoteColumns()` hook, update Notes.jsx, NotesFilters, NotesCreateDialog
5. NotesEditDialog: add status Select
6. Add JSDoc to routes, service, Joi schemas
7. Test all flows: create note, edit note status, color rendering on board

No database migration required — column codes (C01/C02/C03) are unchanged.

## Open Questions

- None. All decisions were clarified during the Phase 0 (grill-me) session.
