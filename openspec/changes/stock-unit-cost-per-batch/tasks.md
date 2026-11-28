# Tasks

## 1. Schema & Migration

- [ ] 1.1 Add `unitCost Decimal? @db.Decimal(10,2)` to stock; verify `prisma validate`
- [ ] 1.2 Create migration with backfill from products.cost; apply locally; verify
- [ ] 1.3 Regenerate Prisma client; verify

## 2. Backend

- [ ] 2.1 Update types/Joi/service for unitCost; verify
- [ ] 2.2 Update dao: getAllStock (totalCost = quantity × COALESCE(unitCost, product.cost)), create/update; verify
- [ ] 2.3 Update reversal.ts (cost handling best-effort); verify
- [ ] 2.4 Update routes/OpenAPI/schemas.ts; run openapi:generate; verify

## 3. Frontend

- [ ] 3.1 Zod schema: add unitCost optional/nullable decimal (min 0, 2dp) + i18n keys; verify
- [ ] 3.2 StockDialog: mapRowToFormValues + EMPTY_FORM_VALUES + unitCost input (editable on create, not gated by hasProduct); verify
- [ ] 3.3 Stock.jsx: toCreateStockPayload include unitCost (empty→null); verify
- [ ] 3.4 StockDatatable: add unitCost column (currency cell) + header key; verify
- [ ] 3.5 i18n keys (en.json + es.json): unit_cost, unit_cost_placeholder, zod.stock.unitCost.\*; verify
- [ ] 3.6 Update FIXTURE_ROWS + regenerate snapshot (StockDatatable.ui.test.jsx); verify
- [ ] 3.7 Verify stockAPI passthrough (no structural change); verify

## 4. Tests

- [ ] 4.1 Unit/property tests for valuation (unitCost vs fallback); verify pass

## 5. Verification

- [ ] 5.1 Run `openspec validate stock-unit-cost-per-batch`; verify no errors
- [ ] 5.2 Run full test suite; verify green
