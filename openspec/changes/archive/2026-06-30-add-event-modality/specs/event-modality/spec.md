# Spec: event-modality

## ADDED Requirements

### RM-01: Event Modality Enum
- GIVEN the system, WHEN an event is created or updated, THEN it MUST have a `modality` field with value `ONLINE`, `IN_PERSON`, or `HYBRID`.
- GIVEN the database, WHEN the migration runs, THEN a Prisma enum `EventModality` MUST exist with values `ONLINE`, `IN_PERSON`, `HYBRID`.
- GIVEN existing events, WHEN the migration runs, THEN all existing rows MUST have `modality` set to `IN_PERSON`.

### RM-02: meetingUrl Field
- GIVEN an event with modality `ONLINE` or `HYBRID`, WHEN the event is created or updated, THEN `meetingUrl` MUST be required and contain a valid URI.
- GIVEN an event with modality `IN_PERSON`, WHEN the event is created or updated, THEN `meetingUrl` MUST be forbidden.
- GIVEN the database, WHEN the migration runs, THEN a `meetingUrl` column MUST exist as `VarChar(500)` nullable.

### RM-03: location Field — Create
- GIVEN a new event with modality `IN_PERSON` or `HYBRID`, WHEN the event is created, THEN `location` MUST be required.
- GIVEN a new event with modality `ONLINE`, WHEN the event is created, THEN `location` MUST be forbidden.
- GIVEN the database, WHEN the migration runs, THEN a `location` column MUST exist as `VarChar(200)` nullable.

### RM-03a: location Field — Update (legacy-safe)
- GIVEN an existing event with modality `IN_PERSON` or `HYBRID`, WHEN the event is updated and `location` is not provided, THEN the update MUST succeed (preserve existing null location).
- GIVEN an existing event with modality `IN_PERSON` or `HYBRID`, WHEN the event is updated and `location` IS provided, THEN it MUST be a non-empty string.
- GIVEN an existing event with modality changed to `ONLINE`, WHEN the event is updated, THEN `location` MUST be removed (set null).

### RM-04: Joi Validation — Create Event
- GIVEN the `EventsCreateSchema`, WHEN validating a create request, THEN it MUST require `modality` and enforce conditional `meetingUrl`/`location` based on modality value using `.when()`.

### RM-05: Joi Validation — Update Event
- GIVEN the `EventsUpdateSchema`, WHEN validating an update request, THEN `modality` MUST be optional.
- GIVEN an update WITH `modality` provided, THEN conditional `meetingUrl`/`location` MUST be enforced based on the new modality value.
- GIVEN an update WITHOUT `modality`, WHEN `meetingUrl` or `location` is provided, THEN validation MUST pass at Joi level — the service layer MUST validate these fields against the event's CURRENT modality in the database.
- GIVEN any modality change, THEN fields forbidden by the NEW modality MUST be cleared (set to null):
  - IN_PERSON → ONLINE: `location` cleared, `meetingUrl` required
  - ONLINE → IN_PERSON: `meetingUrl` cleared, `location` required
  - HYBRID → ONLINE: `location` cleared
  - HYBRID → IN_PERSON: `meetingUrl` cleared
  - IN_PERSON/ONLINE → HYBRID: no clearing (both fields valid)

### RM-06: Joi Validation — EventsFilters
- GIVEN the `EventsFilters` schema, WHEN filtering events, THEN `modality` MUST be an optional filter parameter accepting any of the enum values.

### RM-07: Zod Validation — EventDialog
- GIVEN the `EventsDialogSchema`, WHEN validating the form on the client, THEN `modality` MUST be a required string.
- GIVEN a new event (create mode), THEN conditional validation MUST enforce meetingUrl/location presence based on modality:
  - ONLINE → meetingUrl required, location forbidden
  - IN_PERSON → location required, meetingUrl forbidden
  - HYBRID → both required
- GIVEN an existing event (edit mode), THEN `location` MUST be optional for IN_PERSON/HYBRID (allow legacy null). `meetingUrl` MUST follow create rules.

### RM-08: EventDialog — UI
- GIVEN the EventDialog component, WHEN creating or editing an event, THEN it MUST render a modality Select (ONLINE/IN_PERSON/HYBRID) and conditionally show meetingUrl Input and/or location Input based on selection.

### RM-09: EventList — Modality Badge
- GIVEN the EventList component, WHEN rendering an event card, THEN it MUST display a modality badge next to the eventType badge with camera icon (ONLINE), map-pin icon (IN_PERSON), or both (HYBRID).

### RM-10: EventList — Join Meeting Link
- GIVEN an event with modality `ONLINE` or `HYBRID`, WHEN rendering the event card, THEN it MUST display a clickable "Join meeting" link that opens `meetingUrl` in a new tab.

### RM-11: Helper Function
- GIVEN the client helpers module, WHEN rendering modality badge, THEN `getModalityIcon(modality)` MUST return appropriate icon component for each modality value.

### RM-12: Enum Constants
- GIVEN the client enums module, THEN `EventModalityCodes` MUST exist with keys `ONLINE`, `IN_PERSON`, `HYBRID`.
