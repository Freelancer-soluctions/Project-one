# Spec Delta

## Purpose

Allow a product to have multiple provider offers with distinct prices/costs/lead times.

## ADDED Requirements

### Requirement: Offer entity

The system SHALL store `productProviderOffer` rows (productId, providerId, price, cost, minOrderQuantity?, leadTimeDays?, isPrimary, active, audit) with unique (productId, providerId).

#### Scenario: create offer (RN-PO-001)

- **WHEN** an ADMIN adds a provider offer to a product
- **THEN** it is persisted with price/cost and returned

#### Scenario: duplicate offer rejected (RN-PO-002)

- **WHEN** an offer for the same (productId, providerId) already exists
- **THEN** 409 is returned

### Requirement: Primary offer

The system SHALL designate exactly one primary offer per product (or none).

#### Scenario: set primary (RN-PO-003)

- **WHEN** an offer is marked primary
- **THEN** other offers for that product become non-primary

### Requirement: Read primary price

The system SHALL expose primary provider price/cost in product reads, falling back to product.price/cost when no offers exist.

#### Scenario: fallback (RN-PO-004)

- **WHEN** a product has no offers
- **THEN** product.price/cost are returned

### Requirement: Backfill

The system SHALL backfill one offer per existing product from legacy productProviderId + price/cost.

#### Scenario: backfill (RN-PO-005)

- **WHEN** migration runs
- **THEN** each product with a provider gets a primary offer

### Requirement: NFR security

The system SHALL enforce auth/permission checks, fail-closed.

#### Scenario: unauthenticated rejected (RN-PO-006)

- **WHEN** an unauthenticated request hits any endpoint
- **THEN** 401 is returned
