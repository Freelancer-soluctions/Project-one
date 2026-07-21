## ADDED Requirements

### Requirement: mention:read persists to database
The system SHALL persist `isRead = true` to the `mentions` table when a user marks mentions as read, ensuring the unread count survives page reload and WS reconnection.

#### Scenario: handleMentionRead updates DB before broadcasting
- **WHEN** a user triggers `mention:read` event with an array of mention IDs
- **THEN** the server SHALL execute `prisma.mentions.updateMany({ where: { id: { in: mentionIds }, mentionedUserId: userId }, data: { isRead: true } })` before broadcasting to other sockets
- **AND** the update SHALL be scoped to `mentionedUserId === socket.data.user.id` (users cannot mark other users' mentions as read)

#### Scenario: Unread count survives page reload
- **WHEN** a user marks mentions as read and refreshes the page
- **THEN** the `mention:backlog` event on reconnection SHALL return only mentions where `isRead = false`

### Requirement: useMentionCount uses React Context singleton

### Requirement: useMentionCount is a singleton WS-driven hook
The system SHALL provide a `useMentionCount` hook that maintains a singleton unread mention count by subscribing to WebSocket events: `mention:new` (increment), `mention:backlog` (set initial count), `mention:read` (decrement). The hook SHALL return `{ unreadCount, isLoaded }`.

#### Scenario: Hook initializes count from mention:backlog
- **WHEN** the hook mounts and receives a `mention:backlog` event
- **THEN** `unreadCount` SHALL be set to the backlog count and `isLoaded` SHALL be `true`

#### Scenario: Hook increments on mention:new
- **WHEN** the hook receives a `mention:new` event
- **THEN** `unreadCount` SHALL increment by 1

#### Scenario: Hook decrements on mention:read
- **WHEN** the hook receives a `mention:read` event with a count
- **THEN** `unreadCount` SHALL decrement by the specified amount

#### Scenario: Singleton via React Context ensures single WS listener
- **WHEN** the hook is used in multiple components
- **THEN** only one set of WS event listeners SHALL be registered across the application
- **AND** the singleton SHALL be implemented via React Context provider (not module-level flag) to survive Vite HMR and React Strict Mode double-mount

#### Scenario: Hook re-subscribes on WS reconnect
- **WHEN** the WebSocket reconnects
- **THEN** the hook SHALL re-subscribe and receive a fresh `mention:backlog` event

### Requirement: QuickAccessButton shows unread mention badge
The QuickAccessButton for notes in the SideBar SHALL display an unread mention count badge sourced from `useMentionCount`.

#### Scenario: Badge displays unread count
- **WHEN** `useMentionCount` returns `unreadCount > 0`
- **THEN** the QuickAccessButton SHALL show a badge with the count

#### Scenario: Badge is hidden when count is zero
- **WHEN** `useMentionCount` returns `unreadCount === 0`
- **THEN** the QuickAccessButton SHALL NOT show a badge

#### Scenario: Badge is hidden when not loaded
- **WHEN** `useMentionCount` returns `isLoaded: false`
- **THEN** the QuickAccessButton SHALL NOT show a badge

### Requirement: Clicking sidebar badge navigates with scope=mixed
When a user clicks the QuickAccessButton notes icon with unread mentions, the system SHALL navigate to the notes page with `scope='mixed'` in location state.

#### Scenario: Click navigates to scoped notes view
- **WHEN** a user clicks the QuickAccessButton while the badge is visible
- **THEN** the app SHALL navigate to the notes page with `location.state = { scope: 'mixed' }`

#### Scenario: No scope param when no unread mentions
- **WHEN** a user clicks the QuickAccessButton with no unread mentions
- **THEN** the app SHALL navigate to the notes page with default scope

### Requirement: Badge navigation does NOT auto-clear unread
When a user navigates to the notes page from a mention notification context, the system SHALL NOT emit `mention:read` automatically. Mentions are marked as read ONLY via explicit user action (Mark as Read button, NotesViewDialog open).

#### Scenario: Badge navigation preserves unread state
- **WHEN** a user navigates to notes with `scope='mixed'` via sidebar badge click
- **THEN** `mention:read` SHALL NOT be emitted automatically
- **AND** `hasUnreadMentions` SHALL remain unchanged until user explicitly marks mentions as read

### Requirement: Toast notifications coexist with badge
The existing `useMentionNotifications` toast system SHALL continue to function alongside the new `useMentionCount` badge. They SHALL share the same WS events but serve different UI purposes.

#### Scenario: Toast and badge work independently
- **WHEN** a `mention:new` event is received
- **THEN** the toast notification SHALL fire AND the badge count SHALL increment independently

#### Scenario: Reading a mention updates both systems
- **WHEN** a user views a mentioned note
- **THEN** the toast state SHALL clear and the badge count SHALL decrement
