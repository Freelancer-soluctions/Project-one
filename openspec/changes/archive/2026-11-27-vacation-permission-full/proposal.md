# Proposal

## Why

`vacation` and `permission` lack approval traceability (`approvedBy`/`rejectedBy` + dates), reason/comments persistence (permission captures them in UI but drops them; vacation has none), and vacation has no available-days tracking (no `vacationBalance`/`accrualRecord`). The approval flow is unauditable, leave balances cannot be enforced, and payroll cannot deduct leave.

## What Changes

- Add `approvedBy`/`approvedAt`/`rejectedBy`/`rejectedAt` + `reason`/`comments` to both `vacation` and `permission` models (nullable expand).
- Add `vacationBalance` and `vacationAccrualRecord` models (per employee, per period) with accrual rules and transactional deduction on approval / restore on rejection-cancellation.
- Stamp approver/rejecter + dates server-side on status transition (service rule, not client-settable); sanitize spread `...data` to prevent client forgery.
- Pass `req.userId` in vacation create/patch controllers (currently missing) and permission patch.
- Add dedicated approval authorization (new `canApproveVacation`/`canApprovePermission` codes or enforce via service).
- Update raw SQL joins, TS types, Joi, frontend dialogs/datatable/filters/zod/i18n/snapshots.
- Integrate payroll deduction for approved unpaid leave (read approved vacations in period).
- Add unit + integration tests (currently 0% vacation coverage).

## Non-goals

- No multi-tenant, no external HR integration.
- No email/notification (separate).

## Capabilities

### New Capabilities

- `vacation-permission-full`: approval traceability, reason/comments, balance/accrual, payroll deduction.

### Modified Capabilities

- (none)

## Impact

- **DB**: new columns + 2 new models + FKs + migration + backfill (null for historical).
- **API**: PATCH status stamps server-side; new balance endpoints.
- **Frontend**: VacationDialog/PermissionDialog audit pairs; balance UI; datatable columns.
- **Risk**: high (new domain + concurrency + payroll integration).

## Riesgos

- R1: concurrency on balance updates → DB transactions/locking.
- R2: 0% test coverage → add integration tests before/while.
- R3: payroll deduction changes totalPayment semantics.
- R4: service spread `...data` security hole.

## Dependencias

- RBAC permission assignment pattern.
- Payroll module.
