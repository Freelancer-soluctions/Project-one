## ADDED Requirements

### Requirement: Updated testing architecture documentation

The system SHALL have updated documentation in docs/testing-architecture.md that reflects the complete testing strategy.

#### Scenario: Documentation includes all testing types

- **WHEN** documentation is read
- **THEN** it includes unit, integration, E2E, smoke, and regression testing sections

#### Scenario: Documentation shows current implementation

- **WHEN** documentation is read
- **THEN** it accurately reflects the current state of testing in the project

### Requirement: Testing priority guide for ERP modules

The system SHALL have documented priorities for testing ERP modules based on criticality.

#### Scenario: Critical modules documented

- **WHEN** documentation is read
- **THEN** it lists critical modules (sale, payroll, purchase, users) as highest priority

#### Scenario: Module priority levels defined

- **WHEN** documentation is read
- **THEN** it shows three priority levels: Critical, High, Normal

### Requirement: Coverage targets

The system SHALL have documented coverage targets for different module types.

#### Scenario: Coverage targets defined

- **WHEN** documentation is read
- **THEN** it specifies ≥80% for critical modules, ≥60% for business modules
