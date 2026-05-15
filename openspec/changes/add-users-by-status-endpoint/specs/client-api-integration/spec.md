# Spec: Client API Integration

## Overview

This spec defines the requirements for integrating the user status query endpoint in the client-side users API module.

## Requirements

### Functional Requirements

1. **API Method Location**
   - Add new method to `apps/client/src/modules/users/api/usersApi.js`
   - Follow existing naming conventions and structure in the file

2. **Method Signature**
   - Method name: `getUsersByStatus(status)`
   - Parameters:
     - `status` (string, required): The user status to filter by
   - Returns: Promise with array of user objects containing id and name

3. **API Call Implementation**
   - Use the existing HTTP client/fetch pattern from the file
   - Call the endpoint: `GET /api/users/by-status/:status`
   - Handle the response and extract the data array

4. **Error Handling**
   - Propagate errors to the caller
   - Handle 400, 404, and 500 errors appropriately
   - Return meaningful error messages

5. **Type Safety (if TypeScript)**
   - Define interface for UserStatusResponse
   - Define interface for User (id, name)

### Non-Functional Requirements

1. **Code Quality**
   - Follow existing code style in the file
   - Include JSDoc comments for the method
   - Maintain consistency with other API methods

2. **Documentation**
   - Add JSDoc comment describing:
     - Method purpose
     - Parameters
     - Return value
     - Example usage

3. **Testing**
   - Tests are deferred for this iteration (as requested)

## Acceptance Criteria

- [ ] Method added to usersApi.js following existing patterns
- [ ] Method accepts status parameter
- [ ] Method calls the correct endpoint
- [ ] Response is properly parsed and returned
- [ ] Error handling is implemented
- [ ] JSDoc comments are added
- [ ] Code follows existing conventions

## Dependencies

- Server endpoint must be implemented first
- Existing usersApi.js structure and patterns
- HTTP client/fetch library used in the project