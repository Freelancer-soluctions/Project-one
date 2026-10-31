# coverage-mutation-testing Specification

## Purpose

Measures the strength of assertions on critical business paths via mutation testing, with a declared score threshold and named surviving mutants, so coverage cannot be satisfied by tests that execute lines without asserting on them.

## Requirements

### Requirement: Mutation testing is available for critical paths

The project SHALL provide a mutation testing tool runnable against critical business paths, with a declared mutation score threshold. Surviving mutants SHALL be reported by name.

#### Scenario: Surviving mutant reported

- **WHEN** a mutant survives the test suite
- **THEN** it is reported by name
- **AND** the score is compared against the threshold

#### Scenario: Score below threshold fails

- **WHEN** the mutation score is below the threshold
- **THEN** the run fails

### Requirement: Mutation testing runs on a non-PR cadence

Mutation testing SHALL run on a scheduled cadence (not per-PR) due to cost. Blocking SHALL be by regression against a recorded baseline, not by an absolute score on first run.

#### Scenario: Regression blocks

- **WHEN** the mutation score regresses against the baseline
- **THEN** the run fails

#### Scenario: Initial run records baseline

- **WHEN** no baseline exists
- **THEN** the score is recorded as the baseline
- **AND** the run does not fail solely for being below an absolute threshold
