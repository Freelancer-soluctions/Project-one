# Proposal

## Why

`sale` and `purchase` store only `total`. There is no status (paid/cancelled/received), no payment method, no `paidAt`, and no `invoiceNumber`/reference. A registered sale cannot tell whether it was collected; a purchase cannot distinguish received from cancelled. Revenue reports therefore count uncollected/cancelled rows as real revenue, and there is no accounts-receivable/payable visibility or invoice numbering.

## What Changes

- Add `saleStatus` enum (PENDING, PAID, CANCELLED, REFUNDED) and `purchaseStatus` enum (PENDING, RECEIVED, PAID, CANCELLED) — NOT reusing `orderStatus` (its SHIPPED/RECEIVED values don't fit a sale).
- Add `status` (default PENDING), `paymentMethod`, `paidAt`, `invoiceNumber` (unique) to both models.
- Backfill existing rows to COMPLETED/PAID to preserve historical revenue reports.
- Add status/payment/invoice to Joi create/update/filter schemas and OpenAPI docs.
- Implement cancel/refund flow: status transition + compensating opposite-direction inventoryMovement rows and the matching stock adjustment, in one guarded transaction, instead of hard delete (reuse events/stateMachine.ts pattern).
- Add state-machine unit tests and integration tests for cancel-reversal.

## Non-goals

- No full accounting/ledger module (out of product scope per `docs/APPLICATION-CONTEXT.md`).
- No multi-currency, no partial payments, no tax/IVA.
- No refactor of expenses/payroll status (already modeled).

## Capabilities

### New Capabilities

- `sale-purchase-status`: lifecycle (status transitions), payment tracking, invoice numbering, and cancellation with stock reversal for sale and purchase.

### Modified Capabilities

- (none)

## Impact

- **DB**: additive migration (new enums + 4 columns per table) with backfill defaults.
- **API**: sale/purchase create/update/filter accept status/paymentMethod/invoiceNumber; new cancel semantics.
- **Code**: `apps/server/src/modules/sales`, `purchases` (schemas, service, dao); OpenAPI schemas.ts.
- **Tests**: new unit/integration coverage.

## Riesgos

- R1: Existing rows backfilled to PAID may hide unpaid historical sales — acceptable given no prior tracking.
- R2: Cancel-with-reversal depends on inventoryMovement module contract; design must define it to avoid double-reversal.
- R3: `invoiceNumber` uniqueness scope (global vs per-supplier) to confirm during implementation.

## Dependencias

- `events/stateMachine.ts` transition pattern.
- `inventoryMovement` module for compensating movements.
