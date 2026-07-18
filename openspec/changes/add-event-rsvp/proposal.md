## Why

Events need a structured attendee registration system. Currently there is no way to track who is attending, manage capacity, handle waitlists, or enforce attendance limits. This blocks key use-cases like paid events, limited-capacity workshops, and audience management.

## What Changes

- Add `attendees` table with CONFIRMED/WAITLIST/CANCELLED states
- Add `capacity` and `attendeeCount` fields to `events` table
- Add `registration_log` table for audit trail of all state changes
- Add RSVP self-service endpoints under existing `events/` module: `POST /events/:eventId/register`, `DELETE /events/:eventId/register`
- Add admin endpoints: `GET /events/:eventId/attendees`, `PATCH /events/:eventId/attendees/:attendeeId`
- Implement automatic FIFO waitlist promotion when a CONFIRMED attendee cancels
- Add capacity validation with concurrency-safe Prisma interactive transactions
- Add 5 new permission codes for role-based access control
- Add RSVP frontend components inside existing events module (no new page)

## Capabilities

### New Capabilities
- `event-rsvp-registration`: Self-service registration, cancellation, capacity enforcement, and waitlist management
- `event-rsvp-admin`: Admin attendee listing, status management, and attendee lookup
- `event-rsvp-audit`: Audit logging of all registration state changes

### Modified Capabilities

None — RSVP is a new capability. No existing spec requirements are changing.

## Impact

- **Database**: Schema migration adding `attendees`, `registration_log` tables; `events` table extended with `capacity` and `attendeeCount`
- **Backend API**: 4 new endpoints under `/events/:eventId/` namespace
- **Permissions**: 5 new codes added to auth system
- **Frontend**: New components in `apps/client/src/modules/events/components/`
- **State machine**: New state transition logic for registration lifecycle
- **Concurrency**: Interactive transactions for capacity-safe registration
