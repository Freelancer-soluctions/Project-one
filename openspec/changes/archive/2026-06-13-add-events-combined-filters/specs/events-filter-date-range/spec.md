## ADDED Requirements

### Requirement: Filter events by date range
The system SHALL filter events by a date range using `dateFrom` and `dateTo` ISO date string parameters. Both params SHALL be optional and inclusive.

#### Scenario: Both dateFrom and dateTo provided
- **WHEN** client sends `?dateFrom=2026-06-01&dateTo=2026-06-30`
- **THEN** the system SHALL return only events where `eventDate` is between 2026-06-01 and 2026-06-30 (inclusive)

#### Scenario: Only dateFrom provided
- **WHEN** client sends `?dateFrom=2026-07-01`
- **THEN** the system SHALL return only events where `eventDate` is on or after 2026-07-01

#### Scenario: Only dateTo provided
- **WHEN** client sends `?dateTo=2026-06-30`
- **THEN** the system SHALL return only events where `eventDate` is on or before 2026-06-30

#### Scenario: No date params provided
- **WHEN** client does not include `dateFrom` or `dateTo`
- **THEN** the system SHALL NOT apply any date range filter

#### Scenario: Invalid date format
- **WHEN** client sends `?dateFrom=not-a-date`
- **THEN** the system SHALL reject with a 400 validation error

#### Scenario: dateTo before dateFrom
- **WHEN** client sends `?dateFrom=2026-07-01&dateTo=2026-06-01`
- **THEN** the system SHALL return an empty result set (no events match the inverted range)
