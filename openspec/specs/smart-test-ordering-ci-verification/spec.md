# smart-test-ordering-ci-verification Specification

## Purpose

Checklist de verificación end-to-end del sequencer fail-first en GitHub Actions.

## Requirements

### Requirement: End-to-end verification of fail-first ordering in CI

The three pending-CI verifications of `smart-test-ordering` SHALL be executed in a real PR and recorded with evidence before the change is closed.

#### Scenario: History restores and reorders in a real PR

- **WHEN** a PR run finds a `tia-history` artifact from a recent full-suite run
- **THEN** the "Restore ordering history" step completes before the test step and historically failing files run first

#### Scenario: TTFF metric is published for both failing and green runs

- **WHEN** the metric resolves in a failing run and in a green run
- **THEN** the step summary shows TTFF + hit-rate in the first case and "no first failure" in the second, and a broken script marks the metric unavailable without failing the job

#### Scenario: Quarantine is not resurrected by ordering

- **WHEN** a quarantined file has failures in ordering history
- **THEN** it does not run in the blocking PR run
