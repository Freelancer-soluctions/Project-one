# Tasks

## 1. Schema & Migration

- [x] 1.1 Add `saleStatus` and `purchaseStatus` enums and `status/paymentMethod/paidAt/invoiceNumber` columns (nullable expand); verify `prisma validate`
- [x] 1.2 Backfill existing rows to PAID; contract `status` to NOT NULL; verify migration. (Las columnas se añaden `NOT NULL DEFAULT 'PENDING'` — DDL no bloqueante en PG — y el backfill mueve las filas históricas a PAID conservando el default para las nuevas.)

## 2. Server

- [x] 2.1 Implement state machine for sale/purchase transitions (reuse events/stateMachine.ts pattern); verify unit tests
- [x] 2.2 Update create/update service to handle paymentMethod/invoiceNumber; add `PATCH /:id/status` transition endpoint (status not client-settable on create); auto-set paidAt; verify
- [x] 2.3 Implement cancel/refund flow writing compensating opposite-direction movements plus the matching `stock` quantity, inside a transition guarded by the starting status (idempotent: cannot cancel/refund twice); verify integration
- [x] 2.4 Update Joi schemas (create/update/filters) for both modules; verify validation tests
- [x] 2.5 Update dao where-clauses for status filter; verify

## 3. Docs & Client

- [x] 3.1 Update OpenAPI schemas.ts for sale/purchase; verify (`openapi:generate` + `lint:api`)
- [x] 3.2 Align client types/filters with new fields; verify typecheck — hecho en `apps/client`: panel compartido `components/statusPaymentPanel` (estado + método de pago + factura + `paidAt`, con transiciones vía `PATCH /:id/status`), filtros `status` en `SalesFiltersForm`/`PurchaseFiltersForm`, mutaciones `updateSaleStatus`/`updatePurchaseStatus`; verificado con `vitest`, `eslint` y `vite build`.

## 4. Tests

- [x] 4.1 Unit tests for state machine; verify pass
- [x] 4.2 Integration tests for cancel-reversal; verify pass — `apps/server/tests/integration/sales/sales-purchase-status.integration.test.ts` (9 tests) verde contra `projectoneDB_test`, tras aplicar las migraciones `20261126000000` y `20261126000001`. Cubre transiciones, `paidAt`, invoice único, reversión de stock en cancel/refund, idempotencia y paginación del filtro por estado.

## 5. Verification

- [x] 5.1 Run `openspec validate add-sale-purchase-status-payment`; verify no errors
- [x] 5.2 Run full test suite; verify green — `test:unit` verde (35 archivos / 316 tests), `test:integration` verde (10 archivos / 96 tests) y `db:contract` sin drift ("No difference detected").
