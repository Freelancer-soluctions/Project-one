# coverage-baselines Specification

## Purpose

Measures and documents current test coverage baselines for both workspaces so the coverage thresholds configured by the `ci-testing-pipeline-reactivation` change (successor of the absorbed `ci-test-integration`) are realistic and data-driven.

## Requirements

### Requirement: Coverage baseline measurement

The coverage baselines SHALL be measured by running `npm run test:coverage` in both workspaces.

#### Scenario: Client coverage measured

- **WHEN** `npm run test:coverage --workspace=apps/client` runs
- **THEN** client coverage metrics (statements, branches, functions, lines) are captured

#### Scenario: Server coverage measured

- **WHEN** `npm run test:coverage --workspace=apps/server` runs
- **THEN** server coverage metrics (statements, branches, functions, lines) are captured

### Requirement: Coverage baselines documented

The measured baselines SHALL be recorded in `docs/cicd-plan-implementacion.md` so they are available when configuring thresholds.

#### Scenario: Baselines recorded in cicd plan

- **WHEN** coverage metrics are captured
- **THEN** a "Coverage Baselines (Jul 2026)" section is added to `docs/cicd-plan-implementacion.md` as §14.5 (after §14, before §15)
- **AND** it includes client and server coverage metrics, the measurement date, and a note that thresholds are configured by the `ci-testing-pipeline-reactivation` change

### Requirement: Dependency ordering with the testing pipeline change

This change SHALL be completed before the coverage-threshold work of `ci-testing-pipeline-reactivation` (successor of the absorbed `ci-test-integration`) because the documented baselines feed its coverage thresholds.

#### Scenario: Baselines feed thresholds

- **WHEN** the `ci-testing-pipeline-reactivation` change configures `coverage.thresholds`
- **THEN** the thresholds are set at or slightly below the baselines documented here
- **AND** the dependency annotation (ci-quality-gates → ci-testing-pipeline-reactivation) is present in both changes
