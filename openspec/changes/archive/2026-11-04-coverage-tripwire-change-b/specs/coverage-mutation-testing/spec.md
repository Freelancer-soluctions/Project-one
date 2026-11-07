# Spec Delta

## MODIFIED Requirements

### Requirement: Mutation testing is available for critical paths

The project SHALL provide a mutation testing tool (Stryker) runnable against the business-critical paths declared in the versioned critical-path inventory, with a declared mutation score threshold. Surviving mutants SHALL be reported by name, file, location and mutated operator in the workflow summary and as an uploaded artifact. A local command SHALL mirror the nightly invocation.

#### Scenario: Surviving mutant reported

- **WHEN** a mutant survives the test suite
- **THEN** the summary lists its file, location and mutated operator
- **AND** the mutation score is reported against the declared threshold

#### Scenario: Declared threshold is reported

- **WHEN** the mutation run completes
- **THEN** the declared high/low thresholds are reported
- **AND** they are not the blocking condition on the first run

#### Scenario: Score below threshold fails

- **WHEN** the mutation score is below the declared threshold
- **AND** it also regresses against the recorded baseline
- **THEN** the run fails

#### Scenario: Local reproduction command

- **WHEN** a developer runs the local mutation command
- **THEN** it uses the same Stryker configuration as the nightly workflow

### Requirement: Mutation testing runs on a non-PR cadence

Mutation testing SHALL run on a scheduled cadence (not per-PR) due to cost. Blocking SHALL be by regression against a recorded baseline, not by an absolute score on first run. A missing baseline SHALL be recorded and the run SHALL exit successfully; a corrupt baseline SHALL fail with a distinct verdict; a missing report SHALL fail with a distinct tool-failure verdict, never as a regression.

#### Scenario: Regression blocks

- **WHEN** the mutation score regresses beyond tolerance against the recorded baseline
- **THEN** the run fails
- **AND** surviving mutants are listed for triage

#### Scenario: Initial run records baseline

- **WHEN** no baseline exists or the baseline is marked unrecorded
- **THEN** the measured score is written to a proposed baseline artifact
- **AND** the run does not fail solely for being below an absolute threshold

#### Scenario: Corrupt baseline fails distinctly

- **WHEN** the baseline file exists but cannot be parsed or lacks a numeric score
- **THEN** the run fails with a baseline-corrupt verdict
- **AND** the failure is not reported as a score regression

#### Scenario: Tool failure is not a regression

- **WHEN** the mutation report is missing because the tool did not produce results
- **THEN** the run fails with a tool-failure verdict
- **AND** no regression is recorded

## ADDED Requirements

### Requirement: Mutation scope comes from the critical-path inventory

The mutation scope SHALL be derived from the versioned critical-path inventory rather than a duplicated hand-written list, so a path promoted to enforced is mutated without a second configuration edit.

#### Scenario: Promoted path enters mutation scope

- **WHEN** a critical path is declared in the inventory
- **THEN** the mutation configuration targets that path

### Requirement: Mutation baseline advances only through review

The recorded mutation baseline SHALL advance only through a reviewed pull request, never through a direct commit to main from the scheduled workflow.

#### Scenario: Scheduled run proposes a baseline update

- **WHEN** the nightly run improves the score over the recorded baseline
- **THEN** it uploads a proposed baseline artifact
- **AND** it does not commit the baseline to main
