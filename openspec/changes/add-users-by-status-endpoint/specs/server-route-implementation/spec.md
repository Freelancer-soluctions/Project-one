# Spec: Server Route Implementation

## Overview

This spec defines the requirements for implementing the server-side route for querying users by status, following the existing controller/service/DAO pattern in the users module.

## Requirements

### Functional Requirements

1. **DAO Layer Implementation**
   - Add function `getUsersByStatus(status)` in `apps/server/src/modules/users/dao.js`
   - Query users filtered by status code
   - Select only `id` and `name` fields (minimal payload)
   - Use Prisma to query the users table with status filter
   - Return array of user objects with id and name

2. **Service Layer Implementation**
   - Add function `getUsersByStatus(status)` in `apps/server/src/modules/users/service.js`
   - Call the DAO function
   - Handle any business logic if needed
   - Return the result from DAO

3. **Controller Layer Implementation**
   - Add function `getUsersByStatus` in `apps/server/src/modules/users/controller.js`
   - Use `handleCatchErrorAsync` wrapper
   - Extract status parameter from `req.params`
   - Call the service function
   - Use `globalResponse` to send response with status 200
   - Include JSDoc comments

4. **Route Definition**
   - Add route in `apps/server/src/modules/users/routes.js`
   - Route path: `GET /by-status/:status`
   - Map to the controller function
   - Follow existing route pattern in the file

5. **Error Handling**
   - DAO should return empty array if no users found
   - Service should propagate errors
   - Controller should handle errors via `handleCatchErrorAsync`
   - Validate status parameter if needed

### Non-Functional Requirements

1. **Code Quality**
   - Follow existing code style and patterns
   - Maintain consistency with other user endpoints
   - Use existing utilities (`handleCatchErrorAsync`, `globalResponse`)

2. **Performance**
   - Query should be optimized (only select id and name)
   - Consider adding database index on status field if not exists

3. **Documentation**
   - Add JSDoc comments to all functions
   - Document the route in routes.js if pattern exists

4. **Security**
   - Validate status parameter to prevent SQL injection
   - Use parameterized queries (Prisma handles this)

## Acceptance Criteria

- [ ] DAO function added with Prisma query filtering by status
- [ ] DAO returns only id and name fields
- [ ] Service function added and calls DAO
- [ ] Controller function added with proper error handling
- [ ] Controller uses `handleCatchErrorAsync` and `globalResponse`
- [ ] Route added in routes.js with correct path
- [ ] All functions have JSDoc comments
- [ ] Code follows existing patterns and conventions
- [ ] Endpoint returns 200 with user array or empty array

## Dependencies

- Existing users module structure (controller, service, dao, routes)
- Prisma ORM configured
- User model with status field
- Existing utility functions (`handleCatchErrorAsync`, `globalResponse`)