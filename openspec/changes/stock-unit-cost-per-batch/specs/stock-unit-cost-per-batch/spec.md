# Spec Delta

## Purpose

Add per-batch unit cost and correct stock valuation.

## ADDED Requirements

### Requirement: Unit cost on stock

The system SHALL store an optional `unitCost Decimal(10,2)?` on each stock row (per batch/lot). Validation: non-negative decimal with 2 decimal places (not integer).

#### Scenario: persisted (RN-ST-001)

- **WHEN** a stock entry is created with unitCost
- **THEN** it is persisted and returned

#### Scenario: non-negative (RN-ST-002)

- **WHEN** a negative unitCost is submitted
- **THEN** 400 is returned

#### Scenario: patch semantics (RN-ST-007)

- **WHEN** unitCost is omitted on create
- **THEN** it is stored as null (valuation falls back to product.cost)
- **WHEN** unitCost is set to null on PATCH
- **THEN** it is cleared (fallback restored)
- **WHEN** unitCost is omitted on PATCH
- **THEN** it is unchanged

### Requirement: Valuation uses unit cost

The system SHALL compute `totalCost = quantity × COALESCE(unitCost, product.cost)`.

#### Scenario: unit cost used (RN-ST-003)

- **WHEN** a stock row has unitCost set
- **THEN** totalCost uses unitCost

#### Scenario: fallback (RN-ST-004)

- **WHEN** a stock row has no unitCost
- **THEN** totalCost uses product.cost

### Requirement: Backfill

The system SHALL backfill unitCost from products.cost during migration.

#### Scenario: backfill (RN-ST-005)

- **WHEN** migration runs
- **THEN** existing rows get unitCost = product.cost

### Requirement: NFR security

The system SHALL enforce auth/permission checks, fail-closed.

#### Scenario: unauthenticated rejected (RN-ST-006)

- **WHEN** an unauthenticated request hits any endpoint
- **THEN** 401 is returned
