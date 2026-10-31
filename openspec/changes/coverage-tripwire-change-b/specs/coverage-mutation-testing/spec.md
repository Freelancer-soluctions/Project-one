# Spec Delta

## MODIFIED Requirements

### Requirement: Mutation testing is available for critical paths

The project SHALL provide a mutation testing tool (Stryker) runnable against critical business paths, with a declared mutation score threshold. Surviving mutants SHALL be reported by name, including mutant id, file, location, and mutated operator, in both the workflow summary and an uploaded artifact. A root script (`mutation:test`) SHALL mirror the nightly invocation for local reproduction.

#### Scenario: Surviving mutant reported

- **WHEN** a mutant survives the test suite
- **THEN** it is reported by name with id, file, location, and mutated operator
- **AND** the report is available in the workflow summary and as an uploaded artifact
- **AND** the score is compared against the threshold

#### Scenario: Score below threshold fails

- **WHEN** the mutation score is below the threshold
- **AND** a baseline already exists
- **THEN** the run fails

#### Scenario: First run does not fail for low score

- **WHEN** no baseline exists
- **THEN** the run does not fail solely for being below an absolute threshold
- **AND** the score is recorded as the baseline

#### Scenario: Local reproduction available

- **WHEN** a developer runs the local mutation test command
- **THEN** it executes the same mutation run as the nightly workflow

### Requirement: Mutation testing runs on a non-PR cadence

Mutation testing SHALL run on a scheduled cadence (nightly, not per-PR) due to cost. Blocking SHALL be by regression against a recorded baseline, not by an absolute score on first run. The first run SHALL record the baseline mutation score and SHALL NOT fail solely for being below an absolute threshold.

#### Scenario: Regression blocks

- **WHEN** the mutation score regresses against the baseline
- **THEN** the run fails

#### Scenario: Initial run records baseline

- **WHEN** no baseline exists
- **THEN** the score is recorded as the baseline
- **AND** the run does not fail solely for being below an absolute threshold

#### Scenario: Nightly cadence

- **WHEN** the nightly workflow runs
- **THEN** mutation testing executes against critical paths
- **AND** the score and surviving mutants are reported

## ADDED Requirements

### Requirement: Mutation baseline storage and lifecycle

The mutation baseline SHALL be stored as a versioned file (`stryker-baseline.json`) in the repository, updated via pull request (never direct commit to main). If the baseline file is missing, the run SHALL record the current score as the baseline and exit 0 (advisory). If the baseline file exists but is corrupt or unreadable, the run SHALL fail with a distinct "baseline missing or corrupt" verdict.

#### Scenario: Missing baseline records and passes

- **WHEN** no baseline file exists
- **THEN** the current score is recorded as the baseline
- **AND** the run exits 0

#### Scenario: Corrupt baseline fails distinctly

- **WHEN** the baseline file exists but is corrupt or unreadable
- **THEN** the run fails with a "baseline missing or corrupt" verdict
- **AND** the failure is not treated as a regression or tool failure
