# websocket-jwt-auth Specification

## Purpose
TBD - created by archiving change websocket-level-03-auth. Update Purpose after archive.
## Requirements
### Requirement: WebSocket JWT authentication
The system SHALL authenticate Socket.IO connections using JWT tokens provided via the client handshake auth object, using the same verification logic as the Express REST API middleware.

#### Scenario: Client without token is rejected
- **WHEN** a client attempts to connect without providing an auth token
- **THEN** the server SHALL reject the connection with `new Error('UNAUTHORIZED')` (message string 'UNAUTHORIZED')
- **AND** the server SHALL log a warning with the client's IP address

#### Scenario: Client with valid JWT connects successfully
- **WHEN** a client connects with a valid JWT token in `socket.handshake.auth.token`
- **THEN** the server SHALL verify the token using `jwt.verify` with HS256 algorithm
- **AND** the server SHALL store the decoded payload in `socket.data.user`
- **AND** the server SHALL allow the connection

#### Scenario: Client with expired JWT is rejected
- **WHEN** a client connects with an expired JWT token
- **THEN** the server SHALL reject the connection with `new Error('UNAUTHORIZED')` (message string 'UNAUTHORIZED')
- **AND** the server SHALL log a warning with the expired token details and client IP

#### Scenario: Client refreshes token on connect_error and reconnects
- **WHEN** a client receives a `connect_error` due to an expired or invalid token
- **AND** the client obtains a new valid JWT token
- **AND** the client calls `socket.connect()` with the new token
- **THEN** the server SHALL accept the connection

#### Scenario: Failed auth logs warning with IP
- **WHEN** authentication fails for any reason
- **THEN** the server SHALL record a warning via the Winston logger including the client's IP address and timestamp

