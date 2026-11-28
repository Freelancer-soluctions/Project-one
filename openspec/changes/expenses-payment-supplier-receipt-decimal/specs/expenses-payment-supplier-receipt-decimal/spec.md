# Spec Delta

## Purpose

Fix money precision and add payment method, supplier, and receipt URL to expenses.

## ADDED Requirements

### Requirement: Decimal total

The system SHALL store `total` as `Decimal(18,2)`, never Float. Rounding mode: half-up to 2 decimals.

#### Scenario: decimal stored (RN-EX-001)

- **WHEN** an expense is created with total=10.123
- **THEN** it is stored as 10.12 (2 decimals, half-up) and reads back as Decimal

### Requirement: Payment method

The system SHALL store an optional `paymentMethod` (reuse existing enum).

#### Scenario: payment method persisted (RN-EX-002)

- **WHEN** an expense is created with a paymentMethod
- **THEN** it is persisted and returned

### Requirement: Supplier

The system SHALL store an optional `providerId` FK to productProviders.

#### Scenario: supplier persisted (RN-EX-003)

- **WHEN** an expense is created with a valid providerId
- **THEN** the FK is persisted and the supplier returned in reads

#### Scenario: invalid supplier rejected (RN-EX-004)

- **WHEN** an expense references a non-existent providerId
- **THEN** 400 is returned

### Requirement: Receipt URL

The system SHALL store an optional `receiptUrl` (URL string).

#### Scenario: receipt persisted (RN-EX-005)

- **WHEN** an expense is created with a receiptUrl
- **THEN** it is persisted and returned

#### Scenario: invalid receipt rejected (RN-EX-007)

- **WHEN** an expense is created with a non-URL receiptUrl
- **THEN** 400 is returned

### Requirement: NFR security

The system SHALL enforce auth/permission checks, fail-closed.

#### Scenario: unauthenticated rejected (RN-EX-006)

- **WHEN** an unauthenticated request hits any endpoint
- **THEN** 401 is returned
