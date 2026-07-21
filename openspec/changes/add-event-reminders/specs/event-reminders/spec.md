# Event Reminders — Specification

## Capability: event-reminders

Automated 24-hour and 1-hour reminders delivered via Socket.IO notification to registered attendees.

## Model: events.reminders (flag-based, no separate table)

### Requirement: RM-01 — Schema: events model columns
- `remindersEnabled` Boolean, default true, nullable false
- `reminder24hSentAt` DateTime?, nullable true
- `reminder1hSentAt` DateTime?, nullable true

#### Scenario: RM-01a — Defaults
WHEN a new event is created
THEN remindersEnabled defaults to true, reminder24hSentAt IS NULL, reminder1hSentAt IS NULL

#### Scenario: RM-01b — Manager disables reminders
WHEN an event is created with remindersEnabled = false
THEN no reminders will fire for this event
AND the scheduler query skips it

### Requirement: RM-02 — Schema: settings model column
- `remindersEnabled` Boolean, default true, nullable false on the settings model

#### Scenario: RM-02a — User-level opt-out
WHEN a user sets remindersEnabled = false in their settings
THEN the scheduler does NOT send reminders to that user even if the event has reminders enabled

#### Scenario: RM-02b — Default opt-in
WHEN a new user is created
THEN their settings.remindersEnabled defaults to true

### Requirement: RM-03 — BullMQ scheduler
A repeatable BullMQ job runs every 5 minutes to check for events needing reminders.

#### Scenario: RM-03a — Job interval
GIVEN the server is running
WHEN 5 minutes have elapsed since the last check
THEN the scheduler job fires

#### Scenario: RM-03b — Query scope
WHEN the scheduler job runs
THEN it queries events WHERE
   remindersEnabled = true
   AND deletedAt IS NULL
   AND eventDate >= CURRENT_DATE
   AND (
     (reminder24hSentAt IS NULL AND eventDate = CURRENT_DATE + 1 AND startTime BETWEEN CURRENT_TIME - interval '5 minutes' AND CURRENT_TIME + interval '5 minutes')
     OR
     (reminder1hSentAt IS NULL AND eventDate = CURRENT_DATE AND startTime BETWEEN CURRENT_TIME - interval '5 minutes' AND CURRENT_TIME + interval '1 hour')
   )

#### Scenario: RM-03c — No matching events
WHEN no events match the query
THEN the scheduler does nothing

### Requirement: RM-04 — Worker runs in same Express process
The BullMQ Worker is created in the same Node.js process as Express, started in src/bin/index.js.

#### Scenario: RM-04a — Worker startup
GIVEN the server boots
WHEN src/bin/index.js runs
THEN the BullMQ Worker is created and starts polling the queue

#### Scenario: RM-04b — Graceful shutdown
WHEN SIGTERM or SIGINT is received
THEN worker.close() is called before httpServer.close()
AND in-flight jobs complete before shutdown

### Requirement: RM-05 — Redis Docker service
A redis:7 service is added to docker-compose.yml.

#### Scenario: RM-05a — Redis container
WHEN docker-compose up is run
THEN a redis:7 container starts on port 6379
AND a named volume persists Redis data

#### Scenario: RM-05b — BullMQ connection
WHEN BullMQ connects to Redis
THEN it uses REDIS_HOST and REDIS_PORT from process.env
AND falls back to localhost:6379

### Requirement: RM-06 — Dispatch: send-reminder job
For each event needing a reminder, the scheduler adds a send-reminder job to the queue.

#### Scenario: RM-06a — Job creation
WHEN the scheduler finds an event needing a 24h reminder
THEN it adds a BullMQ job with data: { eventId, type: '24h' }

#### Scenario: RM-06b — Same for 1h
WHEN the scheduler finds an event needing a 1h reminder
THEN it adds a BullMQ job with data: { eventId, type: '1h' }

### Requirement: RM-07 — Notification delivery
The send-reminder worker emits via notificationBus to connected Socket.IO clients.

#### Scenario: RM-07a — Fetch attendees
WHEN the send-reminder worker receives a job
THEN it queries CONFIRMED attendees for the event
AND skips attendees whose user settings have remindersEnabled = false

#### Scenario: RM-07b — Bus emit
WHEN the worker processes a reminder for an attendee
THEN it calls notificationBus.emit('event:reminder', { eventId, userId, type: '24h'|'1h', title, startTime })

