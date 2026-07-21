## Context

The current global rate limiter lives in `apps/server/src/middleware/rateLimit.js` as an exported `limiter` instance using `express-rate-limit` v7. It applies 500 requests/hour per IP address with in-memory storage, and is configured in `apps/server/src/app.js` to apply to all `/api` routes except `/api/v1/auth/*`.

Two structural problems drive this change:

1. **Per-IP granularity breaks under corporate NAT**: Multiple users behind a single public IP share one quota. With 10 users behind a NAT, each gets ~50 req/hour — below normal admin traffic (150–300 req/hour). The system has no way to distinguish users by identity.

2. **In-memory storage doesn't survive restarts**: Every server restart resets the rate limit counters. Horizontal scaling is impossible because each process maintains its own counters, and a load balancer would spray requests across processes with independent quotas.

The application already has JWT authentication (`verifyToken` middleware) that sets `req.userId` on authenticated requests, and auth-specific rate limiters (loginLimiter, refreshTokenLimiter, changePasswordLimiter, forgotPasswordLimiter) that apply before the global limiter on auth routes.

## Goals / Non-Goals

**Goals:**
- Replace per-IP global rate limiting with per-user (JWT `req.userId`) rate limiting, falling back to `req.ip` for unauthenticated requests
- Increase global limit from 500 req/hour/IP to 3,000 req/hour/user with a 100 req/minute burst sub-limiter for short-term traffic spikes
- Add Redis-backed storage (`rate-limit-redis` + `ioredis`) for persistence across restarts and horizontal scalability
- Provide fail-open behavior when Redis is unavailable (`skipOnStoreError: true`)
- Move the global limiter after `verifyToken` in the middleware chain so `req.userId` is available
- Upgrade headers to IETF draft-8 combined `RateLimit` format
- Keep all existing auth-specific limiters completely untouched (loginLimiter, refreshTokenLimiter, changePasswordLimiter, forgotPasswordLimiter)

**Non-Goals:**
- Not changing auth-specific rate limiter configuration or behavior
- Not adding Redis to auth-specific limiters (they remain in-memory/IP-based)
- Not modifying the rate limit data model (no DB migration needed)
- Not adding rate limit analytics dashboards or monitoring beyond existing Prometheus metrics
- Not implementing distributed rate limit synchronization strategies beyond Redis store

## Decisions

### 1. Per-user key generation via JWT `req.userId`

**Decision**: Use `req.userId` (set by `verifyToken` middleware) as the rate limit key for authenticated requests, falling back to `req.ip` for unauthenticated requests.

**Rationale**: This solves the corporate NAT problem directly — each authenticated user gets their own quota regardless of IP. Fallback to IP ensures unauthenticated requests (which will be rejected by `verifyToken` anyway for protected routes) still have some basic protection.

**Alternatives considered**:
- **Per-IP + X-Forwarded-For header**: Unreliable — headers can be spoofed by attackers and don't solve NAT.
- **Per-API-key**: The app uses JWT, not API keys.
- **Per-session cookie**: Adds cookie dependency to the global limiter; JWT is more reliable.

### 2. Redis store with `rate-limit-redis` v4 + `ioredis`

**Decision**: Use `rate-limit-redis` v4.x with `ioredis` as the store driver for the global limiter.

**Rationale**: Redis provides persistent counters that survive server restarts and shared state for horizontal scaling. `rate-limit-redis` is the official Redis store adapter for `express-rate-limit`. `ioredis` is a robust Redis client with cluster/sentinel support, TLS, and disconnect detection.

**Alternatives considered**:
- **In-memory (current)**: Simple but doesn't scale horizontally and resets on restart.
- **Postgres (Prisma)**: Unnecessary overhead — rate limiting is a key-value expiry problem, not relational.
- **Memcached**: Less ecosystem support with `express-rate-limit`; no native TTL expiry.
- **`@upstash/ratelimit`** (serverless Redis): Adds another vendor dependency; the app is a long-running server, not serverless.

**Redundancy strategy**: `skipOnStoreError: true` allows the limiter to pass through requests when Redis is unreachable, preventing Redis downtime from becoming API downtime.

**Configuration**: The Redis client connects via the `REDIS_URL` environment variable (default: `redis://localhost:6379`). A dedicated config module at `src/config/redis.js` creates the `ioredis` singleton shared by both limiters.

Both `globalBurstLimiter` and `globalLimiter` share the same Redis store instance and `keyGenerator`, ensuring consistent key derivation and a single Redis client connection.

### 3. Limit values: 3,000 req/hour with 100 req/minute burst (two-tier)

**Decision**: Implement two separate `rateLimit()` instances stacked in the middleware chain: a burst sub-limiter (`globalBurstLimiter`) with 100 req/min, followed by the hourly limiter (`globalLimiter`) with 3,000 req/hour. Both use the same Redis store and `keyGenerator`. The order matters -- burst runs first (rejects fast traffic spikes early) and hourly runs second (catches sustained abuse).

