## Purpose

Detect secrets in the repository both at pull request time and on a weekly scheduled full-history scan, using license-free tooling (GitHub native secret scanning plus open-source Gitleaks) so CI never blocks on a missing commercial license secret.

## ADDED Requirements

### Requirement: PR-time secret detection
The system SHALL scan the pull request diff for secrets on every PR targeting `main`, gating the merge when a new secret is detected in the changed lines.

#### Scenario: PR introduces a secret in the diff
- **WHEN** a pull request targeting `main` contains a detectable secret in its diff
- **THEN** the CI secrets job SHALL run a Gitleaks scan scoped to the PR diff range (`base.sha..head.sha`)
- **AND** the job SHALL fail the check, blocking merge until the secret is removed or rotated
- **AND** the failure SHALL include the detected secret type and file location for remediation

#### Scenario: PR without secrets passes
- **WHEN** a pull request targeting `main` contains no detectable secrets
- **THEN** the CI secrets job SHALL complete successfully
- **AND** the check SHALL be reported as passing

#### Scenario: Existing secret committed to history
- **WHEN** a secret already exists in the repository history but is not part of the current PR diff range
- **THEN** the PR-time scan SHALL NOT fail the PR solely for the historical secret
- **AND** the historical secret SHALL be reported by the scheduled full-repository scan instead

### Requirement: Scheduled full-repository scan
The system SHALL run a Gitleaks scan over the entire repository history on a weekly schedule, independent of pull requests, so secrets committed in the past are detected.

#### Scenario: Weekly scheduled scan executes
- **WHEN** the scheduled workflow trigger fires (weekly cron)
- **THEN** the workflow SHALL scan the full repository, including all historical commits (not only staged changes)
- **AND** the workflow SHALL report all findings in the job output with commit hash and file path for each detected secret

#### Scenario: Secret found in historical commit
- **WHEN** the full-history scan detects a secret in a past commit
- **THEN** the workflow SHALL surface the finding with the commit SHA and file path
- **AND** the workflow SHALL NOT fail the scheduled run merely for reporting a finding (audit mode), so findings remain visible without breaking automation

### Requirement: License-free secret scanning operation
The secret scanning workflows SHALL operate without requiring any commercial license secret, so the pipeline never fails due to missing licensed tooling.

#### Scenario: GIT_LEAKS secret not configured
- **WHEN** the `GIT_LEAKS` secret is not configured in the repository
- **THEN** the CI secrets job SHALL still execute and pass using GitHub native secret scanning and open-source Gitleaks
- **AND** the job SHALL emit a warning that licensed scanning is unavailable, rather than failing

#### Scenario: GIT_LEAKS secret configured
- **WHEN** the `GIT_LEAKS` secret is configured in the repository
- **THEN** the CI secrets job SHALL still run the same license-free scans
- **AND** the presence of the license SHALL NOT be required for the job to succeed

### Requirement: GitHub secret scanning enablement documented
The repository SHALL document how to enable GitHub native secret scanning and push protection so maintainers can activate the primary detection layer.

#### Scenario: Maintainer enables secret scanning from docs
- **WHEN** a maintainer follows the documented steps (Settings → Security → Secret scanning)
- **THEN** the documentation SHALL state that GitHub secret scanning is native and free for public repositories (no token or license required)
- **AND** the documentation SHALL state that private repositories require GitHub Advanced Security (paid) to enable secret scanning and push protection
- **AND** the documentation SHALL include steps to enable push protection so pushes containing secrets are blocked

#### Scenario: Secret pushed with push protection enabled
- **WHEN** push protection is enabled and a developer pushes a commit containing a recognized secret
- **THEN** GitHub SHALL block the push
- **AND** the developer SHALL receive guidance to rotate the secret and remove it from history

#### Scenario: Secret scanning alert raised
- **WHEN** GitHub secret scanning detects a secret already in the repository
- **THEN** an alert SHALL appear in the Security tab for maintainers to review
- **AND** the documentation SHALL describe how to respond to and dismiss alerts
