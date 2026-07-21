## Why

The server codebase migrated from PUT to PATCH for all update endpoints. During migration, old `update*` handler functions were left behind in controller, service, and DAO layers across 13 modules. These functions are dead code — no route calls them, and the frontend (RTK Query) uses only `method: 'PATCH'`.

This cleanup removes dead code and renames inconsistently-named functions (`update*` used as PATCH handlers) to match actual usage.

## What Changes

### Group A — Delete `update*` from ALL 3 layers (controller + service + DAO)
Functions have completely separate `patch*` DAO counterparts. Safe to delete entirely.

| Module | Controller | Service | DAO |
|--------|-----------|---------|-----|
| expenses | `updateExpenseById` | `updateExpenseById` | `updateExpenseById` |
| performanceEvaluation | `updatePerformanceEvaluationById` | `updatePerformanceEvaluationById` | `updatePerformanceEvaluationById` |
| sales | `updateSaleById` | `updateSaleById` | `updateSaleById` |
| purchase | `updatePurchaseById` | `updatePurchaseById` | `updatePurchaseById` |
| warehouse | `updateWarehouseById` | `updateWarehouseById` | `updateWarehouse` |

### Group B — Delete controller + service `update*`, KEEP DAO
Live `patch*` service functions share the same DAO `update*` function.

| Module | Controller | Service | DAO (keep) |
|--------|-----------|---------|------------|
| attendance | `updateAttendanceById` | `updateAttendanceById` | `updateAttendanceById` |
| vacation | `updateVacationById` | `updateVacationById` | `updateVacationById` |
| users | `updateUserById` | `updateUserById` | `updateUserById` |

### Group C — Delete controller `update*` only (service + DAO shared)
Live `patch*` controller shares the same service function.

| Module | Controller only |
|--------|----------------|
| permission | `updatePermissionById` |
| products | `updateById` |
| providers | `updateProviderById` |
| stock | `updateStockById` |

### Group D — Payroll special case
- Controller: delete `updatePayrollById`
- Service: delete `updatePayrollById`
- DAO: keep `updatePayrollById` (shared), delete orphaned `updatePayrollByIdPartial`

### Group E — Orphaned DAO functions
- `users/dao.js`: delete `patchUserById` (not called by any service)
- `payroll/dao.js`: delete `updatePayrollByIdPartial` (not called by any service)

## Capabilities

### New Capabilities
*None. This is a cleanup change with no new capabilities.*

### Modified Capabilities
*None. No spec-level behavior changes — only dead code removal.*

## Impact

- **13 modules** affected across controller/service/DAO layers
- ~25 dead functions removed
- Zero runtime behavior changes
- Zero API contract changes
- Validated against RTK Query client endpoints — all use `method: 'PATCH'`
