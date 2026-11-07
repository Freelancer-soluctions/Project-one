# Spec: pbt-hardening

## ADDED Requirements

### Requirement: Domain invariants as properties

Property tests SHALL cover domain invariants over available SUT. Stock quantity >= 0 is enforced by stockCreateSchema (Joi min(0)); no idempotency helper exists in attendance/service.ts, so that invariant is out of scope unless domain logic is added first.

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

### Requirement: Setup files honor PBT_SEED and PBT_NUMRUNS

The setup files SHALL read PBT_SEED and PBT_NUMRUNS env vars and override the defaults (seed 42 / numRuns 1000 in CI, 100 local).

#### Scenario: Env override applied

- **WHEN** PBT_SEED or PBT_NUMRUNS is set
- **THEN** fc.configureGlobal uses those values instead of defaults
