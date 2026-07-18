## ADDED Requirements

### Requirement: JWT Cookie Authentication for SSE Endpoint
The SSE subscribe endpoint SHALL authenticate connections by validating the JWT from the HTTP-only cookie in the request's Cookie header.

#### Scenario: Authenticate with valid JWT cookie
- **WHEN** a client opens an SSE connection to `/api/v1/sse/subscribe` with a valid JWT in the HTTP-only cookie
- **THEN** the auth middleware SHALL decode and validate the JWT, extract the userId, and allow the connection to proceed

#### Scenario: Extract JWT from configurable cookie name
- **WHEN** an SSE connection request arrives
- **THEN** the auth middleware SHALL extract the JWT from the cookie name defined by the `SSE_COOKIE_NAME` environment variable, defaulting to `"token"` if not set

#### Scenario: Reject connection with missing cookie
- **WHEN** a client opens an SSE connection without a JWT cookie
- **THEN** the auth middleware SHALL respond with HTTP 401 Unauthorized, close the connection, and the client SHALL NOT reconnect

#### Scenario: Reject connection with expired JWT
- **WHEN** a client opens an SSE connection with an expired JWT
- **THEN** the auth middleware SHALL respond with HTTP 401 Unauthorized, close the connection, and the client SHALL NOT reconnect

#### Scenario: Reject connection with invalid JWT
- **WHEN** a client opens an SSE connection with a malformed or tampered JWT
- **THEN** the auth middleware SHALL respond with HTTP 401 Unauthorized and close the connection

#### Scenario: Pass userId to downstream handlers
- **WHEN** JWT validation succeeds
- **THEN** the middleware SHALL attach the decoded userId to the request object for use by channel authorization and SseManager

### Requirement: Credential Forwarding
The SSE endpoint SHALL require `withCredentials: true` from the client to ensure HTTP-only cookies are sent with the EventSource request.

#### Scenario: Cookie sent with EventSource request
- **WHEN** the client creates an EventSource with `{ withCredentials: true }`
- **THEN** the browser SHALL include the HTTP-only cookie in the SSE request

#### Scenario: Require Access-Control-Allow-Credentials
- **WHEN** the SSE endpoint receives a cross-origin request
- **THEN** the CORS middleware SHALL set `Access-Control-Allow-Credentials: true`; if this header is not set, the SSE connection SHALL fail

### Known Limitation: JWT Expiry During Long-Lived Connections
Long-lived SSE connections may exceed the JWT expiry duration. Token refresh for SSE connections is deferred and not handled in the current implementation. Clients MUST re-establish the SSE connection after JWT expiry, which will include the new JWT cookie.
