## Context

Users need the ability to bookmark/favorite notes for quick access. Currently, notes are flat with no personal curation mechanism. This feature adds a favorites system spanning database, API, and UI layers.

**Current state:** Notes CRUD via Express/Prisma with JWT auth. No favorites concept exists. The notes table has no favorites column — favorites are a separate cross-reference table.

**Constraints:**
- All operations scoped to the authenticated user (JWT token → userId)
- Backend: Express + Prisma + PostgreSQL
- Frontend: React + Redux Toolkit (RTK Query) + shadcn/ui
- i18n support required for all user-facing labels

## Goals / Non-Goals

**Goals:**
- New Prisma model `user_notes_favorites` with unique constraint on `[noteId, userId]`
- Backend support for `isFavorite` on GET /notes (filter), POST /notes (create), PATCH /notes/:id (update)
- Lightweight `PATCH /notes/:id/fav` toggle endpoint
- Frontend FavoriteToggle component, NotesFilters toggle, NotesCard integration, dialog support
- i18n keys for all favorite-related labels

**Non-Goals:**
- No bulk favorite operations
- No favorite collections or folders
- No reordering or pinning of favorites
- No analytics on favorites usage
- No favorite notifications

## Decisions

**Decision 1: Separate join table vs. boolean column on notes**
- Chosen: Separate `user_notes_favorites` table with `@@unique([noteId, userId])`
- Rationale: Favorites are a user-specific cross-reference, not a note property. Multiple users can favorite the same note. A boolean column would couple user preference to the note entity and require array columns for multi-user support. A join table scales cleanly with cascade delete from notes.
- Alternative considered: `isFavorite` boolean on notes — rejected because it ties favorite status to a single user, breaking multi-tenant semantics.

**Decision 2: DAO-level EXISTS subquery for GET /notes?isFavorite=true**
- Chosen: When `isFavorite=true`, the DAO adds a `WHERE EXISTS (SELECT 1 FROM user_notes_favorites WHERE note_id = notes.id AND user_id = :currentUserId)` clause
- Rationale: Clean separation — no join that multiples rows. EXISTS performs well with the unique index. No additional data transformation needed.
- Alternative considered: JOIN with DISTINCT — rejected because EXISTS is more performant and semantically clearer.

**Decision 3: Lightweight PATCH /notes/:id/fav endpoint**
- Chosen: Separate endpoint that checks current state (EXISTS check), then toggles (INSERT or DELETE)
- Rationale: Frontend doesn't need to know current state or send the full note body. One round-trip, idempotent-adjacent (toggling twice returns to original). Avoids PUT semantics on PATCH.
- Alternative considered: PUT /notes/:id/favorites — rejected for violating REST semantics (favorites are not a sub-resource with its own identity).

**Decision 4: isFavorite on create/update is handled in existing endpoints**
- Chosen: POST /notes and PATCH /notes/:id accept optional `isFavorite` boolean body field. After note create/update, if present, insert or delete from user_notes_favorites accordingly.
- Rationale: Single request for combined create+set-favorite reduces API calls. The DAO handles both note and favorite operations in one transaction.
- Alternative considered: Require client to call PATCH /notes/:id/fav separately — rejected because it adds an extra request for the common "create and favorite" pattern.

**Decision 5: RTK Query integration approach**
- Chosen: Add `isFavorite` param to `getAllNotes` query + add `toggleFavorite` mutation
- Rationale: RTK Query cache invalidation handles refetching automatically. The tag system ensures all components see updated data.
- Alternative considered: Local state management — rejected because favorite state must survive navigation and be consistent across components.

**Decision 6: Per-note isFavorited status computed via batch lookup**
- Chosen: GET /notes responses include `isFavorited: boolean` per note, computed via a batch lookup (single EXISTS subquery in the main query, or a single query fetching all of the user's favorite noteIds for in-memory mapping)
- Rationale: Frontend needs to display favorite state per note in lists (NotesCard, dialogs). Computing it via batch lookup avoids N+1 queries and keeps the response self-contained.
- Alternative considered: Separate endpoint to fetch all favorited noteIds — rejected because it adds an extra API call and requires client-side reconciliation with the notes list.

## Risks / Trade-offs

- **[Performance] batch lookup on every GET /notes** → Mitigation: The batch lookup is a single EXISTS subquery or a single SELECT of favorite IDs per user. The unique composite index on (noteId, userId) keeps lookups O(1) per row, making the overall operation O(n) where n is the number of returned notes. For realistic note counts (<10K per user), impact is negligible.
- **[Data Integrity] Orphaned favorites on user/note deletion** → Mitigation: Cascade delete from notes table (note deletion cleans up favorites). User deletion is handled at application level (soft delete or cascade via application logic).
- **[Race Condition] Double-click on favorite toggle** → Mitigation: The toggle endpoint is idempotent-adjacent (CHECK then INSERT/DELETE). Rapid double-clicks may cause the second request to fail on unique constraint (P2002) or DELETE on non-existent row — both are safe no-ops with proper error handling, treated as success.
- **[UI Consistency] Favorite state out of sync after optimistic update** → Mitigation: RTK Query invalidation refetches after mutation settles. Optimistic updates must roll back on error.
- **[i18n] Missing translations for new keys** → Mitigation: All i18n keys have English defaults. Missing translations gracefully fall back to the default locale.
