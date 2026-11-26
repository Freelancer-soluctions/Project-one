# Proposal

## Why

`clientOrder` and `providerOrder` exist in the Prisma schema and are referenced by the React client, but the server-side module was removed as dead code and the endpoints were never mounted. The frontend therefore calls non-existent routes (guaranteed 404). On top of that, the schema has monetary and traceability defects that would make any future "order → sale/purchase" conversion lossy or impossible: `Float` instead of `Decimal`, no stored `total`, no delivery dates, and `saleId`/`purchaseId` links that were never persisted. This change revives the feature on a correct foundation so orders can be created, tracked, and converted into sales/purchases.

## What Changes

- **Revive** the `clientOrder` and `providerOrder` modules in the server (TS, layered routes → controller → service → dao), registered in `routes/v1/index.ts`, with full `details[]` persistence.
- **Schema (BREAKING-ish, expand/contract)**: change `unitPrice`/`estimatedPrice` from `Float` to `Decimal(18,2)`; add `total Decimal(18,2)` to both orders; add `expectedDeliveryDate DateTime?` and `deliveredOn DateTime?`; persist `saleId`/`purchaseId` links on create/update; add soft-delete consistency with existing modules.
- Add delivery date tracking to order lifecycle (PENDING → PROCESSING → SHIPPED → RECEIVED → COMPLETED) so SHIPPED/RECEIVED states are measurable.
- Add transactional total maintenance whenever detail lines change.
- Align Joi (server) and Zod (client) validation: `details[]` required, monetary precision (2 decimals).
- Deduplicate the triplicated `providerOrder` route in `App.jsx` (lines 112, 113, 115) and remove orphaned OpenAPI/Joi surface if not used.
- Add server-side tests (unit + integration) and client mutation/dialog coverage; E2E smoke.

## Non-goals

- No invoicing/tax module (explicitly out of scope per `docs/APPLICATION-CONTEXT.md`): no discount-per-line, IVA, or invoice generation. Orders convert to `sale`/`purchase` only.
- No multi-currency, no partial deliveries/shipments beyond status.
- No refactor of `expenses.total` (separate change), even though it shares the `Float` defect.

## Capabilities

### New Capabilities

- `orders`: lifecycle, CRUD, detail persistence, totals, delivery dates and order→sale/purchase conversion for `clientOrder` and `providerOrder`.

### Modified Capabilities

- (none — no existing spec covers orders)

## Impact

- **DB**: migration altering `clientOrderDetail.unitPrice`, `providerOrderDetail.estimatedPrice` to `DECIMAL(18,2)`; new columns `total`, `expectedDeliveryDate`, `deliveredOn` on both order tables.
- **API**: new endpoints `/api/v1/clientOrder` and `/api/v1/providerOrder` (CRUD + status transitions + `POST /:id/convert` to create the linked sale/purchase).
- **Code**: new TS modules under `apps/server/src/modules/{clientOrder,providerOrder}`; client API already wired; Joi schemas at `src/utils/joiSchemas/joi.ts`.
- **Tests**: new unit/integration/E2E coverage.
- **Risk**: data volume effectively zero (feature never worked), so casts are safe.

## Riesgos

- R1: Reviving may conflict with any in-flight work on sales/purchases conversion — verify no pending PRs touch those modules.
- R2: Status enum reuse (`orderStatus`) shared by both orders; transitions must be validated server-side.
- R3: Float→Decimal cast on any stray rows (none expected) — migration uses `::DECIMAL(18,2)`.

## Dependencias

- Prisma migration tooling (`npm run prisma-migration`).
- Existing `sale`/`purchase` modules for conversion flow.
- RBAC permission codes: verify `clientOrder`/`providerOrder` permissions exist in seed or add them.
