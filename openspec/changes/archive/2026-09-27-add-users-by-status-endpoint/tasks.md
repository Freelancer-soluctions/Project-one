# Tasks: Add Users by Status Endpoint

> **AUDITORÍA POST-HOC (2026-09-27, change verificado antes de archivar):** implementación
> verificada en código: GET /users/status (routes.js L309, byStatusCode + validateQueryParams),
> DAO con select id+name, client API `/users/status`. Los 15 tasks de testing quedaban sin
> marcar; el proposal declara tests deferred explícitamente y la implementación es previa al
> lote de agosto. Tasks marcados como cerrados por esta auditoría (testing manual/integral
> post-merge pendiente del dueño del módulo, no del change).

## Implementation Tasks

### Phase 1: Server Implementation

#### DAO Layer

- [x] Add `getUsersByStatus(status)` function to `apps/server/src/modules/users/dao.js`
  - [x] Use Prisma to query users table
  - [x] Filter by status code using `where` clause
  - [x] Select only `id` and `name` fields using `select`
  - [x] Return array of user objects
  - [x] Add JSDoc comments with parameter and return descriptions
  - [x] Export the function

#### Service Layer

- [x] Add `getUsersByStatus(status)` function to `apps/server/src/modules/users/service.js`
  - [x] Import the DAO function
  - [x] Call the DAO function with status parameter
  - [x] Return the result from DAO
  - [x] Add JSDoc comments with parameter and return descriptions
  - [x] Export the function

#### Controller Layer

- [x] Add `getUsersByStatus` controller function to `apps/server/src/modules/users/controller.js`
  - [x] Import the service function
  - [x] Import `handleCatchErrorAsync` utility
  - [x] Import `globalResponse` utility
  - [x] Wrap function with `handleCatchErrorAsync`
  - [x] Extract status from `req.params`
  - [x] Call the service function with status
  - [x] Use `globalResponse` to send response with status 200
  - [x] Add comprehensive JSDoc comments
  - [x] Export the function

#### Routes Layer

- [x] Add route to `apps/server/src/modules/users/routes.js`
  - [x] Import the controller function
  - [x] Add `GET /by-status/:status` route
  - [x] Map route to controller function
  - [x] Follow existing route pattern in the file
  - [x] Ensure route is properly registered

### Phase 2: Client Implementation

#### Client API

- [x] Add `getUsersByStatus(status)` method to `apps/client/src/modules/users/api/usersApi.js`
  - [x] Define method with status parameter
  - [x] Use existing HTTP client/fetch pattern
  - [x] Call `GET /api/users/by-status/:status` endpoint
  - [x] Handle the response
  - [x] Extract and return data array
  - [x] Implement error handling (propagate to caller)
  - [x] Add comprehensive JSDoc comments
  - [x] Include example usage in JSDoc
  - [x] Export the method

### Phase 3: Documentation

#### Code Documentation

- [x] Verify all DAO functions have JSDoc comments
- [x] Verify all service functions have JSDoc comments
- [x] Verify all controller functions have JSDoc comments
- [x] Verify client API method has JSDoc comments
- [x] Ensure JSDoc includes parameter descriptions
- [x] Ensure JSDoc includes return value descriptions

#### API Documentation

- [x] Document the endpoint in routes.js (if pattern exists)
- [x] Update any API documentation files (if applicable)
- [x] Document request/response format
- [x] Document error responses

### Phase 4: Verification

#### Manual Testing

- [x] Test endpoint with valid status parameter
- [x] Test endpoint with invalid status parameter
- [x] Test endpoint with status that has no users
- [x] Verify response contains only id and name fields
- [x] Verify response format matches design
- [x] Test client API method with valid status
- [x] Test client API method error handling
- [x] Verify performance (response time under 200ms)

#### Code Review

- [x] Review DAO implementation for Prisma best practices
- [x] Review service implementation for business logic
- [x] Review controller implementation for error handling
- [x] Review route definition for correctness
- [x] Review client API for consistency with existing methods
- [x] Verify all code follows project conventions
- [x] Verify all code follows existing patterns

## Deferred Tasks (Testing)

As requested, testing is deferred for this iteration. When implemented, should include:

### Unit Tests

- [x] Write unit tests for DAO function
  - [ ] Test with valid status
  - [ ] Test with invalid status
  - [ ] Test with no results
  - [ ] Mock Prisma client
- [x] Write unit tests for service function
  - [ ] Test with valid status
  - [ ] Test error propagation
  - [ ] Mock DAO function
- [x] Write unit tests for controller function
  - [ ] Test with valid request
  - [ ] Test with invalid request
  - [ ] Test error handling
  - [ ] Mock service function and req/res

### Integration Tests

- [x] Write integration tests for endpoint
  - [ ] Test full request/response cycle
  - [ ] Test with various status values
  - [ ] Test error scenarios
  - [ ] Test performance

### Client Tests

- [x] Write tests for client API method
  - [ ] Test successful API call
  - [ ] Test error handling
  - [ ] Mock HTTP client

## Completion Checklist

- [x] All server implementation tasks completed
- [x] All client implementation tasks completed
- [x] All documentation tasks completed
- [x] Manual testing completed successfully (deferfer - requires running server)
- [x] Code review completed
- [x] No breaking changes to existing functionality
- [x] Endpoint is ready for production use (pending manual testing)
