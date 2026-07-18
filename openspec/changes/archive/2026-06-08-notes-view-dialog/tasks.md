## 1. Setup

- [x] 1.1 Install `@tailwindcss/typography` dev dependency — run `cd apps/client && npm install -D @tailwindcss/typography`
- [x] 1.2 Add `@tailwindcss/typography` plugin to the Tailwind CSS config file
- [x] 1.3 Backend — Update DAO `getAllNotes` to include `isRead` in mentions query and add `hasUnreadMentions` to each note response object
  - File: `apps/server/src/modules/notes/dao.js` lines 89-117
  - Change: select `isRead` alongside `id`, `noteId`; compute separate map for unread mentions

## 2. Create NotesViewDialog Component

- [x] 2.1 Create `apps/client/src/modules/notes/components/NotesViewDialog.jsx` with shadcn Dialog structure (Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle)
- [x] 2.2 Initialize a read-only Tiptap editor using `useEditor` from `@tiptap/react` with `StarterKit` extensions, `editable: false`, and `immediatelyRender: false`
- [x] 2.3 Render note content in `EditorContent` wrapped in `<div className="prose prose-sm max-w-none">` for typography styling
- [x] 2.4 Fetch and display mentions data using `useGetMentionsByNoteIdQuery(note.id)` — show "Mentioned by: userName" when data loads
- [x] 2.5 Fetch and display column/status name using the `useGetNoteColumns()` hook — match current note's columnId
- [x] 2.6 Display hashtags as a flex-wrap list of small badge/label elements
- [x] 2.7 Display note creation date in readable format
- [x] 2.8 Wire props: `note`, `open`, `onOpenChange` for dialog open/close state
- [x] 2.9 NotesViewDialog — Add loading skeleton/spinner while RTK queries load (useGetMentionsByNoteIdQuery, useGetNoteColumns)
- [x] 2.10 NotesViewDialog — Add error handling for failed fetches: hide mention/column sections on error, show note content regardless
- [x] 2.11 NotesViewDialog — Use full extensions list matching TiptapEditor: StarterKit, Underline, Subscript, Superscript, Highlight, Link.configure({ openOnClick: false }), TextAlign.configure({ types: ["heading", "paragraph"] }), Mention with openOnClick: false

## 3. Modify NotesCard Component

- [x] 3.1 Import `LuEye` icon from `lucide-react`
- [x] 3.2 Add local state `isViewDialogOpen` and `setIsViewDialogOpen` in NotesCard
- [x] 3.3 Render a "View" button (button element with LuEye icon) visible only when `isMentioned === true && isOwner === false`
- [x] 3.4 Render `<NotesViewDialog note={note} open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} />` inside NotesCard
- [x] 3.5 Ensure existing LuCheck (Mark as read) button remains separate and unchanged
- [x] 3.6 NotesCard — Add unread indicator (blue dot/badge) when hasUnreadMentions === true && isMentioned === true && isOwner === false

## 4. Socket-Driven Cache Invalidation

- [x] 4.1 Notes.jsx — Remove `mention:read` emission from the badge navigation useEffect (lines 70-76). Simplify: keep only scope-setting from location.state, remove the socket.emit line and the fromBadgeFiredRef guard
- [x] 4.2 Verify that `mention:read` is ONLY emitted from NotesCard handleMarkAsRead (lines 38-42 of NotesCard.jsx) — confirm individual LuCheck button works correctly
- [x] 4.3 Add `mention:read` socket listener in Notes that invalidates 'Notes' cache tag — when mention:read received (from any source), dispatch \`api.util.invalidateTags(['Notes'])\`
- [ ] 4.4 (Optional) Add `mention:read` emission inside NotesViewDialog when dialog opens for a note with unread mentions — mark as read automatically when user views content
- [x] 4.5 Verify end-to-end: sidebar badge → navigate to Notes → no automatic mark-as-read → click LuCheck on card → mention:read emitted → cache invalidated → hasUnreadMentions updates to false

## 5. Security Verification

- [x] 5.1 Verify no `dangerouslySetInnerHTML` is used in `NotesViewDialog.jsx` or any modified files
- [x] 5.2 Verify note content renders via Tiptap's safe ProseMirror DOMParser, not raw HTML injection
