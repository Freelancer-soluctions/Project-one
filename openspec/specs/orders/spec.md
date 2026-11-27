# orders Specification

## Purpose

Revive and harden client/provider orders so they can be created with line items, monetary precision, delivery tracking, and conversion into sales/purchases.

## Requirements

### Requirement: Order monetary precision

The system SHALL store all order money values as `Decimal(18,2)`, never `Float`, for both `clientOrder` and `providerOrder`.

#### Scenario: line price stored with 2 decimals (RN-ORD-001)

- **WHEN** a client order detail is created with `unitPrice = 10.123`
- **THEN** the request is rejected with 400 (Joi rejects >2 decimals); values with ≤2 decimals are stored exactly as `Decimal`

### Requirement: Order total is persisted and maintained

The system SHALL persist a `total` on each order and recompute it transactionally whenever detail lines are added, updated, or removed.

#### Scenario: total recomputed on detail add (RN-ORD-002)

- **WHEN** a provider order has lines (qty 2 × price 5.00) and (qty 1 × 3.50)
- **THEN** `order.total == 13.50`

#### Scenario: total recomputed on detail removal (RN-ORD-003)

- **WHEN** a detail line is removed
- **THEN** `order.total` decreases by that line's contribution

### Requirement: Delivery date tracking

The system SHALL allow setting `expectedDeliveryDate` on creation/update and `deliveredOn` on status transition to RECEIVED/COMPLETED, for both order types.

#### Scenario: expected date persisted (RN-ORD-004)

- **WHEN** an order is created with `expectedDeliveryDate`
- **THEN** it is persisted and returned in reads

#### Scenario: deliveredOn set on receive (RN-ORD-005)

- **WHEN** an order transitions to RECEIVED
- **THEN** `deliveredOn` is set to the transition timestamp

#### Scenario: manual deliveredOn override by ADMIN (RN-ORD-005b)

- **WHEN** an ADMIN sets `deliveredOn` manually on update
- **THEN** the value is persisted; non-ADMIN requests with `deliveredOn` are rejected with 403

### Requirement: Order-to-sale/purchase conversion link

The system SHALL persist `saleId` on `clientOrder` when converted to a sale, and `purchaseId` on `providerOrder` when converted to a purchase.

#### Scenario: link persisted on conversion (RN-ORD-006)

- **WHEN** a client order is converted to a sale
- **THEN** `clientOrder.saleId` equals the new sale's id

#### Scenario: delete blocked when linked (RN-ORD-007)

- **WHEN** a delete is attempted on an order with a linked sale/purchase
- **THEN** the request is rejected with 409

### Requirement: Order status lifecycle

The system SHALL enforce the allowed status transitions for both order types: PENDING→PROCESSING→SHIPPED→RECEIVED→COMPLETED, and any non-COMPLETED state→CANCELLED; CANCELLED and COMPLETED are terminal.

#### Scenario: valid forward transition accepted (RN-ORD-010)

- **WHEN** an order in PENDING transitions to PROCESSING
- **THEN** the transition succeeds and status is updated

#### Scenario: invalid transition rejected (RN-ORD-011)

- **WHEN** a transition from COMPLETED to CANCELLED (or PENDING to COMPLETED) is attempted
- **THEN** the request is rejected with 400

### Requirement: Detail validation

The system SHALL require at least one detail line on create, with `quantity >= 1` and a valid monetary price.

#### Scenario: empty details rejected (RN-ORD-008)

- **WHEN** create is attempted with `details: []`
- **THEN** validation fails with 400

### Requirement: NFR security

The system SHALL enforce auth (`verifyToken`) and role/permission checks on all order endpoints, fail-closed.

#### Scenario: unauthenticated rejected (RN-ORD-009)

- **WHEN** an unauthenticated request hits any order endpoint
- **THEN** 401 is returned
