# Design

## Context

See proposal.md. Additive, nullable columns on products. No multi-provider redesign (separate change).

## Goals / Non-Goals

**Goals:** minOrderQuantity, leadTimeDays, taxRate (nullable) on products.
**Non-Goals:** multi-provider offers, tax computation in totals, invoicing.

## Decisions

### D1 — Nullable Ints for minOrderQuantity/leadTimeDays.

### D2 — taxRate Decimal(5,2) nullable default 0; not wired to totals.

### D3 — Surface as hints in providerOrder creation (non-blocking).

## Risks / Trade-offs

- [Semantic overlap with stock.minimum] → document distinction in UI.
- [taxRate unused] → keep nullable, no total wiring.

## Migration Plan

Add nullable columns. No backfill needed.

Rollback: manual SQL.

## Threat Model

Auth fail-closed; no PII.

## Frontend Impact

- Zod schema: minOrderQuantity (int >=0), leadTimeDays (int >=0), taxRate (number 0..100, 2 decimals).
- ProductBasicInfo: defaultValues + ProductNumberField inputs + buildPriceCostRow extension + fix barcode casing.
- toProductPayload: map new fields with correct casing.
- ProductsDatatable: new columns.
- ProviderOrdersDialog: non-blocking hint (minOrderQuantity, leadTimeDays).
- fieldLimits: clarify scope.
- i18n (en/es): labels + zod messages (min_order_quantity, lead_time_days, tax_rate).
- UI tests + snapshots.
