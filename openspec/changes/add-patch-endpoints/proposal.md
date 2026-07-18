## Why

Backend has 23 modules all using `router.put(` for updates with mixed semantic correctness. Some modules (settings) use optional-field schemas with PUT (should be PATCH). HTTP verb semantics are inconsistent. Frontend forced to send complete objects for every update — no support for partial updates.

REST API design analysis (docs/api-rest-design-analysis.md) identifies: no PATCH support, inconsistent response formats, no 404 handling.

Enterprise REST practice (Microsoft REST Guidelines, GitHub API, Stripe) recommends dual PUT + PATCH.

## What Changes

- **Phase 1**: Add PATCH endpoints alongside existing PUT in all 23+ backend modules

**Backend per module:**
1. New Joi schema `XxxUpdatePartial` (all fields `.optional()` + `.min(1)`)
2. New route `router.patch('/:id', ...)` using same controller
3. DAO modifications: conditional `connect` calls to handle partial data safely

**Frontend per module:**
4. New RTK Query mutation `patchXxx` with `method: 'PATCH'`
5. New shared hook `useChangedFields` for diff-based partial updates

**Non-goals:**
- No changes to existing PUT endpoints
- No 404 handling (separate change)
- No response format unification (separate change)

## Capabilities

### New Capabilities
- `patch-endpoints`: Add PATCH HTTP method endpoints alongside existing PUT endpoints across all backend modules, with partial-update Joi schemas, conditional DAO connect patterns, and corresponding frontend RTK Query mutations.

### Modified Capabilities
<!-- No existing spec-level behavior is changing — only adding new PATCH endpoints alongside existing PUT endpoints -->

## Impact

- All 23+ backend route modules: new PATCH route + partial schema + DAO safety
- Frontend: new RTK Query mutations per module + shared `useChangedFields` hook
- No breaking changes to existing PUT endpoints
- API surface expands ~2x for update endpoints
