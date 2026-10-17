# smart-test-ordering Specification

## Purpose

Ordena la suite fail-first más allá del sequencer base de `tia-hardening`: historial de fallos
disponible en CI (no solo en caché local), ranking honesto que degrada en lugar de ascender flaky
y cuarentena, métrica TTFF/first-fail visible en el step summary, auditoría reproducible de
order-dependence con seed fijado y paridad de orden en el tier local — sin tocar los safety nets
(nocturno completo, guard D7, cuarentena, pre-push).

## Requirements

### Requirement: Ordering history available to fail-first runs in CI

When a CI unit test job runs with fail-first ordering active, the recent-failure history
published as an artifact by full-suite/nightly runs SHALL be restored, best-effort, to the exact
location the sequencer reads before the test step starts, so the order in CI is data-driven
instead of silently degrading to the no-history default. Missing, stale or corrupt history SHALL
degrade to the deterministic order without failing, blocking or emptying the job (the ordering
layer never gates), and the history window N SHALL be documented with its current value and
changed only with recorded metric evidence.

#### Scenario: History artifact restores before the test step

- **WHEN** a CI unit test job finds a `tia-history` artifact published by a recent full-suite run
- **THEN** the history file exists at the sequencer's read path before the test command executes
- **AND** files with recorded failures in the window run first in that job's log

#### Scenario: No history degrades deterministically

- **WHEN** the artifact is absent (fresh repo, retention expired) or its JSON is corrupt
- **THEN** the job runs with the deterministic documented order and the job outcome is unchanged
- **AND** an advisory notice records that ordering ran without history (never a failure, never "0 tests")

#### Scenario: History window is documented

- **WHEN** the ordering history window N is inspected in the project documentation
- **THEN** it states the current value and the metric evidence used to tune it

### Requirement: Flaky-aware ranking degradation

The fail-first ranking SHALL NOT promote a test file that is flagged as flaky or listed in
quarantine above a deterministically failing file with comparable recent failures: flaky evidence
degrades a file in the ranking, it never ascends it. Quarantine exclusions of blocking PR runs
SHALL keep happening by exclusion after selection — ordering SHALL NOT resurrect a quarantined
test into a blocking PR run — and when no flaky evidence is available the ranking SHALL remain
exactly the failure-count order (degradation is best-effort, never a new failure mode).

#### Scenario: Flaky file degrades in the ranking

- **WHEN** two files have the same recent failure count and one is flagged flaky in the latest
  flaky-retries evidence while the other fails deterministically
- **THEN** the deterministic file runs first and the flaky file is ranked below it

#### Scenario: Quarantined test is not resurrected by ordering

- **WHEN** a file listed in `.github/flaky-quarantine.yml` has failures in the ordering history
- **THEN** the ranking does not promote it, and the blocking PR run still excludes it through the
  quarantine list applied after selection (`quarantine-exclude.mjs` unchanged)

#### Scenario: Absent flaky evidence changes nothing

- **WHEN** no flaky-retries evidence is available to the ranking
- **THEN** the order is the plain failure-count ordering (stable tie-break) with no error

### Requirement: First-failure (TTFF) metric published advisory

Each workspace test job SHALL publish to the GitHub step summary an advisory first-failure
metric: the time-to-first-failure in wall-clock and as the percentage of the suite executed
before the first red result, the share of failures surfaced in the first X% of the run, and the
historial hit-rate (how many of the observed failures were predicted by the ordering history).
Runs without any failure SHALL publish an explicit "no first failure" value instead of omitting
the metric, and any failure of the measurement itself SHALL NOT flip the job result (advisory,
same non-gating contract as the TIA shadow metric it sits next to).

#### Scenario: Seeded failure surfaces early and is measured

- **WHEN** a run fails and the metric resolves
- **THEN** the step summary shows TTFF (wall-clock and % of suite) and the failing file
- **AND** the summary shows the hit-rate against the ordering history for that run

#### Scenario: Green run still reports

- **WHEN** a run completes with zero failures
- **THEN** the summary publishes an explicit "no first failure" value (metric present, not empty)

#### Scenario: Measurement failure never gates

- **WHEN** the metric script errors (missing results JSON, malformed data)
- **THEN** the job result and the executed test run are unchanged and the summary marks the metric unavailable

### Requirement: Order-dependence audit with recorded seed

The system SHALL provide an order-dependence audit that runs the suite under a shuffle with a
fixed, recorded seed, reproducible on any machine (same seed ⇒ same order), available as a local
command and as a scheduled advisory workflow whose failures surface order-dependence without
becoming a required check. The audit SHALL NOT be the default behavior of the nightly full-suite
run or of blocking PR runs: the nightly keeps executing the complete suite in natural order (no
imposed historical ordering, no shuffle) so order-dependence bugs stay visible in the safety tier.

#### Scenario: Same seed reproduces the order

- **WHEN** the audit runs twice with the recorded seed
- **THEN** both runs execute the files in the same permutation and a test failing only in some
  permutations is flagged as order-dependent

#### Scenario: Nightly stays the natural-order safety tier

- **WHEN** the scheduled full-suite workflow executes
- **THEN** it runs without shuffle and without historical ordering (its opt-out remains in effect)
- **AND** no audit result is required for it to run

#### Scenario: Audit is advisory

- **WHEN** the scheduled audit detects order-dependence
- **THEN** the workflow run shows the failure for triage and no PR merge gate depends on it

### Requirement: Local ordering parity without hook changes

Local scoped test runs SHALL receive the same fail-first ordering contract as CI through the
shared Vitest configuration, and this capability SHALL NOT modify `.husky/pre-push` or the
selection semantics of the local pre-push tier (owned by `pre-push-scoped-testing`): ordering
changes only the sequence of the same tests, never which tests the hook runs.

#### Scenario: Developer sees historically failing file first locally

- **WHEN** a developer runs the local scoped suite with local ordering history present
- **THEN** the historically failing file runs first, matching the CI ordering contract
- **AND** `git diff .husky/pre-push` is empty

#### Scenario: Selection contract untouched

- **WHEN** this change is applied
- **THEN** the pre-push hook still runs the same selected tests as before (ordering only)
