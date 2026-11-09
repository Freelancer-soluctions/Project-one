# Spec Delta

## Purpose

Declares an aspirational coverage objective per workspace and metric that is reported everywhere but never enforced, keeping the enforced floor and the target visibly distinct.

## ADDED Requirements

### Requirement: Objective is declared outside the enforced thresholds

Each workspace SHALL declare a display-only objective for the four metrics in a policy file outside `coverage.thresholds` (for example `.coverage-policy.json`). The objective SHALL be reported by the guard, CI summaries and the canonical documentation, and SHALL NOT affect the pass/fail verdict. An objective below the enforced floor SHALL fail validation as a configuration error.

#### Scenario: Run between floor and objective stays green

- **WHEN** measured coverage is above the floor and below the objective
- **THEN** the guard reports the objective
- **AND** the verdict is green

#### Scenario: Objective below floor is a configuration error

- **WHEN** the declared objective for a metric is lower than the enforced floor
- **THEN** validation fails
- **AND** no coverage verdict is produced from that configuration

#### Scenario: Objective is reported, not enforced

- **WHEN** the guard evaluates a report
- **THEN** the objective is shown next to each metric
- **AND** the exit code depends only on the enforced floor

### Requirement: Objective cannot be confused with a glob threshold

The objective SHALL NOT be declared under `coverage.thresholds`, because Vitest interprets non-metric keys there as glob patterns and would enforce them.

#### Scenario: Vitest does not enforce the objective

- **WHEN** a workspace configuration is loaded by Vitest
- **THEN** no objective key exists under `coverage.thresholds`
- **AND** Vitest enforces only floor values
