# Tasks

## 1. Schema & Migration

- [ ] 1.1 Add `minOrderQuantity Int?`, `leadTimeDays Int?`, `taxRate Decimal? @db.Decimal(5,2)` to products; verify `prisma validate`
- [ ] 1.2 Create migration and apply locally; verify
- [ ] 1.3 Regenerate Prisma client; verify

## 2. Backend

- [ ] 2.1 Update types/Joi/controller (new fields + ranges); verify
- [ ] 2.2 Update dao (create/update/getAll); verify
- [ ] 2.3 Update routes/OpenAPI/schemas.ts; run openapi:generate; verify

## 3. Frontend

- [ ] 3.1 Zod schema: add minOrderQuantity (int >=0), leadTimeDays (int >=0), taxRate (number 0..100, 2 decimals); verify
- [ ] 3.2 ProductBasicInfo: defaultValues + ProductNumberField inputs (minOrderQuantity, leadTimeDays, taxRate) + buildPriceCostRow extension + fix barcode casing; verify
- [ ] 3.3 toProductPayload: map new fields (minOrderQuantity, leadTimeDays, taxRate) with correct casing; verify
- [ ] 3.4 ProductsDatatable: add columns (minOrderQuantity, leadTimeDays, taxRate); verify
- [ ] 3.5 ProviderOrdersDialog: non-blocking hint showing selected product's minOrderQuantity + leadTimeDays; verify
- [ ] 3.6 fieldLimits.products: clarify scope (or add entries if needed); verify
- [ ] 3.7 i18n (en.json + es.json): labels + zod messages (min_order_quantity, lead_time_days, tax_rate); verify
- [ ] 3.8 UI tests + regenerate snapshots (ProductsDatatable.ui.test.jsx); verify

## 4. Tests

- [ ] 4.1 Integration tests (CRUD + ranges + 401); verify pass

## 5. Verification

- [ ] 5.1 Run `openspec validate product-reorder-and-tax-fields`; verify no errors
- [ ] 5.2 Run full test suite; verify green
