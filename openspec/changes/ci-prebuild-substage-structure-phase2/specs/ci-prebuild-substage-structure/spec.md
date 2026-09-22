# Spec Delta

## MODIFIED Requirements

### Requirement: Phase 1 non-blocking knip activation

**Status**: REMOVED — replaced by Phase 2 blocking promotion.

The system SHALL NOT use `continue-on-error: true` on dead-code jobs in Phase 2. The Phase 1 non-blocking mode is superseded by the blocking promotion.

#### Scenario: Phase 1 deprecated

- **WHEN** the team completes Phase 2 calibration
- **THEN** `continue-on-error: true` is removed from `client-dead-code` and `server-dead-code`
- **AND** the advisory-only behavior from Phase 1 is no longer active

#### Scenario: PR touches client workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `client=true`
- **THEN** the `client-dead-code` job runs `npx knip` WITHOUT `continue-on-error: true`
- **AND** the job blocks the merge if knip finds issues

#### Scenario: PR touches server workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `server=true`
- **THEN** the `server-dead-code` job runs `npx knip` WITHOUT `continue-on-error: true`
- **AND** the job blocks the merge if knip finds issues

#### Scenario: PR does not touch the workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `client=false` (or `server=false`)
- **THEN** the corresponding dead-code job is skipped via `if: needs.repo-discovery.outputs.client == 'true'` (or server equivalent)

### Requirement: Phase 2 blocking promotion

The system SHALL remove `continue-on-error` from dead-code jobs, making knip dead-code findings blocking quality gates that prevent PR merge on failure. The promotion SHALL occur only after baseline metrics are documented and the team confirms knip stability.

#### Scenario: Phase 2 promotion

- **WHEN** the team confirms knip stability (false positive rate acceptable, ignores calibrated)
- **THEN** `continue-on-error: true` is removed from `client-dead-code` and `server-dead-code`
- **AND** knip failures block the merge (same pattern as pr-title-lint/dco per §9.3.3/§9.3.4)

#### Scenario: knip failure blocks PR

- **WHEN** a PR targets `main` and `client-dead-code` (or `server-dead-code`) reports knip findings
- **THEN** the job exits with non-zero status
- **AND** the aggregator `prebuild-quality-complete` propagates the failure
- **AND** `ci-complete` reports failure, blocking the merge

### Requirement: Baseline calibration of ignores

The system SHALL calibrate ignores in per-workspace `knip.json` files when the knip baseline reports false positives, and document them in the change artifacts. Baseline metrics SHALL include false positive counts, required ignores, and per-workspace calibration status.

#### Scenario: False positives on first run

- **WHEN** `npx knip` runs for the first time against the codebase and reports false positives
- **THEN** the false positives are added to the `ignore` array in the corresponding `knip.json`
- **AND** the calibration is documented in the change artifacts

#### Scenario: Baseline metrics documented

- **WHEN** Phase 2 begins
- **THEN** baseline knip metrics are recorded for each workspace: total findings, false positive count, ignored entries, and pass/fail status
- **AND** the metrics are available for team review before promotion

## ADDED Requirements

### Requirement: Aggregator job reporting verification

The system SHALL verify that all 4 aggregator jobs (`prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-unit-tests-complete`) report correctly in a test PR under both `CI_MINIMAL=true` and `CI_MINIMAL=false` paths.

#### Scenario: Aggregators report under CI_MINIMAL=false

- **WHEN** a test PR runs with `CI_MINIMAL=false`
- **THEN** all 4 aggregator jobs execute and report their status (success or failure) to the GitHub status check system
- **AND** each aggregator's `needs` resolution produces the correct pass/skip/fail propagation

#### Scenario: Aggregators skip under CI_MINIMAL=true

- **WHEN** a test PR runs with `CI_MINIMAL=true`
- **THEN** all 4 aggregator jobs are SKIPPED
- **AND** no aggregator reports a failure to the GitHub status check system
- **AND** `ci-complete` still passes (skipped aggregators treated as passing)

### Requirement: ci-complete CI_MINIMAL pass-through

The `ci-complete` aggregator SHALL pass when all upstream aggregators are skipped (`CI_MINIMAL=true`), treating skipped jobs/aggregators as success.

#### Scenario: ci-complete passes with skipped aggregators

- **WHEN** `CI_MINIMAL=true` and all 4 substage aggregators are skipped
- **THEN** `ci-complete` evaluates as success
- **AND** the GitHub required status check `ci-complete` reports success

#### Scenario: ci-complete fails on blocking aggregator failure

- **WHEN** `CI_MINIMAL=false` and any aggregator reports failure
- **THEN** `ci-complete` reports failure
- **AND** the GitHub required status check blocks the merge

### Requirement: Ruleset status check regression verification

The system SHALL verify that all 4 existing ruleset status checks (`verify-signatures`, `commit-lint`, `pr-title-lint`, `dco`) continue to function correctly after Phase 2 changes. No regressions in their behavior are permitted.

#### Scenario: Ruleset checks pass on clean PR

- **WHEN** a test PR has valid signatures, conventional commits, proper PR title, and DCO sign-off
- **THEN** all 4 ruleset checks pass
- **AND** their behavior is identical to pre-Phase 2

#### Scenario: Ruleset checks fail on violating PR

- **WHEN** a test PR violates any ruleset rule (missing signature, non-conventional commit, invalid PR title, missing DCO)
- **THEN** the corresponding check fails
- **AND** the failure is independent of any dead-code or aggregator changes

## Notes

- **Traceability**: This delta satisfies Requirement 9 (Phase 2 blocking promotion) from the original spec, which was deferred to this change.
- **Breaking change**: Removing `continue-on-error` makes knip failures blocking — teams that relied on advisory-only knip output must address dead code before merging.
