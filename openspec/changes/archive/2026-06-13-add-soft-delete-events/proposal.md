## Why

Implementing soft delete for the events model allows events to be "deleted" without permanently removing them from the database. This is needed to preserve data integrity during ongoing development — particularly because the `add-event-rsvp` change (not yet implemented) will introduce an `attendees` table with a foreign key referencing `events`. Hard-deleting events would orphan or cascade-delete RSVP attendee records, losing historical participation data. Soft delete also enables ADMIN recovery of accidentally deleted events, audit trails (who deleted what and when), and controlled visibility through query filters.

## What Changes

- Add `deletedAt` (DateTime?) and `deletedBy` (Int?, FK → users) fields to the `events` model in Prisma schema
- `DELETE /events/:id` becomes a soft delete: UPDATE sets `deletedAt = now()` and `deletedBy = req.userId`, instead of hard DELETE
- `GET /events` automatically filters out soft-deleted events (`WHERE deletedAt IS NULL`)
- ADMIN can view soft-deleted events via query param `?showDeleted=true`
- ADMIN and MANAGER can restore a soft-deleted event via `PATCH /events/:id` with `deletedAt: null` and `deletedBy: null`
- No other entities are affected; no Prisma middleware is introduced
- **BREAKING**: The existing `DELETE /events/:id` endpoint changes semantics from hard-delete to soft-delete (HTTP 200 response remains the same)
- **RSVP intersection**: The `add-event-rsvp` change (not yet implemented) must update its M7 design note to replace `onDelete: Cascade` with a no-action approach, since soft-deleted parent events should protect the FK

## Capabilities

### New Capabilities
- `soft-delete-operation`: Soft delete behavior on the DELETE endpoint — UPDATE instead of DELETE, sets `deletedAt` and `deletedBy`
- `soft-delete-query`: GET /events filters out soft-deleted events; ADMIN can override with `?showDeleted=true`
- `soft-delete-restore`: ADMIN and MANAGER can restore a soft-deleted event via PATCH by clearing `deletedAt` and `deletedBy`

### Modified Capabilities
- (none — no existing specs are changing behavior at the spec level)

### Cross-Change Intersections
- `soft-delete-rsvp-intersection`: Documents the required update to the pending `add-event-rsvp` change — the `attendees` → `events` FK must not use `onDelete: Cascade` when the parent only soft-deletes

## Impact

- **Schema**: `events` model gains `deletedAt DateTime?` and `deletedBy Int?` (FK → users)
- **DAO**: `deleteEventById` changes from hard delete to UPDATE with soft-delete fields; `getAllEvents` adds default `deletedAt: null` filter; new `restoreEventById` method
- **Service**: `deleteEventById` passes `userId` for audit; `getAllEvents` propagates `showDeleted` flag
- **Controller**: `deleteEventById` passes authenticated user ID; `showDeleted` query param support
- **Routes**: No new routes — restore uses existing `PATCH /events/:id`; soft delete uses existing `DELETE /events/:id`
- **Permissions**: `canDeleteEvents` remains for soft delete; restore requires `canEditEvents` or a new `canRestoreEvents` permission (pending decision)
- **RSVP change**: Must update `add-event-rsvp` design.md to reflect that event parent FK cannot cascade delete
