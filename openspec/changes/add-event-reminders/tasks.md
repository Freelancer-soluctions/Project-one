## 1. Database Schema

- [ ] 1.1 Add `remindersEnabled`, `reminder24hSentAt`, `reminder1hSentAt` columns to `events` Prisma model
- [ ] 1.2 Add `remindersEnabled` column to `settings` Prisma model
- [ ] 1.3 Generate and run Prisma migration

## 2. Docker & Dependencies

- [ ] 2.1 Add `redis:7` service to `docker-compose.yml` with named volume for persistence
- [ ] 2.2 Add `REDIS_HOST` and `REDIS_PORT` environment variables to the API service
- [ ] 2.3 Install npm packages: `bullmq`, `@bull-board/api`, `@bull-board/express`

## 3. Queue Infrastructure

- [ ] 3.1 Create Redis connection configuration module (`apps/server/src/config/redis.js`)
- [ ] 3.2 Create reminder queue singleton (`apps/server/src/scheduler/reminderQueue.js`)

## 4. Scheduler Module (`src/scheduler/`)

- [ ] 4.1 Create scheduler module that queries events needing 24h or 1h reminders per RM-03b
- [ ] 4.1a Handle RM-12b edge: if event startTime already passed and zero attendees → set flag to prevent infinite polling
- [ ] 4.1b Handle RM-14a edge: re-read reminderXhSentAt immediately before adding job (optimistic check to prevent double dispatch)
- [ ] 4.2 Add `send-reminder` BullMQ jobs to the queue for each matching event
- [ ] 4.3 Register the repeatable job on queue initialization

## 5. Send-Reminder Worker (`src/scheduler/`)

- [ ] 5.1 Create worker (`src/scheduler/reminderWorker.js`) that fetches CONFIRMED attendees for the event (RM-07a)
- [ ] 5.2 Filter attendees whose user `settings.remindersEnabled = true` (RM-02a)
- [ ] 5.3 Emit `event:reminder` via `notificationBus` for each recipient (RM-07b)
- [ ] 5.4 Update `reminder24hSentAt` / `reminder1hSentAt` after successful dispatch (RM-08a)
- [ ] 5.5 Configure retry with exponential backoff: 10s, 30s, 90s, 270s (RM-11a)

## 6. Application Bootstrap

- [ ] 6.1 Start BullMQ Worker in `src/bin/index.js` (RM-04a)
- [ ] 6.2 Add graceful shutdown: call `worker.close()` on SIGTERM/SIGINT (RM-04b)
- [ ] 6.3 Mount Bull Board Express router at `/admin/queues` (RM-10a), protected by verifyToken + verifyRole(['ADMIN'])
- [ ] 6.4 Add `EVENT_REMINDER` constant to `BUS_EVENTS` in `notificationBus.js` (value: 'event:reminder')
- [ ] 6.5 Add listener in `level-02-server.js`: `bus.on(BUS_EVENTS.EVENT_REMINDER, ...)` → `io.to(user:${userId}).emit('event:reminder', payload)`

## 7. Event Service Changes

- [ ] 7.1 Modify `eventService.updateEventById` to reset reminder flags when `eventDate` or `startTime` changes (RM-09a, RM-09b)
- [ ] 7.2 Ensure `remindersEnabled` is accepted in CREATE and UPDATE request schemas
- [ ] 7.3 Preserve existing flags when non-date/time fields are updated (RM-09c)

## 8. Settings API — Extend existing

- [ ] 8.1 Add `remindersEnabled: Joi.boolean().optional()` to `SettingsUpdate` Joi schema (settings.joi.js)
- [ ] 8.2 Destructure `remindersEnabled` from `req.body` in settings controller.update
- [ ] 8.3 Existing route `PATCH /:id` handles it — no new route needed

## 9. Tests

- [ ] 9.1 Unit: scheduler query logic (mock Prisma, verify RM-03b conditions)
- [ ] 9.2 Unit: worker filters attendees by settings.remindersEnabled (COALESCE handling per RM-13)
- [ ] 9.3 Unit: flag reset on reschedule (RM-09a, RM-09b, RM-09c)
- [ ] 9.4 Integration: worker notificationBus.emit received by listener
- [ ] 9.5 Integration: BullMQ job lifecycle (enqueue → process → mark sent)
- [ ] 9.6 Integration: best-effort failure mode (RM-15a)

## 10. Frontend

- [ ] 10.1 Add `remindersEnabled` Switch/Checkbox field to EventDialog create/edit form (default: true)
- [ ] 10.2 Add `remindersEnabled` setting toggle to Settings notifications tab component
- [ ] 10.3 Add Socket.IO client listener for `event:reminder` → show toast/sonner notification with event title and reminder type
