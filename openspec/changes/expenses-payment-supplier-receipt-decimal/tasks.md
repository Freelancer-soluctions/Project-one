# Tasks

## 1. Schema & Migration

- [ ] 1.1 Change `total` Float → Decimal(18,2); add `paymentMethod?`, `providerId?` FK (relation `expenseProvider`), `receiptUrl?`; add reverse relation `expenses expenses[]` on `productProviders`; verify `prisma validate`
- [ ] 1.2 Create migration (cast + add cols) and apply locally; validate existing data has no NaN/extreme precision; verify
- [ ] 1.3 Regenerate Prisma client; verify

## 2. Backend

- [ ] 2.1 Update types/Joi/controller: new fields; validate providerId existence (service) → 400; paymentMethod enum; receiptUrl URL validation (Joi .uri() + max length); remove phantom status; verify
- [ ] 2.2 Update dao (create/update/getAll, raw SQL joins for supplier, remove `e."status"` filter branch); verify
- [ ] 2.3 Fix latent bug: remove `status` from Joi filters and OpenAPI ExpenseFilters/Body schemas; verify
- [ ] 2.4 Update routes/OpenAPI/schemas.ts + schemas-shift-left.ts; run `npm run openapi:generate`; verify

## 3. Frontend

- [ ] 3.1 Zod schema: parse Decimal string for total; add paymentMethod, providerId, receiptUrl (URL validation); clarify filters scope; verify
- [ ] 3.2a Expenses.jsx: fetch providers via useGetAllProvidersFiltersQuery and pass providers prop (mirror Purchase.jsx); verify
- [ ] 3.2b ExpensesDialog: mapRowToFormValues + EMPTY_FORM_VALUES + toSubmissionValues for new fields + Decimal total conversion; verify
- [ ] 3.2c ExpensesDialog: implement supplier select, payment method select, receipt URL input; verify
- [ ] 3.3a ExpensesDatatable: add paymentMethod, supplier, receiptUrl columns + total formatting; verify
- [ ] 3.3b ExpensesDatatable: update FIXTURE_ROWS before regenerating snapshots; verify
- [ ] 3.4a fieldLimits: add expenses.receiptUrl with backend-aligned max length; verify
- [ ] 3.4b i18n (en.json + es.json): add receipt_url and validation keys; verify
- [ ] 3.4c Filters scope: document or implement payment/provider filters end-to-end; verify
- [ ] 3.5 Schema tests + datatable UI tests updates; verify
- [ ] 3.6 Regenerate snapshots; verify

## 4. Tests

- [ ] 4.1 Integration tests (CRUD + new fields + 401 + invalid supplier 400 + Decimal); verify pass

## 5. Verification

- [ ] 5.1 Run `openspec validate expenses-payment-supplier-receipt-decimal`; verify no errors
- [ ] 5.2 Run full test suite; verify green
