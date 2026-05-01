## 1. Create Module Schema Directories

- [x] 1.1 Create `schemas/` directory in `apps/server/src/modules/auth/`
- [x] 1.2 Create `schemas/` directory in `apps/server/src/modules/users/`
- [x] 1.3 Create `schemas/` directory in `apps/server/src/modules/notes/`
- [x] 1.4 Create `schemas/` directory in `apps/server/src/modules/news/`
- [x] 1.5 Create `schemas/` directory in `apps/server/src/modules/events/`
- [x] 1.6 Create `schemas/` directory in `apps/server/src/modules/settings/`
- [x] 1.7 Create `schemas/` directory in `apps/server/src/modules/products/`
- [x] 1.8 Create `schemas/` directory in `apps/server/src/modules/providers/`
- [x] 1.9 Create `schemas/` directory in `apps/server/src/modules/warehouse/`
- [x] 1.10 Create `schemas/` directory in `apps/server/src/modules/stock/`
- [x] 1.11 Create `schemas/` directory in `apps/server/src/modules/inventoryMovement/`
- [x] 1.12 Create `schemas/` directory in `apps/server/src/modules/sales/`
- [x] 1.13 Create `schemas/` directory in `apps/server/src/modules/clients/`
- [x] 1.14 Create `schemas/` directory in `apps/server/src/modules/purchases/`
- [x] 1.15 Create `schemas/` directory in `apps/server/src/modules/employees/`
- [x] 1.16 Create `schemas/` directory in `apps/server/src/modules/attendance/`
- [x] 1.17 Create `schemas/` directory in `apps/server/src/modules/payroll/`
- [x] 1.18 Create `schemas/` directory in `apps/server/src/modules/vacation/`
- [x] 1.19 Create `schemas/` directory in `apps/server/src/modules/permission/`
- [x] 1.20 Create `schemas/` directory in `apps/server/src/modules/expenses/`
- [x] 1.21 Create `schemas/` directory in `apps/server/src/modules/performanceEvaluation/`

## 2. Split Joi Schemas into Per-Module Files

- [x] 2.1 Read `apps/server/src/utils/joiSchemas/joi.js` to identify all schema definitions
- [x] 2.2 Create `auth.joi.js` in `modules/auth/schemas/` with auth-related schemas (loginSchema, registerSchema, etc.)
- [x] 2.3 Create `users.joi.js` in `modules/users/schemas/` with user-related schemas
- [x] 2.4 Create `notes.joi.js` in `modules/notes/schemas/` with note-related schemas
- [x] 2.5 Create `news.joi.js` in `modules/news/schemas/` with news-related schemas
- [x] 2.6 Create `events.joi.js` in `modules/events/schemas/` with event-related schemas
- [x] 2.7 Create `settings.joi.js` in `modules/settings/schemas/` with settings-related schemas
- [x] 2.8 Create `products.joi.js` in `modules/products/schemas/` with product-related schemas
- [x] 2.9 Create `providers.joi.js` in `modules/providers/schemas/` with provider-related schemas
- [x] 2.10 Create `warehouse.joi.js` in `modules/warehouse/schemas/` with warehouse-related schemas
- [x] 2.11 Create `stock.joi.js` in `modules/stock/schemas/` with stock-related schemas
- [x] 2.12 Create `inventoryMovement.joi.js` in `modules/inventoryMovement/schemas/` with inventory movement schemas
- [x] 2.13 Create `sales.joi.js` in `modules/sales/schemas/` with sales-related schemas
- [x] 2.14 Create `clients.joi.js` in `modules/clients/schemas/` with client-related schemas
- [x] 2.15 Create `purchases.joi.js` in `modules/purchases/schemas/` with purchase-related schemas
- [x] 2.16 Create `employees.joi.js` in `modules/employees/schemas/` with employee-related schemas
- [x] 2.17 Create `attendance.joi.js` in `modules/attendance/schemas/` with attendance-related schemas
- [x] 2.18 Create `payroll.joi.js` in `modules/payroll/schemas/` with payroll-related schemas
- [x] 2.19 Create `vacation.joi.js` in `modules/vacation/schemas/` with vacation-related schemas
- [x] 2.20 Create `permission.joi.js` in `modules/permission/schemas/` with permission-related schemas
- [x] 2.21 Create `expenses.joi.js` in `modules/expenses/schemas/` with expense-related schemas
- [x] 2.22 Create `performanceEvaluation.joi.js` in `modules/performanceEvaluation/schemas/` with performance evaluation schemas
- [x] 2.23 Verify all schema exports in each file match what routes expect

## 3. Update Route Import Statements

- [x] 3.1 Update imports in `modules/auth/routes.js` to use `./schemas/auth.joi.js`
- [x] 3.2 Update imports in `modules/users/routes.js` to use `./schemas/users.joi.js`
- [x] 3.3 Update imports in `modules/notes/routes.js` to use `./schemas/notes.joi.js`
- [x] 3.4 Update imports in `modules/news/routes.js` to use `./schemas/news.joi.js`
- [x] 3.5 Update imports in `modules/events/routes.js` to use `./schemas/events.joi.js`
- [x] 3.6 Update imports in `modules/settings/routes.js` to use `./schemas/settings.joi.js`
- [x] 3.7 Update imports in `modules/products/routes.js` to use `./schemas/products.joi.js`
- [x] 3.8 Update imports in `modules/providers/routes.js` to use `./schemas/providers.joi.js`
- [x] 3.9 Update imports in `modules/warehouse/routes.js` to use `./schemas/warehouse.joi.js`
- [x] 3.10 Update imports in `modules/stock/routes.js` to use `./schemas/stock.joi.js`
- [x] 3.11 Update imports in `modules/inventoryMovement/routes.js` to use `./schemas/inventoryMovement.joi.js`
- [x] 3.12 Update imports in `modules/sales/routes.js` to use `./schemas/sales.joi.js`
- [x] 3.13 Update imports in `modules/clients/routes.js` to use `./schemas/clients.joi.js`
- [x] 3.14 Update imports in `modules/purchase/routes.js` to use `./schemas/purchase.joi.js`
- [x] 3.15 Update imports in `modules/employees/routes.js` to use `./schemas/employees.joi.js`
- [x] 3.16 Update imports in `modules/attendance/routes.js` to use `./schemas/attendance.joi.js`
- [x] 3.17 Update imports in `modules/payroll/routes.js` to use `./schemas/payroll.joi.js`
- [x] 3.18 Update imports in `modules/vacation/routes.js` to use `./schemas/vacation.joi.js`
- [x] 3.19 Update imports in `modules/permission/routes.js` to use `./schemas/permission.joi.js`
- [x] 3.20 Update imports in `modules/expenses/routes.js` to use `./schemas/expenses.joi.js`
- [x] 3.21 Update imports in `modules/performanceEvaluation/routes.js` to use `./schemas/performanceEvaluation.joi.js`
- [x] 3.22 Verify no remaining references to `../../utils/joiSchemas/joi.js` in any routes.js file



## 4. Verification

- [x] 4.1 Run lint on server codebase to verify no broken imports (`cd apps/server && npm run lint`)
- [x] 4.2 Run unit tests to verify functionality (`cd apps/server && npm run test:unit`) - NOTE: Tests require AES_GCM_KEY env var
- [x] 4.3 Run integration tests to verify API endpoints (`cd apps/server && npm run test:integration`) - NOTE: Tests require AES_GCM_KEY env var
- [x] 4.4 Search entire codebase for any remaining references to `utils/joiSchemas/joi.js`
- [x] 4.5 Verify all 21 schema files exist in their respective module `schemas/` directories
