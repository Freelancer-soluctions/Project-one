## 1. Backend — Joi Validation

- [x] 1.1 Add `scope` field to `NotesFilters` Joi schema with valid values `mine`, `mixed` (default `mine`)
- [x] 1.2 Update JSDoc for `NotesFilters` schema to document new `scope` field
- [ ] 1.3 Add validation tests for valid and invalid `scope` values

## 2. Backend — DAO Layer: Scope Filter on GET /notes

- [x] 2.1 Add `scope` parameter to `getAllNotes` DAO function signature
- [x] 2.2 Implement `scope=mine` filter: add Prisma `where` condition `{ createdBy: userId }`
- [x] 2.3 Implement `scope=mixed` filter: add Prisma `where` condition matching `createdBy === userId` OR `mentions: { some: { mentionedUserId: userId } }`
- [x] 2.4 `scope=mentioned` removed — scope reduced to 2 states (mine/mixed). No separate mentioned filter needed
- [x] 2.5 Ensure scope filter works alongside existing filters (searchTerm, statusCode, hashtagIds, isFavorite)

## 3. Backend — DAO Layer: isOwner and isMentioned Flags

- [x] 3.1 Add `isOwner` field to each note in the response map: `note.createdBy === userId`
- [x] 3.2 Add batch lookup for `isMentioned`: single query `SELECT noteId FROM mentions WHERE mentionedUserId = userId` → build Set of mentioned noteIds
- [x] 3.3 Map `isMentioned` flag onto each note: `mentionedNoteIds.has(note.id)`
- [x] 3.4 Add both flags to the response transformation in the `columns.map` block

## 4. Backend — Service Layer: Self-Mention Filter

- [x] 4.1 In `createNote` service, after `extractMentionIds()` call, filter out mentions where `mention.id === userId` before building `mentionsData`
- [x] 4.2 In `updateNoteById` service, apply same self-mention filter after `extractMentionIds()`
- [x] 4.3 Ensure self-mentions do not trigger `MENTION_CREATED` bus events

## 5. Backend — Scoped Note Counts

- [x] 5.1 Add `scope` parameter to `getAllNotesCount` service function
- [x] 5.2 Add `scope` parameter to `getAllNotesCount` DAO function
- [x] 5.3 Implement scope-aware counting: add same Prisma `where` conditions as GET /notes for each column count (backlog, active, completed)
- [x] 5.4 Ensure backward compatibility: no scope param = all notes count (unchanged behavior)

## 6. Backend — Controller and Route Wiring

- [x] 6.1 Update `getAllNotes` controller to extract `scope` from `req.safeQuery` and pass to service
- [x] 6.2 Update `getAllNotesCount` controller to extract `scope` from `req.safeQuery` and pass to service
- [x] 6.3 Verify route registration passes query params correctly

## 7. Backend — Tests

- [ ] 7.1 Update unit tests for service.getAllNotes with scope parameter
- [ ] 7.2 Update unit tests for service.getAllNotesCount with scope parameter
- [ ] 7.3 Add unit tests for self-mention filter in createNote and updateNoteById
- [ ] 7.4 Add integration tests for GET /notes?scope=mine
- [ ] 7.5 Add integration tests for GET /notes?scope=mixed
- [x] 7.6 Removed — `scope=mentioned` no longer exists
- [ ] 7.7 Add integration tests for GET /notes/count?scope=mine|mixed
- [ ] 7.8 Add integration test verifying isOwner and isMentioned flags in response

## 8. Frontend — RTK Query Integration

- [x] 8.1 Add `scope` parameter to `getAllNotes` query in notes API slice (already uses `params: { ...args }`)
- [x] 8.2 Add `scope` parameter to `notesCount` query in notes API slice (already uses `params: { ...args }`)
- [x] 8.3 Configure cache invalidation to refetch when scope changes (existing `invalidatesTags: ['Notes']` handles it)
- [x] 8.4 Read `isOwner` and `isMentioned` fields from GET /notes response per note

## 9. Frontend — Scope Toggle in NotesFilters

- [x] 9.1 Create 2-state scope toggle UI component (segmented button group: "Mine" / "All accessible")
- [x] 9.2 Add scope state management to Notes.jsx with `location.state` for initial value
- [x] 9.3 Wire scope toggle changes to trigger GET /notes refetch with new scope param
- [x] 9.4 Add "Clear filters" handler that resets scope to `mine`
- [x] 9.5 Read initial scope from `location.state?.scope` on navigation

## 10. Frontend — useMentionCount Hook

