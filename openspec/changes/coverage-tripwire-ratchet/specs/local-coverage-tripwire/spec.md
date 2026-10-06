# Spec Delta

## Purpose

Cierra la brecha entre el tripwire de coverage que hoy solo existe en CI y el desarrollador que escribe el código: un comando local de suite completa con paridad real con los jobs de cobertura, y una acción explícita para elevar los pisos que solo pueden subir.

## ADDED Requirements

### Requirement: Local full-suite coverage verification

The project SHALL provide a single root-level command that runs the FULL unit suite with coverage enabled in both workspaces and then evaluates the result against the same thresholds the CI coverage jobs enforce, so a developer can reproduce the CI coverage verdict locally without reading logs. The command SHALL run full suites rather than diff-scoped ones, because partial totals are not comparable to global thresholds. The command SHALL exit non-zero when any configured threshold is unmet, mirroring the CI guard's exit codes so the local and CI verdicts agree.

#### Scenario: Both workspaces pass their floors

- **WHEN** a developer runs the local coverage verification command and both workspaces meet every configured threshold
- **THEN** it reports per-metric results for client and server and exits 0
- **AND** the reported values match what the CI coverage jobs would compute for the same commits

#### Scenario: A workspace is below its floor

- **WHEN** the local coverage verification command finds a metric below its threshold in either workspace
- **THEN** it names the workspace, the metric, the measured value and the threshold, and exits non-zero
- **AND** the failure is attributable to coverage, not to a test failure that already surfaced earlier in the same run

#### Scenario: Partial coverage reports are never compared to global thresholds

- **WHEN** the local coverage verification command runs, whether by its own invocation or because a previous step left a diff-scoped coverage report in the workspace
- **THEN** it always regenerates full-suite coverage before evaluating thresholds
- **AND** it never evaluates global thresholds against a diff-scoped report

### Requirement: Local coverage ratchet raises floors only

The project SHALL provide an explicit local command that raises coverage thresholds to the currently measured values, using the coverage tooling's threshold auto-update, so that the floor ratchets upward. The command SHALL be a deliberate local action and SHALL NOT be enabled in CI, preserving the existing prohibition on auto-updating thresholds during automated runs. The command SHALL report which thresholds it raised and SHALL NOT lower a threshold.

#### Scenario: Developer raises the floor after adding tests

- **WHEN** a developer runs the ratchet command after adding tests that raise measured coverage
- **THEN** the workspace thresholds are updated upward to the measured values
- **AND** the command prints the previous and new value of each threshold it changed

#### Scenario: Ratchet never lowers a threshold

- **WHEN** the ratchet command runs and measured coverage is below an existing threshold for any metric
- **THEN** that threshold is left unchanged
- **AND** the command reports it as unchanged rather than silently reducing it

#### Scenario: Auto-update stays disabled in CI

- **WHEN** any CI job runs coverage
- **THEN** threshold auto-update is not enabled and no CI process rewrites threshold configuration

### Requirement: Local and CI coverage verdicts are documented as a parity contract

The project SHALL document, for each CI coverage job and each local coverage command, whether the two produce the same verdict, and SHALL state explicitly where they do not and why. Documentation SHALL identify any command that a developer could mistake for the CI gate and state what it does not cover.

#### Scenario: Developer looks up a command

- **WHEN** a developer reads the coverage tripwire documentation to decide which command to run
- **THEN** a parity table maps each CI coverage job to its local equivalent or states that no local equivalent exists
- **AND** any divergence is named with its reason, not left implicit

#### Scenario: Pre-push hook is not presented as a coverage gate

- **WHEN** the documentation describes what the pre-push hook enforces
- **THEN** it states that the hook runs diff-scoped tests without evaluating coverage thresholds
- **AND** it points to the local coverage command as the way to verify the coverage floor

### Requirement: Broken cross-references to the coverage documentation are corrected

Documentation that links to the coverage tripwire document SHALL link to its actual location, so that a reader following the reference reaches the file.

#### Scenario: Reference resolves

- **WHEN** a reader follows the coverage tripwire reference from the enterprise testing document
- **THEN** it resolves to the existing file rather than a path that does not exist
