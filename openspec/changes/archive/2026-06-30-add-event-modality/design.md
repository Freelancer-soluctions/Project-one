## Context

The platform currently treats all events as in-person with no modality distinction. There is no `meetingUrl` or `location` field — events have no way to express where or how they take place. The Prisma schema, Joi validation, Zod schemas, DAO, service, controller, and UI components all assume a single implicit modality.

This change introduces explicit event modality (ONLINE, IN_PERSON, HYBRID) with conditional field validation, enabling the platform to support virtual, physical, and hybrid events.

**Stakeholders:** Event organizers (create/manage events), Attendees (filter/view events), Platform operators (migration & backward compatibility)

**Constraints:**
- Must not break existing events — all existing rows get `IN_PERSON` default
- Must enforce strict conditional field rules at multiple layers (DB, API, client)
- Must keep UI changes scoped to EventDialog and EventList

## Goals / Non-Goals

**Goals:**
- Add PostgreSQL enum `EventModality` with values: ONLINE, IN_PERSON, HYBRID
- Add `modality`, `meetingUrl`, `location` columns to the `events` table
- Enforce conditional validation: ONLINE → meetingUrl required/location null; IN_PERSON → location required/meetingUrl null; HYBRID → both required
- Update Prisma schema with enum + model fields
- Generate migration with default IN_PERSON for existing rows
- Update Joi `EventsCreateSchema` and `EventsUpdateSchema` with modality + conditional `.when()` rules
- Update Zod `EventsDialogSchema` with `.refine()` for conditional field presence
- Add `modality` filter to EventsFilters
- Update EventDialog with modality Select, conditional meetingUrl Input + location Input
- Update EventList with modality badge (icons) and clickable meeting URL link
- Add `getModalityIcon()` helper and `EventModalityCodes` enum object
- Update DAO, service, and controller layers to handle new fields end-to-end

**Non-Goals:**
- No UI for filtering by modality in EventList (filters exist at API layer only — UI filter controls deferred)
- No calendar/date changes related to modality
- No pricing or capacity changes based on modality
- No recurring event modality support
- No iCal/export changes
- No permission changes (any organizer can set any modality)

## Decisions

### D1: PostgreSQL native enum via Prisma `enum` keyword
**Decision:** Use Prisma's `enum` keyword at schema level (`enum EventModality { ONLINE IN_PERSON HYBRID }`). Prisma auto-generates the native PostgreSQL `CREATE TYPE` in the migration SQL.
**Rationale:** Prisma's `enum` keyword maps to PostgreSQL native enums. No custom `@pgEnum` attribute exists — Prisma handles the translation automatically. This matches existing patterns in the codebase (`warehouseStatus`, `unitMeasureStock`).
**Alternative considered:** Prisma string enum (`modality String`) with app-level validation — rejected because it allows invalid data to enter the DB via direct queries or migrations.

### D2: Strict conditional field validation
**Decision:** Enforce modality-based field presence strictly at ALL layers:
- DB: CHECK constraint or app-level nullability via Prisma optional fields + application validation
- API (Joi): `.when('modality', ...)` rules for create + update schemas
- Client (Zod): `.refine()` matching server rules
- Service layer: defensive validation

**Rationale:** Consistent enforcement prevents data integrity issues. Each layer acts as a defense-in-depth barrier.
**Rules:** ONLINE → meetingUrl=required, location=forbidden(null); IN_PERSON → location=required, meetingUrl=forbidden(null); HYBRID → both=required

### D3: Default value selection
**Decision:** Default to `IN_PERSON` at both Prisma schema level (`@default(IN_PERSON)`) and migration level (`ALTER COLUMN SET DEFAULT 'IN_PERSON'`).
**Rationale:** Maintains backward compatibility — all existing and new events without explicit modality default to the historically implicit behavior. IN_PERSON is the safest default as it represents the current behavior.
**Alternative considered:** Default to ONLINE (more modern) — rejected because it would change behavior for existing events and organizers who set up events without specifying modality.

