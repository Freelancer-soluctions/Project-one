## Why

When a user is mentioned in a note they don't own, they cannot read the note content. The NotesCard only shows title and creation date. Non-owners have no edit button, and there's no "View" button to see the full note body. Users need a read-only way to view note content when mentioned.

Additionally, users who have been mentioned multiple times cannot distinguish between "already seen" and "new/unread" mentions — they need a visual indicator for unread mentions. The read-only dialog also needs proper loading states and must handle all Tiptap formatting extensions to avoid content rendering issues.

## What Changes

- Add a new `NotesViewDialog` component that renders note content in a read-only Tiptap editor
- Add a "Ver" (View) button to `NotesCard` for `isMentioned && !isOwner` users
- Install `@tailwindcss/typography` for prose styling of rendered content
- Add loading skeleton/spinner states to NotesViewDialog while mentions and columns data load
- Add error state handling for failed fetches in NotesViewDialog
- Use the full Tiptap extensions list (StarterKit, Underline, Subscript, Superscript, Highlight, Link, TextAlign, Mention) matching TiptapEditor for read-only rendering
- **Backend DAO change**: Modify `getAllNotes` to select `isRead` in mentions query and add `hasUnreadMentions: boolean` to each note object
- **Frontend**: Add visual unread indicator (blue dot/badge) on NotesCard when `hasUnreadMentions && isMentioned && !isOwner`
- **Socket sync**: Listen for `mention:read` socket event in Notes.jsx to invalidate 'Notes' RTK Query cache tag
- **Design correction**: Sidebar badge navigation ONLY navigates to Notes with `scope: 'mixed'` — it does NOT automatically mark mentions as read. The `fromBadge` flag is kept solely for setting the scope filter, not for triggering `mention:read` emission.
- No changes to existing owner flow (edit, mark as read, delete)

## Capabilities

### New Capabilities
- `note-view-dialog`: Read-only note viewing for mentioned non-owner users via a dialog with Tiptap rendered content; includes loading/error states and full Tiptap extension support

### Modified Capabilities
- `notes-card` (implicit): Add unread mention indicator (blue dot/badge) for `hasUnreadMentions && isMentioned && !isOwner`
- `notes-dao` (implicit): `getAllNotes` now returns `hasUnreadMentions` per note based on `isRead` field in mentions
- `notes-page` (implicit): Listen for `mention:read` socket events to trigger cache invalidation of the 'Notes' RTK Query tag

## Impact

- **New component**: `apps/client/src/modules/notes/components/NotesViewDialog.jsx`
- **Modified component**: `apps/client/src/modules/notes/components/NotesCard.jsx` (add View button + unread indicator)
- **Modified component**: `apps/client/src/modules/notes/pages/Notes.jsx` (add socket listener for mention:read; remove automatic mention:read emission from badge navigation useEffect, keeping only scope-setting logic)
- **Modified file**: `apps/server/src/modules/notes/dao.js` (add `isRead` to mentions query, compute `hasUnreadMentions`)
- **New dependency**: `@tailwindcss/typography` (dev dependency)
- **Additional Tiptap extensions**: `@tiptap/extension-underline`, `@tiptap/extension-subscript`, `@tiptap/extension-superscript`, `@tiptap/extension-highlight`, `@tiptap/extension-link`, `@tiptap/extension-text-align`, `@tiptap/extension-mention` (most already installed)
- **Data dependencies**: `useGetMentionsByNoteIdQuery`, `useGetNoteColumns` (RTK Query hooks)
- **No breaking changes**
