# Spec Delta

## Purpose

Track salary type and use it to compute payroll totals correctly.

## ADDED Requirements

### Requirement: Salary type on employee

The system SHALL store a `salaryType` (`MONTHLY`, `HOURLY`, `PER_PROJECT`) on every employee, default `MONTHLY`.

#### Scenario: default (RN-ST-001)

- **WHEN** an employee is created without salaryType
- **THEN** it defaults to MONTHLY

#### Scenario: invalid type rejected (RN-ST-002)

- **WHEN** an invalid salaryType is submitted
- **THEN** 400 is returned

### Requirement: Payroll computation

The system SHALL compute `totalPayment` server-side from `baseSalary`, `extraHours`, `deductions`, and `salaryType`; a client-supplied `totalPayment` is ignored. Formula: MONTHLY → baseSalary + extraHours - deductions; HOURLY → baseSalary × extraHours - deductions; PER_PROJECT → baseSalary - deductions. `extraHours` is required for HOURLY.

#### Scenario: hourly (RN-ST-003)

- **WHEN** a payroll is created for an HOURLY employee with baseSalary=5 and extraHours=10
- **THEN** totalPayment = 50 (deductions applied if present)

#### Scenario: monthly (RN-ST-004)

- **WHEN** a payroll is created for a MONTHLY employee
- **THEN** totalPayment = baseSalary + extraHours - deductions

#### Scenario: client totalPayment ignored (RN-ST-006)

- **WHEN** a payroll is created with a client-supplied totalPayment
- **THEN** the server-computed value is used and the client value is ignored

### Requirement: NFR security

The system SHALL enforce auth/permission checks on all endpoints, fail-closed.

#### Scenario: unauthenticated rejected (RN-ST-005)

- **WHEN** an unauthenticated request hits any endpoint
- **THEN** 401 is returned
