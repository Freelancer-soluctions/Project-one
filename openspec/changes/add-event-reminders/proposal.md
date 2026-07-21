## Why

Users need automated reminders for upcoming events so they don't miss important meetings, deadlines, or company events. Currently the system supports event creation but lacks any notification mechanism — users must manually track upcoming events.

## What Changes

- Add 3 columns to `events` model: `remindersEnabled`, `reminder24hSentAt`, `reminder1hSentAt` (flag-based, no separate reminders table)
- Add `remindersEnabled` column to `settings` model (per-user toggle)
- Implement BullMQ scheduler with repeatable job every 5 min to check for events needing reminders
- Add Redis Docker service for BullMQ job queue storage
- notificationBus.emit → Socket.IO delivery for connected users
- Reset reminder sent flags when event rescheduled (date/time change)
- Per-event toggle in EventDialog (managers) + per-user toggle in Settings notifications tab

## Capabilities

### New Capabilities
- `event-reminders`: Automated 24h and 1h reminders delivered via socket notification. Managers toggle per-event. Users toggle per-profile.

### Modified Capabilities
- `events` model: +3 columns (remindersEnabled, reminder24hSentAt, reminder1hSentAt)
- `settings` model: +1 column (remindersEnabled)
- Event create/update forms: +remindersEnabled toggle

## Impact

- **Infrastructure**: New Redis service in docker-compose.yml
- **Database**: 3 new columns on `events` model, 1 new column on `settings` model (no new tables)
- **Backend (apps/server/)**: New `src/scheduler/` module (BullMQ queue + worker + Bull Board), `src/config/redis.js` shared connection. Scheduler module uses no new controllers — logic is self-contained. Settings module gets `remindersEnabled` support via existing `PATCH /:id` route
- **Dependencies**: `bullmq`, `@bull-board/express`, `@bull-board/api`, `ioredis` (may already exist)
- **Notification system**: Existing notificationBus emits `event:reminder` events, Socket.IO forwards to user's room
- **Tests**: Unit + integration for scheduler worker logic, flag reset on reschedule, BullMQ job lifecycle
- **Frontend**: `remindersEnabled` toggle in EventDialog (create/edit) + Settings notifications tab
- **Dependencies**: add-soft-delete-events (deletedAt column), add-event-rsvp (attendees table), add-sse-notification-infrastructure (SSE delivery channel)

