# Spec Delta

## Purpose

Track payroll payment status/date and store bonuses + deduction breakdown, all encrypted.

## ADDED Requirements

### Requirement: Payment status

The system SHALL store `paymentStatus` (DRAFT/PAID/CANCELLED) default DRAFT, and `paymentDate` stamped on PAID transition. Allowed transitions: DRAFT→PAID, DRAFT→CANCELLED; PAID and CANCELLED are terminal.

#### Scenario: paid (RN-PP-001)

- **WHEN** a payroll transitions to PAID
- **THEN** paymentStatus=PAID and paymentDate=now

#### Scenario: invalid transition (RN-PP-002)

- **WHEN** a PAID or CANCELLED payroll attempts to transition to PAID
- **THEN** 400 is returned

### Requirement: Bonuses

The system SHALL store an optional encrypted `bonuses` monetary field.

#### Scenario: bonuses persisted (RN-PP-003)

- **WHEN** a payroll is created with bonuses
- **THEN** bonuses is persisted encrypted and returned

### Requirement: Deduction breakdown

The system SHALL store optional encrypted breakdown fields: `imss`, `isr`, `infonavit`, `otherDeductions`, plus keep `deductions` as total.

#### Scenario: breakdown persisted (RN-PP-004)

- **WHEN** a payroll is created with imss/isr
- **THEN** they are persisted encrypted and returned

### Requirement: Deduction total consistency

The system SHALL validate that `deductions` equals the sum of `imss + isr + infonavit + otherDeductions` when any breakdown field is provided; otherwise the request is rejected with 400.

#### Scenario: inconsistent breakdown rejected (RN-PP-007)

- **WHEN** a payroll is created with deductions=100 but imss+isr=50
- **THEN** 400 is returned

### Requirement: Encryption

The system SHALL encrypt all monetary fields (baseSalary, extraHours, deductions, totalPayment, bonuses, imss, isr, infonavit, otherDeductions) at rest.

#### Scenario: encrypted at rest (RN-PP-005)

- **WHEN** a payroll is created
- **THEN** all monetary columns are ciphertext in DB

### Requirement: NFR security

The system SHALL enforce auth/permission checks, fail-closed.

#### Scenario: unauthenticated rejected (RN-PP-006)

- **WHEN** an unauthenticated request hits any endpoint
- **THEN** 401 is returned
