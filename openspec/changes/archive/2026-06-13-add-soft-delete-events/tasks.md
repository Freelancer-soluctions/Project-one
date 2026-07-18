## 1. Prisma Schema & Migration

- [x] 1.1 Add `deletedAt DateTime?`, `deletedBy Int?` (FK → users), and Prisma relation to the `events` model:
      ```
      userEventDeleted users? @relation("userEventDeleted", fields: [deletedBy], references: [id])
      ```
      Also add reverse relation on `users` model: `eventsDeleted events[] @relation("userEventDeleted")`
- [x] 1.2 Generate and run Prisma migration (`npm run prisma-migration` in apps/server) — migration created as `add_soft_delete_to_events` (database not running, migration file created; run `npx prisma migrate dev` when DB is available)
- [x] 1.3 Update any existing Prisma type references or seed scripts to account for new nullable fields — verified seed.js has no event records, no changes needed

## 2. DAO Layer — Soft Delete Operation

- [x] 2.1 Add `softDeleteEventById(id, userId)` method to DAO that calls `prisma.events.update()` with `deletedAt: new Date()`, `deletedBy: userId`, and `updatedOn: new Date()`
- [x] 2.2 Ensure `softDeleteEventById` does NOT use `prisma.events.delete()` or `prismaService.deleteRow()`
- [x] 2.3 Handle already-deleted event: use `findUnique` first to check existence + `deletedAt` state. Return `{ status: 'already-deleted' }` if `deletedAt` is not null (service translates to 409 Conflict)
- [x] 2.4 Handle non-existent event: return `{ status: 'not-found' }` if `findUnique` returns null (service translates to 404)

## 3. DAO Layer — Query Filtering (showDeleted)

- [x] 3.1 Modify `getAllEvents` to accept a `showDeleted` boolean parameter
- [x] 3.2 Add conditional `deletedAt: null` filter to the Prisma `where` clause when `showDeleted` is false
- [x] 3.3 Omit the `deletedAt: null` filter when `showDeleted` is true
- [x] 3.4 Ensure pagination count (`total`) reflects only non-deleted events when `showDeleted` is false

## 4. DAO Layer — Restore

- [x] 4.1 Add `restoreEventById(id)` method to DAO that calls `prisma.events.update()` setting `deletedAt: null` and `deletedBy: null`
- [x] 4.2 Handle restore of non-existent event (return null → service translates to 404)

## 5. Service Layer

- [x] 5.1 Update `deleteEventById(id, userId)` signature to accept `userId` and delegate to DAO's `softDeleteEventById`
- [x] 5.2 Update `getAllEvents(search, pagination, showDeleted)` to propagate `showDeleted` to DAO
- [x] 5.3 Add restore detection logic in the existing PATCH handler: if body contains `deletedAt: null` and event is soft-deleted, call `restoreEventById`
- [x] 5.4 Ensure non-deleted event with `deletedAt: null` in body is treated as a normal update (no-op on delete fields)
- [x] 5.5 Service translates DAO result: `{ status: 'not-found' }` → HTTP 404, `{ status: 'already-deleted' }` → HTTP 409 Conflict

## 6. Controller Layer

- [x] 6.1 Update `deleteEventById` controller to extract `req.userId` from JWT token and pass it to service as second argument
- [x] 6.2 Add `showDeleted` query parameter extraction and validation via Joi schema for `GET /events`
- [x] 6.3 Pass `showDeleted` through controller → service → DAO pipeline
- [x] 6.4 Block non-ADMIN roles from using `showDeleted=true` with HTTP 403 Forbidden

## 7. Schema Validation (Joi & Zod)

- [x] 7.1 Add `deletedAt: Joi.date().valid(null).optional().raw()` and `deletedBy: Joi.any().valid(null).optional()` to `EventsUpdateSchema` in `events.joi.js`
- [x] 7.2 Add `deletedAt: z.date().nullable().optional()` and `deletedBy: z.number().int().nullable().optional()` to `EventsUpdateSchema` in `events.zod.js`
- [x] 7.3 Add `showDeleted: Joi.boolean().truthy('true', '1').falsy('false', '0').optional()` to `EventsFilters` in `events.joi.js`
- [x] 7.4 Add `showDeleted: z.boolean().optional()` to `EventsFiltersSchema` in `events.zod.js`

## 8. Permissions & Route Validation

- [x] 8.1 Confirm `canDeleteEvents` permission still guards `DELETE /events/:id` (no change needed)
- [x] 8.2 Confirm `canEditEvents` permission guards restore via `PATCH /events/:id` (existing guard, no new permission needed)
- [x] 8.3 Controller-level guard: after extracting `showDeleted`, check `req.userRole === 'ADMIN'`. If non-ADMIN passes `showDeleted=true` → return HTTP 403
- [x] 8.4 Ensure Zod schema validation also applied to GET /events query (if not already)

## 9. Tests

- [x] 9.1 Write DAO unit test: `softDeleteEventById` updates fields instead of deleting (verify `deletedAt`, `deletedBy`, `updatedOn` set)
- [x] 9.2 Write DAO unit test: `softDeleteEventById` returns `{ status: 'not-found' }` for non-existent event
- [x] 9.3 Write DAO unit test: `softDeleteEventById` returns `{ status: 'already-deleted' }` for already-deleted event
- [x] 9.4 Write DAO unit test: `getAllEvents` adds `deletedAt: null` filter by default
- [x] 9.5 Write DAO unit test: `getAllEvents` omits `deletedAt` filter when `showDeleted=true`
- [x] 9.6 Write DAO unit test: `getAllEvents` with `showDeleted=true` includes deleted events in pagination `total` count
- [x] 9.7 Write DAO unit test: `restoreEventById` clears `deletedAt` and `deletedBy`
- [x] 9.8 Write service unit test: `deleteEventById` passes userId to DAO
- [x] 9.9 Write service unit test: restore detection triggers when PATCH body contains `deletedAt: null` on soft-deleted event
- [x] 9.10 Write service unit test: combined restore + field update applies both operations atomically
- [x] 9.11 Write integration test: `DELETE /events/:id` returns 200 and soft-deletes the event (verify `deletedAt` set, row still exists)
- [x] 9.12 Write integration test: `DELETE /events/:id` returns 409 Conflict for already-deleted event
- [x] 9.13 Write integration test: `DELETE /events/:id` returns 404 for non-existent event
- [x] 9.14 Write integration test: `GET /events` excludes soft-deleted events by default
- [x] 9.15 Write integration test: `GET /events?showDeleted=true` as ADMIN includes soft-deleted events
- [x] 9.16 Write integration test: `GET /events?showDeleted=true` pagination `total` includes deleted events
- [x] 9.17 Write integration test: `GET /events?showDeleted=true` as non-ADMIN returns 403
- [x] 9.18 Write integration test: `PATCH /events/:id` with `deletedAt: null` restores a soft-deleted event
- [x] 9.19 Write integration test: `PATCH /events/:id` with `deletedAt: null` on active event is a no-op
- [x] 9.20 Write integration test: `PATCH /events/:id` with `{ deletedAt: null, title: "New" }` restores AND updates simultaneously
- [x] 9.21 Write integration test: USER role cannot restore (returns 403)

## 10. Documentation & Cross-Change Note

- [x] 10.1 Verify `add-event-rsvp/design.md` M7 updated: FK uses `onDelete: Restrict` (not Cascade). Already applied — confirm on RSVP implementation.
- [x] 10.2 Document soft-delete behavior change in API changelog or documentation
