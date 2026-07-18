## ADDED Requirements

### Requirement: Authenticated user can self-register for an event
The system SHALL allow authenticated users to register for events via `POST /events/:eventId/register`.
Registration SHALL be idempotent — if the user is already CONFIRMED, return success with current status.

#### Scenario: Successful registration within capacity
- **WHEN** an authenticated user sends POST /events/:eventId/register
- **AND** the event exists
- **AND** current attendeeCount is less than capacity (or capacity is 0/unlimited)
- **AND** the user is not already registered
- **THEN** the system SHALL create an attendee record with status CONFIRMED
- **AND** increment event.attendeeCount by 1
- **THEN** return 201 with attendee details

#### Scenario: Registration when event is at capacity
- **WHEN** an authenticated user sends POST /events/:eventId/register
- **AND** current attendeeCount equals capacity (capacity > 0)
- **AND** the user is not already registered
- **THEN** the system SHALL create an attendee record with status WAITLIST
- **AND** NOT increment attendeeCount
- **THEN** return 201 with attendee details and status WAITLIST

#### Scenario: Registration for event with capacity=0 (unlimited)
- **WHEN** an authenticated user sends POST /events/:eventId/register
- **AND** the event has capacity = 0
- **THEN** the system SHALL create an attendee record with status CONFIRMED
- **AND** skip all capacity checks
- **AND** increment event.attendeeCount by 1
- **THEN** return 201 with attendee details

#### Scenario: Registration when user is already CONFIRMED
- **WHEN** an authenticated user sends POST /events/:eventId/register
- **AND** the user already has a CONFIRMED attendee record for this event
- **THEN** the system SHALL return 200 with existing attendee details

#### Scenario: Registration when user is already WAITLISTED
- **WHEN** an authenticated user sends POST /events/:eventId/register
- **AND** the user already has a WAITLIST attendee record for this event
- **THEN** the system SHALL return 200 with existing attendee details

#### Scenario: Registration for non-existent event
- **WHEN** an authenticated user sends POST /events/:eventId/register
- **AND** the event does not exist
- **THEN** the system SHALL return 404

#### Scenario: Registration for past event
- **WHEN** an authenticated user sends POST /events/:eventId/register
- **AND** the event's end date is in the past
- **THEN** the system SHALL return 400 with error "Cannot register for a past event"

#### Scenario: Registration without authentication
- **WHEN** an unauthenticated user sends POST /events/:eventId/register
- **THEN** the system SHALL return 401

#### Scenario: Cancelled user re-registers when capacity available
- **WHEN** an authenticated user sends POST /events/:eventId/register
- **AND** the user has a CANCELLED attendee record for this event
- **AND** current attendeeCount is less than capacity (or capacity is 0)
- **THEN** the system SHALL change the attendee status from CANCELLED to CONFIRMED
- **AND** increment event.attendeeCount by 1
- **THEN** return 200 with attendee details

#### Scenario: Cancelled user re-registers when event is at capacity
- **WHEN** an authenticated user sends POST /events/:eventId/register
- **AND** the user has a CANCELLED attendee record for this event
- **AND** current attendeeCount equals capacity (capacity > 0)
- **THEN** the system SHALL change the attendee status from CANCELLED to WAITLIST
- **AND** NOT increment attendeeCount
- **THEN** return 200 with attendee details and status WAITLIST

### Requirement: Authenticated user can cancel their own registration
The system SHALL allow authenticated users to cancel their registration via `DELETE /events/:eventId/register`.
Cancellation SHALL be a soft delete — the attendee status changes to CANCELLED.

#### Scenario: Successful cancellation
- **WHEN** an authenticated user sends DELETE /events/:eventId/register
- **AND** the user has a CONFIRMED or WAITLIST attendee record for this event
- **THEN** the system SHALL set attendee status to CANCELLED
- **AND** if status was CONFIRMED, decrement event.attendeeCount by 1
- **AND** return 200 with the cancelled attendee details

#### Scenario: Cancellation when no registration exists
- **WHEN** an authenticated user sends DELETE /events/:eventId/register
- **AND** the user has no attendee record for this event
- **THEN** the system SHALL return 404

#### Scenario: Cancellation when already cancelled
- **WHEN** an authenticated user sends DELETE /events/:eventId/register
- **AND** the user's attendee status is already CANCELLED
- **THEN** the system SHALL return 200 with existing cancelled details

### Requirement: Waitlist auto-promotion on cancellation
When a CONFIRMED attendee cancels, the system SHALL automatically promote the earliest WAITLIST attendee (FIFO by createdAt) to CONFIRMED status. This SHALL happen atomically within the same transaction.

#### Scenario: Waitlist promotion after cancellation frees a slot
- **WHEN** a CONFIRMED attendee cancels their registration
- **AND** there are WAITLIST attendees for the same event
- **THEN** the system SHALL change the earliest (by createdAt) WAITLIST attendee to CONFIRMED
- **AND** the attendeeCount SHALL remain unchanged (one left, one joined)
- **AND** the promoted attendee's status SHALL be CONFIRMED

#### Scenario: No promotion when waitlist is empty
- **WHEN** a CONFIRMED attendee cancels their registration
- **AND** there are no WAITLIST attendees
- **THEN** the system SHALL decrement attendeeCount by 1
- **AND** NOT attempt any promotion

### Requirement: Capacity validation is concurrency-safe
Registration and cancellation operations SHALL use Prisma interactive transactions with optimistic locking to prevent overselling under concurrent requests.

#### Scenario: Concurrent registration at capacity boundary
- **WHEN** two users simultaneously send POST /events/:eventId/register
- **AND** the event has exactly 1 remaining slot
- **THEN** exactly one user SHALL receive CONFIRMED status
- **AND** exactly one user SHALL receive WAITLIST status
- **AND** attendeeCount SHALL be incremented exactly once
