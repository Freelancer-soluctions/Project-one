# Proposal

## Why

`products` lacks `minOrderQuantity` (supplier MOQ) and `leadTimeDays` (supplier lead time) needed for reordering, and has no `taxRate` (needed if/when invoicing is approved). These are additive, non-breaking gaps independent of the multi-provider redesign.

## What Changes

- Add nullable `minOrderQuantity Int?` and `leadTimeDays Int?` to `products`.
- Add nullable `taxRate Decimal? @db.Decimal(5,2)` (default 0) — not wired into sale/purchase totals until invoicing is approved (out of scope).
- Update backend (types/dao/service/joi/controller/routes/openapi) and frontend (Zod/dialog/datatable/fieldLimits/i18n).
- Surface minOrderQuantity/leadTimeDays as hints in providerOrder creation (non-blocking).

## Non-goals

- No multi-provider offers (separate change `product-multi-provider-offers`).
- No tax computation in sale/purchase totals (invoicing out of scope per docs/APPLICATION-CONTEXT.md).
- No hard enforcement of MOQ in orders (hints only in v1).

## Capabilities

### New Capabilities

- `product-reorder-and-tax-fields`: reorder hints and tax rate on products.

### Modified Capabilities

- (none)

## Impact

- **DB**: 3 nullable columns (non-breaking).
- **API/UI**: additive.
- **Risk**: low.

## Riesgos

- R1: semantic overlap with `stock.minimum` (reorder point) — document distinction.
- R2: taxRate unused until invoicing — keep nullable default 0.

## Dependencias

- productProviders (for hints in providerOrder).
