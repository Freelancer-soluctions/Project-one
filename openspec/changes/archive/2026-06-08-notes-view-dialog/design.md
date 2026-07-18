## Context

Non-owner users who are mentioned in a note currently have no way to read the note content. The NotesCard component only displays the note title and creation date, and only note owners see edit/delete buttons. When users are mentioned (via `isMentioned: true` and `isOwner: false`), they need a read-only dialog to view the full note body.

The existing codebase uses:
- **Tiptap** (`@tiptap/react`) for rich text editing — already installed with `@tiptap/starter-kit`
- **Radix UI Dialog** (`@/components/ui/dialog`) for modal dialogs
- **RTK Query** hooks for data fetching (`useGetMentionsByNoteIdQuery`, `useGetNoteColumns`)
- **Tailwind CSS** for styling

## Goals / Non-Goals

**Goals:**
- Provide a read-only dialog for mentioned non-owner users to view full note content
- Render note content safely using Tiptap's read-only editor (no `dangerouslySetInnerHTML`)
- Show title, content, creation date, hashtags, column/status name, and "mentioned by" user name
- Add a "Ver" (View) button with LuEye icon to NotesCard for `isMentioned && !isOwner` users
- Use `@tailwindcss/typography` prose classes for clean content rendering

**Non-Goals:**
- Modifying the existing owner flow (edit, delete, mark as read)
- Adding API endpoints or backend changes
- Adding edit capabilities for mentioned users
- Changing the existing NotesCard layout or behavior for owners

## Decisions

### 1. Tiptap read-only editor over dangerouslySetInnerHTML
- **Decision**: Use `@tiptap/react`'s `EditorContent` with `editable: false` to render note content
- **Rationale**: Content is stored as ProseMirror JSON. Tiptap's editor handles schema validation and rendering securely — no XSS vector. Using `dangerouslySetInnerHTML` would bypass React's safe rendering and create an OWASP XSS vulnerability. Tiptap is already installed (`@tiptap/react`, `@tiptap/starter-kit`) and used elsewhere in the app for editing.
- **Alternatives considered**: `dangerouslySetInnerHTML` — rejected for security reasons. Plain text rendering — rejected because it would lose rich text formatting.

### 2. Separate View button from existing action buttons
- **Decision**: Add a distinct "Ver" button (LuEye icon) next to existing action buttons, visible only when `isMentioned && !isOwner`
- **Rationale**: Keeps existing owner flow untouched. The condition `isMentioned && !isOwner` ensures owners don't see a redundant View button (they already have Edit). The LuEye icon provides clear visual affordance for "viewing" content.
- **Alternatives considered**: Modifying the edit button behavior for non-owners — rejected as it conflates edit and view concerns.

### 3. Fetch mention and column data inside the dialog
- **Decision**: The dialog component fetches `useGetMentionsByNoteIdQuery(note.id)` and `useGetNoteColumns()` internally
- **Rationale**: Keeps NotesCard lean. Data fetching happens only when the dialog opens, avoiding unnecessary API calls on card render. The dialog manages its own loading/error states.
- **Alternatives considered**: Passing all data as props — rejected because it would require fetching on card mount for every mentioned note.

### 4. @tailwindcss/typography for content styling
- **Decision**: Install and configure `@tailwindcss/typography` plugin and wrap Tiptap content in `<div className="prose prose-sm max-w-none">`
- **Rationale**: Provides consistent typography styling for rendered rich text content without custom CSS. Industry standard for Tailwind-based content rendering.
- **Alternatives considered**: Custom Tailwind classes — rejected as more maintenance and less consistent.

## Risks / Trade-offs

- **Tiptap editor initialization cost**: Creating a Tiptap editor instance (even read-only) has some overhead. For infrequent viewing of individual notes this is negligible. If performance becomes an issue, consider a lightweight HTML renderer as an alternative.
- **Missing `@tailwindcss/typography` blocks CI**: Install step must be completed before the dialog component works visually. Add to project dependencies explicitly.
- **Dialog open/close state management**: The dialog open/close state is managed locally in NotesCard. Ensure the View button is the only trigger to avoid the dialog opening before data is ready.

### Decision 5: Full Tiptap extensions for read-only fidelity
- **Decision**: Use the same 11 extensions as TiptapEditor.jsx (StarterKit, Underline, Subscript, Superscript, Highlight, Link, TextAlign, Mention) minus editor-only ones (Placeholder, CharacterCount)
- **Rationale**: Content created with the full extension set will lose formatting (underlines, links, highlights, mentions) if the read-only viewer uses only StarterKit. Matching extensions preserves content fidelity while maintaining XSS protection via ProseMirror schema validation.
- **Extensions list**:
  ```
  StarterKit,
  Underline,
  Subscript,
  Superscript,
  Highlight,
  Link.configure({ openOnClick: false }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Mention.configure({ /* same mention config minus suggestion UI dropdown */ }),
  ```
