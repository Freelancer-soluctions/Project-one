# Event RSVP Audit

## Purpose
Ensures all attendee status changes are recorded in an immutable, append-only audit log.

## Requirements

### Requirement: All registration state changes are logged
The system SHALL record every attendee status change in the `registration_log` table. Each log entry SHALL include: attendeeId, previousStatus, newStatus, changedBy (userId), and timestamp.

#### Scenario: Log entry created on registration
- **WHEN** a user registers for an event
- **AND** an attendee record is created with status CONFIRMED or WAITLIST
- **THEN** a registration_log entry SHALL be created
- **AND** previousStatus SHALL be NULL
- **AND** newStatus SHALL match the attendee's initial status
- **AND** changedBy SHALL be the registering user's ID

#### Scenario: Log entry created on self-cancellation
- **WHEN** a user cancels their own registration
- **AND** attendee status changes from CONFIRMED/WAITLIST to CANCELLED
- **THEN** a registration_log entry SHALL be created
- **AND** previousStatus SHALL be the prior status
- **AND** newStatus SHALL be CANCELLED
- **AND** changedBy SHALL be the cancelling user's ID

#### Scenario: Log entry created on admin status change
- **WHEN** an admin updates an attendee's status via PATCH
- **THEN** a registration_log entry SHALL be created
- **AND** changedBy SHALL be the admin's user ID

#### Scenario: Log entry created on waitlist promotion
- **WHEN** a WAITLIST attendee is automatically promoted to CONFIRMED
- **THEN** a registration_log entry SHALL be created
- **AND** changedBy SHALL be the system (NULL or special system user ID)
- **AND** previousStatus SHALL be WAITLIST
- **AND** newStatus SHALL be CONFIRMED

### Requirement: Registration log is immutable and append-only
The system SHALL NOT allow update or deletion of registration_log entries. The logs SHALL be append-only.

#### Scenario: Cannot modify log entry
- **WHEN** any user attempts to UPDATE a registration_log record
- **THEN** the system SHALL reject the operation (no update endpoint exposed; Prisma model has no update exposed)

#### Scenario: Cannot delete log entry
- **WHEN** any user attempts to DELETE a registration_log record
- **THEN** the system SHALL reject the operation (no delete endpoint exposed; Prisma model has no delete exposed)
