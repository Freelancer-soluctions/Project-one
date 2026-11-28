# Design

## Context

See proposal.md. Payroll has only flat encrypted baseSalary/extraHours/deductions/totalPayment; status/paymentDate phantom in TS types only.

## Goals / Non-Goals

**Goals:** payment status/date + bonuses + deduction breakdown + encryption wiring + optional lifecycle.
**Non-Goals:** auto-generation from employee salary, multi-currency, tax engine.

## Decisions

### D1 — Encrypted VarChar(128) for new monetary fields (consistency with C-04).

### D2 — `payrollStatus` enum DRAFT/PAID/CANCELLED; paymentDate stamped on PAID.

### D3 — Status-transition endpoint required (PATCH /payroll/:id/status) mirroring sale/purchase, since spec defines transitions.

### D4 — Register new fields in ENCRYPTED_FIELDS (both casings) and SENSITIVE_FIELDS.

### D5 — Keep `deductions` as total (backward compat).

## Risks / Trade-offs

- [Encryption omission] → checklist in tasks.
- [No test baseline] → add tests.

## Migration Plan

Add enum + nullable columns with defaults; backfill existing rows to DRAFT (safer — does not claim paid) with paymentDate=null.

Rollback: manual SQL.

## Threat Model

Auth fail-closed; no PII leak; encrypted fields preserved.

## Frontend Impact

- Zod schema: new monetary fields + cross-field refine.
- payrollApi: updatePayrollStatus mutation + hook.
- PayrollDialog: mapRow/empty/submission/fields for new fields; totalPayment read-only (server computed); paymentStatus display.
- PayrollDatatable: paymentStatus (StatusBadge) + paymentDate + monetary columns.
- fieldLimits.payroll: new fields (128).
- i18n (en/es): zod.payroll keys + status_draft + status labels.
- PayrollFiltersForm: optional filter by paymentStatus.
- UI tests: fixtures + snapshots.
