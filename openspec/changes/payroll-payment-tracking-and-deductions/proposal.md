# Proposal

## Why

`payroll` has no `paymentDate`/`paymentStatus` — cannot tell if a payroll was paid. It has no `bonuses` or deduction breakdown (IMSS, ISR, infonavit, etc.) — only flat encrypted `baseSalary/extraHours/deductions/totalPayment`. Payroll is manual entry with no computation engine and no integration with employees/vacation/permission.

## What Changes

- Add `payrollStatus` enum (DRAFT, PAID, CANCELLED) and a `paymentStatus` column of that enum type (default DRAFT) plus `paymentDate` (stamped on PAID).
- Add `bonuses` and deduction breakdown columns (`imss`, `isr`, `infonavit`, `otherDeductions`) as encrypted `VarChar(128)`, nullable.
- Keep `deductions` as total (backward compat).
- Add required status-transition endpoint (PATCH /payroll/:id/status) mirroring sale/purchase lifecycle, with transition map DRAFT→PAID, DRAFT→CANCELLED (PAID/CANCELLED terminal).
- Update encryption middleware (both casings) + sensitive fields list.
- Update backend (types/dao/service/joi/controller/routes/openapi/schemas-shift-left) and frontend (Zod/dialog/datatable/fieldLimits/i18n/snapshots).
- Add unit + integration tests (currently 0% coverage).

## Non-goals

- No multi-currency, no tax computation engine beyond breakdown storage.
- No automatic payroll generation from employee salary (separate).

## Capabilities

### New Capabilities

- `payroll-payment-tracking-and-deductions`: payment status/date + bonuses + deduction breakdown.

### Modified Capabilities

- (none)

## Impact

- **DB**: enum + ~7 new columns (nullable/default).
- **Encryption**: must register new monetary cols in both middleware casings + sensitive list.
- **API/UI**: additive (old clients ignore new fields).
- **Risk**: encryption omission (silent security regression), no test baseline.

## Riesgos

- R1: forgetting encryption registration → plaintext storage.
- R2: 0% test coverage → regressions.
- R3: status lifecycle scope doubles effort.

## Dependencias

- Encryption middleware pattern.
