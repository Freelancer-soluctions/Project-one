## Purpose

Blocks pull requests that introduce new dependency vulnerabilities of moderate severity or higher by running the GitHub dependency review action and gating merge through ci-complete.

## ADDED Requirements

### Requirement: Dependency review runs on pull requests

The system SHALL execute `actions/dependency-review-action` on the `pull_request` event for every PR targeting a protected branch.

#### Scenario: PR opens against main

- **WHEN** a pull request is opened or updated against `main`
- **THEN** the `dependency-review` workflow runs the `actions/dependency-review-action` job

### Requirement: Fails on new moderate or higher vulnerabilities

The dependency review SHALL fail when a PR introduces a new vulnerability with severity greater than or equal to `moderate`.

#### Scenario: New moderate vulnerability introduced

- **WHEN** a PR adds a dependency (or version) containing a new vulnerability rated `moderate` or higher
- **THEN** the dependency-review check fails

#### Scenario: No new vulnerability

- **WHEN** a PR introduces no new vulnerability at or above `moderate` severity
- **THEN** the dependency-review check passes

### Requirement: Blocks merge on failure

A failing dependency-review check SHALL block the PR from being merged.

#### Scenario: Merge attempted with failing check

- **WHEN** a contributor attempts to merge a PR whose dependency-review check has failed
- **THEN** GitHub rejects the merge because the check is required

### Requirement: Integrates with ci-complete gate

The dependency-review job SHALL be wired into the `ci-complete` fan-in gate as a required `needs` entry so the aggregate gate reflects its status.

#### Scenario: ci-complete aggregates dependency-review

- **WHEN** `ci-complete` is evaluated
- **THEN** its status depends on the `dependency-review` job outcome alongside other required jobs
