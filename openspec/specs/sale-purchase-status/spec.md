# sale-purchase-status Specification

## Purpose

Add lifecycle, payment tracking, invoice numbering, and cancellation-with-reversal to sale and purchase.

## Requirements

### Requirement: Sale status lifecycle

The system SHALL track a `status` on every sale with allowed transitions: PENDING→PAID, PENDING→CANCELLED, PAID→REFUNDED; CANCELLED and REFUNDED are terminal.

#### Scenario: valid transition PAID (RN-SP-001)

- **WHEN** a PENDING sale transitions to PAID
- **THEN** status is PAID and `paidAt` is set

#### Scenario: invalid transition rejected (RN-SP-002)

- **WHEN** a CANCELLED sale attempts to transition to PAID
- **THEN** the request is rejected with 400

### Requirement: Purchase status lifecycle

The system SHALL track a `status` on every purchase with allowed transitions: PENDING→RECEIVED, RECEIVED→PAID, PENDING→CANCELLED, RECEIVED→CANCELLED; CANCELLED is terminal.

#### Scenario: received then paid (RN-SP-003)

- **WHEN** a PENDING purchase transitions to RECEIVED then PAID
- **THEN** status is PAID and `paidAt` is set

#### Scenario: cancel received purchase (RN-SP-004)

- **WHEN** a RECEIVED purchase transitions to CANCELLED
- **THEN** status is CANCELLED and compensating movements are written

### Requirement: Payment tracking

The system SHALL store `paymentMethod` and `paidAt` on sale and purchase; `paidAt` is set automatically on transition to PAID.

#### Scenario: paidAt auto (RN-SP-005)

- **WHEN** a sale transitions to PAID
- **THEN** `paidAt` is set to the transition timestamp

### Requirement: Invoice number

The system SHALL store an optional unique `invoiceNumber` on sale and purchase, settable on create or on PAID transition.

#### Scenario: unique invoice (RN-SP-006)

- **WHEN** two sales share the same invoiceNumber
- **THEN** the second create is rejected with 409

### Requirement: Cancel with reversal

The system SHALL, on cancellation (and on refund of a paid sale), write compensating inventoryMovement rows with the opposite direction (EXIT→ENTRY, ENTRY→EXIT) and adjust the matching `stock` quantity by the reversed units, instead of hard-deleting. TRANSFERENCE/ADJUSTMENT movements have no single opposite and are left untouched. Cancelling twice is an idempotent no-op.

#### Scenario: cancel reverses stock (RN-SP-007)

- **WHEN** a sale with linked EXIT movements is cancelled
- **THEN** a compensating ENTRY movement is created, the stock quantity is reduced by the reversed units, and sale status is CANCELLED

#### Scenario: refund reverses stock (RN-SP-007)

- **WHEN** a PAID sale transitions to REFUNDED
- **THEN** the linked movements are reversed and the stock quantity is adjusted accordingly

### Requirement: Filtering

The system SHALL allow filtering sales/purchases by status.

#### Scenario: filter by status (RN-SP-008)

- **WHEN** list is called with `status=PAID&page=1&limit=20`
- **THEN** only PAID rows are returned and the pagination parameters are accepted by the query contract

### Requirement: NFR security

The system SHALL enforce auth and permission checks on all sale/purchase endpoints, fail-closed.

#### Scenario: unauthenticated rejected (RN-SP-009)

- **WHEN** an unauthenticated request hits any endpoint
- **THEN** 401 is returned
