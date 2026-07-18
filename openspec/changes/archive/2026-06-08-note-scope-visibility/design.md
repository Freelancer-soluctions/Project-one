## Context

Currently, `GET /notes` returns all notes grouped by column with optional `isFavorite` filtering (via EXISTS subquery on `user_notes_favorites`). Each note response includes `isFavorited: boolean` via a batch lookup. The mentions system (parsing, storage, WebSocket events) is fully implemented. However, there is no way to scope notes to only those relevant to the current user — everyone sees every note.

**Current state:** Express + Prisma + PostgreSQL backend; React + Redux Toolkit (RTK Query) + shadcn/ui frontend. JWT auth on all endpoints. `mentions` table exists with `mention:new`, `mention:backlog`, `mention:read` WS events. `isFavorite` filter pattern exists in DAO layer via `WHERE EXISTS` and `some:` Prisma filter.

**Constraints:**
- No new database tables — existing `mentions` + `notes` tables suffice
- Follow the `isFavorite` filter pattern for `scope` param
- All operations scoped to authenticated user (JWT → userId)
- WS infra already delivers mention events — only frontend hook needed

**Risk: mention:read not persisted to DB (CORRECTED)**
- The existing `handleMentionRead` WS handler (`mentionEvents.js:19-27`) broadcasts to other sockets but does NOT update `isRead` in the `mentions` table. Without DB persistence, the unread count resets on page reload and backlog always returns stale mentions.
- **Fix**: Add `prisma.mentions.updateMany({ where: { id: { in: mentionIds }, mentionedUserId }, data: { isRead: true } })` before the broadcast in `handleMentionRead`.

**Performance: scope=mixed OR query**
- The `OR` between `createdBy` direct field and `mentions.some` relation can be slow on large datasets. Mitigation: add composite index `mentions(note_id, mentioned_user_id)` if not present.

**Optimization: getAllNotesCount**
- Current implementation runs 3 separate `prisma.notes.count()` queries. With `scope` conditions, each becomes heavier. Future optimization: refactor to single query with `COUNT(*) FILTER (WHERE ...)`.

## Goals / Non-Goals

**Goals:**
- Add `scope` query param to `GET /notes` (`mine`, `mixed`) with `mine` as default
- Return `isOwner`, `isMentioned`, and `mentionIds` per note in GET /notes response
- Filter self-mentions in `service.js` (skip where `mentionedUserId === mentionedByUserId`)
- Update `getAllNotesCount` to respect `scope` param
- Add `scope` to `NotesFilters` Joi schema
- Add 2-state scope toggle to frontend `NotesFilters` component
- Create `useMentionCount` singleton hook (WS-driven)
- Add unread mention badge to `QuickAccessButton` in `SideBar`
- Make `NotesCard` read-only for non-owners (no edit, drag, delete, fav)
- Enhanced visual indicator (left blue border accent) on mention cards
- Navigation from mention notification sets `scope='mixed'` with `fromBadge` flag
- `NotesSummary` counts reflect scoped (not global) counts

**Non-Goals:**
- No new database tables or schema changes
- No new WebSocket events
- No changes to mention creation/editing aside from self-mention filter
- No changes to POST/PATCH notes endpoints for scope
- No bulk scope operations
- No scope-based authorization (non-owners can still see note content when `mixed`)

## Decisions

**Decision 1: Scope filter implementation pattern**
- Chosen: Follow the `isFavorite` pattern — Prisma `WHERE` / `some:` filter on the `mentions` relation, plus a `WHERE` on `createdBy` (userId), computed before the main query
- Rationale: The `isFavorite` pattern is already established in `dao.js` (lines 43-51). Adding `scope` follows the same structure — conditional `AND` clauses based on the param value. The `mine` scope adds `{ createdBy: userId }`; the `mixed` scope adds both `{ createdBy: userId }` and `{ mentions: { some: { mentionedUserId: userId } } }`.
- Alternative considered: Post-query filtering — rejected because it doesn't scale (loads all notes, then filters in memory).

**Decision 2: isOwner and isMentioned per-note computation**
- Chosen: Batch lookup pattern identical to `isFavorited` — after fetching notes, compute `isOwner` by comparing `note.createdBy === userId` and `isMentioned` by checking if the note's ID is in a set of noteIds where the user is mentioned (single query: `SELECT noteId FROM mentions WHERE mentionedUserId = userId`)
- Rationale: Follows the same batch lookup pattern used for favorites (`favoriteNoteIds` set in `dao.js` line 66-73). Avoids N+1 queries. The `isOwner` check is a simple field comparison; the `isMentioned` check is a single query returning all noteIds where the user is mentioned.
- Alternative considered: Prisma include with nested mention filter — rejected because it would multiply rows (one per mention) requiring deduplication.

