# Spec Delta

## Purpose

Separates an aspirational coverage objective (display-only) from the enforced coverage floor, so progress can be shown without weakening the gate, and validates that the objective is never below the floor.

## ADDED Requirements

### Requirement: Objective is distinct from floor

Each workspace coverage configuration SHALL support an objective block **outside** `coverage.thresholds` — as a named export from the vitest config or as a separate policy file (e.g. `.coverage-objectives.json`) — with the same four metrics. The objective SHALL be reported in CI summaries, guard output, and documentation, but SHALL never influence the exit code. The objective SHALL NOT be placed under `coverage.thresholds`, because Vitest interprets non-metric keys there as glob patterns.

#### Scenario: Objective below floor is configuration error

- **WHEN** an objective value is lower than the corresponding floor
- **THEN** validation fails

#### Scenario: Objective above floor passes

- **WHEN** all objective values are equal to or higher than their floors
- **THEN** validation passes

### Requirement: Objective is display-only

The guard SHALL report measured value, floor, and objective together. A run between floor and objective SHALL produce a passing verdict.

#### Scenario: Between floor and objective passes

- **WHEN** measured coverage is below the objective but above the floor
- **THEN** the verdict is pass
- **AND** the report shows measured, floor, and objective

#### Scenario: Below floor fails regardless of objective

- **WHEN** measured coverage is below the floor
- **THEN** the verdict is fail
- **AND** the objective does not override the floor
