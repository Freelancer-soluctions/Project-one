# event-modality Specification

## Purpose

Events in the system require a modality classification (ONLINE, IN_PERSON, HYBRID) to determine whether a meeting URL, physical location, or both are needed. This spec defines the event modality enum, conditional field validation rules, and the UI/API contracts for creating, updating, and displaying event modality.

## Requirements

### Requirement: Event Modality Enum

Every event MUST have a `modality` field with value `ONLINE`, `IN_PERSON`, or `HYBRID`, backed by a Prisma enum `EventModality`, with all pre-existing rows migrated to `IN_PERSON`.

#### Scenario: Event carries a modality

- **GIVEN** the system, **WHEN** an event is created or updated, **THEN** it MUST have a `modality` field with value `ONLINE`, `IN_PERSON`, or `HYBRID`
- **GIVEN** the database, **WHEN** the migration runs, **THEN** a Prisma enum `EventModality` MUST exist with values `ONLINE`, `IN_PERSON`, `HYBRID`
- **GIVEN** existing events, **WHEN** the migration runs, **THEN** all existing rows MUST have `modality` set to `IN_PERSON`

### Requirement: meetingUrl Field

`meetingUrl` SHALL be required with a valid URI for ONLINE/HYBRID events, forbidden for IN_PERSON, and stored as a nullable `VarChar(500)`.

#### Scenario: meetingUrl per modality

- **GIVEN** an event with modality `ONLINE` or `HYBRID`, **WHEN** the event is created or updated, **THEN** `meetingUrl` MUST be required and contain a valid URI
- **GIVEN** an event with modality `IN_PERSON`, **WHEN** the event is created or updated, **THEN** `meetingUrl` MUST be forbidden
- **GIVEN** the database, **WHEN** the migration runs, **THEN** a `meetingUrl` column MUST exist as `VarChar(500)` nullable

### Requirement: location Field on Create

On create, `location` SHALL be required for IN_PERSON/HYBRID, forbidden for ONLINE, and stored as a nullable `VarChar(200)`.

#### Scenario: location per modality on create

- **GIVEN** a new event with modality `IN_PERSON` or `HYBRID`, **WHEN** the event is created, **THEN** `location` MUST be required
- **GIVEN** a new event with modality `ONLINE`, **WHEN** the event is created, **THEN** `location` MUST be forbidden
- **GIVEN** the database, **WHEN** the migration runs, **THEN** a `location` column MUST exist as `VarChar(200)` nullable

### Requirement: location Field on Update (legacy-safe)

On update, missing `location` for IN_PERSON/HYBRID MUST succeed (preserving a legacy null), a provided `location` MUST be a non-empty string, and switching to ONLINE MUST clear it.

#### Scenario: location per modality on update

- **GIVEN** an existing event with modality `IN_PERSON` or `HYBRID`, **WHEN** the event is updated and `location` is not provided, **THEN** the update MUST succeed (preserve existing null location)
- **GIVEN** an existing event with modality `IN_PERSON` or `HYBRID`, **WHEN** the event is updated and `location` IS provided, **THEN** it MUST be a non-empty string
- **GIVEN** an existing event with modality changed to `ONLINE`, **WHEN** the event is updated, **THEN** `location` MUST be removed (set null)

### Requirement: Joi Validation on Create Event

`EventsCreateSchema` SHALL require `modality` and enforce conditional `meetingUrl`/`location` based on the modality value using `.when()`.

#### Scenario: Create schema enforces modality conditionals

- **GIVEN** the `EventsCreateSchema`, **WHEN** validating a create request, **THEN** it MUST require `modality` and enforce conditional `meetingUrl`/`location` based on modality value using `.when()`

### Requirement: Joi Validation on Update Event

`EventsUpdateSchema` SHALL treat `modality` as optional, enforce conditionals when provided, defer to the service layer when absent, and clear fields forbidden by the new modality.

#### Scenario: Update schema and service-layer conditionals

