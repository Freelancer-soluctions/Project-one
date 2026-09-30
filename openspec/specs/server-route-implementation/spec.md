# server-route-implementation Specification

## Purpose

Definir cómo el módulo `users` del servidor implementa la query por status siguiendo el patrón controller/service/DAO: DAO Prisma con select mínimo (`id`+`name`), delegación por capas, validación del parámetro antes del controller y ruta autenticada bajo el patrón existente del módulo. Complementa la capability del endpoint (`user-status-query-api`) y la integración cliente (`client-api-integration`).

## Requirements

### Requirement: The users module SHALL implement the status query through the controller/service/DAO pattern

The users module SHALL implement `GET /users/status` following the existing layering: a DAO function that queries users via Prisma filtered by status code and selects only `id` and `name`, a service function that delegates to the DAO, and a controller that extracts the status, wraps execution with the module's async error handler, and responds through the standard response helper. All layers SHALL carry JSDoc documentation consistent with the module.

#### Scenario: Request flows through the layers

- **WHEN** a request reaches `GET /users/status` with a validated status code
- **THEN** the controller calls the service, the service calls the DAO, and the DAO returns only `{ id, name }` rows filtered by status

#### Scenario: DAO query is payload-minimal

- **WHEN** the DAO queries the users table
- **THEN** the Prisma select projects only `id` and `name` — no other columns are fetched

### Requirement: The route SHALL be registered with parameter validation

The route SHALL be registered in the users module routes using the module's existing route pattern, with the status query parameter validated (validator middleware) before reaching the controller, and the endpoint protected by the module's standard authentication middleware.

#### Scenario: Validation runs before the controller

- **WHEN** a request arrives with a status value outside the allowed codes
- **THEN** the validator middleware rejects it before the controller executes

#### Scenario: Route is authenticated

- **WHEN** an unauthenticated request reaches the route
- **THEN** the auth middleware rejects it before any user data is queried
