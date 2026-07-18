## 1. Database Schema & Migrations

- [ ] 1.1 Add `capacity` (Int, default 0) and `attendeeCount` (Int, default 0) fields to the `events` Prisma model
- [ ] 1.2 Create `attendees` Prisma model with fields: id (Int, autoincrement), eventId (Int, FK→events), userId (Int, FK→users), status (enum: CONFIRMED/WAITLIST/CANCELLED), createdAt, updatedAt.
      Add indexes: `@@index([eventId, status])` (for FIFO waitlist and COUNT queries), `@@index([eventId, userId])` (for find user's registration), `@@index([userId])` (for "my events" queries).
- [ ] 1.3 Create `registration_log` Prisma model with fields: id (Int, autoincrement), attendeeId (Int, FK→attendees), previousStatus (String? nullable), newStatus (String), changedBy (String? nullable — userId or null for system), createdAt.
      Add index: `@@index([eventId, createdOn])` — requires storing eventId or joining through attendees. Alternative: store eventId directly in registration_log for efficient audit queries.
- [ ] 1.4 Add composite unique constraint on (eventId, userId) for attendees where status != CANCELLED (partial unique index or app-level enforcement)
- [ ] 1.5 Add AttendeeStatus enum to Prisma schema (CONFIRMED, WAITLIST, CANCELLED)
- [ ] 1.6 Run Prisma migration to apply schema changes
- [ ] 1.7 Update event GET endpoints (list + detail) to include `attendeeCount` in the response payload

## 2. Permission Codes & Enums

- [ ] 2.1 Add `canRegisterForEvent` permission code to the PERMISSIONCODES enum (self-service registration)
- [ ] 2.2 Add `canCancelRegistration` permission code to the PERMISSIONCODES enum (self-service cancellation)
- [ ] 2.3 Add `canViewAttendees` permission code to the PERMISSIONCODES enum (admin list attendees)
- [ ] 2.4 Add `canManageAttendees` permission code to the PERMISSIONCODES enum (admin update attendee status)
- [x] 2.5 Add `canViewAttendeeDetail` permission code to the PERMISSIONCODES enum (view attendee details)
- [x] 2.6 Seed the 5 new permission codes into the `permissions` table (IDs 78-82, appended to prisma/seed.js)

## 3. State Machine Logic

- [x] 3.1 Create `stateMachine.js` module with valid transitions
      **Real path:** `src/modules/events/stateMachine.js`
      **Note:** `export default` removed — module only has named exports; never imported via default.
- [x] 3.2 Implement `canTransition(fromStatus, toStatus)` — returns boolean
- [x] 3.3 Implement `getAllowedNextStates(currentStatus)` — returns array of valid target states
- [x] 3.4 Export state machine functions for use in service layer

## 4. Joi Validation Schemas

- [x] 4.1 Create `schemas/event-rsvp.js` with registration params schema
      **Real path:** `src/modules/events/schemas/event-rsvp.js`
- [x] 4.2 Add admin attendee status update schema (status enum, reason optional string)
- [x] 4.3 Add attendee listing query schema (page, limit, status filter optional)
- **Note:** `events/schemas/events.zod.js` was removed — dead code, never imported anywhere.

## 5. DAO Layer

- [x] 5.0 Create `attendee/dao.js` (was `dao/eventAttendeeDao.js`) with transaction-aware Prisma functions
      **Real path:** `src/modules/events/attendee/dao.js`
      Functions: `findAttendeeByUserAndEvent`, `findAttendeeById`, `countConfirmedAttendees`, `findEarliestWaitlist`, `createAttendee`, `updateAttendeeStatus`, `incrementAttendeeCount`, `decrementAttendeeCount`, `createAuditLog`, `listAttendees`
      All functions accept an optional `transaction` parameter for use within Prisma interactive transactions.

## 6. Service Layer

- [x] 6.1 Create `attendee/service.js` (was `services/eventAttendeeService.js`) with `register(eventId, userId)`
      **Real path:** `src/modules/events/attendee/service.js`
      Handles: event validation, idempotency check, re-registration from CANCELLED, capacity check, status assignment, Prisma interactive transaction with optimistic lock, audit logging
- [x] 6.2 Implement `cancel(eventId, userId)` — soft delete via CANCELLED status
- [x] 6.3 Implement `listAttendees(eventId, query)` — paginated attendee listing
- [x] 6.4 Implement `updateAttendeeStatus(attendeeId, newStatus, adminUserId)` — admin status change
- [x] 6.5 Implement `promoteFromWaitlist(eventId)` — FIFO promotion via DAO
- [x] 6.6 Implement `createAuditLog(attendeeId, previousStatus, newStatus, changedBy)` — audit log entry
- [x] 6.7 Implement concurrency-safe registration with Prisma interactive transaction
      **Fix:** Optimistic lock now correctly increments attendeeCount only once (no double-increment bug).
      Registration is idempotent: returns existing attendee instead of throw 409 when already registered.

## 7. Controller & Routes (Attendee)

- [x] 7.1 Create `attendee/routes.js` (was `routes/eventAttendeeRoutes.js`) with Express Router using `mergeParams: true`
      **Real path:** `src/modules/events/attendee/routes.js`
- [x] 7.2 Implement `POST /events/:eventId/register` — handler in `attendee/controller.js`
- [x] 7.3 Implement `DELETE /events/:eventId/register` — handler in `attendee/controller.js`
- [x] 7.4 Implement `GET /events/:eventId/attendees` — admin listing handler in `attendee/controller.js`
- [x] 7.5 Implement `PATCH /events/:eventId/attendees/:attendeeId` — admin update handler in `attendee/controller.js`
- [x] 7.6 Mount attendee routes in main events router via `router.use('/:eventId', attendeeRoutes)`
- [x] 7.7 Update event GET endpoints to include `attendeeCount` in response
      **Note:** `events/controller.js` has event CRUD handlers only — no RSVP handlers
      **Note:** `capacity` field added to `EventsCreateSchema` and `EventsUpdateSchema` (Joi, optional)

## 8. Frontend — API Layer

- [ ] 8.1 Create API functions in `api/eventAttendeeApi.js`
- [ ] 8.2 Add RTK Query endpoints or fetch wrappers for RSVP operations

## 9. Frontend — Components

- [ ] 9.1 Create `AttendButton` component
- [ ] 9.2 Create `AttendeeStatus` component
- [ ] 9.3 Create `AttendeeList` component (admin)
- [ ] 9.4 Integrate `AttendButton` and `AttendeeStatus` into the event detail page
- [ ] 9.5 Integrate `AttendeeList` into the event admin view

## 10. Tests — Unit (52 tests passing)

- [x] 10.1 stateMachine.test.js — test all valid and invalid transitions
- [x] 10.2 register.test.js — test register scenarios (capacity, past event, double register)
- [x] 10.3 cancel.test.js — test cancel CONFIRMED, WAITLIST, non-existent
- [x] 10.4 promoteFromWaitlist.test.js — test FIFO promotion
- [x] 10.5 adminUpdate.test.js — test admin status changes, invalid transitions
- [x] 10.6 auditLog.test.js — test log creation on all state changes

## 11. Tests — Integration

- [ ] 11.1 concurrency.test.js — Promise.allSettled with 2 users on last seat
      (blocked: DB unavailable)
- [ ] 11.2 waitlistPromotion.test.js — cancel CONFIRMED triggers auto-promotion
      (blocked: DB unavailable)
- [ ] 11.3 adminLifecycle.test.js — full flow: register, list, status change, audit
      (blocked: DB unavailable)
- [ ] 11.4 unauthorizedAccess.test.js — unauthenticated and unauthorized roles rejected
      (blocked: DB unavailable)

## Database & Architecture Notes

- All IDs use `Int @id @default(autoincrement())` (project convention)
- AttendeeStatus enum mirrors existing pattern (permissionStatus, vacationStatus, etc.)
- Indexes: `@@index([eventId, status])`, `@@index([eventId, userId])`, `@@index([userId])`
- Registration_log indexes: `@@index([eventId, createdOn])`, `@@index([attendeeId])`
- FK constraint: event deletion is soft delete (use `onDelete: Restrict` on attendees FK)
- Permission codes: `canRegisterForEvent`, `canCancelRegistration`, `canViewAttendees`, `canManageAttendees`, `canViewAttendeeDetail`
- Dead code removed: `events/schemas/events.zod.js` (never imported), `stateMachine.js` `export default` (never imported)

## Refactored Module Structure

Original (proposed):
```
events/
  dao/eventAttendeeDao.js
  services/eventAttendeeService.js
  routes/eventAttendeeRoutes.js
  schemas/event-rsvp.js
```

Actual (layered architecture):
```
events/
  attendee/
    dao.js
    service.js
    controller.js
    routes.js
  schemas/
    event-rsvp.js
  stateMachine.js
  controller.js    (event CRUD only)
  routes.js        (mounts attendee/routes.js)
```
