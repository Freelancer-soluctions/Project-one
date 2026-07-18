## Context

The project currently supports event creation, listing, updating, and deletion via the events module (`apps/server/src/modules/events/`). Events are stored in the `events` table in PostgreSQL with Prisma ORM. Real-time notifications are handled through a shared `notificationBus.js` (EventEmitter singleton) which forwards events to Socket.IO clients.

There is currently no reminder system — users must manually track upcoming events. The `docker-compose.yml` includes PostgreSQL, pgAdmin, the API container, nginx, Prometheus, and Grafana, but no Redis service.

## Goals / Non-Goals

**Goals:**
- Add per-event reminder tracking via 3 new columns on the `events` model: `reminder24hSentAt`, `reminder1hSentAt`, `remindersEnabled`
- Implement a BullMQ scheduler with a repeatable job that runs every 5 minutes to check for events needing reminders
- Reset reminder-sent flags when an event is rescheduled (date/time change)
- Deliver reminder notifications through the existing `notificationBus.emit()` → Socket.IO pipeline
- Add Redis as a Docker service for BullMQ job queue storage
- Provide a per-user settings toggle (`remindersEnabled` in user `settings` model) and a per-event toggle for managers

**Non-Goals:**
- No separate `reminders` database model or CRUD API (simplified to flag-based approach on the events table)
- No configurable reminder timing presets (fixed to 24h and 1h before event start)
- No email/SMS notification delivery (Socket.IO only)
- No historical reminder audit log

**Frontend scope (included):**
- Per-event toggle `remindersEnabled` in EventDialog (create/edit form)
- Per-user toggle `remindersEnabled` in Settings notifications tab
- Socket.IO client listener for `event:reminder` → toast/notification

## Decisions

### Decision 1: Flag-based reminders on `events` model vs. separate `reminders` table
**Chosen:** Flag-based (3 columns on `events` model)
**Rationale:** The requirements specify exactly two fixed reminder windows (24h and 1h before event). A separate `reminders` table with CRUD would be over-engineering for two fixed flags. This simplifies the schema, reduces API surface, and eliminates the need for a reminders controller/service/dao layer.
**Alternatives considered:** Separate `reminders` model with one row per reminder instance — rejected because it adds unnecessary complexity for fixed-window reminders.

### Decision 2: BullMQ for scheduling
**Chosen:** BullMQ with a repeatable job every 5 minutes
**Rationale:** BullMQ is the established Node.js queue solution, integrates naturally with Redis, supports repeatable jobs out of the box, and provides observability (dashboard, job lifecycle events). A 5-minute polling interval balances timeliness with resource usage.
**Alternatives considered:** `node-cron` or `node-schedule` — rejected because they lack persistence across restarts, job retry, and monitoring capabilities. Event-driven scheduling (schedule job per event creation) — rejected because it requires managing many individual jobs and handling edge cases around rescheduling.

### Decision 3: Notification delivery via existing notificationBus
**Chosen:** Reuse `notificationBus.js` (EventEmitter singleton)
**Rationale:** The project already has a proven pattern — `notificationBus.js` decouples services from Socket.IO. The worker emits `event:reminder` on the bus with a `type` field (`'24h'` or `'1h'`) in the payload. A new listener in `level-02-server.js` forwards to the user's Socket.IO room.
**Alternatives considered:** Direct Socket.IO emit from the BullMQ worker — rejected because it bypasses the decoupling pattern and makes testing harder. Two separate event names (`reminder:24h`, `reminder:1h`) — rejected in favor of single event name + type discriminator for simpler listener pattern.

### Decision 4: User settings toggle on existing `settings` model
**Chosen:** Add `remindersEnabled` boolean column to the `settings` model
**Rationale:** The `settings` model already exists per-user and stores display preferences. Adding `remindersEnabled` there is natural — it's a user-level preference. The setting defaults to `true` so existing users opt-in automatically.
**Alternatives considered:** New `user_preferences` table — rejected as unnecessary when the settings model already serves this purpose.

### Decision 5: Per-event toggle for managers
**Chosen:** `remindersEnabled` boolean on the `events` model, settable by ADMIN/MANAGER roles
**Rationale:** Managers creating/editing events should be able to suppress reminders for low-importance events (e.g., internal meetings). The field defaults to `true` (reminders on) and is included in CREATE and UPDATE request schemas.
**REST design:** `POST /api/v1/events` and `PATCH /api/v1/events/:id` will accept an optional `remindersEnabled` boolean.

### Decision 6: Redis as Docker service
**Chosen:** Add a `redis` service to `docker-compose.yml`
**Rationale:** BullMQ requires Redis for job persistence and coordination. A Dockerized Redis instance matches the existing infrastructure pattern (PostgreSQL, pgAdmin already Dockerized). No external Redis hosting needed.
**Configuration:** Standard Redis image with persistent volume, exposed on port 6379. BullMQ configured via `REDIS_URL` environment variable.

### Decision 7: Reset flags on event reschedule
**Chosen:** When `startTime` or `eventDate` changes in `updateEventById`, both `reminder24hSentAt` and `reminder1hSentAt` are set to `NULL`
**Rationale:** A rescheduled event may have already passed its original reminder windows. Resetting ensures both reminders re-fire at the correct times relative to the new date/time. This is implemented in the service layer (`eventService.updateEventById`).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Redis single point of failure | Docker restart policy `always`; add Redis Sentinel / cluster if HA needed later |
| BullMQ job backlog if DB is slow | Keep 5-min interval; add concurrency limit and job timeout in BullMQ config |
| Stale events accumulating in scheduler queries | Query filters only events where `eventDate >= NOW()`; past events are ignored |
| notificationBus emit with no connected Socket.IO clients | The handler silently no-ops if the user is offline; notifications are fire-and-forget (no persistence) |
| 5-min granularity means up to 5-min delay for reminder delivery | Acceptable for non-critical calendar reminders; if sub-minute precision needed, switch to event-driven scheduling |
| Resetting flags on every PATCH even if date/time didn't change | Check if `startTime` or `eventDate` is included in the update body; only reset if those fields changed |
