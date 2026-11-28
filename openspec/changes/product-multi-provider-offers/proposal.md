# Proposal

## Why

A `product` has a single `productProviderId`. In reality, a product can be supplied by multiple providers at different prices/costs/lead times. This blocks quote comparison, supplier selection, and accurate reordering. Transactional data (purchaseDetail.price, providerOrderDetail.estimatedPrice) already captures per-provider prices, so the catalog is the bottleneck.

## What Changes

- New join entity `productProviderOffer` (productId, providerId, price, cost, minOrderQuantity, leadTimeDays, isPrimary, active, audit) with unique (productId, providerId).
- Expand: add offers table + nullable `primaryOfferId` on products (keep legacy `productProviderId` during transition).
- Backfill: one offer row per existing product from `productProviderId` + `price`/`cost`.
- Read paths prefer offer price/cost, fallback to product.price/cost.
- Create/update write offers; deprecate single `productProviderId`.
- Contract (later migration): drop legacy field.

## Non-goals

- No tax computation (separate change).
- No automatic supplier selection algorithm (manual in v1).

## Capabilities

### New Capabilities

- `product-multi-provider-offers`: multi-provider offers with per-provider prices.

### Modified Capabilities

- (none)

## Impact

- **DB**: new table + FK + backfill + eventual contract.
- **API**: payloads change (single provider → offers array).
- **Frontend**: ProductBasicInfo becomes offer editor; datatable shows primary provider.
- **Risk**: high (breaking API change, data backfill, test updates).

## Riesgos

- R1: data backfill if legacy field null/inconsistent.
- R2: stock valuation price ambiguity (which offer?).
- R3: breaking change for integration tests (seed products with productProviderId).
- R4: performance of multi-join.

## Dependencias

- `productProviders` catalog.
- `product-reorder-and-tax-fields` (optional, can merge minOrderQty/leadTime into offers).
