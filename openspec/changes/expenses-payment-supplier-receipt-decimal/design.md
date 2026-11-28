# Design

## Context

See proposal.md. Current expenses: total Float (DOUBLE PRECISION), no paymentMethod/supplier/receipt. Existing paymentMethod enum (schema.prisma:502) and productProviders catalog.

## Goals / Non-Goals

**Goals:** Decimal total + paymentMethod + supplier FK + receiptUrl (URL-only).
**Non-Goals:** file-upload infra, payroll integration, status workflow changes.

## Decisions

### D1 — Decimal(18,2) for total (consistent with purchase/sale).

### D2 — Reuse existing paymentMethod enum.

### D3 — Nullable providerId FK to productProviders.

### D4 — receiptUrl as URL string (no upload infra in v1).

### D5 — Migration: ALTER COLUMN TYPE NUMERIC USING total::numeric; add nullable cols.

## Risks / Trade-offs

- [Cast failure on NaN/extreme] → validate before migration.
- [Frontend number→string] → parse Decimal in dialog/datatable.
- [No tests] → add integration tests.

## Migration Plan

1. ALTER total TYPE NUMERIC(18,2) USING total::numeric.
2. ADD nullable columns.
3. Regenerate Prisma client.

Rollback: manual SQL.

## Threat Model

Auth fail-closed; no new PII; receiptUrl is a URL (validate format).

## Frontend Impact

- Zod schema: Decimal string parsing, paymentMethod, providerId, receiptUrl URL validation.
- Expenses.jsx: fetch providers via useGetAllProvidersFiltersQuery, pass providers prop (mirror Purchase.jsx).
- ExpensesDialog: mapRow/empty/submission for new fields + Decimal total; supplier/payment/receipt inputs.
- ExpensesDatatable: paymentMethod, supplier, receiptUrl columns + total formatting.
- fieldLimits: expenses.receiptUrl.
- i18n (en/es): receipt_url + validation keys.
- Filters scope: document or implement end-to-end.
- UI tests: fixtures + snapshots.
