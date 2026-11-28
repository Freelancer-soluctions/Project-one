# Proposal

## Why

`stock` has no per-batch `unitCost`. Valuation uses `quantity × products.price` (catalog price), not the cost of each entry. This prevents real FIFO/LIFO/weighted-average costing and makes stock reversal cost-inaccurate. The field is a prerequisite; full consumption allocation is a separate, larger effort.

## What Changes

- Add nullable `unitCost Decimal? @db.Decimal(10,2)` to `stock`. `inventoryMovement` audit cost is out of scope (non-goal).
- Backfill from `products.cost`.
- Valuation `totalCost` becomes `quantity × COALESCE(unitCost, products.cost)`.
- Update backend (types/dao/service/joi/controller/routes/openapi) and frontend (Zod/dialog/datatable/i18n/snapshots).
- Add unit/property tests (currently 0% stock coverage).

## Non-goals

- No full FIFO/LIFO consumption allocation / COGS (separate change).
- No payroll/expense integration.
- No inventoryMovement audit cost (out of scope; quantity-only reversal preserved).

## Capabilities

### New Capabilities

- `stock-unit-cost-per-batch`: per-batch unit cost and corrected valuation.

### Modified Capabilities

- (none)

## Impact

- **DB**: nullable column + backfill.
- **API/UI**: additive (unitCost in responses).
- **Risk**: medium (valuation semantics change; no test baseline).

## Riesgos

- R1: backfill assumption (products.cost) for historical rows.
- R2: totalCost semantics change (price → cost) may surprise consumers.
- R3: 0% stock test coverage.

## Dependencias

- products.cost catalog value.
