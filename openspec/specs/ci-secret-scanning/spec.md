# ci-secret-scanning Specification

## Purpose

Detect secrets in the repository both at pull request time and on a weekly scheduled full-history scan, using license-free tooling (GitHub native secret scanning plus open-source Gitleaks) so CI never blocks on a missing commercial license secret.

## Requirements

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
- **AND** the documentation SHALL record the current operational state (enabled/disabled) of `secret_scanning` and `secret_scanning_push_protection`

#### Scenario: Secret pushed with push protection enabled

- **WHEN** push protection is enabled and a developer pushes a commit containing a recognized secret
- **THEN** GitHub SHALL block the push
- **AND** the developer SHALL receive guidance to rotate the secret and remove it from history

#### Scenario: Secret scanning alert raised

- **WHEN** GitHub secret scanning detects a secret already in the repository
- **THEN** an alert SHALL appear in the Security tab for maintainers to review
- **AND** the documentation SHALL describe how to respond to and dismiss alerts

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
- **AND** the merge SHALL remain blocked **once `Secret Detection` (and/or `Prebuild Security Complete`) is added to the ruleset `required_status_checks` (change `secret-scanning` task 6.2, pending/declined by owner as of 2026-11-08)**; until then the failure surfaces in the aggregator but is not enforced at the branch-protection level

#### Scenario: Merge queue runs the scan instead of skipping it

- **WHEN** the pipeline runs for a `merge_group` event
- **THEN** the `secrets` job SHALL run against the merge group base/head range instead of being skipped
- **AND** the anti-skip rule SHALL apply only to the `secrets` job, leaving `dependency-review` and
  `scancode-license-pr-diff` governed by their own conditions (intentional scope, not an oversight)

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

## Notes

- **Operational status (verified 2026-11-08 via `gh workflow list --all`):** both implementing workflows are now
  **`active`** — `Security Pipeline` (security.yml, id 243939664) and `Scheduled Security Scan`
  (scheduled-security.yml, id 328325417). The previous note (2026-09-23, `disabled_manually`) is obsolete. Also
  verified the same day: GitHub native `secret_scanning` and `secret_scanning_push_protection` are **enabled** on the
  public repo (`security_and_analysis` API), so the native layer is live in addition to the Gitleaks layers.
- **Consequence (superseded 2026-11-08):** with both workflows active, the PR-time gate (R1) and the weekly
  full-history scan (R2) **do execute**. Historical note (2026-10-19, change `sast-shift-left-hooks-parity`), kept
  for context — at that time they did not run, and protection relied on: Actual secret protection is layered: **Gitleaks staged scan in the `pre-commit` hook** (the earliest possible point — a committed secret means rewriting history; layer L1 per `docs/pre-merge-gates-governance.md` §4.6), **diff-scoped SAST (which includes Semgrep `p/secrets`) in the `pre-push` hook** (layer L2) and in the **active `ci.yml` `sast` job** (`SAST_MODE=ci node scripts/sast-diff.mjs`, FASE 1 advisory with a 14-day report artifact). The SAST layers complement, not replace, the staged Gitleaks gate — SAST needs a baseline commit and therefore cannot live in `pre-commit`.
- **Re-enablement path:** `gh workflow enable "Security Pipeline" && gh workflow enable "Scheduled Security Scan"` (or Settings → Actions → Workflows). No YAML changes required.
- **Merge-blocking caveat:** `Secret Detection` is still not in the branch ruleset's `required_status_checks` (only
  the governance checks are) — R1's "blocking merge" holds at the check level and, since change
  `secret-scanning-history-governance`, at the aggregator level: `prebuild-security-complete` fails when the job is
  `skipped` in a PR and the job now also runs on `merge_group` (the ruleset binding is owned by change
  `secret-scanning` tasks 6.x).
- **Anti-skip + governance (2026-11-08, change `secret-scanning-history-governance`):** a skipped `secrets` job in a
  PR fails the security aggregator; `.gitleaksignore` / `.gitleaks.toml` changes require a devops code owner
  (`CODEOWNERS` + ruleset `require_code_owner_review=true`); the scheduled scan asserts a non-shallow checkout before
  scanning, pastes rule/file/commit into the failure issue, and the release pipeline runs a full-history scan before
  publishing. Response/rotation procedure: `docs/security/secret-incident-response.md`.
