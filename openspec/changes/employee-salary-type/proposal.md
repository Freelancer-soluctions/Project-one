# Proposal

## Why

`employees.salary` is an encrypted `String` but there is no `salaryType` (monthly/hourly/per-project). Payroll stores `baseSalary` as an encrypted string and `totalPayment` is entered manually (payroll/utils/schema.js notes refine disabled). Without a type, the system cannot compute payroll totals correctly for hourly or per-project employees.

## What Changes

- Add `SalaryType` enum (`MONTHLY`, `HOURLY`, `PER_PROJECT`) and `salaryType` field on `employees` (default `MONTHLY`).
- Optionally mirror `salaryType` on `payroll` (per-period override) — decide in design.
- Update Joi/types/frontend dialog/datatable/i18n.
- Implement payroll computation logic: monthly flat, hourly × hours, per-project flat; update `totalPayment` automatically.
- Add unit tests for computation.

## Non-goals

- No catalog entities for position/department (separate change).
- No employee↔user linkage (separate change).
- No multi-currency or tax.

## Capabilities

### New Capabilities

- `employee-salary-type`: salary type tracking and payroll computation.

### Modified Capabilities

- (none)

## Impact

- **DB**: enum + column (nullable expand, default, contract).
- **Payroll**: computation logic added (currently absent).
- **Frontend**: salaryType selector in EmployeeDialog and PayrollDialog.
- **Risk**: totalPayment semantics change.

## Riesgos

- R1: defaulting existing rows to MONTHLY may be wrong for some — manual review.
- R2: payroll computation introduces new business logic — needs tests.

## Dependencias

- Payroll module.
