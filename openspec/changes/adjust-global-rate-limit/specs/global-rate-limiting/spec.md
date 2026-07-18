## ADDED Requirements

### Requirement: Per-user key derivation
The global rate limiter SHALL derive its rate limit key from the JWT-authenticated user identity when available, falling back to the request IP address for unauthenticated requests.

#### Scenario: Authenticated user uses userId as key
- **WHEN** a request includes a valid JWT token and `verifyToken` middleware has set `req.userId`
- **THEN** the global limiter SHALL use `req.userId` as the rate limit key

#### Scenario: Unauthenticated request falls back to IP
- **WHEN** a request does not have a valid JWT token (and `req.userId` is not set)
- **THEN** the global limiter SHALL use `req.ip` as the rate limit key

### Requirement: Global rate limit window (3,000 requests per hour)
The global limiter SHALL enforce a maximum of 3,000 requests per user per sliding hour window. The window duration and max requests SHALL be configurable via environment variables `RATE_LIMIT_GLOBAL_WINDOW_MS` (default: 3600000) and `RATE_LIMIT_GLOBAL_MAX` (default: 3000).

#### Scenario: Request within global limit passes
- **WHEN** the user has made fewer than 3,000 requests in the current sliding hour window
- **THEN** the request SHALL pass through to the next middleware

#### Scenario: Request exceeding global limit returns 429
- **WHEN** the user has made 3,000 or more requests in the current sliding hour window
- **THEN** the system SHALL respond with HTTP 429 (Too Many Requests)
- **AND** the response SHALL include the IETF draft-8 `RateLimit` header showing the limit and remaining count

#### Scenario: Counter resets after window expiry
- **WHEN** the sliding hour window has elapsed since the user's first request in the window
- **THEN** the rate limit counter SHALL reset, allowing the user to make new requests up to the limit

### Requirement: Burst sub-limiter
The system SHALL enforce a strict per-user request rate of 100 requests per minute (burst window), applied before the hourly window.

#### Scenario: Burst limit exceeded returns 429
- **WHEN** user sends more than 100 requests within a 60-second window
- **THEN** the system SHALL return HTTP 429 Too Many Requests
- **AND** the `RateLimit-Remaining` header SHALL reflect the burst window remaining count
- **AND** the hourly window continues to count independently

#### Scenario: Burst within limits passes through
- **WHEN** user sends 50 requests within a 60-second window
- **THEN** the system SHALL pass the request to the next middleware (hourly limiter)
- **AND** the hourly remaining count SHALL decrement normally

### Requirement: Redis-backed persistent storage
The global limiter SHALL use Redis (`rate-limit-redis` v4 + `ioredis`) as its store backend for rate limit counters, enabling persistence across server restarts and horizontal scaling across multiple processes.

#### Scenario: Counters survive server restart
- **WHEN** the server restarts
- **THEN** the existing rate limit counters in Redis SHALL be preserved and remain in effect

#### Scenario: Horizontal scaling shares counters
- **WHEN** multiple server processes handle requests for the same user
- **THEN** all processes SHALL share the same Redis-backed rate limit counters

#### Scenario: Redis URL env var configures connection
- **WHEN** the server starts
- **THEN** the system SHALL read `REDIS_URL` environment variable to configure the Redis client connection
- **AND** SHALL default to `redis://localhost:6379` if not set

### Requirement: Resilient Redis failure mode
The global limiter SHALL pass through requests without rate limiting when Redis is unavailable, using `skipOnStoreError: true`.

#### Scenario: Redis unavailable allows request
- **WHEN** Redis is unreachable or returns an error
- **THEN** the global limiter SHALL allow the request to pass through without enforcing rate limits

#### Scenario: Redis recovers and resumes limiting
- **WHEN** Redis becomes available again after an outage
- **THEN** the global limiter SHALL automatically resume enforcing rate limits

### Requirement: IETF draft-8 RateLimit headers
The global limiter SHALL emit the IETF draft-8 combined `RateLimit` header format via `standardHeaders: 'draft-8'`.

#### Scenario: Response includes combined RateLimit header
- **WHEN** a response passes through the global limiter
- **THEN** the response SHALL include a `RateLimit` header with `limit`, `remaining`, `reset`, and `policy` fields in IETF draft-8 format

### Requirement: Auth limiter isolation
Auth-specific rate limiters (loginLimiter, refreshTokenLimiter, changePasswordLimiter, forgotPasswordLimiter) SHALL remain completely untouched by this change. They SHALL continue to use in-memory storage and per-IP key derivation.

#### Scenario: Auth endpoints use own limiters
- **WHEN** a request hits an auth endpoint (e.g., `/api/v1/auth/login`)
- **THEN** the auth-specific limiter SHALL apply instead of the global limiter
- **AND** the auth-specific limiter behavior SHALL be unchanged from prior implementation
