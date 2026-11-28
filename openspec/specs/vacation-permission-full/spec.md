# vacation-permission-full Specification

## Purpose

Full vacation/permission lifecycle: approval traceability, reason/comments, balance/accrual, payroll deduction.

## Requirements

### Requirement: Approval traceability

The system SHALL stamp `approvedBy`/`approvedAt` when status→APPROVED and `rejectedBy`/`rejectedAt` when status→REJECTED (or CANCELLED), server-side only; client cannot set them.

#### Scenario: approve (RN-VP-001)

- **WHEN** an authorized user transitions a request to APPROVED
- **THEN** approvedBy=userId, approvedAt=now, rejected fields cleared

#### Scenario: reject (RN-VP-002)

- **WHEN** an authorized user transitions to REJECTED
- **THEN** rejectedBy=userId, rejectedAt=now, approved fields cleared

#### Scenario: forgery rejected (RN-VP-003)

- **WHEN** a client sends approvedBy in the body
- **THEN** it is ignored (400 or stripped)

### Requirement: Reason and comments

The system SHALL persist `reason` (requester) and `comments` (approver) on both models.

#### Scenario: persist reason (RN-VP-004)

- **WHEN** a vacation is created with a reason
- **THEN** reason is persisted and returned

#### Scenario: persist comments (RN-VP-005)

- **WHEN** an approval includes comments
- **THEN** comments is persisted and returned

### Requirement: Paid flag

The system SHALL store a `paid Boolean @default(true)` on both vacation and permission; only unpaid leaves trigger payroll deduction.

#### Scenario: unpaid leave (RN-VP-012)

- **WHEN** a leave is created with paid=false
- **THEN** paid is persisted and the leave is treated as unpaid for payroll

### Requirement: Accrual policy (v1)

The system SHALL accrue 1.25 vacation days per month (15 days/year), capped at 30 days accrued, with no carry-over beyond the cap; accrual runs monthly via a manual trigger endpoint.

#### Scenario: accrual (RN-VP-013)

- **WHEN** the accrual trigger runs for a month
- **THEN** each active employee's balance.accrued increases by 1.25 (up to cap) and a ledger record is created

### Requirement: Vacation balance

The system SHALL track per-employee available vacation days via `vacationBalance` (accrued/used/remaining) and `vacationAccrualRecord` ledger.

#### Scenario: insufficient balance (RN-VP-006)

- **WHEN** a vacation request exceeds remaining balance
- **THEN** 400 is returned

#### Scenario: deduction on approval (RN-VP-007)

- **WHEN** a vacation is approved
- **THEN** used increases and remaining decreases transactionally

#### Scenario: restore on rejection/cancellation (RN-VP-008)

- **WHEN** an approved vacation is rejected or cancelled
- **THEN** used decreases and remaining increases

### Requirement: Payroll deduction

The system SHALL deduct approved unpaid leave from payroll totalPayment in the period.

#### Scenario: deduction (RN-VP-009)

- **WHEN** payroll is computed for an employee with approved unpaid leave in the period
- **THEN** totalPayment reflects the deduction

### Requirement: Approval authorization

The system SHALL restrict APPROVED/REJECTED transitions to holders of `canApproveVacation`/`canApprovePermission` (or ADMIN).

#### Scenario: unauthorized approve (RN-VP-010)

- **WHEN** a user without the approve permission attempts to approve
- **THEN** 403 is returned

### Requirement: NFR security

The system SHALL enforce auth and permission checks, fail-closed, and not leak encrypted fields.

#### Scenario: unauthenticated rejected (RN-VP-011)

- **WHEN** an unauthenticated request hits any endpoint
- **THEN** 401 is returned
