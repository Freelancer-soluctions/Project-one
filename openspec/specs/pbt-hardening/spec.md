# pbt-hardening Specification

## Purpose

Cierra los gaps de cobertura y de sincronización de specs del gate de property-based testing (fast-check) del monorepo: invariantes de dominio sobre SUT reales, propiedades negativas, exploración con semilla aleatoria, resumen reproducible en CI, lint de pureza y postura blocking declarada de forma consistente. Complementa la adopción inicial descrita en el change `property-based-testing-adoption`.

## Requirements

### Requirement: Domain invariants as properties

Property tests SHALL cover domain invariants (stock >= 0, attendance idempotency) over real SUT helpers.

#### Scenario: Stock invariant fails on mutation

- **WHEN** the stock helper is mutated to allow negative stock
- **THEN** the property fails

#### Scenario: Attendance invariant stays within what the SUT guarantees

- **WHEN** the attendance properties run
- **THEN** they assert the invariants enforced by `attendanceCreateSchema`/`attendanceUpdateSchema` (positive `workedHours`, bounded `entryTime`/`exitTime`, integer `employeeId`, non-empty patch)
- **AND** full check-in/check-out idempotency is not asserted until `attendance/service.ts` implements it (out of scope for this capability)

### Requirement: Properties exercise real SUT

Properties SHALL import and exercise real repository helpers, not reimplement logic.

#### Scenario: Real helper used

- **WHEN** a property runs
- **THEN** it calls the actual helper (pagination, money, stock)
- **AND** the monetary property exercises `sumLineItems` — the helper both `SalesDialog` and `PurchaseDialog` use for the `total` field — instead of a copied `reduce`

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

### Requirement: Job summary with seed and counterexample (G2)

The property-tests job SHALL write the seed, path and counterexample to $GITHUB_STEP_SUMMARY on failure.

#### Scenario: Seed and counterexample in summary

- **WHEN** a property test fails in CI
- **THEN** the step summary contains the seed, path and counterexample

### Requirement: Purity lint for property files (G4)

The repository SHALL enforce a lint rule prohibiting Math.random, Date.now and network calls in property test files.

#### Scenario: Impure code fails lint

- **WHEN** a property test file uses Math.random or Date.now
- **THEN** lint fails

### Requirement: maxSkipsPerRun configured (G5)

fc.configureGlobal SHALL set maxSkipsPerRun explicitly (e.g. 50) in both setup files.

#### Scenario: maxSkipsPerRun set

- **WHEN** the setup files are loaded
- **THEN** maxSkipsPerRun is configured

### Requirement: Regression pinning (G6)

Property tests SHALL use examples: for known counterexamples, and the PR template SHALL include a checklist item.

#### Scenario: Examples used

- **WHEN** a property test is updated with a known counterexample
- **THEN** it is added as examples: in fc.assert

### Requirement: Nightly exploration job (G7)

A scheduled workflow SHALL run property tests with a random seed and create an issue on failure (advisory by PRD design).

#### Scenario: Nightly run creates issue on failure

- **WHEN** the nightly property test job fails
- **THEN** an issue is created with seed and counterexample

### Requirement: Environment overrides for seed and budget

Both Vitest setup files SHALL honor `PBT_SEED` and `PBT_NUMRUNS`, overriding the environment defaults (CI: seed 42 / 1000 runs; local: random seed / 100 runs).

#### Scenario: Random-seed exploration

- **WHEN** the nightly workflow exports a random `PBT_SEED` and `PBT_NUMRUNS=5000`
- **THEN** the properties run with that seed and budget, and the seed is published so the failure can be replayed with `PBT_SEED=<seed> npm run test:pbt`
