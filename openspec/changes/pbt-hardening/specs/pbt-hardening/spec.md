# Spec: pbt-hardening

## ADDED Requirements

### Requirement: Domain invariants as properties

Property tests SHALL cover domain invariants (stock >= 0, attendance idempotency) over real SUT helpers.

#### Scenario: Stock invariant fails on mutation

- **WHEN** the stock helper is mutated to allow negative stock
- **THEN** the property fails

### Requirement: Properties exercise real SUT

Properties SHALL import and exercise real repository helpers, not reimplement logic.

#### Scenario: Real helper used

- **WHEN** a property runs
- **THEN** it calls the actual helper (pagination, money, stock)

### Requirement: Negative properties for invalid inputs

Schemas SHALL have properties asserting invalid inputs are rejected.

#### Scenario: Invalid input rejected

- **WHEN** an invalid value is passed to a schema
- **THEN** validation fails

### Requirement: Failure artifact and structured reporter

The property-tests job SHALL upload an artifact on failure and use junit/json reporters.

#### Scenario: Artifact on failure

- **WHEN** a property test fails in CI
- **THEN** an artifact is uploaded and a junit report is generated

### Requirement: Spec sync to blocking posture

The delta spec of `property-based-testing` and the main spec `ci-prebuild-substage-structure` SHALL be updated to reflect the blocking posture of the property-tests job (no continue-on-error, listed in prebuild-tests-complete.needs).

#### Scenario: Specs reflect blocking

- **WHEN** the specs are synced
- **THEN** no reference to advisory/continue-on-error remains for property-tests
