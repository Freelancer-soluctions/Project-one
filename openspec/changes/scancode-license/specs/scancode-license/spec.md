# scancode-license Specification

## Purpose

Governs license compliance for the prebuild security stage: confirms the deny-list based on the ERP's distribution model, defines a triage rule for `unknown` licenses, and promotes the ScanCode PR-diff job to blocking after calibration. Closes the gap between level 2 (managed) and level 3 (enterprise) for license compliance in the PRD's maturity model.

## ADDED Requirements

### Requirement: Deny-list confirmation by distribution model

The repository SHALL document the license deny-list in `security/license-policy.md` based on the ERP's distribution model (SaaS, on-prem, or image delivery). The deny-list SHALL include at minimum: GPL-3.0, AGPL-3.0, SSPL-1.0, CC-BY-NC-4.0. The document SHALL state the distribution model and the rationale for each denied license.

#### Scenario: Deny-list documented

- **WHEN** a maintainer reviews `security/license-policy.md`
- **THEN** the document SHALL state the ERP's distribution model
- **AND** the document SHALL list each denied license with its rationale
- **AND** the document SHALL reference the `deny-licenses` configuration in `dependency-review` (ci.yml)

#### Scenario: Distribution model changes

- **WHEN** the ERP's distribution model changes (e.g., from SaaS to on-prem)
- **THEN** `security/license-policy.md` SHALL be updated
- **AND** the deny-list SHALL be reviewed and adjusted if needed
- **AND** the change SHALL require CODEOWNERS review

### Requirement: Unknown license triage rule

The system SHALL define a triage SLA for `unknown` licenses (`LicenseRef-scancode-unknown*`): each unknown license SHALL generate a ticket with a 30-day deadline. After 4 consecutive weeks with no unresolved unknowns, the `scancode-license-pr-diff` job SHALL be promoted to blocking.

#### Scenario: Unknown license found

- **WHEN** ScanCode detects an `unknown` license in a PR
- **THEN** the job SHALL report a warning (not a failure in FASE 1)
- **AND** a ticket SHALL be created with a 30-day deadline
- **AND** the finding SHALL appear in the job's SARIF upload

#### Scenario: Unknown license unresolved after 30 days

- **WHEN** an unknown license remains unresolved after its 30-day deadline
- **THEN** the next PR scan SHALL escalate the finding to a blocking failure
- **AND** the exception SHALL be documented in `security/exceptions.yml` if the deadline needs extension

#### Scenario: 4 clean weeks achieved

- **WHEN** 4 consecutive weekly scans have no unresolved unknown licenses
- **THEN** `scancode-license-pr-diff` SHALL be promoted to blocking (remove `continue-on-error`, add to aggregator `needs`)
- **AND** the row in `quality-gates.md` SHALL be updated from `advisory (PR, fase 1)` to `blocking (PR)`

### Requirement: Promotion to blocking

The `scancode-license-pr-diff` job SHALL be promoted to blocking after the deny-list is confirmed and the unknown triage rule is defined. Promotion SHALL follow the gradual pattern: remove `continue-on-error: true`, add to `prebuild-security-complete.needs`, update `quality-gates.md`. Rollback SHALL be possible with a single revert.

#### Scenario: Promotion criteria met

- **WHEN** the deny-list is confirmed and the unknown triage rule is defined
- **AND** 4 consecutive weeks have no unresolved unknown licenses
- **THEN** `continue-on-error: true` is removed from `scancode-license-pr-diff`
- **AND** the job is added to `prebuild-security-complete.needs`
- **AND** the job name is updated to drop "advisory"/"FASE 1" labels

#### Scenario: Rollback

- **WHEN** the promotion causes false positives in a PR
- **THEN** a single revert re-adds `continue-on-error: true` and removes the job from `needs`
- **AND** the regression is documented in `quality-gates.md`
