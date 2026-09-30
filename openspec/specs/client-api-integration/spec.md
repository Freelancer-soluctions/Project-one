# client-api-integration Specification

## Purpose

Integrar la query de usuarios por status en el cliente: expone un método en el módulo `users/api` que consume `GET /users/status`, filtra por status y devuelve la lista mínima `{ id, name }` que alimenta el autocomplete de menciones. Cubre solo la capa cliente — el endpoint en sí vive en `user-status-query-api`, el pipeline server en `server-route-implementation`.

## Requirements

### Requirement: The client users API SHALL expose a method to query users by status

The client users API module SHALL expose a method that requests the server's `GET /users/status` endpoint, passes the status filter, and returns the list of `{ id, name }` users. The method SHALL follow the module's existing request pattern and include JSDoc documentation.

#### Scenario: Client fetches users for mentions autocomplete

- **WHEN** the mentions feature needs users filtered by status
- **THEN** the client API method requests `/users/status` and resolves with the `{ id, name }` list

#### Scenario: Errors propagate to the caller

- **WHEN** the server responds with a validation error or the request fails
- **THEN** the method propagates the error to the caller instead of swallowing it
