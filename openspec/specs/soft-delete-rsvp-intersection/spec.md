## Purpose

This capability documents the intersection between the soft-delete behavior for events and the RSVP/attendee system. It ensures that when events are soft-deleted, attendee records are preserved via `onDelete: Restrict` FK constraints, and RSVP queries remain functional for deleted events.

## Requirements

### Requirement: add-event-rsvp design update for FK constraint
The pending `add-event-rsvp` change SHALL update its design document to reflect that the foreign key from `attendees` to `events` must not use `onDelete: Cascade`.

#### Scenario: FK does not cascade delete
- **WHEN** the `add-event-rsvp` change defines the `attendees` → `events` foreign key in the Prisma schema
- **THEN** the FK SHALL NOT use `onDelete: Cascade`
- **AND** the FK SHALL use `onDelete: Restrict` to protect attendee records when the parent event is soft-deleted

#### Scenario: Design note updated in add-event-rsvp
- **WHEN** reviewing the `add-event-rsvp` change's design document
- **THEN** it SHALL contain a note explaining that soft-deleted events should not cascade-delete attendee records
- **AND** it SHALL reference the `add-soft-delete-events` change as the reason for this constraint

### Requirement: RSVP queries account for soft-deleted events
The `add-event-rsvp` change SHALL ensure queries for attendee records consider that the parent event may be soft-deleted.

#### Scenario: List RSVPs for soft-deleted event
- **WHEN** a user queries attendees for an event that has been soft-deleted
- **THEN** the RSVP query SHALL still return attendee records (data is preserved)
- **AND** the event data in the response SHALL include the `deletedAt` and `deletedBy` fields if the event is deleted

#### Scenario: Count RSVPs for soft-deleted events
- **WHEN** counting total attendees per event
- **THEN** soft-deleted events SHALL still have their attendee counts accessible
- **AND** SHALL NOT cause query errors due to the missing parent event
