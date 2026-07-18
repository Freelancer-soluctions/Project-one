## Context

The `events` model currently supports hard-delete via `DELETE /events/:id`, which permanently removes rows from the database. The pending `add-event-rsvp` change will introduce an `attendees` table with a foreign key referencing `events.id`. Hard-deleting an event would orphan or cascade-delete RSVP records, losing historical participation data.

The existing codebase follows a layered architecture:

- **Prisma schema** (`prisma/schema.prisma`): `events` model with fields for title, description, speaker, start/end times, eventDate, createdBy, createdOn, updatedOn, eventTypeId. No soft-delete fields exist.
- **DAO** (`dao.js`): `deleteEventById` delegates to `prismaService.deleteRow()` (hard DELETE). `getAllEvents` builds a `where` filter with optional search query but no soft-delete filtering.
- **Service** (`service.js`): `deleteEventById` calls DAO with numeric ID. `getAllEvents` passes search + pagination.
- **Controller** (`controller.js`): `deleteEventById` extracts `req.params.id`, calls service. No authenticated user ID is passed.
- **Routes** (`routes.js`): DELETE requires `canDeleteEvents` permission. PATCH uses `canEditEvents`. GET uses `canViewEvents`.

Current `events` model (relevant fields):

```
model events {
  id          Int       @id @default(autoincrement())
  title       String    @db.VarChar(50)
  description String    @db.VarChar(200)
  speaker     String?   @db.VarChar(20)
  startTime   DateTime  @db.Time(0)
  endTime     DateTime  @db.Time(0)
  eventDate   DateTime  @db.Timestamp(3)
  createdBy   Int       @db.Integer
  createdOn   DateTime  @db.Timestamp(3)
  updatedOn   DateTime? @db.Timestamp(3)
  eventTypeId Int
  // No soft-delete fields exist
}
```

The change touches the entire vertical slice: Prisma schema → DAO → Service → Controller → Routes.

## Goals / Non-Goals

**Goals:**
- Add `deletedAt DateTime?` and `deletedBy Int?` (FK → users) to the `events` Prisma model
- Convert `DELETE /events/:id` from hard-delete to soft-delete (UPDATE sets `deletedAt` and `deletedBy`)
- `GET /events` automatically filters out soft-deleted events (`WHERE deletedAt IS NULL`)
- ADMIN role can view soft-deleted events via query parameter `?showDeleted=true`
- ADMIN and MANAGER roles can restore soft-deleted events via `PATCH /events/:id` clearing `deletedAt` and `deletedBy`
- Preserve audit trail of who deleted each event and when
- Maintain backward compatibility for non-deleted event queries

**Non-Goals:**
- No changes to other models (notes, news, products, etc.)
- No introduction of Prisma middleware or lifecycle hooks
- No changes to event creation logic
- No physical data migration of existing events (existing rows remain unaffected; they implicitly have `deletedAt = NULL`)
- No new HTTP endpoints — restore reuses the existing PATCH route
- No changes to the `add-event-rsvp` schema directly (only a design note update)

## Decisions

### Decision 1: Soft-delete with `deletedAt` + `deletedBy` audit columns

**Choice**: Add two nullable columns — `deletedAt DateTime?` (timestamp of soft-delete) and `deletedBy Int?` (FK → users.id), with a Prisma relation `userEventDeleted`.

**Rationale**:
- `deletedAt` alone suffices for filtering, but `deletedBy` is essential for audit trails (who deleted the event?).
- The pattern mirrors the existing `createdBy`/`updatedBy` audit convention already used across the schema (e.g., `products.updatedBy`, `notes.createdBy`).
- Nullable by nature: `NULL` means "not deleted", any timestamp means "deleted at this time".
- Single responsibility: no need for an `isDeleted` boolean flag when `deletedAt IS NOT NULL` conveys the same information.
- Prisma relation enforces referential integrity: `userEventDeleted users? @relation("userEventDeleted", fields: [deletedBy], references: [id])`.

**Alternatives considered**:
- *Separate `deleted_events` table*: Over-engineered for this use case; unnecessary complexity for a simple audit trail.
- *Boolean `isDeleted`*: Doesn't capture *when* the deletion happened; would need a separate `deletedAt` anyway.
- *Prisma middleware/soft-delete plugin*: Adds magic behavior — explicit DAO changes are more maintainable and debuggable.

### Decision 2: DAO-level soft-delete (not Prisma middleware)

**Choice**: Implement soft-delete logic directly in the DAO layer, not through Prisma middleware or interceptors.

**Rationale**:
- Explicit: The `deleteEventById` DAO function changes from `prisma.events.delete()` to `prisma.events.update()`.
- The `getAllEvents` DAO adds `deletedAt: null` to the `where` clause by default.
- No implicit behavior — developers reading the DAO can see exactly what happens.
- The existing `prismaService.deleteRow()` utility is NOT reused; soft-delete bypasses it entirely.
- `updatedOn` is also updated during soft-delete (`updatedOn = new Date()`) for audit consistency.

**Alternatives considered**:
- *Prisma middleware (`$use`)*: Would intercept ALL delete operations globally. Too broad — we only want soft-delete for `events`, not other models. Harder to test.
- *Service-layer UPDATE call*: The service would call `updateEventById` with `deletedAt`/`deletedBy`. This conflates "update event properties" with "soft-delete event" — semantic confusion. A dedicated `softDeleteEventById` in DAO is clearer.

