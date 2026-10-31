# Spec Delta

## Purpose

Provides a blocking CI enforcement point for the coverage floor that runs on full-suite coverage and propagates a non-zero verdict through the test aggregator. This capability does not itself bind the check to the GitHub ruleset.

## ADDED Requirements

### Requirement: Full-suite coverage enforcement point exists and is blocking

The project SHALL provide a CI enforcement point that evaluates the coverage floor against a full-suite coverage report and whose failure propagates to the test aggregator. The enforcement point SHALL NOT evaluate diff-scoped (partial) reports against global floors. Binding the resulting check as a required GitHub ruleset status is outside this capability.

#### Scenario: Full-suite run below floor fails the pipeline

- **WHEN** a full-suite coverage report is below any configured threshold
- **THEN** the enforcement point exits non-zero
- **AND** the failure propagates to the test aggregator
- **AND** the test aggregator reports failure
- **AND** the check is not represented as a GitHub ruleset requirement unless separately configured

#### Scenario: Diff-scoped run does not evaluate global floors

- **WHEN** the test run is diff-scoped (TIA)
- **THEN** the enforcement point does not compare partial totals against global floors
- **AND** the global floor is evaluated only on a full-suite report

### Requirement: Enforcement verdict is single and actionable

The enforcement point SHALL emit a verdict that names the workspace, the metric, the measured value, the threshold, and the offending file when a threshold is unmet. The verdict SHALL come from the same guard used by the local tier so local and CI verdicts cannot disagree.

#### Scenario: Threshold breach names the offender

- **WHEN** a threshold is unmet
- **THEN** the output names the workspace, metric, measured value, threshold, and offending file
- **AND** the exit code is non-zero

#### Scenario: Local and CI verdicts agree

- **WHEN** the same coverage report is evaluated locally and in CI
- **THEN** both verdicts are identical

### Requirement: Report integrity is enforced

The enforcement point SHALL verify that the coverage report exists, is non-empty, is derived from a completed (non-cancelled, non-skipped) test run, and that shard failures propagate. A report from a cancelled or skipped run SHALL NOT be treated as a valid source of truth.

#### Scenario: Empty report fails

- **WHEN** the coverage report has zero files
- **THEN** the enforcement point exits non-zero

#### Scenario: Cancelled upstream propagates

- **WHEN** an upstream test shard is cancelled
- **THEN** the enforcement point exits non-zero
