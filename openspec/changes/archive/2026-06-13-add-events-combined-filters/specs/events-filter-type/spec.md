## ADDED Requirements

### Requirement: Filter events by event type ID
The system SHALL filter events by event type using exact match on the `eventTypeId` column. The `type` parameter SHALL be an integer representing the event type ID.

#### Scenario: Valid event type filter
- **WHEN** client sends `?type=3`
- **THEN** the system SHALL return only events where `eventTypeId` equals 3

#### Scenario: Missing type parameter (no filter)
- **WHEN** client does not include `type` in query params
- **THEN** the system SHALL NOT apply any event type filter

#### Scenario: Invalid type value
- **WHEN** client sends `?type=abc`
- **THEN** the system SHALL reject with a 400 validation error