### Decision 3: Restore via existing PATCH endpoint with role guard

**Choice**: Reuse `PATCH /events/:id` to support restoring soft-deleted events. When the request body includes `deletedAt: null` and `deletedBy: null`, and the caller has `canEditEvents` permission, the service clears both fields.

**Rationale**:
- No new route needed — keeps the API surface small.
- PATCH semantics naturally support partial updates; clearing `deletedAt` is a valid partial update.
- The restore case is distinguished at the service layer: if `deletedAt` is explicitly set to `null` in the body AND the current event is soft-deleted, treat it as a restore.
- Permission check: `canEditEvents` (already exists, no seed needed). ADMIN and MANAGER roles already have this permission.

**Combined restore+update**: When a PATCH sends `{ "deletedAt": null, "title": "New Title" }`, BOTH operations are applied: the event is restored AND the title is updated. The service processes restore first, then applies remaining field updates normally.

**Alternatives considered**:
- *New `POST /events/:id/restore` endpoint*: REST-pure but adds unnecessary routing when PATCH already handles partial updates.
- *Dedicated `PATCH /events/:id/restore`*: Same problem — redundant route.
- *New `canRestoreEvents` permission*: Rejected in favor of simpler `canEditEvents`; no seed migration needed.

### Decision 4: Query filtering with `showDeleted` query parameter

**Choice**: `GET /events` always filters out soft-deleted events (`WHERE deletedAt IS NULL`). ADMIN users can override with `?showDeleted=true` to include soft-deleted events in results.

**Rationale**:
- Default behavior is invisible to all users — no breaking change for normal operations.
- The `showDeleted` param is validated by Joi/Zod schemas (`EventsFilters` / `EventsFiltersSchema`) and passed through service → DAO.
- Only ADMIN role is allowed to pass `showDeleted=true`. MANAGER and USER roles receive HTTP 403.
- Guard implementation: controller-level check — after extracting `showDeleted`, verify `req.userRole === 'ADMIN'` or 403. The middleware `checkRoleAuthOrPermisssion` already passes all roles (ADMIN, MANAGER, USER) for GET; the additional restriction is applied in the controller.
- Implementation: the DAO `where` clause conditionally includes or omits the `deletedAt: null` filter.

**Alternatives considered**:
- *Separate `GET /events/deleted` endpoint*: Duplicates the existing list endpoint for a rare use case.
- *Always include deleted for ADMIN*: ADMIN would need filtering control; `showDeleted` is more granular.
- *Middleware-level guard*: Would require new custom middleware; controller-level is simpler.

### Decision 5: Controller passes authenticated user ID for audit trail

**Choice**: The controller `deleteEventById` passes `req.userId` (from JWT token) to the service, which forwards it to the DAO for `deletedBy`.

**Rationale**:
- Currently the controller does NOT pass `userId` to `deleteEventById` — only `req.params.id`. This is a gap that needs filling to support `deletedBy`.
- The pattern is already established in `createEvent` (controller passes `userId` → service → DAO).
- The service layer signature changes from `deleteEventById(id)` to `deleteEventById(id, userId)`.

### Decision 6: Soft-delete updates `updatedOn`

**Choice**: When soft-deleting an event, also update `updatedOn = new Date()`.

**Rationale**:
- Without this, a soft-deleted event shows a stale `updatedOn` timestamp from before deletion, which is misleading.
- Consistent with the existing pattern: every state-changing operation updates `updatedOn`.

### Decision 7: Non-existent vs already-deleted distinction in DAO

**Choice**: The DAO `softDeleteEventById` function uses `findUnique` first to check existence + `deletedAt` state before the `update`. Returns `{ status: 'not-found' | 'already-deleted' | 'deleted', event }` for the service to handle.

**Rationale**:
- `prisma.events.update()` throws `Prisma.NotFoundError` for a missing ID but can't distinguish "exists but already deleted" from "doesn't exist".
- Explicit pre-check enables distinct HTTP responses: 404 for non-existent, 409 Conflict for already-deleted.
- Debug logging distinguishes the two cases for observability.

## Risks / Trade-offs

- **Breaking change**: `DELETE /events/:id` changes semantics from hard-delete to soft-delete. API consumers who expect hard-delete (e.g., for GDPR deletion or space reclamation) will no longer get permanent removal. A dedicated hard-delete endpoint (`DELETE /events/:id/force`) may be needed later.
  → **Risk**: Low — current consumers are internal. Mitigation: document the semantic change in API changelog.

- **RSVP FK constraint**: The `add-event-rsvp` change previously specified `onDelete: Cascade` on the attendees FK. With soft-delete, no hard DELETE occurs, so the cascade never triggers. Updated M7 in `add-event-rsvp/design.md` now specifies `onDelete: Restrict` — if a hard-delete is ever attempted, the FK constraint prevents it, preserving data integrity.

  → **Risk**: Low. Soft-delete protects data by design.

- **Permission escalation**: Reusing `canEditEvents` for restore means any user with event edit permission can restore deleted events. This is acceptable because:
  - Only ADMIN/MANAGER roles have `canEditEvents` in practice.
  - Restore is an edit operation semantically.
