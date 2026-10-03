# ci-flaky-quarantine Specification

## Purpose

Detecta y pone en cuarentena tests intermitentes en CI mediante una métrica semanal de pass-rate, una lista de cuarentena versionada con restauración humana y reintentos acotados y visibles, para que los fallos intermitentes no erosionen la confianza en el merge gate ni se silencien con reintentos ciegos.

## Requirements

### Requirement: Weekly flaky metric with quarantine threshold

A scheduled weekly workflow SHALL compute the per-test pass rate from the JUnit XML reports published by the test jobs during a trailing 14-day observation window, and SHALL flag as quarantine candidate every test executed in at least 10 runs of that window whose pass rate is below 70%.

#### Scenario: Intermittent test is flagged

- **WHEN** a test executed in 12 runs of the observation window failed in 7 of them (pass rate 41.7%)
- **THEN** the weekly report flags it as a quarantine candidate showing its pass rate and run counts
- **AND** the candidate is advisory (it does not block any PR by itself)

#### Scenario: Stable test is not flagged

- **WHEN** a test executed 30 times in the observation window with a 100% pass rate
- **THEN** the weekly report does not flag it

#### Scenario: Insufficient data is reported, not guessed

- **WHEN** a test executed in only 4 runs of the observation window and failed once
- **THEN** it is NOT flagged as a quarantine candidate and the report lists it as "insufficient data"

### Requirement: Quarantine list with human restoration

Tests SHALL be quarantined only by adding an entry to the committed quarantine list `.github/flaky-quarantine.yml` recording file path, date, reason and owner. Blocking PR runs SHALL exclude quarantined tests, the nightly full-suite run SHALL execute them anyway, and removal of an entry SHALL require a human pull request — no workflow SHALL create, modify or remove entries in the quarantine list automatically.

#### Scenario: Quarantined failure does not block the PR

- **WHEN** a test listed in `.github/flaky-quarantine.yml` fails during a blocking PR run
- **THEN** the PR run does not fail because of that test and the run report shows that it was excluded by the quarantine list
- **AND** the entry remains in the list (only a human PR can remove it)

#### Scenario: Nightly run provides restoration evidence

- **WHEN** the nightly full-suite run executes a quarantined test (quarantine exclusions do not apply to it) and it passes or fails
- **THEN** its result feeds the weekly pass-rate metric so the owner can decide on restoration with data

#### Scenario: Restoration requires a human pull request

- **WHEN** the weekly report shows a quarantined test with a pass rate at or above 70% across the last 14 days
- **THEN** no automation removes the entry; only a human pull request deleting it returns the test to blocking runs

### Requirement: No silent skipping of flaky tests

Quarantining SHALL NOT be implemented by editing test source (`test.skip`, commenting out or deleting tests); the set of tests excluded from a blocking run SHALL be derived exclusively from the committed quarantine list.

#### Scenario: Exclusion is derived from the list

- **WHEN** a blocking CI run computes which tests to exclude
- **THEN** the exclusion set comes from parsing `.github/flaky-quarantine.yml`, not from markers inside test files

#### Scenario: Skipping a flaky test in source is a violation

- **WHEN** a pull request introduces `test.skip` (or deletes a test) to silence an intermittent failure without a quarantine entry
- **THEN** code review flags it as the documented anti-pattern (silent flaky) and the change is rejected in favor of a quarantine entry with owner and reason

### Requirement: Bounded, CI-only and visible retries

Test retries SHALL be configured only in CI (never enforced by local hooks), SHALL be bounded to at most 2 retries per test, and SHALL be visible: a test that passes only after a retry SHALL be recorded as flaky in the weekly metric and surfaced in that run's test report. The system SHALL NOT retry beyond the bound until the run goes green.

#### Scenario: Pass on retry is recorded as flaky

- **WHEN** a test fails once and passes on retry 1 during a CI run
- **THEN** the job succeeds AND the test is recorded as flaky for the weekly metric
- **AND** the run's report shows the retry (the result is not silently green)

#### Scenario: Retries exhausted fail the job

- **WHEN** a test still fails after its 2 retries
- **THEN** the job fails (and blocks the merge after FASE 2 promotion)

#### Scenario: Local tiers do not mask flakiness

- **WHEN** a developer runs the suite locally or through `.husky/pre-push`
- **THEN** no retry masks an intermittent failure — retries exist only in CI

### Requirement: Quarantine share below 1 percent

The weekly report SHALL include the quarantine share (quarantined tests over total tests in the suite); the health target is below 1%, and reaching or exceeding 1% SHALL raise an advisory alert that requires triage without blocking the merge gate.

#### Scenario: Healthy quarantine share

- **WHEN** 4 of 620 tests are quarantined (0.64%)
- **THEN** the report shows a share below the target and no alert is raised

#### Scenario: Quarantine growth triggers triage alert

- **WHEN** quarantined tests reach 1% of the suite
- **THEN** the weekly job publishes an advisory alert (step summary / notification) requiring triage
- **AND** `ci-complete` and the PR merge gate are unaffected (the alert is not a blocking check)
