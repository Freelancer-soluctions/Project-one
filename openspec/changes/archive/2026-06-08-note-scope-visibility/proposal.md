## Why

Users currently see all notes in the system regardless of whether they created them or were mentioned in them. This creates noise — users must manually filter through notes they don't own or aren't part of. A scope-based visibility system lets users focus on "my notes" by default while still discovering notes where they're mentioned, improving daily workflow efficiency and reducing cognitive load.

## What Changes

1. **Backend — `scope` query param on GET /notes**: Add `scope` enum (`mine`, `mixed`) — `mine` is default, returns only user-created notes; `mixed` returns user's notes + notes where they're mentioned
2. **Backend — Per-note flags**: Add `isOwner` and `isMentioned` boolean fields to each note in GET /notes response
3. **Backend — Self-mention filter**: In `service.js`, skip creating mention records where `mentionedUserId === mentionedByUserId`
4. **Backend — Scoped counts**: Update `getAllNotesCount` to respect the same `scope` logic
5. **Backend — Joi validation**: Add `scope` enum validation to `NotesFilters` schema
6. **Frontend — Scope toggle**: Add 2-state scope toggle to `NotesFilters` component (mine/mixed)
7. **Frontend — useMentionCount hook**: Singleton hook that listens to WS events `mention:new`, `mention:backlog`, `mention:read` for unread mention count
8. **Frontend — Sidebar badge**: Add unread mention badge to `QuickAccessButton` in `SideBar`
9. **Frontend — Read-only cards**: Make `NotesCard` read-only for non-owners (no edit, drag, delete, fav toggle — show "mentioned" badge, mark as read)
10. **Frontend — Scoped navigation**: Navigation from mention notification auto-sets `scope='mixed'` with `fromBadge` flag
11. **Frontend — Scoped summaries**: `NotesSummary` counts reflect scoped (not global) counts
12. **Frontend — Enhanced visual indicator**: Non-owner mention cards display a left blue border accent (`border-l-4 border-l-blue-400`)

## Capabilities

### New Capabilities
- `note-scope-api`: Backend scope query parameter (`mine`/`mixed`), per-note `isOwner`/`isMentioned` flags, scope-respecting note counts, and Joi validation
- `note-scope-ui`: Frontend 2-state scope toggle, read-only non-owner NotesCard behavior, scoped NotesSummary counts, mention-navigation integration, and enhanced visual indicator on mention cards
- `mention-notifications`: Frontend `useMentionCount` singleton hook (WS-driven), unread mention badge in SideBar QuickAccessButton

### Modified Capabilities
<!-- No existing main specs require requirement-level changes. The mentions and favorites features exist as changes (not yet synced to main specs). The scope feature adds new query/filter behavior without altering existing spec requirements. -->

## Impact

- **Backend API** (`GET /notes`): New `scope` query param (`mine`/`mixed`); new `isOwner`, `isMentioned` fields in response
- **Backend API** (`GET /notes/count`): New `scope` query param support (`mine`/`mixed`)
- **Backend Service** (`service.js`): Self-mention filter in mention creation logic
- **Backend Validation** (`notes.joi.js`): `scope` added to `NotesFilters` schema
- **Frontend** (`NotesFilters`): 2-state scope toggle UI
- **Frontend** (`NotesCard`): Read-only mode for non-owners + left blue border accent on mention cards
- **Frontend** (new hook): `useMentionCount` WebSocket-driven hook
- **Frontend** (`SideBar`): Unread mention badge on `QuickAccessButton`, navigation with `fromBadge` flag
- **Frontend** (`NotesSummary`): Scoped count display
- **Infrastructure**: No new database tables — existing `mentions` and `notes` tables suffice
- **WebSocket**: No new WS events needed — existing `mention:new`, `mention:backlog`, `mention:read` events used
