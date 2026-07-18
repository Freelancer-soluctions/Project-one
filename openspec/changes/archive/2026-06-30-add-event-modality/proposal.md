## Why

Events currently have no modality concept — all events are implicitly treated as in-person. There is no `meetingUrl` field, no `location` field, and no distinction between ONLINE, IN_PERSON, or HYBRID event types. This limits the platform to physical events only, missing the growing need for virtual and hybrid events.

Adding event modality enables the platform to support online meetings (with join links), in-person events (with location), and hybrid events (both), meeting modern event management requirements.

## What Changes

- Add `EventModality` enum (ONLINE, IN_PERSON, HYBRID) to Prisma schema as a native PostgreSQL enum
- Add `modality` field to the events model with a default of IN_PERSON
- Add `meetingUrl` (VarChar(500)) and `location` (VarChar(200)) fields to the events model with conditional nullability
- Enforce conditional field validation: ONLINE → meetingUrl required/location forbidden, IN_PERSON → location required/meetingUrl forbidden, HYBRID → both required
- Update Joi create/update schemas for events with modality + conditional validation
- Update Zod schema for client-side validation matching server rules
- Update EventDialog component to show modality selector + conditional fields
- Update EventList to display modality badge (camera/map-pin icons) and clickable meeting URL
- Update DAO, service, and controller layers to handle new fields
- Migration to add enum and columns, assigning IN_PERSON to all existing rows

## Capabilities

### New Capabilities
- `event-modality`: Event modality management — ONLINE/IN_PERSON/HYBRID enum, conditional field validation (meetingUrl/location), default assignment, and database migration

### Modified Capabilities
- *(No existing capabilities have requirement changes — modality is a new feature, not a modification of existing validation rules)*

## Impact

- **Database**: New PostgreSQL enum `EventModality`, new columns `modality`, `meetingUrl`, `location` on `events` table
- **Backend**: Prisma schema update, migration, Joi validation schemas, DAO, service, controller updates
- **Frontend**: EventDialog (modality selector), EventList (badge + meeting link), enums, helpers, Zod schema updates
- **Validation**: Conditional field enforcement at Joi + Zod + service layer
- **No breaking changes**: Existing rows get IN_PERSON default; existing API contracts preserved
