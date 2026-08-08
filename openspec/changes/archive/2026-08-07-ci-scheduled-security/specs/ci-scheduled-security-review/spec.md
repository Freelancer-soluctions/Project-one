## Purpose

Provides a weekly scheduled security review of the repository's merged dependency state: it re-runs SBOM generation and dependency vulnerability/license scanning on a cron schedule (independent of PR activity), and produces a human-readable security digest artifact that consolidates dependency counts, vulnerable packages, license summaries, and secret-scanning findings for maintainers.

## ADDED Requirements

### Requirement: Weekly scheduled security review trigger

The system SHALL run the scheduled security review on a weekly cron schedule, independent of pull request activity, so vulnerabilities introduced into merged dependencies between PRs are detected. The schedule SHALL reuse the same trigger pattern as the existing scheduled secret-scanning workflow (cron weekly + `workflow_dispatch`), without duplicating or modifying that workflow's file.

#### Scenario: Weekly cron fires

- **WHEN** the weekly cron schedule fires
- **THEN** the `security-digest` workflow SHALL start a run
- **AND** the run SHALL execute the SBOM, vulnerability review, and digest jobs against the current `main` branch state

#### Scenario: Manual dispatch

- **WHEN** a maintainer manually triggers the workflow via `workflow_dispatch`
- **THEN** the workflow SHALL run the same jobs as the scheduled run
- **AND** the run SHALL be executable with no required inputs

#### Scenario: Existing scheduled secret-scanning workflow not duplicated

- **WHEN** the scheduled security review workflow is defined
- **THEN** it SHALL NOT create or modify `.github/workflows/scheduled-security.yml` or `.github/workflows/security.yml` (owned by sibling changes `ci-secret-scanning` and `ci-security-enhance`)
- **AND** the scheduled secret-scanning workflow SHALL remain the single owner of the Gitleaks full-history scan

### Requirement: Scheduled SBOM generation on merged state

The workflow SHALL re-run SBOM generation in CycloneDX JSON format on the scheduled cadence, covering the monorepo's npm workspaces as declared in the root lockfile, so the SBOM reflects the merged dependency state of `main` rather than only PR-time states.

#### Scenario: Scheduled SBOM run

- **WHEN** the scheduled workflow runs the SBOM job
- **THEN** the SBOM SHALL be generated in CycloneDX JSON format using `anchore/sbom-action@v0.17.2`
- **AND** the SBOM SHALL reflect the dependencies declared in `package-lock.json` of `main`
- **AND** the SBOM SHALL be available to the digest job for analysis

#### Scenario: SBOM uploaded for traceability

- **WHEN** the SBOM job generates the SBOM file
- **THEN** the workflow SHALL upload it as a workflow artifact
- **AND** the artifact SHALL be retrievable for auditing

### Requirement: Scheduled dependency vulnerability and license review

The workflow SHALL scan the merged dependency tree for known vulnerabilities on the weekly cadence, independent of PRs, so newly-published vulnerabilities in already-merged dependencies are surfaced. The license summary SHALL be derived from the SBOM components (CycloneDX metadata), not from a separate license scanner.

#### Scenario: Vulnerable package in merged dependencies

- **WHEN** the vulnerability review job scans `package-lock.json` on the scheduled cadence
- **THEN** the scan SHALL report each known-vulnerable package with its severity and affected version
- **AND** the findings SHALL be written to a machine-readable report (JSON) for the digest job
- **AND** the workflow run SHALL NOT fail solely for reporting findings (audit-style, consistent with the sibling scheduled secret-scanning)

#### Scenario: No known vulnerabilities found

- **WHEN** the vulnerability review job finds no known vulnerabilities in the merged dependencies
- **THEN** the scan SHALL complete successfully
- **AND** the report SHALL indicate zero findings

#### Scenario: License summary derived

- **WHEN** the digest job processes the SBOM and vulnerability report
- **THEN** the digest SHALL include a license summary derived from the SBOM components
- **AND** the digest SHALL flag any license matching the project's documented deny-list (static constant `LICENSE_DENY_LIST` in `generate-security-digest.mjs`, documented in `docs/security/SECURITY.md`)
- **AND** the deny-list SHALL contain 15 entries covering the core GPL/LGPL/AGPL family (base versions plus their `-+` "or later" variants for GPL and AGPL, and base versions for LGPL)
- **AND** the deny-list SHALL intentionally omit the `-+` suffix variants `LGPL-2.0+`, `LGPL-2.1+`, and `LGPL-3.0+` present in the sibling dependency-review-action default deny-list — an accepted scope reduction: the base LGPL family (LGPL-2.0, LGPL-2.1, LGPL-3.0) is already covered, and the `-+` variants are omitted to avoid over-blocking

### Requirement: Human-readable security digest generation

The workflow SHALL generate a markdown security digest that consolidates the SBOM dependency counts, vulnerable packages, license summary, and (when available) secret-scanning findings, uploaded as a workflow artifact and optionally posted as a PR summary comment when actionable.

#### Scenario: Digest generated from scheduled run

- **WHEN** the digest job runs after the SBOM and vulnerability review complete
- **THEN** the digest SHALL contain a markdown summary including: total dependency count, count of vulnerable packages with severity breakdown, license summary, and timestamp
- **AND** the digest SHALL be uploaded as a workflow artifact via `actions/upload-artifact@v4`

#### Scenario: Secret-scanning findings cross-referenced

- **WHEN** the scheduled secret-scanning workflow has produced a `gitleaks-report` artifact in its latest weekly run
- **THEN** the digest job SHALL attempt to include a summary of those secret findings in the digest
- **AND** the digest SHALL note when the secret report is unavailable instead of failing

#### Scenario: Actionable digest posted as PR comment

- **WHEN** the digest contains actionable findings (critical/high vulnerabilities or license incompatibilities) and the workflow run was dispatched with the optional `pull_request_number` input
- **THEN** the workflow SHALL post a summary comment on that pull request
- **AND** the comment SHALL reference the artifact for full details

### Requirement: Digest and reports surfaced without breaking automation

The scheduled run SHALL surface findings visibly (artifacts, digest, optional comment) while keeping the run green in audit mode, so automation (e.g. notifications, subsequent runs) is not broken by reported findings.

#### Scenario: Vulnerabilities found on schedule

- **WHEN** the scheduled run detects vulnerabilities
- **THEN** the run SHALL complete successfully (audit mode)
- **AND** the findings SHALL be visible via the uploaded digest and JSON report artifacts

#### Scenario: Digest job failure handling

- **WHEN** the digest generation job fails (e.g. missing input file)
- **THEN** the workflow SHALL report the failure on the run
- **AND** the previously generated SBOM and vulnerability report artifacts SHALL remain available for manual inspection
