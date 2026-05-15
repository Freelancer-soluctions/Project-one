# Spec: User Status Query API

## Overview

This spec defines the requirements for the user status query API endpoint that will be used by the mentions feature in the notes module.

## Requirements

### Functional Requirements

1. **Endpoint Path**: `GET /api/users/by-status/:status`
   - Accepts a status parameter in the URL path
   - Returns a list of users matching the specified status

2. **Query Parameters**
   - `status` (required): The user status to filter by (e.g., "active", "inactive", "pending")
   - Must be validated against allowed status values

3. **Response Format**
   - Returns an array of user objects
   - Each user object contains only:
     - `id`: User identifier (string/number)
     - `name`: User display name (string)
   - No additional fields should be included

4. **Response Structure**
   ```json
   {
     "success": true,
     "data": [
       {
         "id": "user-1",
         "name": "John Doe"
       },
       {
         "id": "user-2",
         "name": "Jane Smith"
       }
     ]
   }
   ```

5. **Error Handling**
   - Return 400 if status parameter is invalid
   - Return 404 if no users found with the specified status
   - Return 500 for server errors

### Non-Functional Requirements

1. **Performance**
   - Response time should be under 200ms for typical queries
   - Minimal payload size (only id and name fields)

2. **Security**
   - Endpoint should be authenticated (if other user endpoints are)
   - Validate status parameter to prevent injection attacks

3. **Documentation**
   - Include JSDoc comments for the API method
   - Document the endpoint in the server route file

## Acceptance Criteria

- [ ] Endpoint accepts status parameter and returns filtered users
- [ ] Response contains only id and name fields
- [ ] Invalid status returns 400 error
- [ ] No users found returns 404 error
- [ ] API is documented with JSDoc comments
- [ ] Response time is under 200ms for typical queries

## Dependencies

- Existing user model with status field
- Database query capability to filter by status