- [x] 10.1 Create `useMentionCount` hook file at `hooks/useMentionCount.js`
- [x] 10.2 Implement singleton via React Context provider (mount at app root)
- [x] 10.3 Subscribe to `mention:new` event → increment unread count
- [x] 10.4 Subscribe to `mention:backlog` event → set initial count
- [x] 10.5 Subscribe to `mention:read` event → decrement unread count
- [x] 10.6 Return `{ unreadCount, isLoaded }` from hook
- [x] 10.7 Handle WS reconnection: re-subscribe and receive fresh backlog
- [x] 10.8 Export hook from `hooks/index.js`

## 11. Frontend — Sidebar Mention Badge

- [x] 11.1 Import `useMentionCount` in SideBar component
- [x] 11.2 Add unread count badge to QuickAccessButton for notes (conditionally rendered when `unreadCount > 0 && isLoaded`)
- [x] 11.3 Wire QuickAccessButton click to navigate with `location.state = { scope: 'mixed', fromBadge: true }` when badge visible
- [x] 11.4 Add i18n keys for badge aria-label

## 12. Frontend — Read-only NotesCard

- [x] 12.1 Conditionally hide edit button when `isOwner === false`
- [x] 12.2 Conditionally hide delete button when `isOwner === false`
- [x] 12.3 Conditionally set `draggable` attribute and `onDragStart` handler — only when `isOwner === true`
- [x] 12.4 Conditionally hide favorite toggle when `isOwner === false`
- [x] 12.5 Add "mentioned" badge to card when `isOwner === false && isMentioned === true`
- [x] 12.6 Add enhanced visual indicator for mention cards: blue left border accent (`border-l-4 border-l-blue-400`) + subtle bg when `isMentioned && !isOwner`
- [x] 12.7 Add "Mark as read" button on mention-only cards
- [x] 12.8 Wire "Mark as read" to emit `mention:read` event with note-specific `mentionIds` from response

## 13. Frontend — Mention Navigation Integration

- [x] 13.1 When navigating to notes from sidebar mention badge, pass `scope='mixed'` and `fromBadge: true` in location state
- [x] 13.2 When mention notification is clicked, navigate to notes with `scope='mixed'`
- [~] 13.3 On entering notes page via `fromBadge` navigation, emit `mention:read` to clear badge (use `useRef` guard to prevent duplicate emits)
  - **SUPERSEDED by notes-view-dialog design Decision 9**: `mention:read` should NOT auto-emit on badge navigation. Mentions marked as read ONLY via explicit user action (Mark as Read button).

## 14. Frontend — Scoped NotesSummary

- [x] 14.1 Pass scope filter parameter to `notesCount` query from NotesSummary
- [x] 14.2 Ensure NotesSummary column counts (backlog, active, completed) update when scope changes
- [x] 14.3 Handle empty/zero-count states for each scope

## 15. Frontend — i18n

- [x] 15.1 Add i18n keys: `scope_mine`, `scope_mixed`, `mentioned_badge`, `mark_as_read`, `mentions_count` (scope_mentioned removed — no longer needed)
- [x] 15.2 Add English locale translations for new keys
- [x] 15.3 Add Spanish locale translations for new keys

## 16. Backend — mention:read DB Persistence

- [x] 16.1 In `handleMentionRead` (mentionEvents.js), add `prisma.mentions.updateMany()` before broadcast to persist `isRead = true` in DB
- [x] 16.2 Ensure update only affects mentions where `mentionedUserId === socket.data.user.id` (security: prevent marking other users' mentions as read)
- [ ] 16.3 Add test verifying mention:read persists to DB and survives page reload
- [ ] 16.4 Add test verifying unauthorized user cannot mark another user's mentions as read

## 17. Database — Performance Index

- [x] 17.1 Verify or add composite index on `mentions(note_id, mentioned_user_id)` for scope=mixed OR query performance
- [x] 17.2 Verify or add single index on `notes(created_by)` for scope=mine filter performance
- [ ] 17.3 Run `EXPLAIN ANALYZE` on scope=mixed query to verify index usage

## 18. Optimization — Follow-up (non-blocking)

- [ ] 18.1 (Future) Refactor `getAllNotesCount` from 3 separate queries to single query with `COUNT(*) FILTER (WHERE ...)` for efficiency with scope filters

## 19. Frontend — Tests

- [ ] 19.1 Write unit tests for useMentionCount hook (mock WS events)
- [ ] 19.2 Write unit tests for scope toggle component
- [ ] 19.3 Write integration tests for NotesFilters scope interactions
- [ ] 19.4 Write integration tests for read-only NotesCard rendering
- [ ] 19.5 Write E2E tests for scope filter flow (mine → mixed) and visual indicator appearance on mention cards
- [ ] 19.6 Write E2E tests for mention badge display and navigation