**Rationale**: Two separate instances allow each limiter to maintain its own independent counter window. Stacking them means a fast burst is rejected quickly by the first limiter without the overhead of evaluating the hourly window. 3,000 req/hour (~50 req/min average) covers normal admin traffic (150-300 req/hour) with a 10x safety margin. The 100 req/min burst handles short-term traffic spikes (e.g., bulk data exports, rapid page navigation after login).

**Configuration**: Both values overridable via env vars:
- `RATE_LIMIT_GLOBAL_MAX` -- default 3000
- `RATE_LIMIT_GLOBAL_WINDOW_MS` -- default 3600000 (1 hour)

### 4. Middleware reorder: verifyToken global (Path A)

**Decision**: Move `verifyToken` middleware from individual module routers to `routes/v1/index.js` (or `app.js`), running BEFORE `globalLimiter`. Remove `router.use(verifyToken)` from ALL module route files (events, providers, news, users, etc.).

**Middleware chain order in `app.js` / `routes/v1/index.js`**:
```js
// STEP 1: Auth routes (NO verifyToken, NO global limiters)
// Auth handles its own authentication and rate limiting
router.use('/auth', auth);

// STEP 2: Global verifyToken + rate limiting for ALL business routes
router.use(verifyToken);          // Sets req.userId from JWT
router.use(globalBurstLimiter);   // 100 req/min
router.use(globalLimiter);        // 3000 req/hr

// STEP 3: Business module sub-routers
router.use('/news', news);
router.use('/events', events);
// ... rest of modules
```

**Rationale**: The current middleware order in `app.js` applies the global limiter before route-level middleware (including `verifyToken`). To access `req.userId` (set by `verifyToken`), authentication must execute before rate limiting. Lifting `verifyToken` to the router level via `routes/v1/index.js` eliminates redundancy across ~20 module routers and creates a single, consistent middleware chain. Auth routes are mounted FIRST, before the verifyToken + rate limiter chain, which naturally exempts them from global rate limiting without needing explicit path checks.

**Current approach in `app.js`**:
```js
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/v1/auth')) return next();
  limiter(req, res, next);
});
```

**Target approach**: Remove the `app.js` rate limiter middleware and apply the chain in `routes/v1/index.js`:
```js
// STEP 1: Auth routes first (no verifyToken, no limiters)
router.use('/auth', auth);

// STEP 2: Global middleware chain
router.use(verifyToken);
router.use(globalBurstLimiter);
router.use(globalLimiter);

// STEP 3: Business module sub-routers
router.use('/news', news);
router.use('/events', events);
// ...
```
Then each module route file (events, providers, news, users, etc.) removes its individual `router.use(verifyToken)`.

**Note**: This is a one-time restructuring that cleans up ~20 module routers. The benefit is that rate limiting middleware is applied in one place with a single consistent chain. Auth routes (`/v1/auth`) bypass this entirely -- they are mounted on a separate router BEFORE verifyToken is applied.

### 5. IETF draft-8 combined `RateLimit` header

**Decision**: Use `standardHeaders: 'draft-8'` instead of `standardHeaders: true`.

**Rationale**: `express-rate-limit` v7 supports the new IETF standard `RateLimit` combined header (RFC draft-8) which consolidates rate limit info into a single `RateLimit` header. `standardHeaders: true` emits the legacy `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` headers. Moving to `draft-8` is the modern standard.

### 6. Rename `limiter` → `globalLimiter`

**Decision**: Rename the export from `limiter` to `globalLimiter`.

**Rationale**: `limiter` is vague — it could mean any limiter in the system. `globalLimiter` clearly communicates its role as the catch-all rate limiter for the API, distinct from auth-specific limiters.

### 7. Refactoring pattern: keep old code commented

**Decision**: Keep the old (`limiter` / per-IP / in-memory) code commented with a `// BEFORE:` comment explaining what changed.

**Rationale**: Used as an inline audit trail for this specific refactor -- commented code shows the original version and the reason for change. This helps reviewers understand what changed without cross-referencing git history, and provides a quick rollback reference during development.

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Redis becomes a single point of failure** | API unavailable if Redis goes down | `skipOnStoreError: true` — limiter passes through requests when Redis errors |
| **Per-user without auth = fallback to IP** | Unauthenticated users lose per-user granularity | Acceptable — unauthenticated requests to protected routes are rejected by `verifyToken` anyway |
| **Redis latency adds to request time** | Increased P95 response times | `ioredis` connection pooling; Redis typically <1ms latency on LAN |
| **`REDIS_URL` env var not configured** | App starts but rate limiting silently fails | Document in `.env.example`; add startup warning 
