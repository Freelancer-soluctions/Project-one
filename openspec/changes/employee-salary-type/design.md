# Design

## Context

See proposal.md. Payroll today stores baseSalary as encrypted string and totalPayment manually (client: apps/client/src/modules/payroll/utils/schema.js:74 refine disabled; server: src/modules/payroll/schemas/payroll.joi.ts).

## Goals / Non-Goals

**Goals:** salaryType enum + payroll computation.
**Non-Goals:** catalogs, user linkage, multi-currency.

## Decisions

### D1 — Enum on employee only (v1)

salaryType lives on employee; payroll inherits via employee lookup at computation time. Avoids per-payroll override complexity.

### D2 — Computation in service

Payroll service computes totalPayment from salaryType + baseSalary + hours; service validates hours required for HOURLY.

### D3 — Default MONTHLY

Existing rows backfill to MONTHLY.

## Risks / Trade-offs

- [Default wrong for some rows] → manual review queue.
- [New computation untested] → unit tests for each type.

## Frontend Impact

- Employee zod schema + EmployeesDialog selector + i18n.
- Payroll zod: totalPayment optional; PayrollDialog: totalPayment read-only/display-only, employee salaryType display, conditional extraHours.
- Payroll employee list query already returns salaryType (dao selects e.\*).

## Migration Plan

Add enum + column (nullable expand → default → contract).

Rollback: manual SQL.

## Threat Model

Auth fail-closed; no new PII.