#### Scenario: RM-07c — Socket.IO forward
WHEN notificationBus emits 'event:reminder'
THEN the Socket.IO handler sends the notification to the user's room
AND the client shows a toast/notification

#### Scenario: RM-07d — User offline
WHEN the user is not connected to Socket.IO
THEN the notification is silently dropped (fire-and-forget)

### Requirement: RM-08 — Mark sent
After successful notification dispatch, the worker marks the event as sent.

#### Scenario: RM-08a — Update flag
WHEN all reminders for an event type have been dispatched
THEN the worker updates events SET reminder24hSentAt = NOW() or reminder1hSentAt = NOW()

#### Scenario: RM-08b — Crash recovery
WHEN the server crashes before marking the flag
THEN on restart, the scheduler will re-process the event (idempotent dispatch — users offline on first attempt will miss it, but the flag is eventually set)

### Requirement: RM-09 — Flag reset on reschedule
When eventDate or startTime changes, both reminder sent flags reset to null.

#### Scenario: RM-09a — Date changed
WHEN an event's eventDate is updated via PATCH /events/:id
THEN reminder24hSentAt = NULL, reminder1hSentAt = NULL

#### Scenario: RM-09b — Time changed
WHEN an event's startTime is updated
THEN reminder24hSentAt = NULL, reminder1hSentAt = NULL

#### Scenario: RM-09c — Other fields only
WHEN non-date/time fields are updated (title, description, etc.)
THEN reminder flags are NOT reset

### Requirement: RM-10 — Bull Board monitoring
Bull Board Express router is mounted at /admin/queues.

#### Scenario: RM-10a — Dashboard access
GIVEN the server is running
WHEN GET /admin/queues is requested
THEN the Bull Board dashboard renders with job stats, retries, and failure details

#### Scenario: RM-10b — Protected route
WHEN an unauthenticated user accesses /admin/queues
THEN access is denied (ADMIN role required)

### Requirement: RM-11 — Error handling
Failed send-reminder jobs retry with exponential backoff.

#### Scenario: RM-11a — Job failure
WHEN a send-reminder job throws an error
THEN BullMQ retries with backoff: 10s, 30s, 90s, 270s (4 attempts total)
AFTER 4 failed attempts
THEN the job moves to the dead-letter queue

#### Scenario: RM-11b — Scheduler failure
WHEN the scheduler repeatable job fails
THEN it is retried on the next 5-minute cycle (natural retry)
AND the error is logged

### Requirement: RM-12 — Dependency on add-event-rsvp
This change depends on the attendees table from add-event-rsvp.

#### Scenario: RM-12a — Attendees required
WHEN the send-reminder worker queries attendees
THEN it uses the attendees model from add-event-rsvp
AND filters by status = CONFIRMED

#### Scenario: RM-12b — No attendees
WHEN an event has remindersEnabled = true but zero CONFIRMED attendees
THEN the scheduler skips this event (no-op, flag is NOT set)
AND if the event's startTime has already passed, the flag IS set to prevent infinite polling

### Requirement: RM-13 — Edge: user settings row may not exist

#### Scenario: RM-13a — Missing settings row
WHEN querying a user's remindersEnabled preference
THEN use LEFT JOIN with COALESCE(settings.remindersEnabled, true)
BECAUSE users may not have a settings row yet (created on-demand)

### Requirement: RM-14 — Edge: race condition on double dispatch

#### Scenario: RM-14a — Read-back before add
WHEN the scheduler job finds an event needing a reminder
THEN it re-reads the reminderXhSentAt flag immediately before adding the send-reminder job (optimistic check)
TO prevent double dispatch if the previous tick's worker hasn't committed yet

### Requirement: RM-15 — Failure semantics: best effort

#### Scenario: RM-15a — Partial failure
WHEN sending reminders to attendees, some notificationBus.emit calls fail
THEN the failures are logged
AND the reminderSentAt flag IS still set (best-effort)
BECAUSE SSE notifications are fire-and-forget; retrying would duplicate sends to successful recipients

#### Scenario: RM-15b — Worker job failure
WHEN the entire send-reminder job fails before marking the flag
THEN BullMQ retries with exponential backoff: 10s, 30s, 90s, 270s
AND if all retries exhausted, the job goes to dead-letter queue
