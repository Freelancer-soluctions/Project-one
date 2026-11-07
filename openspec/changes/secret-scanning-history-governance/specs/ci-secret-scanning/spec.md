# ci-secret-scanning Specification (delta)

## MODIFIED Requirements

### Requirement: Scheduled full-repository scan

The system SHALL run a Gitleaks scan over the entire repository history on a weekly schedule, independent of pull requests, so secrets committed in the past are detected. The scheduled scan SHALL fail closed: a detected secret fails the run so a leak blocks the pipeline, while the JSON and SARIF report artifacts are still uploaded so findings remain visible and auditable.

#### Scenario: Weekly scheduled scan executes

- **WHEN** the scheduled workflow trigger fires (weekly cron)
- **THEN** the workflow SHALL scan the full repository, including all historical commits (not only staged changes)
- **AND** the workflow SHALL assert that the checkout is not shallow before scanning, failing with an explicit message otherwise
- **AND** the workflow SHALL report all findings in the job output with commit hash and file path for each detected secret

#### Scenario: Secret found in historical commit

- **WHEN** the full-history scan detects a secret in a past commit
- **THEN** the workflow SHALL surface the finding with the commit SHA and file path in the created issue
- **AND** the workflow SHALL create or update an issue containing the rule, file and commit for each finding
- **AND** the workflow SHALL fail the scheduled run (fail-closed), blocking the pipeline until the secret is rotated or removed

#### Scenario: Reports still uploaded when the scan fails

- **WHEN** the Gitleaks scan step exits non-zero because findings were detected
- **THEN** the JSON and SARIF report steps SHALL still run (declared `if: always()`) and upload the report artifacts
- **AND** the artifacts SHALL remain downloadable for remediation even though the run failed

### Requirement: GitHub secret scanning enablement documented

The repository SHALL document how to enable GitHub native secret scanning and push protection so maintainers can activate the primary detection layer.

#### Scenario: Maintainer enables secret scanning from docs

- **WHEN** a maintainer follows the documented steps (Settings → Security → Secret scanning)
- **THEN** the documentation SHALL state that GitHub secret scanning is native and free for public repositories (no token or license required)
- **AND** the documentation SHALL state that private repositories require GitHub Advanced Security (paid) to enable secret scanning and push protection
- **AND** the documentation SHALL include steps to enable push protection so pushes containing secrets are blocked
- **AND** the documentation SHALL record the current operational state (enabled/disabled) of `secret_scanning` and `secret_scanning_push_protection`

#### Scenario: Secret pushed with push protection enabled

- **WHEN** push protection is enabled and a developer pushes a commit containing a recognized secret
- **THEN** GitHub SHALL block the push
- **AND** the developer SHALL receive guidance to rotate the secret and remove it from history

#### Scenario: Secret scanning alert raised

- **WHEN** GitHub secret scanning detects a secret already in the repository
- **THEN** an alert SHALL appear in the Security tab for maintainers to review
- **AND** the documentation SHALL describe how to respond to and dismiss alerts

## ADDED Requirements

### Requirement: Baseline and allowlist governance

The repository SHALL govern changes to the Gitleaks baseline (`.gitleaksignore`) and allowlists (`.gitleaks.toml`) through code ownership and justified entries.

#### Scenario: Change to baseline or allowlist

- **WHEN** a pull request modifies `.gitleaksignore` or `.gitleaks.toml`
- **THEN** the change SHALL require review by a code owner (CODEOWNERS)
- **AND** each allowlist entry SHALL include a reason and a review date

#### Scenario: Unjustified allowlist entry

- **WHEN** a pull request adds an allowlist entry without a reason
- **THEN** the review SHALL reject it

### Requirement: Scanner health and anti-skip

The pre-build security aggregator SHALL fail when a secret scan job is skipped on a pull request, so a skipped scanner never reports a clean result.

#### Scenario: Secret scan skipped on PR

- **WHEN** the `secrets` job is skipped during a pull request
- **THEN** `prebuild-security-complete` SHALL fail
- **AND** the merge SHALL remain blocked until the scan runs or is explicitly justified

### Requirement: Pre-release secret scan

The release pipeline SHALL run a full-history secret scan before publishing, failing the release if a secret outside the allowlist is present.

#### Scenario: Release with historical secret

- **WHEN** a release is triggered and the full-history scan detects a secret outside the allowlist
- **THEN** the release SHALL fail
- **AND** the finding SHALL be reported with rule, file and commit

### Requirement: Secret incident response

The repository SHALL document a runbook for responding to a detected secret, prioritizing revocation and rotation over history rewriting.

#### Scenario: Verified secret found

- **WHEN** a verified secret is detected in any scan
- **THEN** the runbook SHALL require revocation and rotation first (RR-1)
- **AND** the runbook SHALL define an audit of access/billing logs (RR-2)
- **AND** the runbook SHALL define a rotation deadline (D3 = 24 hours for a single-maintainer team)
- **AND** the runbook SHALL record each incident (date, affected secret without value, actions, actual deadline) as governance evidence
