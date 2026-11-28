# Design

## Context

See proposal.md. Current valuation uses quantity × products.price (catalog). No per-batch cost.

## Goals / Non-Goals

**Goals:** unitCost per batch + corrected valuation + backfill.
**Non-Goals:** full FIFO/LIFO consumption allocation / COGS.

## Decisions

### D1 — Nullable Decimal(10,2) on stock; valuation fallback chain: COALESCE(stock.unitCost, primaryOffer.cost, product.cost) when product-multi-provider-offers is implemented, otherwise COALESCE(stock.unitCost, product.cost).

### D2 — Backfill from products.cost.

### D3 — Reverse (reversal.ts) preserves quantity only; cost not recalculated on cancel (best-effort, existing behavior).

## Risks / Trade-offs

- [Backfill assumption] → products.cost may be null; COALESCE to 0.
- [totalCost semantics change] → document; frontend shows unitCost column.
- [No tests] → add unit/property tests.

## Migration Plan

Add nullable column; backfill; keep nullable (no contract).

Rollback: manual SQL.

## Threat Model

Auth fail-closed; no PII.

## Frontend Impact

- Zod schema: unitCost optional/nullable decimal (min 0, 2dp) + i18n keys.
- StockDialog: mapRowToFormValues + EMPTY_FORM_VALUES + unitCost input (editable on create, not gated by hasProduct).
- Stock.jsx: toCreateStockPayload include unitCost (empty→null).
- StockDatatable: unitCost column (currency cell) + header key.
- i18n (en/es): unit_cost, unit_cost_placeholder, zod.stock.unitCost.\*.
- FIXTURE_ROWS + snapshot regeneration.
- stockAPI: verify passthrough (no structural change).
- Reversal: backend-only (no reversal UI exists).
