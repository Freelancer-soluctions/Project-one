# Design

## Context

See proposal.md. Current product has single productProviderId FK. Multi-provider offers require a join entity.

## Goals / Non-Goals

**Goals:** multi-provider offers with per-provider prices/costs, primary designation, backfill, read fallback.
**Non-Goals:** tax computation, auto supplier selection, invoicing.

## Decisions

### D1 — New table `productProviderOffer` (not array field) for relational integrity.

### D2 — Expand/contract: make legacy `productProviderId` nullable (Int?) during expand; add `primaryOfferId?`. This allows offer-less products, satisfying RN-PO-004 fallback.

### D3 — Backfill one offer per product from legacy field.

### D4 — Read paths prefer primary offer price/cost, fallback to product.price/cost.

### D5 — Stock valuation uses primary offer cost (or product.cost fallback).

## Risks / Trade-offs

- [Data backfill] → idempotent, one offer per product.
- [Breaking API] → version carefully; update integration tests.
- [Performance] → index on (productId, providerId), (productId, isPrimary).
- [R5: nullable legacy field] → make productProviderId Int? in expand phase to allow offer-less products (RN-PO-004 fallback).
- [R2: stock valuation] → totalCost currently uses price; decide price vs cost semantics explicitly before changing (do not silently alter).

## Migration Plan

1. Create table + nullable FKs.
2. Backfill.
3. Update read/write paths.
4. Contract later (separate change).

Rollback: manual SQL.

## Threat Model

Auth fail-closed; no PII in offers (prices are business data, not encrypted per existing pattern).

## Frontend Contract

- Payload shape: `{ ..., offers: [{ providerId, price, cost, minOrderQuantity?, leadTimeDays?, isPrimary, active }] }`. Top-level price/cost become derived from primary offer (or retained as fallback during transition).
- Read fields: primary provider name, primary offer price/cost, offer count.
- Stock valuation: primary offer cost (or product.cost fallback).
- Provider filter: filter products that have an offer from a given provider.
- i18n keys: offer_add, offer_remove, offer_set_primary, offer_active, offer_min_order_quantity, offer_lead_time_days, duplicate_provider.
