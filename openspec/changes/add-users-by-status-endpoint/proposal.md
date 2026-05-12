# Proposal: Add Users by Status Endpoint

## Why

The notes module requires a mentions feature that needs to query users by their status. Currently, there is no endpoint available to filter users by status and retrieve only the essential fields (id and name) needed for the mentions autocomplete functionality.

## What Changes

This change will add a new endpoint to the users module that:
- Filters users by status
- Returns only id and name fields (minimal data for performance)
- Follows the existing structure in both client and server modules
- Includes proper documentation

## Capabilities

1. **User Status Query API**: Query users filtered by status with minimal response fields
2. **Client API Integration**: Integrate the new endpoint in the client users API module
3. **Server Route Implementation**: Create the corresponding server route with proper structure

## Impact

- **Client**: Adds a new API method in `apps/client/src/modules/users/api/` for querying users by status
- **Server**: Adds a new route in `apps/server/src/modules/users/` following the existing controller/service/DAO pattern
- **Performance**: Minimal response payload (only id and name) improves autocomplete performance
- **Documentation**: API documentation will be added for the new endpoint
- **Testing**: Tests are deferred for this iteration (as requested)

## Dependencies

- Existing users module structure in both client and server
- Current user status field in the database