## ADDED Requirements

### Requirement: Regression test suite

The system SHALL have a regression test suite that runs before each commit to ensure existing features continue working.

#### Scenario: Core tests pass

- **WHEN** regression suite runs
- **THEN** all core unit and integration tests pass

#### Scenario: No breaking changes

- **WHEN** developer commits code
- **THEN** regression suite verifies no existing functionality is broken

### Requirement: Pre-commit hook integration

The system SHALL integrate regression tests with git hooks to prevent broken code from being committed.

#### Scenario: Pre-commit triggers regression

- **WHEN** developer attempts to commit
- **THEN** regression tests run automatically

#### Scenario: Tests fail blocks commit

- **WHEN** regression tests fail
- **THEN** commit is blocked and developer sees failure details

### Requirement: Regression test coverage by priority

The system SHALL prioritize regression testing based on module criticality.

#### Scenario: Critical modules have priority

- **WHEN** regression suite runs
- **THEN** tests for critical modules (sale, payroll, users) execute first

#### Scenario: Business modules tested

- **WHEN** regression suite runs
- **THEN** tests for business modules (inventory, employees, attendance) are included
