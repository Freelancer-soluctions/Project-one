## Why

The current global rate limiter limits 500 req/hour per IP address, causing two critical issues: (1) corporate NAT environments collapse multiple users behind a single IP into one shared quota, giving each user ~50 req/hour when 10 users share it — less than 1 req/minute, while a normal admin generates 150–300 req/hour; (2) in-memory storage resets on every server restart and cannot scale horizontally across processes. These limitations block enterprise adoption and multi-server deployments.

## What Changes

- **Replace IP-based global limiter** with a per-user (JWT `req.userId`) rate limiter, falling back to `req.ip` for unauthenticated requests
- **Increase limit** from 500 req/hour/IP to 3,000 req/hour/user with a 100 req/minute burst sub-limiter
- **Add Redis store** (`rate-limit-redis` + `ioredis`) for persistence and multi-process horizontal scaling
- **Add Redis store failure fallback** (`skipOnStoreError: true`) so Redis downtime doesn't block requests
- **Move rate limiter middleware** after `verifyToken` in the middleware chain to gain access to `req.userId`
- **Create Redis config** module (`apps/server/src/config/redis.js`) for reusable client configuration
- **Add environment variables** `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_GLOBAL_WINDOW_MS`, and `REDIS_URL`
- **Add npm dependencies** `rate-limit-redis` and `ioredis`
- **Update headers** to IETF draft-8 combined `RateLimit` header format
- **Keep ALL auth-specific limiters untouched** (loginLimiter, refreshTokenLimiter, changePasswordLimiter, forgotPasswordLimiter)

## Capabilities

### New Capabilities
- `global-rate-limiting`: Per-user (JWT-authenticated) global rate limiting with Redis persistence, horizontal scaling support, and burst-rate sub-limiting. Covers the API surface guarded by the global limiter after `verifyToken`.

### Modified Capabilities
- *(none — no existing specs have requirement changes)*

## Impact

| File | Change |
|------|--------|
| `apps/server/src/middleware/rateLimit.js` | Add Redis store, refactor `limiter` → `globalLimiter` with per-user key, add burst sub-limiter |
| `apps/server/src/middleware/index.js` | Update export name `limiter` → `globalLimiter` |
| `apps/server/src/app.js` | Move globalLimiter AFTER verifyToken, update import name |
| `apps/server/src/config/redis.js` | NEW: Redis client configuration module |
| `apps/server/.env.example` | Add `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_GLOBAL_WINDOW_MS`, and `REDIS_URL` |
| `apps/server/src/modules/auth/routes.js` | No changes needed — auth already imports `loginLimiter`/`refreshTokenLimiter` directly |
| `apps/server/package.json` | Add `rate-limit-redis`, `ioredis` dependencies |

**Risks:**
- Redis becomes a new dependency — `skipOnStoreError: true` allows pass-through when Redis is down
- Unauthenticated requests bypass the global limiter (hits `verifyToken` first, which rejects them) — acceptable because auth has its own strict limiters
- `REDIS_URL` and `RATE_LIMIT_GLOBAL_MAX` must be configured in environment
