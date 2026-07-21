# Tasks: Adjust Global Rate Limit

## 1. Install Dependencies
- [ ] 1.1 Install `rate-limit-redis` and `ioredis`

## 2. Redis Client Configuration
- [ ] 2.1 Create `apps/server/src/config/redis.js` — Redis client singleton using ioredis
- [ ] 2.2 Export `redisClient` for use by rate limiter and other modules
- [ ] 2.3 Handle connection errors gracefully with reconnect logic

## 3. Middleware Restructuring — Global verifyToken (with auth exemption)
- [ ] 3.1 Add imports for `verifyToken`, `globalBurstLimiter`, `globalLimiter` to `apps/server/routes/v1/index.js`
- [ ] 3.2 Restructure `routes/v1/index.js`:
  - [ ] Mount `/auth` sub-router FIRST (before verifyToken + rate limiters)
  - [ ] Apply `verifyToken` middleware after auth mount
  - [ ] Apply `globalBurstLimiter` after verifyToken
  - [ ] Apply `globalLimiter` after burst limiter
  - [ ] Mount all business module sub-routers AFTER the middleware chain
- [ ] 3.3 Remove `router.use(verifyToken)` from ALL ~20 business module route files:
  - [ ] news/routes.js
  - [ ] providers/routes.js
  - [ ] notes/routes.js
  - [ ] settings/routes.js
  - [ ] events/routes.js
  - [ ] products/routes.js
  - [ ] warehouse/routes.js
  - [ ] stock/routes.js
  - [ ] inventoryMovement/routes.js
  - [ ] sales/routes.js
  - [ ] clients/routes.js
  - [ ] purchase/routes.js
  - [ ] employees/routes.js
  - [ ] attendance/routes.js
  - [ ] payroll/routes.js
  - [ ] vacation/routes.js
  - [ ] permission/routes.js
  - [ ] users/routes.js
  - [ ] expenses/routes.js
  - [ ] performanceEvaluation/routes.js
- [ ] 3.4 Verify `providerOrder/routes.js` has verifyToken but isn't mounted — out of scope (dead code, leave as-is)
- [ ] 3.5 Verify auth routes still work: signin, signup, refresh-token (they should, mounted before verifyToken)

## 4. Refactor rateLimit.js
- [ ] 4.1 Import `redisClient` from `../config/redis.js`
- [ ] 4.2 Create `RedisStore` from `rate-limit-redis` with `sendCommand: (...args) => redisClient.call(...args)`
- [ ] 4.3 Create `globalBurstLimiter` — rateLimit({ windowMs: 60000, max: 100, ... })
- [ ] 4.4 Create `globalLimiter` — rateLimit({ windowMs: 3600000, max: 3000, ... })
- [ ] 4.5 Both limiters share: same Redis store, `keyGenerator: (req) => req.userId || req.ip`, `standardHeaders: 'draft-8'`, `skipOnStoreError: true`
- [ ] 4.6 Keep old `limiter` code commented with `// BEFORE:` annotation explaining the change (per-IP→per-user, in-memory→Redis, 500→3000)
- [ ] 4.7 Keep all auth limiters unchanged (loginLimiter, refreshTokenLimiter, etc.)

## 5. Update middleware/index.js Exports
- [ ] 5.1 Change `limiter` export to `globalLimiter`
- [ ] 5.2 Add `globalBurstLimiter` export

## 6. Update Middleware Chain Order
- [ ] 6.1 Update `apps/server/src/app.js`:
  - [ ] Remove `limiter` from import: change `import { limiter, errorHandler }` → `import { errorHandler }`
  - [ ] Remove lines 42-45 (the `/api` rate limiter conditional block that checked for `/auth`)
  - [ ] Update remaining imports if needed
- [ ] 6.2 Update `routes/v1/index.js` — apply verifyToken + globalBurstLimiter + globalLimiter chain before module routers
- [ ] 6.3 Ensure auth routes are exempt from global rate limiting (already handled — mounted before verifyToken)

## 7. Update .env.example
- [ ] 7.1 Add `REDIS_URL=redis://localhost:6379`
- [ ] 7.2 Add `RATE_LIMIT_GLOBAL_MAX=3000`
- [ ] 7.3 Add `RATE_LIMIT_GLOBAL_WINDOW_MS=3600000`

## 8. Verification
- [ ] 8.1 Run `npm run lint` — no errors
- [ ] 8.2 Start server — no Redis connection errors
- [ ] 8.3 Test auth routes work (signin, refresh-token)
- [ ] 8.4 Test authenticated route with rate limit headers visible
