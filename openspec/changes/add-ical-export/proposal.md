## Why

Users need to sync events from the platform into their personal calendars (Google Calendar, Apple Calendar, Outlook). Currently, there is no export mechanism — users must manually copy event details. Adding iCal export enables one-click calendar integration, improving user experience and event adoption.

## What Changes

- Add a new `GET /api/v1/events/export/ical` endpoint that returns events in iCalendar (.ics) format
- Support optional date-range query parameters (`startDate`, `endDate`) to filter exported events
- Support optional `eventType` query parameter to filter by event type code
- Add the `ical-generator` npm dependency for RFC 5545 compliant iCal generation
- Return the response with `Content-Type: text/calendar` and `Content-Disposition: attachment` headers

## Capabilities

### New Capabilities
- `ical-export`: Generate and download an iCalendar (.ics) file containing platform events, with optional date-range and event-type filtering

### Modified Capabilities
- (none)

## Impact

- **Backend**: New route in `apps/server/src/modules/events/routes.js`, new controller method in `controller.js`, new service method in `service.js` (or a dedicated export service), and new `dao.js` query for filtered event retrieval
- **Dependencies**: Add `ical-generator` to `apps/server/package.json`
- **API**: New public endpoint at `/api/v1/events/export/ical` (authenticated, permission-gated)
- **Tests**: New integration tests for the export endpoint; unit tests for iCal generation logic
- **No database changes**: The existing `events` and `eventTypes` models fully support the required data
