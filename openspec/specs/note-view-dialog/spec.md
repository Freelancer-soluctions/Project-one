## ADDED Requirements

### Requirement: View button visibility for mentioned non-owners
The system SHALL display a "View" button for users who have been mentioned in a note but do not own it, and SHALL hide it otherwise.

#### Scenario: View button visible for mentioned non-owner
- **WHEN** a note has `isMentioned === true` AND `isOwner === false`
- **THEN** a "View" button with a LuEye icon SHALL appear in the card actions area

#### Scenario: View button hidden for non-mentioned users
- **WHEN** a note's `isMentioned` is `false`
- **THEN** the "View" button SHALL NOT be rendered

#### Scenario: View button hidden for note owners
- **WHEN** the current user is the note owner (`isOwner === true`)
- **THEN** the "View" button SHALL NOT be rendered

### Requirement: Read-only dialog content display
The system SHALL display the full note content in a read-only dialog when the "View" button is clicked, showing all note details without edit controls.

#### Scenario: Dialog opens with note details
- **WHEN** the user clicks the "View" button
- **THEN** a Dialog SHALL open displaying: note title, note content rendered via Tiptap read-only editor, creation date, hashtags as a label list, and column/status name

#### Scenario: Mentioned-by user name displayed
- **WHEN** the dialog is open AND mentions data has loaded
- **THEN** the name of the user who mentioned the current user SHALL be displayed in the dialog

#### Scenario: No edit controls in dialog
- **WHEN** the dialog is open
- **THEN** no edit controls (edit button, editable fields, save/cancel) SHALL be shown — the dialog is read-only

### Requirement: XSS security for note content rendering
The system SHALL prevent cross-site scripting (XSS) attacks when rendering note content by using safe parsing and avoiding dangerous React patterns.

#### Scenario: Malicious HTML stripped by ProseMirror schema
- **WHEN** note content contains malicious HTML such as `<script>` tags, event handler attributes (`onerror`, `onclick`, etc.), or other XSS vectors
- **THEN** the ProseMirror schema SHALL strip them during `DOMParser.parse()` and they SHALL NOT be rendered in the output

#### Scenario: No dangerouslySetInnerHTML usage
- **WHEN** rendering note content in the dialog
- **THEN** `dangerouslySetInnerHTML` SHALL NOT be used anywhere in the NotesViewDialog component or related files

### Requirement: Dialog close behavior
The system SHALL close the read-only dialog gracefully via any standard close mechanism and SHALL clean up the editor instance on unmount.

#### Scenario: Dialog closes via close button
- **WHEN** the user clicks the close button (X) in the dialog header
- **THEN** the dialog SHALL close

#### Scenario: Dialog closes via overlay click
- **WHEN** the user clicks outside the dialog (on the overlay)
- **THEN** the dialog SHALL close

#### Scenario: Editor instance destroyed on unmount
- **WHEN** the dialog closes and the NotesViewDialog component unmounts
- **THEN** the Tiptap editor instance SHALL be destroyed (React handles cleanup via unmount)

### Requirement: Unread mention visual indicator
The system SHALL indicate which notes have unread mentions, distinct from notes whose mentions have already been read.

#### Scenario: Unread indicator visible for unread mentions
- **WHEN** a note has `hasUnreadMentions === true` AND `isMentioned === true` AND `isOwner === false`
- **THEN** a visual unread indicator (e.g., blue dot, colored badge) SHALL appear on the card alongside the existing mentioned badge

#### Scenario: Unread indicator hidden after mention:read
- **WHEN** the `mention:read` socket event is received AND the notes cache is invalidated
- **THEN** the refetched notes SHALL have `hasUnreadMentions === false` for the affected notes
- **AND** the unread indicator SHALL be removed from those notes

### Requirement: Socket-driven cache invalidation
The system SHALL invalidate the notes RTK Query cache when mentions are marked as read, ensuring the UI reflects the latest mention state.

#### Scenario: Notes refetch after mention:read
- **WHEN** the client receives a `mention:read` socket event
- **THEN** the 'Notes' tag SHALL be invalidated
- **AND** `useGetAllNotesQuery` SHALL refetch with updated `hasUnreadMentions` values

### Requirement: Dialog loading state
The system SHALL display a loading state while the dialog fetches mentions and column data.

#### Scenario: Loading skeleton visible during fetch
- **WHEN** the dialog opens AND mentions or columns data is loading
- **THEN** a loading skeleton or spinner SHALL be displayed in the dialog body

#### Scenario: Graceful error handling
- **WHEN** mentions or columns fetch fails
- **THEN** the dialog SHALL still display note content (from note prop)
- **AND** the "Mentioned by" section SHALL be hidden
- **AND** no error toast or blocking error SHALL be shown

### Requirement: Mention:read only from note interaction
The system SHALL mark mentions as read ONLY when the mentioned user explicitly interacts with the note, not automatically upon navigation.

#### Scenario: Mark as read via card button
- **WHEN** the user clicks the "Mark as read" (LuCheck) button on a NotesCard where `isMentioned === true` AND `isOwner === false`
- **THEN** `socket.emit('message', { type: 'mention:read', payload: { mentionIds: note.mentionIds } })` SHALL be emitted for that note
- **AND** the 'Notes' cache tag SHALL be invalidated
- **AND** the card SHALL update to remove the unread indicator

#### Scenario: Badge navigation does NOT mark as read
- **WHEN** the user clicks the sidebar badge to navigate to the Notes module
- **THEN** NO `mention:read` event SHALL be emitted automatically
- **AND** mentions SHALL remain in their current read/unread state

#### Scenario: NotesViewDialog optionally marks as read
- **WHEN** the user opens the NotesViewDialog for a note with `hasUnreadMentions === true`
- **THEN** optionally, a `mention:read` event SHALL be emitted for that note's mentionIds
- **AND** the unread indicator SHALL update after cache invalidation
