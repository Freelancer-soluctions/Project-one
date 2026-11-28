# Spec Delta

## Purpose

Link employees to user accounts and enable self-service access to own data.

## ADDED Requirements

### Requirement: Optional user link

The system SHALL store an optional unique `userId` FK on employees, nullable (not every employee has an account).

#### Scenario: link (RN-EU-001)

- **WHEN** an employee is linked to a user
- **THEN** employee.userId is set and the user is returned

#### Scenario: unlink (RN-EU-002)

- **WHEN** an employee is unlinked
- **THEN** employee.userId becomes null

#### Scenario: link unauthorized (RN-EU-008)

- **WHEN** a user without canLinkEmployeeUser attempts link or unlink
- **THEN** 403 is returned

### Requirement: Create account for employee

The system SHALL allow creating a user account for an employee (password hashed, role assigned, returns 201 without password).

#### Scenario: account created (RN-EU-009)

- **WHEN** an ADMIN creates an account for an unlinked employee with a valid role
- **THEN** a user is created, employee.userId is set, and the response omits the password

#### Scenario: duplicate email (RN-EU-010)

- **WHEN** account creation targets an email already in use
- **THEN** 409 is returned

#### Scenario: unauthorized (RN-EU-011)

- **WHEN** a user without canLinkEmployeeUser attempts account creation
- **THEN** 403 is returned

#### Scenario: one-to-one (RN-EU-003)

- **WHEN** a user is already linked to another employee
- **THEN** linking again is rejected with 409

### Requirement: Backfill by email

The system SHALL backfill userId by matching employee.email to user.email during migration.

#### Scenario: backfill (RN-EU-004)

- **WHEN** migration runs
- **THEN** employees with a matching user email get userId set

### Requirement: Self-service

The system SHALL provide `/employees/me` returning the authenticated user's employee record (or 404).

#### Scenario: own record (RN-EU-005)

- **WHEN** an authenticated user with a linked employee calls /employees/me
- **THEN** their employee record is returned

#### Scenario: no link (RN-EU-006)

- **WHEN** an authenticated user without a linked employee calls /employees/me
- **THEN** 404 is returned

### Requirement: NFR security

The system SHALL enforce auth/permission checks; self-service endpoints must not leak encrypted fields beyond authorized roles.

#### Scenario: unauthenticated rejected (RN-EU-007)

- **WHEN** an unauthenticated request hits any endpoint
- **THEN** 401 is returned
