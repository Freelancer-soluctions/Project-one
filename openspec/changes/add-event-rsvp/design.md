## Context

Events currently lack any attendee registration system. The events module exists with CRUD operations, basic time validation, and permission-based access. We need to add RSVP capability — self-service registration, capacity management, waitlists, admin attendee management, and audit logging.

The system uses Express + Prisma + PostgreSQL. Existing patterns: controller → service → DAO, Joi validation schemas, and `checkRoleAuthOrPermisssion` middleware for authorization.

All entity IDs in the project use Int autoincrement (project convention).

## Goals / Non-Goals

**Goals:**
- Self-service registration and cancellation for authenticated users
- Per-event capacity management with waitlist auto-promotion (FIFO)
- Admin attendee overview and status management
- Complete audit trail for all registration state changes
- Concurrency-safe registration under race conditions

**Non-Goals:**
- Email notifications for registration/waitlist promotion (future concern)
- Payment processing for paid events
- Recurring event series registration logic
- Public (unauthenticated) registration
- Independent RSVP page or route — features are embedded in existing events module

## Decisions

| # | Decision | Rationale | Alternatives Considered |
|---|---|---|---|
| 1 | Inside existing `events/` module | RSVP is a feature of events, not an independent domain. Mirrors frontend structure. Keeps cohesion. | New `rsvp/` module — rejected: would create cross-module coupling and split related logic |
| 2 | Per-event `capacity` (int, 0 = unlimited), editable by admin | Simple model, admin-controlled. 0 = unlimited avoids nullable sentinel values. | Global capacity setting — rejected: too rigid |
| 3 | States: CONFIRMED ↔ WAITLIST ↔ CANCELLED (bidirectional between CANCELLED and CONFIRMED/WAITLIST) | Covers core lifecycle. WAITLIST allows over-capacity signups. CANCELLED is soft-delete. Re-registration allowed from CANCELLED to either CONFIRMED (if space) or WAITLIST (if at capacity). | Separate `deleted` boolean — rejected: adds complexity, status field suffices |
| 4 | FIFO waitlist promotion on cancellation | First-come-first-served is the expected user behavior for event waitlists. | Priority-based — rejected: not needed for v1; admin can manually reorder later |
| 5 | Prisma interactive transaction + `updateMany` optimistic lock on `attendeeCount` | Prevents overselling under concurrent requests. The `updateMany` with `attendeeCount` filter acts as a compare-and-swap. When `capacity === 0` (unlimited), skip capacity check entirely — only apply optimistic lock when `capacity > 0`. Code guard: `if (event.capacity > 0) { /* capacity check */ }`. | Database-level constraints — rejected: Prisma doesn't support CHECK constraints; raw SQL would break abstraction |
| 6 | `registration_log` table for audit trail | Every state change is recorded immutably. Enables compliance, debugging, and user support. | No audit log — rejected: insufficient for production accountability |
| 7 | Soft delete via status change to `CANCELLED` | Preserves data integrity across FK relationships; user can re-register. | Hard DELETE — rejected: loses history; FK constraints would cascade |
| 8 | RESTful URLs: `/events/:eventId/register`, `/events/:eventId/attendees` | Follows existing route convention. `mergeParams` from Express Router avoids manual param extraction. Routes inherit `verifyToken` from parent events router. | Flat routes like `/rsvp/...` — rejected: breaks URI hierarchy |
| 9 | 5 new permission codes (camelCase `can*` prefix) for role-based access | Granular control. Follows existing `PERMISSIONCODES` convention. | Single "rsvp-admin" permission — rejected: too coarse; need to separate self-register from admin actions |
| 10 | Joi schemas in separate `schemas/` file | Follows existing modular-joi-schemas pattern already established in the codebase. | Inline validation — rejected: inconsistent with project conventions |
| 11 | All IDs use Int autoincrement (not UUID) | Matches existing project convention across all models. Simpler FKs, better index performance. | UUID — rejected: inconsistent with codebase practice |
| 12 | DAO layer follows existing pattern with transaction-aware functions | Separates Prisma queries from business logic. Keeps service layer pure. Existing pattern is controller → service → DAO. | Direct Prisma in service — rejected: mixes concerns, hard to test |

## Valid State Transitions

| From → To | Description |
|---|---|
| null → CONFIRMED | User registers when capacity available |
| null → WAITLIST | User registers when event is at capacity |
| CONFIRMED → CANCELLED | User cancels or admin removes |
| WAITLIST → CANCELLED | User cancels waitlist or admin removes |
| WAITLIST → CONFIRMED | Admin promotes or auto-promotion from FIFO |
| CANCELLED → CONFIRMED | Cancelled user re-registers when space available |
| CANCELLED → WAITLIST | Cancelled user re-registers when event at capacity |

## Valid transition matrix

```
                 → CONFIRMED  → WAITLIST  → CANCELLED
null              ✓            ✓           ✗
CONFIRMED         ✗            ✗           ✓
WAITLIST          ✓            ✗           ✓
CANCELLED         ✓            ✓           ✗
```

## Notes

- **M1 (changedBy for self-cancel):** When a user cancels their own registration, `changedBy` = userId (same as the authenticated user making the request).
- **M2 (changedBy for system):** Waitlist auto-promotion uses `changedBy = null` (system-triggered).
- **M3 (changedBy for admin):** Admin status changes use `changedBy = adminUserId`.
- **M4 (capacity=0):** Event with capacity = 0 means unlimited. Skip all capacity checks and optimistic lock. Always assign CONFIRMED.
- **M5 (registration_log immutability):** No update or delete endpoints exposed for registration_log.
- **M6 (route inheritance):** Routes under `/events/:eventId/` inherit `verifyToken` from the parent events router via `mergeParams: true`.
- **M7 (soft delete — updated):** Soft delete replaces hard delete for events (see change `add-soft-delete-events`). The `events` DELETE endpoint now performs an UPDATE setting `deletedAt`/`deletedBy`. Since no `prisma.events.delete()` is ever called, the Prisma `onDelete: Cascade` on the attendees FK never triggers. Attendee records are preserved automatically. The FK should use `onDelete: Restrict` (prevent dangling FK if hard delete ever occurs) rather than `onDelete: Cascade`.
- **M8 (admin listing filter):** Admin `GET /events/:eventId/attendees` includes optional `status` query param to filter by status. Default shows all non-CANCELLED (CONFIRMED + WAITLIST).

## Risks / Trade-offs

- **[Concurrency]** Interactive transactions reduce throughput under high registration load → Mitigation: keep transaction scope minimal; consider queue-based processing if contention becomes an issue. Note: only applies when `capacity > 0`.
- **[Waitlist fairness]** FIFO promotion happens immediately on cancellation — if 1000 people are waitlisted, promotion runs sequentially → Mitigation: acceptable for v1; batch promotion can be introduced later
- **[Hard delete vs soft delete]** CANCELLED status means unique constraints on (userId, eventId) must allow re-registration → Mitigation: composite unique constraint on (userId, eventId) WHERE status != 'CANCELLED' (partial index) or handle in application logic
- **[Migration]** Adding capacity to existing events — existing events default to capacity=0 (unlimited) → Mitigation: no migration script needed; admin can set capacity per-event
