# employee-catalogs Specification

## Purpose

Replace free-text position/department on employees with first-class catalog entities, enabling consistent grouping/filtering and future org-chart/area-manager features.

## Requirements

### Requirement: Position catalog

The system SHALL provide CRUD for positions (id, code, name, active, audit fields) with unique code.

#### Scenario: create position (RN-EC-001)

- **WHEN** an ADMIN creates a position with a unique code and name
- **THEN** it is persisted and returned with audit fields

#### Scenario: duplicate code rejected (RN-EC-002)

- **WHEN** a position is created with an existing code
- **THEN** 409 is returned

### Requirement: Department catalog

The system SHALL provide CRUD for departments (id, code, name, active, audit fields) with unique code.

#### Scenario: create department (RN-EC-003)

- **WHEN** an ADMIN creates a department with a unique code and name
- **THEN** it is persisted and returned with audit fields

#### Scenario: duplicate department code rejected (RN-EC-009)

- **WHEN** a department is created with an existing code
- **THEN** 409 is returned

### Requirement: Employee linkage

The system SHALL store required `positionId` and `departmentId` FKs on employees; create requires catalog ids and update accepts catalog ids (never `null`).

#### Scenario: employee with position/department (RN-EC-004)

- **WHEN** an employee is created with valid positionId and departmentId
- **THEN** the FKs are persisted and the catalog is returned in reads

#### Scenario: invalid catalog id rejected (RN-EC-005)

- **WHEN** create/update references a non-existent positionId/departmentId
- **THEN** 400 is returned

#### Scenario: assigned catalog row cannot be deleted

- **WHEN** a position or department still assigned to an employee is deleted
- **THEN** 409 is returned and the catalog row is kept

### Requirement: Filtering by catalog

The system SHALL allow filtering employees by departmentId and positionId.

#### Scenario: filter by department (RN-EC-006)

- **WHEN** list is called with departmentId
- **THEN** only employees in that department are returned

#### Scenario: filter by position (RN-EC-010)

- **WHEN** list is called with positionId
- **THEN** only employees in that position are returned

### Requirement: Backfill

The system SHALL backfill positionId/departmentId from existing free-text values (normalized) during migration.

#### Scenario: backfill normalizes (RN-EC-007)

- **WHEN** migration runs on existing rows
- **THEN** distinct normalized free-text values become catalog rows and employee FKs are set

### Requirement: NFR security

The system SHALL enforce auth and permission checks on all new endpoints, fail-closed.

#### Scenario: unauthenticated rejected (RN-EC-008)

- **WHEN** an unauthenticated request hits any new endpoint
- **THEN** 401 is returned
