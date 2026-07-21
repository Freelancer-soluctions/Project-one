# Spec: ical-export

## ADDED Requirements

### Requirement: IE-01 — Single Event iCal Endpoint
The system SHALL expose `GET /api/v1/events/:id/ical` that returns an RFC 5545 compliant .ics file for a single event.

#### Scenario: IE-01a — Successful single event export
WHEN an authenticated user with `canViewEvents` sends `GET /api/v1/events/123/ical`
THEN the system returns `200 OK`
AND `Content-Type: text/calendar; charset=utf-8`
AND `Content-Disposition: attachment; filename="event-123.ics"`
AND the body is a valid iCalendar file with one VEVENT

#### Scenario: IE-01b — Event not found
WHEN GET /api/v1/events/999/ical is sent for a non-existent event
THEN the system returns `404 Not Found`

#### Scenario: IE-01c — Unauthenticated
WHEN a request without token is sent
THEN the system returns `401 Unauthorized`

#### Scenario: IE-01d — Unauthorized role
WHEN a user without `canViewEvents` sends the request
THEN the system returns `403 Forbidden`

### Requirement: IE-02 — RFC 5545 Compliant Output
The .ics output SHALL use `ical-generator` library with correct VTIMEZONE for America/Mexico_City.

#### Scenario: IE-02a — VCALENDAR structure
WHEN the .ics is generated
THEN output contains `BEGIN:VCALENDAR`, `VERSION:2.0`, `PRODID:-//Project One//Events//ES`, `END:VCALENDAR`

#### Scenario: IE-02b — VTIMEZONE block
WHEN the .ics is generated
THEN output contains `BEGIN:VTIMEZONE`, `TZID:America/Mexico_City`, and related STANDARD block (Mexico abolished DST 2022, UTC-6 fixed)

#### Scenario: IE-02c — VEVENT mapping
WHEN a VEVENT is generated for an event
THEN
- `UID` = `event-{id}@project-one`
- `SUMMARY` = event.title
- `DESCRIPTION` = event.description
- `DTSTART;TZID=America/Mexico_City` = eventDate (date) + startTime (HH:mm)
- `DTEND;TZID=America/Mexico_City` = eventDate (date) + endTime (HH:mm)
- `DTSTAMP` = current UTC timestamp
- `ORGANIZER;CN=Speaker Name` = event.speaker (if present)
- `URL` = `/events/{id}` (relative app URL)

#### Scenario: IE-02d — Special characters escaped
WHEN event.title or event.description contains commas, semicolons, backslashes, or newlines
THEN they are escaped per RFC 5545 text value encoding rules

### Requirement: IE-03 — Data Composition (date + time → datetime)
The system SHALL compose DTSTART/DTEND from the separate eventDate, startTime, and endTime fields.

#### Scenario: IE-03a — Composition logic
GIVEN eventDate = 2025-06-11T00:00:00.000Z and startTime = 09:00:00
WHEN composing DTSTART
THEN result = 20250611T090000 with TZID=America/Mexico_City
BECAUSE eventDate stores the date at midnight UTC and startTime is local Mexico City time

### Requirement: IE-04 — No VALARM
The generated .ics SHALL NOT include VALARM components.

#### Scenario: IE-04a — No alarm
WHEN inspecting the generated VEVENT
THEN no `BEGIN:VALARM` block is present

### Requirement: IE-05 — Export Service
The system SHALL create `src/modules/events/exportService.js` for iCal generation.

#### Scenario: IE-05a — generateIcal(event) function
WHEN exportService.generateIcal(event) is called with a single event object
THEN it returns a valid iCalendar string with one VEVENT entry
