## ADDED Requirements

### Requirement: Filter events by speaker name
The system SHALL filter events where the `speaker` column contains the query string using case-insensitive partial match.

#### Scenario: Partial speaker name match
- **WHEN** client sends `?speaker=john`
- **THEN** the system SHALL return events where speaker name contains "john" (case-insensitive, e.g. "John Doe", "JOHNSON")

#### Scenario: Exact speaker name match
- **WHEN** client sends `?speaker=Jane%20Smith`
- **THEN** the system SHALL return events where speaker name contains "Jane Smith"

#### Scenario: No matching speaker
- **WHEN** client sends `?speaker=NonExistentPerson`
- **THEN** the system SHALL return an empty result set

#### Scenario: Empty speaker parameter
- **WHEN** client sends `?speaker=`
- **THEN** the system SHALL NOT apply any speaker filter

#### Scenario: Speaker filter combined with searchQuery
- **WHEN** client sends `?speaker=john&searchQuery=workshop`
- **THEN** the system SHALL return events where speaker contains "john" AND (title/description/speaker contains "workshop")
