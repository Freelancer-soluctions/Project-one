# scancode-license Specification

## Purpose

Governs license compliance for the prebuild security stage: confirms the deny-list based on the ERP's distribution model, defines a triage rule for `unknown` licenses, and promotes the ScanCode PR-diff job to blocking after calibration. Closes the gap between level 2 (managed) and level 3 (enterprise) for license compliance in the PRD's maturity model.

## ADDED Requirements

### Requirement: Deny-list confirmation by distribution model

The repository SHALL document the license deny-list decision in the existing canonical file `docs/learning/license-policy.md` (not a new file), based on the ERP's distribution model (SaaS, on-prem, or image delivery). The deny-list SHALL include at minimum: GPL-3.0, AGPL-3.0, SSPL-1.0, CC-BY-NC-4.0. The document SHALL state the distribution model and the rationale for each denied license. The executable deny-list lives in `.github/license-policy.yml` (config-file for `dependency-review`); the narrative doc and the yml SHALL stay in sync.

#### Scenario: Deny-list documented

- **WHEN** a maintainer reviews `docs/learning/license-policy.md`
- **THEN** the document SHALL state the ERP's distribution model
- **AND** the document SHALL list each denied license with its rationale
- **AND** the document SHALL reference `.github/license-policy.yml` as the executable source

#### Scenario: Distribution model changes

- **WHEN** the ERP's distribution model changes (e.g., from SaaS to on-prem)
- **THEN** `docs/learning/license-policy.md` SHALL be updated
- **AND** the deny-list in `.github/license-policy.yml` SHALL be reviewed and adjusted if needed
- **AND** the change SHALL require CODEOWNERS review

### Requirement: Unknown license triage rule

The system SHALL define a triage process for `unknown` licenses (`LicenseRef-scancode-unknown*`): each unknown license SHALL be tracked with a ticket and a 30-day deadline. The job reports a warning for unknown licenses in the initial rollout. The `license-compliance` main spec's invariant "unknown never blocks" SHALL be amended via a MODIFIED delta to reflect the escalation rule below.

#### Scenario: Unknown license found

- **WHEN** ScanCode detects an `unknown` license in a PR
- **THEN** the job SHALL report a warning initially (ticket with 30-day deadline)
- **AND** a ticket SHALL be created (manual or via issue template) with a 30-day deadline
- **AND** the finding SHALL appear in the job's artifact/log output (`pr-license-report.json`)
- **AND** if the unknown remains unresolved after 30 days, it escalates to blocking (exception expired in `security/exceptions.yml`)

#### Scenario: Unknown license unresolved after 30 days

- **WHEN** an unknown license remains unresolved after its 30-day deadline
- **THEN** the next PR scan SHALL escalate the finding to a blocking failure
- **AND** the exception SHALL be documented in `security/exceptions.yml` if the deadline needs extension

#### Scenario: 4 clean weeks achieved

- **WHEN** 4 consecutive weeks have no unresolved unknown licenses **and** the deny-list is confirmed
- **THEN** `scancode-license-pr-diff` SHALL be promoted to blocking (remove `continue-on-error`, make evaluate step fail on violations, add to aggregator `needs`)
- **AND** the row in `quality-gates.md` SHALL be updated from `advisory (PR, fase 1)` to `blocking (PR)`

### Requirement: Blocking from day one

The `scancode-license-pr-diff` job is blocking from day one: `continue-on-error: true` removed, evaluate step exits non-zero on deny-list violations, job name updated (no "advisory"/"FASE 1" labels). The job is in `prebuild-security-complete.needs` (ci.yml). Rollback SHALL be possible with a single revert. Note: the job was originally advisory (FASE 1) but promoted to blocking on 2026-11-10 after the Docker image fix (setup-uv + uv tool install).

#### Scenario: Promotion criteria met

- **WHEN** the deny-list is confirmed and the unknown triage rule is defined
- **AND** 4 consecutive weeks have no unresolved unknown licenses
- **THEN** `continue-on-error: true` is removed from `scancode-license-pr-diff`
- **AND** the evaluate step (ci.yml L1680-1685) is modified to exit non-zero on deny-list violations
- **AND** the job name is updated to drop "advisory"/"FASE 1" labels

#### Scenario: Rollback

- **WHEN** the promotion causes false positives in a PR
- **THEN** a single revert re-adds `continue-on-error: true` and reverts the evaluate step
- **AND** the regression is documented in `quality-gates.md`
