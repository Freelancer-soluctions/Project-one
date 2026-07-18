## Purpose

This capability covers soft-delete operations for events. Instead of permanently deleting event records, the system marks them as deleted by setting `deletedAt` and `deletedBy` fields, preserving data integrity and enabling audit trails.

## Requirements

### Requirement: DELETE endpoint performs soft delete
The system SHALL convert the existing hard-delete `DELETE /events/:id` into a soft-delete operation that sets `deletedAt` and `deletedBy` instead of permanently removing the row.

#### Scenario: Soft delete an existing event
- **WHEN** an authenticated user with `canDeleteEvents` permission sends `DELETE /events/:id` for an existing non-deleted event
- **THEN** the system SHALL set `deletedAt = now()` and `deletedBy = req.userId` on the event row
- **AND** the system SHALL return HTTP 200 with the updated event object
- **AND** the event SHALL remain in the database with all other fields unchanged

#### Scenario: Soft delete already soft-deleted event
- **WHEN** a user sends `DELETE /events/:id` for an event where `deletedAt` is NOT NULL
- **THEN** the system SHALL return HTTP 409 Conflict (event already deleted)

#### Scenario: Soft delete non-existent event
- **WHEN** a user sends `DELETE /events/:id` for an event that does not exist
- **THEN** the system SHALL return HTTP 404 Not Found

#### Scenario: Soft delete without authentication
- **WHEN** an unauthenticated request is sent to `DELETE /events/:id`
- **THEN** the system SHALL return HTTP 401 Unauthorized

#### Scenario: Soft delete without permission
- **WHEN** an authenticated user without `canDeleteEvents` permission sends `DELETE /events/:id`
- **THEN** the system SHALL return HTTP 403 Forbidden

### Requirement: Soft delete sets deletedBy to authenticated user ID
The system SHALL record the authenticated user's ID as `deletedBy` when performing a soft delete for audit trail purposes.

#### Scenario: Controller passes userId to service
- **WHEN** `DELETE /events/:id` is called with a valid authenticated user
- **THEN** the controller SHALL extract `req.userId` from the JWT token
- **AND** SHALL pass it to the service layer as `deleteEventById(id, userId)`

#### Scenario: deletedBy references a valid user
- **WHEN** an event is soft-deleted
- **THEN** the `deletedBy` field SHALL contain the ID of the authenticated user who performed the deletion
- **AND** `deletedBy` SHALL be a foreign key referencing `users.id`

### Requirement: Soft delete updates updatedOn timestamp
The system SHALL update the `updatedOn` field when performing a soft delete, consistent with other event mutations.

#### Scenario: updatedOn set to now() during soft delete
- **WHEN** a soft delete is performed on an event
- **THEN** the `updatedOn` field SHALL be set to the current timestamp
- **AND** `updatedOn` SHALL reflect the deletion timestamp (same as or near `deletedAt`)

### Requirement: Soft delete bypasses prismaService.deleteRow utility
The system SHALL NOT use the existing `prismaService.deleteRow()` utility for soft-deletes.

#### Scenario: DAO uses update instead of delete
- **WHEN** `deleteEventById` is called in the DAO
- **THEN** the DAO SHALL call `prisma.events.update()` with `deletedAt` and `deletedBy` fields
- **AND** SHALL NOT call `prisma.events.delete()` or `prismaService.deleteRow()`
