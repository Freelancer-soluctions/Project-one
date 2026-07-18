## ADDED Requirements

### Requirement: Admin can list all attendees for an event
The system SHALL allow authorized users with `canViewAttendees` permission to retrieve all attendees for an event via `GET /events/:eventId/attendees`.

#### Scenario: Successful attendee listing
- **WHEN** an authorized user sends GET /events/:eventId/attendees
- **AND** the event exists
- **THEN** the system SHALL return a paginated list of attendees
- **AND** each attendee SHALL include: id, userId, userName, status, createdAt, updatedAt
- **AND** by default SHALL include only non-CANCELLED attendees (CONFIRMED + WAITLIST)
- **AND** the `status` query param SHALL allow filtering by specific status values

#### Scenario: Attendee listing for non-existent event
- **WHEN** an authorized user sends GET /events/:eventId/attendees
- **AND** the event does not exist
- **THEN** the system SHALL return 404

#### Scenario: Attendee listing without permission
- **WHEN** an authenticated user without `canViewAttendees` permission sends GET /events/:eventId/attendees
- **THEN** the system SHALL return 403

### Requirement: Admin can update an attendee's status
The system SHALL allow authorized users with `canManageAttendees` permission to change an attendee's status via `PATCH /events/:eventId/attendees/:attendeeId`.

#### Scenario: Admin confirms a WAITLIST attendee
- **WHEN** an authorized user sends PATCH /events/:eventId/attendees/:attendeeId
- **AND** the attendee has status WAITLIST
- **AND** the event has available capacity (or unlimited)
- **AND** the request body includes `{ "status": "CONFIRMED" }`
- **THEN** the system SHALL update the attendee status to CONFIRMED
- **AND** increment attendeeCount by 1
- **THEN** return 200 with updated attendee details

#### Scenario: Admin confirms WAITLIST when event is at capacity
- **WHEN** an authorized user sends PATCH /events/:eventId/attendees/:attendeeId
- **AND** the attendee has status WAITLIST
- **AND** the event has no available capacity (attendeeCount >= capacity, capacity > 0)
- **AND** the request body includes `{ "status": "CONFIRMED" }`
- **THEN** the system SHALL return 409 Conflict with error "Event is at capacity"
- **AND** the attendee status SHALL remain WAITLIST

#### Scenario: Admin cancels an attendee
- **WHEN** an authorized user sends PATCH /events/:eventId/attendees/:attendeeId
- **AND** the request body includes `{ "status": "CANCELLED" }`
- **THEN** the system SHALL update the attendee status to CANCELLED
- **AND** if previous status was CONFIRMED, decrement attendeeCount by 1
- **AND** if there are WAITLIST attendees, promote the earliest
- **THEN** return 200 with updated attendee details

#### Scenario: Admin attempts invalid status transition
- **WHEN** an authorized user sends PATCH /events/:eventId/attendees/:attendeeId
- **AND** the request body includes an invalid status transition
- **THEN** the system SHALL return 400 with validation error

#### Scenario: Admin updates non-existent attendee
- **WHEN** an authorized user sends PATCH /events/:eventId/attendees/:attendeeId
- **AND** the attendee does not exist
- **THEN** the system SHALL return 404
