# API Changelog

All notable changes to the Project One API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed

#### Events Module — Soft Delete Implementation (`add-soft-delete-events`)

**`DELETE /api/v1/events/:id`** — Changed from **hard delete** to **soft delete**

| Aspect | Before | After |
|--------|--------|-------|
| **Operation** | `prisma.events.delete()` — row removed from database | `prisma.events.update()` — sets `deletedAt`, `deletedBy`, `updatedOn` |
| **Response (success)** | `200 OK` with `{ message }` | `200 OK` with soft-deleted event object |
| **Response (not found)** | `404 Not Found` | `404 Not Found` — `{ success: false, statusCode: 404, message: "Event not found" }` |
| **Response (already deleted)** | N/A (hard delete would fail silently or error) | `409 Conflict` — `{ success: false, statusCode: 409, message: "Event already deleted" }` |

**New Query Parameter: `GET /api/v1/events?showDeleted=true`**

| Aspect | Details |
|--------|---------|
| **Parameter** | `showDeleted` (boolean, optional) |
| **Values** | `true`, `1`, `false`, `0` (parsed via Joi/Zod) |
| **Default** | `false` — soft-deleted events excluded |
| **Access Control** | **ADMIN role only** — non-ADMIN receives `403 Forbidden` |
| **Effect on Response** | Includes soft-deleted events in `dataList`; `total` count includes deleted events |
| **Event Object** | Soft-deleted events include `deletedAt` (ISO timestamp) and `deletedBy` (user ID) fields |

**Restoration via `PATCH /api/v1/events/:id`**

| Aspect | Details |
|--------|---------|
| **Trigger** | Request body contains `deletedAt: null` |
| **Precondition** | Event must be soft-deleted (`deletedAt` is not null) |
| **Permission** | Requires `canEditEvents` permission (existing guard) |
| **Behavior** | Clears `deletedAt` and `deletedBy`; sets `updatedOn` |
| **Combined Updates** | If body includes other fields (e.g., `title: "New"`), restoration and field update applied atomically |
| **No-op Case** | Active event (`deletedAt` already null) with `deletedAt: null` in body → normal update (no error) |

**New Response Codes for Events Endpoints**

| Endpoint | Code | Condition |
|----------|------|-----------|
| `DELETE /events/:id` | `409 Conflict` | Event already soft-deleted |
| `DELETE /events/:id` | `404 Not Found` | Event does not exist |
| `GET /events?showDeleted=true` | `403 Forbidden` | Non-ADMIN role attempts to use `showDeleted=true` |
| `PATCH /events/:id` (restore) | `404 Not Found` | Event does not exist |
| `PATCH /events/:id` (restore) | `403 Forbidden` | User lacks `canEditEvents` permission |

**Database Schema Changes**

| Model | Field | Type | Notes |
|-------|-------|------|-------|
| `events` | `deletedAt` | `DateTime?` | Timestamp of soft deletion |
| `events` | `deletedBy` | `Int?` | FK → `users.id` (nullable) |
| `events` | `userEventDeleted` | Relation | `@relation("userEventDeleted", fields: [deletedBy], references: [id])` |
| `users` | `eventsDeleted` | Relation[] | Reverse relation `@relation("userEventDeleted")` |

**Cross-Change Compatibility**

- **`add-event-rsvp` (pending)**: The `attendees` table FK to `events` uses `onDelete: Restrict` (not Cascade) to preserve attendee records when events are soft-deleted. See design note M7 in `add-event-rsvp/design.md`.
- **Pagination**: The `deletedAt: null` filter is applied in both `findMany` and `count` queries, ensuring `total` accurately reflects the filtered dataset.

---

## [1.0.0] - 2026-06-13

### Added
- Initial API release with Events, Users, Notes, News, Products, and other modules
- JWT authentication with role-based permissions
- Pagination, filtering, and search across list endpoints
- Zod + Joi validation schemas for all endpoints

---

## Changelog Guidelines

### Entry Format

```markdown
## [Version] - YYYY-MM-DD

### Added
- New endpoints, features, or capabilities

### Changed
- Modifications to existing behavior (breaking or non-breaking)

### Deprecated
- Features marked for removal in future versions

### Removed
- Features removed in this version

### Fixed
- Bug fixes

### Security
- Vulnerability fixes or security improvements
```

### Version Numbering

- **Major** — Breaking changes to API contracts
- **Minor** — New features, non-breaking enhancements
- **Patch** — Bug fixes, documentation updates

### Breaking Change Markers

Use `⚠️ BREAKING:` prefix in Changed entries for breaking changes.