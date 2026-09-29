## Group A — Delete ALL 3 layers (controller + service + DAO)

- [x] A1. expenses: delete `updateExpenseById` from controller.js, service.js, dao.js
- [x] A2. performanceEvaluation: delete `updatePerformanceEvaluationById` from controller.js, service.js, dao.js
- [x] A3. sales: delete `updateSaleById` from controller.js, service.js, dao.js
- [x] A4. purchase: delete `updatePurchaseById` from controller.js, service.js, dao.js
- [x] A5. warehouse: delete `updateWarehouseById` from controller.js, service.js, dao.js (note: DAO fn is `updateWarehouse`)

## Group B — Delete controller + service only (keep DAO)

- [x] B1. attendance: delete `updateAttendanceById` from controller.js, service.js
- [x] B2. vacation: delete `updateVacationById` from controller.js, service.js
- [x] B3. users: delete `updateUserById` from controller.js, service.js

## Group C — Delete controller only (shared service)

- [x] C1. permission: delete `updatePermissionById` from controller.js
- [x] C2. products: delete `updateById` from controller.js
- [x] C3. providers: delete `updateProviderById` from controller.js
- [x] C4. stock: delete `updateStockById` from controller.js

## Group D — Payroll special case

- [x] D1. payroll: delete `updatePayrollById` from controller.js, service.js
- [x] D2. payroll/dao.js: delete orphaned `updatePayrollByIdPartial`

## Group E — Orphaned DAO functions

- [x] E1. users/dao.js: delete orphaned `patchUserById`

## Verification

- [x] V1. Run tests: `cd apps/server && npm run test` (notes-mentions.test.js failure is pre-existing, unrelated to cleanup)
