# Spec Delta

## Purpose

Separates unit and integration coverage thresholds so each test type is evaluated against its own floor, while preserving backward compatibility for workspaces that declare a single flat threshold set.

## ADDED Requirements

### Requirement: Per-type threshold sets are supported

The guard SHALL accept a type selector (unit or integration) and load the corresponding threshold set from a named export or separate policy file (e.g. `coverageThresholds.unit` / `coverageThresholds.integration` in the vitest config, or `.coverage-thresholds.json`). Workspaces without per-type blocks SHALL fall back to the flat `coverage.thresholds` as the unit set. Per-type sets SHALL NOT be placed under `coverage.thresholds`, because Vitest interprets non-metric keys there as glob patterns.

#### Scenario: Unit type loads unit thresholds

- **WHEN** the guard is invoked with type=unit
- **THEN** it evaluates the unit threshold set

#### Scenario: Integration type loads integration thresholds

- **WHEN** the guard is invoked with type=integration
- **THEN** it evaluates the integration threshold set

#### Scenario: Flat fallback for backward compatibility

- **WHEN** a workspace has no per-type blocks
- **THEN** the flat thresholds are treated as the unit set
- **AND** no existing config breaks

### Requirement: Type is named in verdict

The guard SHALL name the evaluated type in its output. A unit run SHALL never be compared against integration thresholds.

#### Scenario: Verdict names type

- **WHEN** the guard evaluates a threshold set
- **THEN** the output names the type (unit or integration)

#### Scenario: No cross-type comparison

- **WHEN** a unit run is evaluated
- **THEN** integration thresholds are not applied
