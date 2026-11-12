# security-exceptions-policy Specification

## Purpose

Governs security risk acceptance through a versioned exceptions file with owner, reason, and expiry, enforced by a CI gate that fails on expired exceptions. Documents remediation SLAs by severity, collects seven monthly security metrics, and provides runbooks for each failure type. Closes the gap between level 2 (managed) and level 3 (enterprise) in the PRD's maturity model for the prebuild security stage.

## Requirements

### Requirement: Versioned exceptions file

The repository SHALL maintain a versioned file `security/exceptions.yml` containing all accepted security risks. Each entry SHALL include: `id`, `tool`, `finding`, `scope`, `reason`, `owner`, `created`, `expires`, and `ticket`. Every suppression (inline or in file) SHALL reference an exception `id`.

#### Scenario: New exception added

- **WHEN** a pull request adds a suppression to any tool's configuration
- **THEN** a corresponding entry SHALL exist in `security/exceptions.yml`
- **AND** the entry SHALL include a non-empty `reason`, `owner`, and `expires` date
- **AND** the expiry date SHALL be at most 90 days from `created`

#### Scenario: Exception without reference is rejected

- **WHEN** a pull request adds an inline suppression without referencing an exception id
- **THEN** the review SHALL reject the change
- **AND** the `security-exceptions-check` job SHALL flag it if a cross-reference scan is implemented (see task 1.2); otherwise it is a review-time rule enforced via CODEOWNERS

### Requirement: CI gate on expired exceptions

The system SHALL run a job `security-exceptions-check` in substage 2C of `ci.yml` that parses `security/exceptions.yml` and fails if any exception has `expires` before the current date, is malformed, or has `expires` more than 90 days after `created`. The job is blocking from day one: no `continue-on-error`, wired to `prebuild-security-complete.needs`.

#### Scenario: Expired exception fails the gate

- **WHEN** the current date is after an exception's `expires` date
- **THEN** `security-exceptions-check` SHALL exit non-zero
- **AND** the job output SHALL name the expired exception id and its expiry date
- **AND** the failure blocks the merge (job is wired to `prebuild-security-complete.needs`, no `continue-on-error`)

#### Scenario: Malformed exceptions file fails the gate

- **WHEN** `security/exceptions.yml` has a syntax error or a missing required field
- **THEN** `security-exceptions-check` SHALL exit non-zero
- **AND** the error message SHALL identify the field or line that is invalid

#### Scenario: Exception exceeds 90-day cap

- **WHEN** an exception has `expires` more than 90 days after `created`
- **THEN** `security-exceptions-check` SHALL exit non-zero
- **AND** the error message SHALL name the exception id and state the 90-day maximum

#### Scenario: All exceptions valid

- **WHEN** all exceptions have valid schema and no expiry has passed
- **THEN** `security-exceptions-check` SHALL exit zero

### Requirement: Remediation SLA documentation

The repository SHALL document remediation SLAs in `security/SLA.md` with the following targets: Critical/KEV/exploit known: 7 days; High: 30 days; Medium: 90 days; Low: best effort. The document SHALL define clock-start rules (detection date), escalation triggers, interaction with exceptions (pending exception does not pause the clock; reassignment does not restart the clock), and active-exploitation acceleration (evidence of active exploitation triggers an accelerated deadline and immediate risk reassessment).

#### Scenario: SLA document exists and is complete

- **WHEN** a maintainer reviews `security/SLA.md`
- **THEN** the document SHALL contain the four severity tiers with their deadlines
- **AND** the document SHALL define clock-start, escalation, exception interaction (including reassignment and active-exploitation rules)

### Requirement: Monthly security metrics

The system SHALL run a monthly workflow `security-metrics.yml` that collects the seven PRD metrics (time to fix by severity, open SLA breaches, PRs blocked by security, false positives per month, active exceptions and earliest expiry, stage duration, tool-failure runs) and opens or updates an issue with the results. The workflow SHALL also annotate the review result in the repository (e.g., a metrics log under `security/metrics/` or a section in `docs/security/SECURITY.md`) so the evidence is retained for auditors.

#### Scenario: Monthly metrics issue created

- **WHEN** the monthly cron triggers
- **THEN** the workflow SHALL collect all seven metrics
- **AND** SHALL open or update a GitHub issue titled `[monthly-security-metrics]` with the results
- **AND** the issue SHALL include the count of active exceptions and the earliest expiry date

#### Scenario: Review result annotated in repo

- **WHEN** the monthly review completes
- **THEN** the result SHALL be recorded in a repo artifact (file or section) so the evidence is retained
- **AND** the artifact SHALL include the date, metrics summary, and reviewer

### Requirement: Security runbooks

The repository SHALL maintain runbooks under `docs/runbooks/security/` covering at minimum: exception expiry, secret incident response, CVE triage, tool failure, denied/unknown license, urgent fix blocked by a gate, and PR red due to new finding. Each runbook SHALL follow the format: situation, first step, next step.

#### Scenario: Runbook exists for each failure type

- **WHEN** a failure type listed in the PRD runbooks table occurs
- **THEN** a corresponding runbook SHALL exist under `docs/runbooks/security/`
- **AND** the runbook SHALL state the first step and the next step

### Requirement: CODEOWNERS for security directory

The `.github/CODEOWNERS` file SHALL include an entry for `/security/` requiring review by the appropriate code owner (per the repo's team convention, e.g., `devops-team` or the security maintainer), appended at the end of the file (respecting last-match-wins). Changes to exceptions, SLA, or policies pass through review.

#### Scenario: Change to security directory requires review

- **WHEN** a pull request modifies any file under `security/`
- **THEN** the change SHALL require review by the code owner defined in CODEOWNERS

### Requirement: Single-maintainer accepted risk

The repository SHALL document in `docs/security/SECURITY.md` that the lack of separation of duties (owner and approver are the same person) is an accepted risk, compensated by exception expiry, CODEOWNERS, and visible exception count. This satisfies the PRD's "Un solo mantenedor" section.

#### Scenario: Accepted risk documented

- **WHEN** a maintainer reviews `docs/security/SECURITY.md`
- **THEN** the document SHALL state that separation of duties is not achieved
- **AND** the document SHALL list the compensating controls (expiry, CODEOWNERS, visible count)
- **AND** the document SHALL note that a second account resolves this permanently

### Requirement: Emergency bypass governance

The repository SHALL document in the runbook `docs/runbooks/security/urgent-fix-blocked.md` that if a gate blocks an urgent fix, the bypass is limited to one role, is recorded, and is followed by a formal exception. The check is never disabled.

#### Scenario: Emergency bypass documented

- **WHEN** a maintainer reads the urgent-fix-blocked runbook
- **THEN** the runbook SHALL state that bypass is limited to one role
- **AND** the runbook SHALL state that the bypass is recorded and followed by a formal exception
- **AND** the runbook SHALL state that the check is never disabled