- **Note**: `editable: false` ensures no user input regardless of extensions present.

### Decision 6: Loading and error states in dialog
- **Decision**: NotesViewDialog manages its own loading/error UI for RTK Query fetches
- **Implementation**:
  - While `isLoading` for mentions or columns: show a skeleton placeholder in the dialog body
  - On fetch error: gracefully degrade — show note content (already available from note prop) but hide "Mentioned by" and column sections with a subtle error message
  - State management: derived from `isLoading`, `isError` return values of `useGetMentionsByNoteIdQuery` and `useGetNoteColumns`

### Decision 7: Unread mentions indicator
- **Decision**: Backend adds `hasUnreadMentions` boolean per note; frontend shows visual indicator
- **Rationale**: Users need to distinguish between "already seen" and "new/unread" mentions. The existing `isMentioned` flag is binary (has any mention ever). Adding `hasUnreadMentions` provides the missing granularity.
- **Backend**: DAO getAllNotes — modify mentions query to include `isRead` field. Create separate map for notes with unread mentions.
- **Frontend**: NotesCard shows a blue dot/badge next to the mentioned_badge span when `hasUnreadMentions === true`
- **Socket sync**: When `mention:read` event received on client → invalidate 'Notes' RTK Query cache tag → refetch updates hasUnreadMentions to false
- **Trigger source**: The `mention:read` event is emitted only from explicit user actions (Mark as Read button on NotesCard, optionally NotesViewDialog open), NOT from sidebar badge navigation.

### Decision 8: Socket-driven cache invalidation
- **Decision**: Notes component listens for 'mention:read' socket event and invalidates the 'Notes' tag
- **Rationale**: When mentions are marked as read (via individual note actions), the notes cache must reflect updated `hasUnreadMentions`. Without invalidation, the card would continue showing the unread indicator until manual refresh.
- **Implementation**: Use `useDispatch` to call `api.util.invalidateTags(['Notes'])` when mention:read received
- **Note**: The `mention:read` event is emitted from NotesCard's handleMarkAsRead (via socket.emit), NOT from any useEffect in Notes.jsx. The Notes.jsx useEffect at lines 70-76 is simplified to only read `location.state` for scope setting.

### Decision 9: Mention:read only from note interaction (NOT badge navigation)
- **Decision**: Mentions are marked as read ONLY when the user explicitly interacts with a specific note — never automatically from sidebar badge navigation.
- **Rationale**: The sidebar badge's purpose is to show unread count and provide quick access to the Notes module filtered to mixed scope. Automatically marking all mentions as read on badge click destroys the user's ability to see what's new. This aligns with the principle that marking content as read requires explicit user intent at the item level.
- **Emission points**:
  1. **NotesCard "Mark as read" (LuCheck) button** (lines 38-42): Emits `
  1. **NotesCard "Mark as read" (LuCheck) button** (lines 38-42): Emits `socket.emit('message', { type: 'mention:read', mentionIds })` for the specific note's mentionIds — this is the PRIMARY mechanism
  2. **NotesViewDialog open** (OPTIONAL): When the dialog opens, optionally emit `mention:read` for the viewed note — this is SECONDARY and configurable
- **What is REMOVED**: The `useEffect` in Notes.jsx at lines 70-76 that used to emit `mention:read` on every navigation with `fromBadge: true`. This effect is simplified to ONLY handle setting `scope` from `location.state`.
- **What remains**: The `fromBadge` flag in `location.state` is kept for setting `scope: 'mixed'` so the user sees both own notes and mentioned notes together. `fromBadge` no longer triggers any side effect beyond scope control.
- **What remains unchanged**: The `fromBadgeFiredRef` pattern is simplified/removed along with the socket emit. The `location.state?.scope` logic stays.
- **Sidebar badge unread count**: The unread count in SideBar is already reactive via MentionCountProvider's socket event listeners — no changes needed there.
- **Socket listener stays**: Notes.jsx still listens for `mention:read` socket events to invalidate the 'Notes' RTK Query tag (the listener is the RECEIVER side, separate from the emitter).

## Updated Risks / Trade-offs
- **Socket cache invalidation race**: If mention:read fires before the GET /notes query completes, the refetch may still return hasUnreadMentions: true. Mitigation: invalidate after a short delay or use RTK Query's `refetchOnReconnect` behavior.
- **Full extension set overhead**: Adding 7 extra extensions has negligible bundle impact since they're already loaded by TiptapEditor. Zero incremental cost.
