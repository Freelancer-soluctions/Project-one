# coverage-critical-path-floors Specification

## Purpose

Declares the business-critical code paths of the product and the coverage floor each must meet, evaluated as a distinct threshold level, so a critical module with no tests is a visible failure rather than a silent gap in an aggregate.

## Requirements

### Requirement: Critical paths are declared in a versioned policy

The project SHALL maintain a versioned, reviewable declaration of critical business paths (auth, permissions, crypto, payroll, sales, inventory, stock, warehouse, expenses, users) with a coverage floor per path. A critical path with no unit tests SHALL be an explicit failure, not an implicit zero within a workspace aggregate.

#### Scenario: Critical path declared

- **WHEN** a path is listed in the critical-path policy
- **THEN** it carries a coverage floor
- **AND** the floor is evaluated by the guard

#### Scenario: Untested critical path fails

- **WHEN** a critical path has no unit tests
- **THEN** the enforcement point reports it as a failure
- **AND** the path is named in the output

### Requirement: Critical-path floor is a distinct threshold level

The coverage configuration SHALL support a critical-path threshold level in addition to the global floor, per-file, and glob levels. The critical-path level SHALL apply only to files matching a declared critical path and SHALL NOT replace the global floor.

#### Scenario: Critical path below floor fails even if global passes

- **WHEN** a file on a critical path is below its critical-path floor
- **AND** the workspace global floor is satisfied
- **THEN** the enforcement point fails and names the file

#### Scenario: Non-critical file not evaluated against critical paths

- **WHEN** a file does not match any declared critical path
- **THEN** it is not evaluated against critical-path thresholds

### Requirement: Critical roots remain synchronized with the policy

Every production source file under a versioned critical root SHALL have an entry in the critical-path policy. A new file under such a root must be added as either `enforced` with a complete numeric floor in the workspace Vitest config, or `exempt` with reason, owner, and future expiry. An exact critical-path floor without a policy entry SHALL fail validation.

#### Scenario: New source file is added under a critical root

- **WHEN** a source file is added under a critical root
- **THEN** validation fails until the file is declared in policy

#### Scenario: Critical floor has no policy entry

- **WHEN** a Vitest config declares an exact-file critical floor without a policy entry
- **THEN** validation fails

### Requirement: Exemptions are auditable

A critical path that cannot yet meet its floor SHALL be recorded in a versioned exception list with a reason, an owner, and an expiry. An exemption without these fields SHALL be rejected by validation.

#### Scenario: Exemption with required fields accepted

- **WHEN** an exemption declares reason, owner, and expiry
- **THEN** it is accepted
- **AND** the path is not evaluated until expiry

#### Scenario: Exemption missing fields rejected

- **WHEN** an exemption lacks reason, owner, or expiry
- **THEN** validation fails

**Decision — no display-only target field:** this specification governs enforced floors only. The current policy/configuration has no separate target field; adding targets and reporting progress toward them is deferred until a future change defines and implements that contract.