**Decision 2.5: mentionIds per note for scoped mark-as-read**
- Chosen: The batch mention lookup now returns `{ id, noteId }` instead of just `noteId`. A Map of `noteId → mentionIds[]` is built in the DAO and attached to each note in the response as `mentionIds: number[]`.
- Rationale: The "Mark as read" button on each mention card needs to mark ONLY the user's mentions in that specific note, not all mentions globally. Passing specific `mentionIds` in the `mention:read` WebSocket payload scopes the operation correctly.
- Alternative considered: Resolving noteId → mentionIds on the server — rejected because it adds an extra query per request.

**Decision 3: Self-mention filter approach**
- Chosen: In `service.js` `createNote` and `updateNoteById`, after calling `extractMentionIds()`, filter out mentions where `mention.id === userId` before preparing `mentionsData`
- Rationale: Self-mentions (e.g., @self in note text) should not create mention records — the user doesn't need to be notified about their own mentions. The extraction happens at the service layer where `userId` is available. This is a simple filter step after the existing extraction logic (service.js lines 48-73 and 142-168).
- Alternative considered: Filter in DAO layer — rejected because DAO should be data-access only, not business logic.

**Decision 4: Scope-aware getAllNotesCount**
- Chosen: Add optional `scope` parameter to `getAllNotesCount` in both service and DAO. When scope is provided, add the same Prisma `where` conditions as `getAllNotes` to each column's count query.
- Rationale: The counts (backlog/active/completed) should reflect only the notes visible in the current scope, not global totals. The existing count function queries per-column counts — scope conditions are added as additional `where` clauses.
- Alternative considered: Compute counts from the already-filtered notes list — rejected because counts would only reflect the current page/column view.

**Decision 5: Frontend scope state management**
- Chosen: Add `scope` parameter to the RTK Query `getAllNotes` query (same pattern as `isFavorite`). The `NotesFilters` component manages the 2-state toggle locally and triggers a refetch when scope changes.
- Rationale: Redux/RTK Query cache invalidation handles refetching automatically. Adding `scope` as a query parameter integrates with existing `tags` for cache management. The toggle is a simple local state in NotesFilters that updates the query parameter.
- Alternative considered: Separate Redux slice for scope — rejected because it adds complexity when a local state + query param suffices.

**Decision 6: useMentionCount hook design**
- Chosen: Singleton hook that initializes WebSocket listeners on mount for `mention:new` (increment), `mention:backlog` (set initial count), and `mention:read` (decrement). Stores count in local state and provides `{ unreadCount, isLoaded }`. Uses a **shared context provider** (React Context or minimal Redux slice) mounted at the app root level to ensure a single WS listener registration survives HMR and React Strict Mode double-mount.
- Rationale: The mention count badge in the sidebar needs to be a single source of truth across the app. A React Context/Redux approach survives Vite HMR (hot reload), whereas a module-level flag would reset and duplicate listeners on every hot reload. The WS events `mention:new`/`mention:backlog`/`mention:read` already exist in the notification bus.
- Alternative considered: Module-level singleton flag — rejected because it's fragile with Vite HMR and React Strict Mode (double-mount would register duplicate listeners after hot reload).

**Decision 7: Read-only NotesCard for non-owners + visual indicator**
- Chosen: When `isOwner === false`, the card renders without edit button, delete button, drag handle, and favorite toggle. A "mentioned" badge appears instead. When `isMentioned && !isOwner`, a blue left border accent (`border-l-4 border-l-blue-400`) distinguishes mention cards visually in mixed view. A "mark as read" button appears (calls WS or API to mark mentions as read for this note). The card body is still clickable to view content.
- Rationale: Non-owners should see the note content but not modify them. The "mentioned" badge + blue left border provides visual distinction in mixed view. "Mark as read" allows tracking which mentioned notes they've seen.
- Alternative considered: Hide non-owned notes entirely in `mine` scope — this is already the default behavior. The `mixed` scope is opt-in.

**Decision 8: Scoped navigation from notifications**
- Chosen: When a user clicks the sidebar mention badge, navigate to the notes board with `scope='mixed'` and `fromBadge: true` in location state. The `fromBadge` flag triggers `mention:read` to clear the unread badge. Notes where `isMentioned && !isOwner` display a blue left border accent for visual distinction.
- Rationale: Removing the `mentioned` scope means navigation goes to `mixed` view. The `fromBadge` flag replaces the previous `scope='mentioned'`-based auto-trigger for `mention:read`. Visual indicators (badge + border accent) help users find mention cards in the mixed view.
- Alternative considered: Navigate to the specific note directly — rejected because the user may need surrounding context (column, adjacent notes).

**Decision 9: Scoped NotesSummary counts**
- Chosen: `NotesSummary` fetches counts using the same `scope` filter as the main notes list. The `getAllNotesCount` endpoint accepts optional `scope` param.
- Rationale: Consistency — counts should reflect the visible scope (mine or mixed), not global totals. The `mentioned` scope no longer exists; only `mine` and `mixed` are supported.
