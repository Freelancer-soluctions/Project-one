# Tasks

## 1. Schema & Migration

- [ ] 1.1 Add `payrollStatus` enum + `paymentStatus`/`paymentDate` + `bonuses`/`imss`/`isr`/`infonavit`/`otherDeductions` columns; verify `prisma validate`
- [ ] 1.2 Create migration (backfill existing rows) and apply locally; verify
- [ ] 1.3 Regenerate Prisma client; verify

## 2. Backend

- [ ] 2.1 Update types (replace phantom status/period with paymentStatus/paymentDate + new monetary fields); verify
- [ ] 2.2 Update dao (create/update/getAll) for new fields; verify
- [ ] 2.3 Update service (String() normalization); verify
- [ ] 2.4 Update Joi payroll.joi.ts: new fields + cross-field refine (deductions === sum of breakdown) returning 400 + payrollStatusSchema for status endpoint; verify
- [ ] 2.5 Update controller JSDoc + routes swagger + openapi + schemas-shift-left; verify
- [ ] 2.6 Add status-transition endpoint (PATCH /payroll/:id/status) + util at src/utils/lifecycle/payroll.ts with transition map DRAFT→PAID, DRAFT→CANCELLED; verify

## 3. Encryption wiring

- [ ] 3.1 Register new monetary fields in ENCRYPTED_FIELDS (both casings) and SENSITIVE_FIELDS; verify

## 4. Frontend

- [ ] 4.1 Zod schema: add bonuses/imss/isr/infonavit/otherDeductions/paymentStatus/paymentDate + cross-field refine (deductions === sum breakdown); verify
- [ ] 4.2 payrollApi: add updatePayrollStatus mutation + useUpdatePayrollStatusMutation (mirror salesAPI) + tag invalidation; verify
- [ ] 4.3 PayrollDialog: mapRowToFormValues + EMPTY_FORM_VALUES + toSubmissionValues + buildPayrollFields for new monetary fields; verify
- [ ] 4.4 PayrollDialog: make totalPayment read-only/display-only (server computed); add paymentStatus display; verify
- [ ] 4.5 PayrollDatatable: paymentStatus column (StatusBadge) + paymentDate column + monetary columns; verify
- [ ] 4.6 fieldLimits.payroll: add bonuses/imss/isr/infonavit/otherDeductions (128); verify
- [ ] 4.7 i18n (en.json + es.json): zod.payroll keys (totalPayment, bonuses, imss, isr, infonavit, otherDeductions) + status_draft + payroll status labels; verify
- [ ] 4.8 PayrollFiltersForm: optional filter by paymentStatus (or mark out of scope); verify
- [ ] 4.9 UI test fixtures + regenerate snapshots (PayrollDatatable.ui.test.jsx); verify

## 5. Tests

- [ ] 5.1 Unit tests for service/dao; verify pass
- [ ] 5.2 Integration tests; verify pass

## 6. Verification

- [ ] 6.1 Run `openspec validate payroll-payment-tracking-and-deductions`; verify no errors
- [ ] 6.2 Run full test suite; verify green