### D4: Field types and sizes
**Decision:**
- `meetingUrl`: `String? @db.VarChar(500)` — URI format validation
- `location`: `String? @db.VarChar(200)` — plain text
- Both nullable at DB level; conditional validation enforced at app level

**Rationale:** VarChar(500) accommodates long meeting URLs with query parameters. VarChar(200) is sufficient for physical addresses. Nullable DB columns with app-level conditional rules give flexibility — the DB constraint is not a CHECK constraint because Prisma's optional fields handle nullability.

### D5: Client-side icon approach
**Decision:** Use `lucide-react` icons (already a dependency via shadcn/ui): `Video` for ONLINE, `MapPin` for IN_PERSON, `Globe` (or `Video`+`MapPin` combo) for HYBRID. Create a `getModalityIcon(modality)` helper in a shared `helpers.js`.
**Rationale:** Avoids adding a new icon library. lucide-react is already bundled. A helper function centralizes the icon mapping.

### D6: Meeting URL display in EventList
**Decision:** Show the meeting URL as a clickable external link when modality is ONLINE or HYBRID. Open in new tab (`target="_blank" rel="noopener noreferrer"`). Show a "Join meeting" label with the Video icon.
**Rationale:** Users expect to click to join. New tab prevents losing their place on the event list.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| [Data Integrity] Existing rows lack location even though they're IN_PERSON (default) | Migration sets IN_PERSON without location. Location is required on CREATE but OPTIONAL on UPDATE — existing events keep null location until explicitly set. Future enhancement: prompt organizers to fill missing location. |
| [Validation Gap] Service layer bypasses Joi/Zod validation — raw Prisma calls could skip rules | Add defensive validation in the service layer that mirrors Joi rules before calling Prisma. |
| [UX Confusion] Organizers might not understand conditional field behavior | Use clear labels, placeholders, and disabled/hidden states in the form. Add helper text: "For online events, provide a meeting URL" / "For in-person events, provide a location." |
| [Migration Rollback] Dropping enum and columns is a destructive operation | Migration is additive only (new enum, nullable columns). Rollback restores a backup or runs the down migration. Enum removal requires a multi-step migration (alter column type, drop enum). |
| [Performance] Adding columns to a large events table | Migration runs `ALTER TABLE ... ADD COLUMN ... DEFAULT` which is a metadata-only operation in PostgreSQL (no table rewrite for nullable columns with non-volatile default). No performance concern. |

## Migration Plan

### Up Migration
Prisma auto-generates migration SQL from changes in `schema.prisma`:
- Adds `enum EventModality { ONLINE IN_PERSON HYBRID }` → generates `CREATE TYPE "EventModality"`
- Adds `modality EventModality @default(IN_PERSON)` → generates `ALTER TABLE ... ADD COLUMN "modality" ... DEFAULT 'IN_PERSON'`
- Adds `meetingUrl String? @db.VarChar(500)` → generates `ALTER TABLE ... ADD COLUMN "meetingUrl" VARCHAR(500)`
- Adds `location String? @db.VarChar(200)` → generates `ALTER TABLE ... ADD COLUMN "location" VARCHAR(200)`

Run: `npx prisma migrate dev --name add-event-modality`

### Rollback
`npx prisma migrate dev --name rollback-add-event-modality` or restore from backup.
**Note:** Rollback loses data. In production, prefer a forward fix.

### Deployment
- Schema changes rolled out via Prisma migration as part of the application deploy
- No downtime required (additive changes only)
- No data backfill needed — existing rows get IN_PERSON

## Open Questions

- Should the API expose modality as a filter parameter on the GET /events endpoint? — **Resolved:** Yes, add optional `modality` query param.
- Should the EventList show a filter dropdown for modality? — **Deferred:** Not in scope; will be a separate change.
- Should HYBRID events show both an icon or a combined icon? — **Resolved:** Show both Video + MapPin icons side by side.
- Should the DAO layer validate modality combinations or delegate entirely to service layer? — **Resolved:** Delegate to service layer; DAO is a thin data access wrapper.
E
