## Purpose

This capability defines how soft-deleted events can be restored. ADMIN and MANAGER users can restore events by sending `deletedAt: null` through the existing PATCH endpoint, without requiring a dedicated restore route.

## Requirements

### Requirement: ADMIN and MANAGER can restore soft-deleted events via PATCH
The system SHALL allow authenticated users with the appropriate role to restore a soft-deleted event by clearing the `deletedAt` and `deletedBy` fields through the existing `PATCH /events/:id` endpoint.

#### Scenario: ADMIN restores soft-deleted event
- **WHEN** an ADMIN user sends `PATCH /events/:id` with body containing `{ "deletedAt": null, "deletedBy": null }` for a soft-deleted event
- **THEN** the system SHALL set both `deletedAt` and `deletedBy` to NULL on the event row
- **AND** SHALL return HTTP 200 with the restored event object
- **AND** the event SHALL reappear in `GET /events` responses

#### Scenario: MANAGER restores soft-deleted event
- **WHEN** a MANAGER user sends `PATCH /events/:id` with body containing `{ "deletedAt": null, "deletedBy": null }` for a soft-deleted event
- **THEN** the system SHALL restore the event identically to ADMIN restore
- **AND** SHALL return HTTP 200 with the restored event object

#### Scenario: Restore non-deleted event is a no-op
- **WHEN** a user sends `PATCH /events/:id` with `{ "deletedAt": null }` for an event that is already active (deletedAt IS NULL)
- **THEN** the system SHALL update other provided fields normally
- **AND** SHALL return HTTP 200 with the event object (deletedAt remains NULL)

#### Scenario: Restore non-existent event returns 404
- **WHEN** a user sends `PATCH /events/:id` with restore fields for an event ID that does not exist
- **THEN** the system SHALL return HTTP 404

### Requirement: Restore requires appropriate permissions
The system SHALL enforce role-based access control for restoring soft-deleted events.

#### Scenario: USER role cannot restore
- **WHEN** a USER role sends `PATCH /events/:id` with `{ "deletedAt": null }` for a soft-deleted event
- **THEN** the system SHALL return HTTP 403 Forbidden

#### Scenario: Unauthenticated cannot restore
- **WHEN** an unauthenticated request is sent to `PATCH /events/:id` with restore fields
- **THEN** the system SHALL return HTTP 401 Unauthorized

### Requirement: Service distinguishes restore from regular update
The service layer SHALL detect when a PATCH request is a restore operation (explicit `deletedAt: null` on a soft-deleted event) and handle it appropriately.

#### Scenario: Service identifies restore by deletedAt null and current state
- **WHEN** the service receives a PATCH request with `deletedAt` explicitly set to `null`
- **AND** the current event has `deletedAt IS NOT NULL`
- **THEN** the service SHALL treat this as a restore operation
- **AND** SHALL clear both `deletedAt` and `deletedBy` to NULL

### Requirement: Restore does not create new endpoint
The system SHALL reuse the existing `PATCH /events/:id` endpoint for restore functionality without adding new routes.

#### Scenario: No new routes added for restore
- **WHEN** inspecting the routes configuration
- **THEN** there SHALL be no dedicated restore endpoint (e.g., `POST /events/:id/restore` or `PATCH /events/:id/restore`)
- **AND** restore SHALL be handled within the existing `PATCH /events/:id` logic

### Requirement: PATCH body accepts deletedAt and deletedBy fields
The Joi/Zod update schemas SHALL accept `deletedAt` and `deletedBy` as optional fields so restore requests pass validation.

#### Scenario: Joi EventsUpdateSchema accepts deletedAt: null
- **WHEN** a PATCH request body contains `{ "deletedAt": null }`
- **THEN** `EventsUpdateSchema` SHALL validate successfully
- **AND** `deletedAt` SHALL be `Joi.date().valid(null).optional().raw()`

#### Scenario: Joi EventsUpdateSchema accepts deletedBy: null
- **WHEN** a PATCH request body contains `{ "deletedBy": null }`
- **THEN** `EventsUpdateSchema` SHALL validate successfully
- **AND** `deletedBy` SHALL be `Joi.any().valid(null).optional()`

### Requirement: Combined restore + field update works atomically
When a PATCH body includes both restore fields and regular update fields, both operations SHALL be applied.

#### Scenario: Restore and update title simultaneously
- **WHEN** a PATCH request sends `{ "deletedAt": null, "title": "New Title" }` for a soft-deleted event
- **THEN** the event SHALL be restored (`deletedAt = NULL, deletedBy = NULL`)
- **AND** the title SHALL be updated to "New Title"
- **AND** all other original fields SHALL remain unchanged

#### Scenario: Restore-only body when event is active results in no-op
- **WHEN** a PATCH request sends `{ "deletedAt": null }` for an already-active event
- **THEN** the operation SHALL be a no-op for restore
- **AND** any other provided fields SHALL be updated normally
