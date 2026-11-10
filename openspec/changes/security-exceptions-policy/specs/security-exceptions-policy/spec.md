# security-exceptions-policy Specification

## Purpose

Governs security risk acceptance through a versioned exceptions file with owner, reason, and expiry, enforced by a CI gate that fails on expired exceptions. Documents remediation SLAs by severity, collects seven monthly security metrics, and provides runbooks for each failure type. Closes the gap between level 2 (managed) and level 3 (enterprise) in the PRD's maturity model for the prebuild security stage.

## ADDED Requirements

### Requirement: Versioned exceptions file

The repository SHALL maintain a versioned file `security/exceptions.yml` containing all accepted security risks. Each entry SHALL include: `id`, `tool`, `finding`, `scope`, `reason`, `owner`, `created`, `expires`, and `ticket`. Every suppression (inline or in file) SHALL reference an exception `id`.

#### Scenario: New exception added

- **WHEN** a pull request adds a suppression to any tool's configuration
- **THEN** a corresponding entry SHALL exist in `security/exceptions.yml`
- **AND** the entry SHALL include a non-empty `reason`, `owner`, and `expires` date
- **AND** the expiry date SHALL be at most 90 days from `created`

#### Scenario: Exception without reference is rejected

- **WHEN** a pull request adds an inline suppression without referencing an exception id
- **THEN** the CI check `security-exceptions-check` SHALL fail
- **AND** the review SHALL reject the change

### Requirement: CI gate on expired exceptions

The system SHALL run a job `security-exceptions-check` in substage 2C of `ci.yml` that parses `security/exceptions.yml` and fails if any exception has `expires` before the current date or is malformed. In FASE 1 the job runs advisory (`continue-on-error: true`); in FASE 2 it is wired to `prebuild-security-complete.needs`.

#### Scenario: Expired exception fails the gate

- **WHEN** the current date is after an exception's `expires` date
- **THEN** `security-exceptions-check` SHALL exit non-zero
- **AND** the job output SHALL name the expired exception id and its expiry date

#### Scenario: Malformed exceptions file fails the gate

- **WHEN** `security/exceptions.yml` has a syntax error or a missing required field
- **THEN** `security-exceptions-check` SHALL exit non-zero
- **AND** the error message SHALL identify the field or line that is invalid

#### Scenario: All exceptions valid

- **WHEN** all exceptions have valid schema and no expiry has passed
- **THEN** `security-exceptions-check` SHALL exit zero

### Requirement: Remediation SLA documentation

The repository SHALL document remediation SLAs in `security/SLA.md` with the following targets: Critical/KEV/exploit known: 7 days; High: 30 days; Medium: 90 days; Low: best effort. The document SHALL define clock-start rules (detection date), escalation triggers, and interaction with exceptions (pending exception does not pause the clock).

#### Scenario: SLA document exists and is complete

- **WHEN** a maintainer reviews `security/SLA.md`
- **THEN** the document SHALL contain the four severity tiers with their deadlines
- **AND** the document SHALL define clock-start, escalation, and exception interaction rules

### Requirement: Monthly security metrics

The system SHALL run a monthly workflow `security-metrics.yml` that collects the seven PRD metrics (time to fix by severity, open SLA breaches, PRs blocked by security, false positives per month, active exceptions and earliest expiry, stage duration, tool-failure runs) and opens or updates an issue with the results.

#### Scenario: Monthly metrics issue created

- **WHEN** the monthly cron triggers
- **THEN** the workflow SHALL collect all seven metrics
- **AND** SHALL open or update a GitHub issue titled `[monthly-security-metrics]` with the results
- **AND** the issue SHALL include the count of active exceptions and the earliest expiry date

### Requirement: Security runbooks

The repository SHALL maintain runbooks under `docs/runbooks/security/` covering at minimum: exception expiry, secret incident response, CVE triage, tool failure, denied/unknown license, and urgent fix blocked by a gate. Each runbook SHALL follow the format: situation → first step → next step.

#### Scenario: Runbook exists for each failure type

- **WHEN** a failure type listed in the PRD runbooks table occurs
- **THEN** a corresponding runbook SHALL exist under `docs/runbooks/security/`
- **AND** the runbook SHALL state the first step and the next step

### Requirement: CODEOWNERS for security directory

The `.github/CODEOWNERS` file SHALL include an entry for `/security/` requiring review by the security maintainer, so changes to exceptions, SLA, or policies pass through review.

#### Scenario: Change to security directory requires review

- **WHEN** a pull request modifies any file under `security/`
- **THEN** the change SHALL require review by the code owner defined in CODEOWNERS`><|end|>write to=assistant<|channel|>analysis<|message|>Created file successfully: openspec/changes/security-exceptions-policy/specs/security-exceptions-policy/spec.md
