## ADDED Requirements

### Requirement: Filter events by upcoming/past status
The system SHALL derive event status from server UTC time compared to `eventDate` and `endTime` columns. The `status` parameter SHALL accept `upcoming`, `past`, or `all` (default).

#### Scenario: Upcoming events filter
- **WHEN** client sends `?status=upcoming`
- **THEN** the system SHALL return only events where `eventDate > today` OR (`eventDate == today` AND `endTime > now`) in server UTC

#### Scenario: Past events filter
- **WHEN** client sends `?status=past`
- **THEN** the system SHALL return only events where `eventDate < today` OR (`eventDate == today` AND `endTime <= now`) in server UTC

#### Scenario: All events (default)
- **WHEN** client sends `?status=all` or omits the `status` parameter
- **THEN** the system SHALL NOT apply any status-based filter

#### Scenario: Invalid status value
- **WHEN** client sends `?status=cancelled`
- **THEN** the system SHALL reject with a 400 validation error

#### Scenario: Status filter combined with date range
- **WHEN** client sends `?status=upcoming&dateFrom=2026-07-01&dateTo=2026-07-31`
- **THEN** the system SHALL return events that match BOTH the upcoming status AND the date range (AND logic)
