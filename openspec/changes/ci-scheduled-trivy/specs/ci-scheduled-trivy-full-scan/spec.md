## Purpose

Provides a weekly scheduled Trivy full filesystem scan (severity HIGH/CRITICAL, SARIF output) and full `npm audit` over the merged state of `main`, extending the existing scheduled secret-scanning workflow so dependency and filesystem vulnerabilities published between PR activity are detected on a cadence without duplicating the CI-push scans.

## ADDED Requirements

### Requirement: Scheduled Trivy full scan trigger

The system SHALL run the Trivy full filesystem scan on the existing weekly scheduled security workflow (`.github/workflows/scheduled-security.yml`, cron `0 3 * * 1` — Monday 03:00 UTC), independent of pull request activity, so filesystem/dependency vulnerabilities present in the merged tree of `main` are detected between PRs. The scan SHALL run in audit mode (reporting findings without failing the scheduled run).

#### Scenario: Weekly cron fires

- **WHEN** the weekly cron schedule fires on the scheduled security workflow
- **THEN** the workflow SHALL start the Trivy full scan job against the current `main` branch state
- **AND** the scan SHALL execute with `scan-type: fs` over the repository root (`scan-ref: .`)
- **AND** the scan SHALL evaluate severity HIGH and CRITICAL vulnerabilities
- **AND** the run SHALL NOT fail solely for reporting vulnerabilities (audit mode)

#### Scenario: Manual dispatch

- **WHEN** a maintainer manually triggers the workflow via `workflow_dispatch`
- **THEN** the Trivy full scan job SHALL run with the same configuration as the scheduled run
- **AND** the run SHALL be executable with no required inputs

#### Scenario: Existing CI-push Trivy not duplicated

- **WHEN** the scheduled Trivy scan is defined
- **THEN** it SHALL NOT modify `.github/workflows/security.yml` (owner of the event-driven Trivy `dependency-scan` job in the sibling change `ci-security-enhance`)
- **AND** the scheduled scan SHALL remain the only Trivy scan on the weekly cadence

### Requirement: Trivy SARIF report uploaded to code scanning

The system SHALL produce the Trivy scan results in SARIF format and upload them so findings are surfaced in the GitHub Security tab (code scanning), reusing the workflow's existing `security-events: write` permission.

#### Scenario: Vulnerabilities found on schedule

- **WHEN** the Trivy full scan reports HIGH or CRITICAL vulnerabilities
- **THEN** the workflow SHALL generate a SARIF report of the findings
- **AND** the workflow SHALL upload the SARIF report via `github/codeql-action/upload-sarif@v4` with a distinct category (e.g. `trivy`) so the alerts appear in the Security tab separate from other tools
- **AND** the run SHALL complete successfully in audit mode with findings visible in the Security tab

#### Scenario: No vulnerabilities found

- **WHEN** the Trivy full scan finds no HIGH or CRITICAL vulnerabilities
- **THEN** the scan SHALL complete successfully
- **AND** the SARIF upload SHALL report zero alerts without failing

### Requirement: Scheduled npm audit on merged lockfile

The system SHALL run `npm audit --audit-level=high` on the root lockfile on the same weekly cadence, covering the monorepo's npm workspaces as declared in `package-lock.json` of `main`, so newly-published vulnerabilities in already-merged dependencies are surfaced. The audit SHALL run in report mode (not failing the run for findings).

#### Scenario: Vulnerable dependency in merged lockfile

- **WHEN** the scheduled npm audit scans `package-lock.json` of `main`
- **THEN** the audit SHALL report vulnerable packages, failing (exit code) only for findings at or above high severity
- **AND** the run SHALL NOT fail solely for reporting findings (audit mode)
- **AND** the findings SHALL be visible in the workflow run logs/annotations

#### Scenario: No known vulnerabilities

- **WHEN** the scheduled npm audit finds no vulnerabilities at or above high severity
- **THEN** the audit SHALL complete successfully
- **AND** the run SHALL report zero findings

#### Scenario: Existing CI-push npm audit not duplicated

- **WHEN** the scheduled npm audit is defined
- **THEN** it SHALL NOT modify `.github/workflows/ci-enterprise.yml` (owner of the event-driven `dependency-audit` job)
- **AND** the scheduled audit SHALL remain the only npm audit on the weekly cadence

### Requirement: Existing scheduled secret-scanning ownership preserved

The extension SHALL be additive to `.github/workflows/scheduled-security.yml`: the existing Gitleaks full-history scan jobs SHALL remain unchanged and the workflow SHALL remain the single owner of the Gitleaks full-history scan.

#### Scenario: Gitleaks jobs untouched

- **WHEN** the Trivy and npm audit jobs are added to the scheduled security workflow
- **THEN** the existing `gitleaks-full-scan` job and its JSON/SARIF upload steps SHALL remain present and unchanged
- **AND** the workflow SHALL NOT create or modify `.github/workflows/security-digest.yml` (owned by the sibling change `ci-scheduled-security-review`)