- **GIVEN** the `EventsUpdateSchema`, **WHEN** validating an update request, **THEN** `modality` MUST be optional
- **GIVEN** an update WITH `modality` provided, **THEN** conditional `meetingUrl`/`location` MUST be enforced based on the new modality value
- **GIVEN** an update WITHOUT `modality`, **WHEN** `meetingUrl` or `location` is provided, **THEN** validation MUST pass at Joi level — the service layer MUST validate these fields against the event's CURRENT modality in the database
- **GIVEN** any modality change, **THEN** fields forbidden by the NEW modality MUST be cleared (set to null): IN_PERSON → ONLINE clears `location` and requires `meetingUrl`; ONLINE → IN_PERSON clears `meetingUrl` and requires `location`; HYBRID → ONLINE clears `location`; HYBRID → IN_PERSON clears `meetingUrl`; IN_PERSON/ONLINE → HYBRID clears nothing (both fields valid)

### Requirement: Joi Validation on EventsFilters

The `EventsFilters` schema SHALL accept `modality` as an optional filter parameter with any enum value.

#### Scenario: Filter by modality

- **GIVEN** the `EventsFilters` schema, **WHEN** filtering events, **THEN** `modality` MUST be an optional filter parameter accepting any of the enum values

### Requirement: Zod Validation on EventDialog

The `EventsDialogSchema` SHALL require `modality` as a string and enforce conditional meetingUrl/location presence, with `location` optional on edit for IN_PERSON/HYBRID (legacy null allowed).

#### Scenario: Dialog schema conditionals

- **GIVEN** the `EventsDialogSchema`, **WHEN** validating the form on the client, **THEN** `modality` MUST be a required string
- **GIVEN** a new event (create mode), **THEN** conditional validation MUST enforce meetingUrl/location presence based on modality: ONLINE → meetingUrl required and location forbidden; IN_PERSON → location required and meetingUrl forbidden; HYBRID → both required
- **GIVEN** an existing event (edit mode), **THEN** `location` MUST be optional for IN_PERSON/HYBRID (allow legacy null) and `meetingUrl` MUST follow create rules

### Requirement: EventDialog UI

The EventDialog component SHALL render a modality Select (ONLINE/IN_PERSON/HYBRID) and conditionally show the meetingUrl and/or location inputs based on the selection.

#### Scenario: Conditional dialog inputs

- **GIVEN** the EventDialog component, **WHEN** creating or editing an event, **THEN** it MUST render a modality Select (ONLINE/IN_PERSON/HYBRID) and conditionally show meetingUrl Input and/or location Input based on selection

### Requirement: EventList Modality Badge

The EventList card SHALL display a modality badge next to the eventType badge with a camera icon (ONLINE), map-pin icon (IN_PERSON), or both (HYBRID).

#### Scenario: Badge rendering

- **GIVEN** the EventList component, **WHEN** rendering an event card, **THEN** it MUST display a modality badge next to the eventType badge with camera icon (ONLINE), map-pin icon (IN_PERSON), or both (HYBRID)

### Requirement: EventList Join Meeting Link

For ONLINE/HYBRID events, the EventList card SHALL display a clickable "Join meeting" link that opens `meetingUrl` in a new tab.

#### Scenario: Join meeting link

- **GIVEN** an event with modality `ONLINE` or `HYBRID`, **WHEN** rendering the event card, **THEN** it MUST display a clickable "Join meeting" link that opens `meetingUrl` in a new tab

### Requirement: Modality Icon Helper

The client helpers module SHALL expose `getModalityIcon(modality)` returning the appropriate icon component for each modality value.

#### Scenario: Icon helper

- **GIVEN** the client helpers module, **WHEN** rendering the modality badge, **THEN** `getModalityIcon(modality)` MUST return appropriate icon component for each modality value

### Requirement: Enum Constants

The client enums module SHALL expose `EventModalityCodes` with keys `ONLINE`, `IN_PERSON`, `HYBRID`.

#### Scenario: Client enum constants

- **GIVEN** the client enums module, **THEN** `EventModalityCodes` MUST exist with keys `ONLINE`, `IN_PERSON`, `HYBRID`
