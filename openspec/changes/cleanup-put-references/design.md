## Context

The server codebase migrated all update endpoints from PUT to PATCH (`router.put()` → `router.patch()`). Old `update*` handler functions remain as dead code across controller, service, and DAO layers in 13 modules. Additionally, some modules use `update*` functions as PATCH handlers (inconsistent naming).

**Validation performed:**
- Frontend RTK Query: 13 affected modules all use `method: 'PATCH'` — zero PUT
- Server routes: zero `router.put()` calls across all modules
- Confirmed no frontend dependency on dead `update*` server functions

## Goals / Non-Goals

**Goals:**
- Remove all dead `update*` functions not called by any route
- Rename is NOT a goal (functions used as PATCH handlers with `update*` names will be kept as-is unless they're in a Safe group with separate DAO)
- Keep all tests passing after changes

**Non-Goals:**
- No behavior changes
- No API contract changes
- No renaming of live functions (scope is deletion-only, except for entirely separate DAO chains)
- No changes to frontend

## Decisions

### Classification methodology

Each module was traced across 3 layers (controller → service → DAO) to determine if the dead `update*` function's DAO is shared with the live `patch*` function:

1. **Separate DAO (Safe to delete all 3 layers):** Live `patch*` calls a different DAO function than dead `update*`
2. **Shared DAO (Keep DAO, delete controller+service):** Live `patch*` service calls the same DAO function as dead `update*`
3. **Shared Service (Delete controller only):** Live `patch*` controller calls the same service function as dead `update*`

### Per-module decisions

| Module | Layers to delete | Rationale |
|--------|-----------------|-----------|
| expenses | controller, service, DAO | Live `patchExpenseById` → `patchExpenseByIdDao` (separate) |
| perfEvaluation | controller, service, DAO | Live `patchPerformanceEvaluationById` → `patchPerformanceEvaluationByIdDao` (separate) |
| sales | controller, service, DAO | Live `patchSaleById` → `patchSaleByIdDao` (separate) |
| purchase | controller, service, DAO | Live `patchPurchaseById` → `patchPurchaseByIdDao` (separate) |
| warehouse | controller, service, DAO | Live `patchWarehouseById` → `patchWarehouseByIdDao` (separate) |
| attendance | controller, service | Live `patchAttendanceById` service → `updateAttendanceByIdDao` (shared) |
| vacation | controller, service | Live `patchVacationById` service → `updateVacationByIdDao` (shared) |
| users | controller, service | Live `patchUserById` service → `updateUserByIdDao` (shared) |
| permission | controller only | Live `patchPermissionById` controller → same service fn |
| products | controller only | Live `patchById` controller → `productsService.updateById` (shared) |
| providers | controller only | Live `patchProviderById` controller → `providersService.updateById` (shared) |
| stock | controller only | Live `patchStockById` controller → `updateStockByIdService` (shared) |
| payroll | controller, service | Dead `updatePayrollById` separate from live `updatePayrollByIdPartial`; DAO shared |

### Orphaned DAO functions

- `users/dao.js`: `patchUserById` is not called by any service — orphaned, delete
- `payroll/dao.js`: `updatePayrollByIdPartial` is not called by any service — orphaned, delete

## Risks / Trade-offs

- **[Low Risk]** DAO-level deletions validated by tracing the exact function calls. No assumptions.
- **[Low Risk]** Frontend validated against RTK Query — zero PUT usage.
- **[Medium Risk]** If tests reference deleted functions, they will fail. Will run tests after cleanup.
- **[No Risk]** No runtime behavior changes — only removing uncalled code.
