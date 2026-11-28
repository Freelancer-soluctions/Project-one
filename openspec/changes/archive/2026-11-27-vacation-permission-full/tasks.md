# Tasks

## 1. Schema & Migration

- [x] 1.1 Add traceability columns (approvedBy/approvedAt/rejectedBy/rejectedAt) + reason + comments + paid (default true) to vacation and permission; verify `prisma validate`
- [x] 1.2 Add `vacationBalance` and `vacationAccrualRecord` models + FKs; verify
- [x] 1.3 Create migration and apply locally; verify
- [x] 1.4 Regenerate Prisma client; verify

## 2. Backend — Vacation

- [x] 2.1 Update types/Joi/controller (reason, comments, traceability; pass req.userId) and sanitize spread; verify
- [x] 2.2 Stamp approver/rejecter in service on status transition; verify
- [x] 2.3 Implement balance check + deduction/restore transactionally; verify
- [x] 2.4 Extend dao raw SQL joins (approvedBy/rejectedBy user names) + types; verify
- [x] 2.5 Routes/OpenAPI; verify

## 3. Backend — Permission

- [x] 3.1 Update model/dao/service/controller (persist reason/comments/traceability; pass req.userId on patch); sanitize spread; verify
- [x] 3.2 Stamp approver/rejecter; verify
- [x] 3.3 Extend raw SQL joins (approvedBy/rejectedBy user names) + types; verify
- [x] 3.4 Routes/OpenAPI; verify

## 4. RBAC & Payroll

- [x] 4.1 Add `canApproveVacation`/`canApprovePermission` to PERMISSIONCODES + seed; verify
- [x] 4.2 Payroll service: read approved unpaid leave in period and deduct from totalPayment; verify
- [x] 4.3 Accrual job/policy (manual trigger endpoint); verify

## 5. Frontend

- [x] 5.1a VacationDialog: reason + comments inputs + paid toggle + audit pairs (approved/rejected by/on); verify
- [x] 5.1b Vacation zod + fieldLimits (reason 500, comments 1000) + i18n keys; verify
- [x] 5.2a PermissionDialog: approved/rejected audit pairs + paid toggle; verify
- [x] 5.2b Permission zod + fieldLimits + i18n; verify
- [x] 5.3a VacationDatatable columns (reason, comments, paid, approved/rejected by/on); verify
- [x] 5.3b PermissionDatatable columns (comments, approved/rejected by/on, paid); verify
- [x] 5.4a Balance RTK Query endpoints in vacationApi.js; verify
- [x] 5.4b Balance UI placement (request dialog validation + remaining display) + permission-gated status transitions; verify
- [x] 5.5 Filters forms (VacationFiltersForm, PermissionFiltersForm): update EMPTY_FILTERS/toFilterParams or mark out of scope; verify — fuera de alcance: los filtros no cambian en este change y los nuevos campos no son filtrables
- [x] 5.6 i18n keys (en.json + es.json): approved_by, approved_on, rejected_by, rejected_on, reason, comments, paid, balance/remaining/accrued/used; verify
- [x] 5.7 UI test fixtures + regenerate snapshots (VacationDatatable.ui.test, PermissionDatatable.ui.test); verify

## 6. Tests

- [x] 6.1 Unit tests for stamping/balance/payroll computation; verify pass
- [x] 6.2 Integration tests for approval flow + balance; verify pass

## 7. Verification

- [x] 7.1 Run `openspec validate vacation-permission-full`; verify no errors
- [x] 7.2 Run full test suite; verify green
