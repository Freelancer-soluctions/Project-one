# Design: Add Users by Status Endpoint

## Overview

This design document outlines the technical implementation for adding a users-by-status endpoint to support the mentions feature in the notes module. The implementation follows the existing controller/service/DAO pattern in the server and maintains consistency with the client API structure.

## Architecture

### System Components

```
┌─────────────────┐
│   Client Side    │
│                 │
│  usersApi.js    │
│  ┌──────────┐   │
│  │getUsers  │   │
│  │ByStatus  │   │
│  └────┬─────┘   │
└───────┼─────────┘
        │ HTTP GET
        │ /api/users/by-status/:status
        ▼
┌─────────────────┐
│   Server Side   │
│                 │
│  routes.js      │
│  ┌──────────┐   │
│  │  Route   │   │
│  └────┬─────┘   │
│       │         │
│  controller.js  │
│  ┌──────────┐   │
│  │getUsers  │   │
│  │ByStatus  │   │
│  └────┬─────┘   │
│       │         │
│  service.js     │
│  ┌──────────┐   │
│  │getUsers  │   │
│  │ByStatus  │   │
│  └────┬─────┘   │
│       │         │
│  dao.js         │
│  ┌──────────┐   │
│  │getUsers  │   │
│  │ByStatus  │   │
│  └────┬─────┘   │
└───────┼─────────┘
        │ Prisma Query
        ▼
┌─────────────────┐
│   Database      │
│                 │
│  users table   │
│  (id, name,    │
│   statusId)     │
└─────────────────┘
```

## Technical Decisions

### 1. API Design

**Endpoint**: `GET /api/users/by-status/:status`

**Rationale**:
- RESTful design using URL path parameter for status
- Consistent with existing user endpoints pattern
- Easy to cache and bookmark

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user-1",
      "name": "John Doe"
    }
  ]
}
```

**Rationale**:
- Follows existing `globalResponse` pattern
- Minimal payload (only id and name) for performance
- Consistent with other API responses in the project

### 2. Server Implementation Strategy

**Layered Architecture**:

1. **DAO Layer** (`dao.js`)
   - Direct database access using Prisma
   - Filters users by status code
   - Selects only `id` and `name` fields
   - Returns array of user objects

2. **Service Layer** (`service.js`)
   - Business logic layer
   - Calls DAO function
   - Handles any data transformation if needed
   - Returns result to controller

3. **Controller Layer** (`controller.js`)
   - HTTP request/response handling
   - Uses `handleCatchErrorAsync` for error handling
   - Uses `globalResponse` for consistent responses
   - Extracts status from `req.params`

4. **Routes Layer** (`routes.js`)
   - Maps URL path to controller function
   - Follows existing route pattern

**Rationale**:
- Maintains separation of concerns
- Follows existing project patterns
- Easy to test and maintain
- Consistent with other user endpoints

### 3. Client Implementation Strategy

**API Method** (`usersApi.js`):
```javascript
getUsersByStatus(status)
```

**Implementation Details**:
- Uses existing HTTP client/fetch pattern
- Calls `GET /api/users/by-status/:status`
- Extracts and returns data array
- Propagates errors to caller

**Rationale**:
- Consistent with existing API methods
- Reuses existing HTTP client
- Simple and predictable interface

### 4. Database Query Optimization

**Query Strategy**:
```javascript
prisma.users.findMany({
  where: {
    status: {
      code: status
    }
  },
  select: {
    id: true,
    name: true
  }
})
```

**Rationale**:
- Prisma's `select` ensures only id and name are fetched
- Reduces payload size
- Improves query performance
- Type-safe query construction

**Performance Considerations**:
- Consider adding database index on `status.code` if not exists
- Query should complete in under 200ms for typical datasets
- Minimal payload reduces network transfer time

### 5. Error Handling Strategy

**Server Side**:
- `handleCatchErrorAsync` wrapper catches all errors
- Returns appropriate HTTP status codes:
  - 400: Invalid status parameter
  - 404: No users found (optional, could return empty array)
  - 500: Server errors

**Client Side**:
- Propagates errors to caller
- Allows consuming code to handle errors appropriately

**Rationale**:
- Consistent with existing error handling patterns
- Provides meaningful error messages
- Flexible error handling for consumers

### 6. Security Considerations

**Input Validation**:
- Validate status parameter against allowed values
- Use Prisma's parameterized queries (prevents SQL injection)
- Consider status whitelist if status values are limited

**Authentication**:
- Follow existing authentication pattern for user endpoints
- If other user endpoints require auth, this should too

**Rationale**:
- Prevents injection attacks
- Maintains security consistency
- Follows project security standards

## Implementation Order

### Phase 1: Server Implementation
1. Add `getUsersByStatus(status)` function to `dao.js`
2. Add `getUsersByStatus(status)` function to `service.js`
3. Add `getUsersByStatus` controller function to `controller.js`
4. Add route to `routes.js`

### Phase 2: Client Implementation
1. Add `getUsersByStatus(status)` method to `usersApi.js`
2. Add JSDoc documentation

### Phase 3: Testing (Deferred)
- Unit tests for DAO, Service, Controller
- Integration tests for the endpoint
- Client API tests

## Dependencies

### External Dependencies
- Prisma ORM (already configured)
- Express.js (already configured)
- Existing HTTP client (already configured)

### Internal Dependencies
- `apps/server/src/modules/users/dao.js` - existing DAO functions
- `apps/server/src/modules/users/service.js` - existing service functions
- `apps/server/src/modules/users/controller.js` - existing controller functions
- `apps/server/src/modules/users/routes.js` - existing routes
- `apps/server/src/utils/responses&Errors/handleCatchErrorAsync.js` - error handling
- `apps/server/src/utils/responses&Errors/globalResponse.js` - response formatting
- `apps/client/src/modules/users/api/usersApi.js` - existing API methods

## Risks and Mitigations

### Risk 1: Performance Issues with Large Datasets
**Mitigation**:
- Select only id and name fields
- Consider pagination if needed in future
- Add database index on status field

### Risk 2: Invalid Status Values
**Mitigation**:
- Validate status parameter
- Return 400 error for invalid status
- Consider status whitelist

### Risk 3: Breaking Existing Functionality
**Mitigation**:
- Follow existing patterns exactly
- Test thoroughly before deployment
- Maintain backward compatibility

## Future Enhancements

1. **Pagination**: Add pagination support for large result sets
2. **Caching**: Implement caching for frequently queried statuses
3. **Additional Filters**: Allow filtering by multiple criteria
4. **Sorting**: Add sorting options (e.g., by name)
5. **Search**: Add search functionality within status results

## Documentation Requirements

### Code Documentation
- JSDoc comments for all new functions
- Parameter descriptions
- Return value descriptions
- Example usage where appropriate

### API Documentation
- Document endpoint in route file
- Include request/response examples
- Document error responses
- Update any API documentation files

## Testing Strategy (Deferred)

As requested, testing is deferred for this iteration. When implemented, should include:

1. **Unit Tests**:
   - DAO function with various status values
   - Service function
   - Controller function with mock request/response

2. **Integration Tests**:
   - Full endpoint testing
   - Error scenarios
   - Performance testing

3. **Client Tests**:
   - API method testing
   - Error handling