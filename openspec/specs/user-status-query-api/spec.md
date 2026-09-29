# user-status-query-api Specification

## Purpose

Exponer la query de usuarios por status como endpoint mínimo: `GET /users/status` devuelve solo `{ id, name }` de los usuarios que matchean un status validado, con payload reducido para el autocomplete de menciones. Es la fuente de datos del change de integración cliente (`client-api-integration`) y complementa la capa server (`server-route-implementation`).

## Requirements

### Requirement: The users API SHALL expose a status-filtered query endpoint

The users module SHALL expose `GET /users/status` that filters users by status code and returns only the minimal fields needed for mentions autocomplete (`id` and `name`). The endpoint SHALL be authenticated and the status parameter SHALL be validated against the allowed status codes.

#### Scenario: Query users by a valid status

- **WHEN** a client requests `GET /users/status` with a valid status code
- **THEN** the response returns `success: true` with an array of `{ id, name }` objects for matching users

#### Scenario: Response contains only minimal fields

- **WHEN** the endpoint returns users
- **THEN** each user object contains only `id` and `name` — no additional fields leak into the payload

### Requirement: Invalid or unknown status SHALL be rejected without leaking internals

The endpoint SHALL return a client-error response when the status parameter is missing or not an allowed status code, and SHALL return an empty list (or not-found semantics per the module's existing conventions) when no users match — never a 500.

#### Scenario: Status parameter outside the allowed codes

- **WHEN** a client requests the endpoint with a status code that is not allowed
- **THEN** the API responds with a validation error instead of executing the query

#### Scenario: No users match the requested status

- **WHEN** the status is valid but no users have it
- **THEN** the endpoint responds successfully with an empty list
