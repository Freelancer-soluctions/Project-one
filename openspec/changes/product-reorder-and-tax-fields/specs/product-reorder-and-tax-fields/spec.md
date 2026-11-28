# Spec Delta

## Purpose

Add reorder hints (minOrderQuantity, leadTimeDays) and optional taxRate to products.

## ADDED Requirements

### Requirement: Min order quantity

The system SHALL store an optional `minOrderQuantity Int?` (supplier MOQ) on products, distinct from stock.minimum (reorder point).

#### Scenario: persisted (RN-PR-001)

- **WHEN** a product is created with minOrderQuantity
- **THEN** it is persisted and returned

#### Scenario: non-negative (RN-PR-002)

- **WHEN** a negative minOrderQuantity is submitted
- **THEN** 400 is returned

### Requirement: Lead time

The system SHALL store an optional `leadTimeDays Int?` (supplier lead time in days).

#### Scenario: persisted (RN-PR-003)

- **WHEN** a product is created with leadTimeDays
- **THEN** it is persisted and returned

### Requirement: Tax rate

The system SHALL store an optional `taxRate Decimal(5,2)?` default 0, not applied to totals until invoicing exists.

#### Scenario: persisted (RN-PR-004)

- **WHEN** a product is created with taxRate
- **THEN** it is persisted and returned

#### Scenario: range (RN-PR-005)

- **WHEN** a taxRate outside 0..100 is submitted
- **THEN** 400 is returned

### Requirement: NFR security

The system SHALL enforce auth/permission checks, fail-closed.

#### Scenario: unauthenticated rejected (RN-PR-006)

- **WHEN** an unauthenticated request hits any endpoint
- **THEN** 401 is returned
