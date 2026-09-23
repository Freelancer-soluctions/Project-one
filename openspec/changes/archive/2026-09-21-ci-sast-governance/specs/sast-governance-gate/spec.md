## Purpose

Provides SAST (Static Application Security Testing) as a CI governance gate using Semgrep in `.github/workflows/ci.yml`. Scans only the PR diff for ERROR-severity findings using inline packs (no local config dependency). Non-blocking in F1, blocking in F2 after ruleset binding.

## ADDED Requirements

### Requirement: SAST job runs on every pull request

The system SHALL execute a Semgrep SAST scan as a job named `SAST (Semgrep)` in `.github/workflows/ci.yml` on every `pull_request` event targeting `main`.

#### Scenario: PR triggers SAST scan

- **WHEN** a pull request is opened, synchronized, or reopened targeting `main`
- **THEN** the `sast` job in `ci.yml` executes using the `semgrep/semgrep:1.176.1` Docker image

#### Scenario: Merge queue does not trigger SAST

- **WHEN** the workflow is triggered by `merge_group`
- **THEN** the `sast` job is skipped (`if: github.event_name == 'pull_request'` — diff-scoped scan is meaningless in merge queue context)

### Requirement: Diff-scoped scanning via baseline commit

The SAST scan SHALL analyze only the diff between the PR base and head commits, not the entire codebase. The scan MUST use `semgrep ci --baseline-commit <base_sha>` with `fetch-depth: 0` on checkout.

#### Scenario: Scan covers only PR changes

- **WHEN** a PR modifies 3 files out of 500
- **THEN** Semgrep scans only the diff of those 3 files against baseline rules, not all 500

#### Scenario: Full codebase on first PR

- **WHEN** a PR targets a baseline with no prior Semgrep scan history
- **THEN** Semgrep falls back to scanning the full diff (baseline commit behavior)

### Requirement: Severity-filtered gate

The scan SHALL fail (exit 1) only on findings with severity `ERROR`. Findings with severity `WARNING` or `INFO` SHALL NOT cause the job to fail.

#### Scenario: ERROR finding blocks job

- **WHEN** the scan detects a finding with severity `ERROR` (e.g., SQL injection, command injection)
- **THEN** the job exits with code 1, propagating failure to the CI status

#### Scenario: WARNING finding does not block job

- **WHEN** the scan detects a finding with severity `WARNING` (e.g., `no-console-log`)
- **THEN** the job exits with code 0 and the finding is reported in logs only

### Requirement: Inline packs (no local config dependency)

The scan SHALL use inline `--config p/...` flags for all rule packs. The job SHALL NOT reference `.semgrep/.semgrep.yml` or any local config file. Packs: `p/owasp-top-ten`, `p/security-audit`, `p/secrets`, `p/nodejs`, `p/expressjs`, `p/sql-injection`, `p/command-injection`, `p/react`, `p/xss`.

#### Scenario: Packs resolve from Semgrep registry

- **WHEN** the scan runs
- **THEN** it loads rules from the Semgrep registry via `--config p/...` flags, independent of any local config file

#### Scenario: Local config file ignored by CI

- **WHEN** `.semgrep/.semgrep.yml` is modified (e.g., uncommenting packs, adding rules)
- **THEN** the CI job behavior is unchanged (it uses inline packs, not the local file)

### Requirement: Exclusions inline (no .semgrepignore dependency)

The scan SHALL exclude files via inline `--exclude` flags: `node_modules`, `dist`, `build`, `coverage`, `.env`, `*.min.js`, `prisma/generated`, `e2e`. The job SHALL NOT depend on `.semgrepignore`. The 8 inline excludes achieve parity with `.semgrepignore` (test/spec patterns `*.test.*`/`*.spec.*` are managed by Semgrep internally in diff-mode and are not passable via `--exclude`).

#### Scenario: Test files excluded

- **WHEN** the scan runs
- **THEN** files matching `*.test.*` and `*.spec.*` are not analyzed

#### Scenario: Generated/dist excluded

- **WHEN** the scan runs
- **THEN** files under `node_modules/`, `dist/`, `build/`, and `coverage/` are not analyzed

#### Scenario: Auto-generated Prisma Client excluded

- **WHEN** the scan runs
- **THEN** files under `prisma/generated/` are not analyzed (auto-generated Prisma Client code produces false positives; `--exclude prisma/generated` uses simple path form without glob `**` for Semgrep compatibility)

#### Scenario: Sensitive files excluded

- **WHEN** the scan runs
- **THEN** files matching `.env` and `*.min.js` are not analyzed (configuration secrets and minified bundles are not actionable SAST targets)

### Requirement: Phased rollout — F1 non-blocking, F2 blocking

The job SHALL be deployed in two phases:

- **F1**: `continue-on-error: true` (non-blocking) — allows tuning false positives without blocking merges.
- **F2**: Remove `continue-on-error` and add "SAST (Semgrep)" as required status check in ruleset 21227644.

#### Scenario: F1 mode — finding does not block merge

- **WHEN** the job has `continue-on-error: true` (F1)
- **AND** the scan finds an ERROR severity issue
- **THEN** the job reports failure but the PR merge is not blocked

#### Scenario: F2 mode — finding blocks merge

- **WHEN** the job has `continue-on-error` removed (F2)
- **AND** "SAST (Semgrep)" is a required check in ruleset 21227644
- **AND** the scan finds an ERROR severity issue
- **THEN** the PR merge is blocked until the finding is resolved

### Requirement: Custom rules layer loaded via --config

The SAST scan SHALL load custom Semgrep rules from `.semgrep/rules/` via `--config .semgrep/rules` in addition to the inline packs. Custom rules MUST appear BEFORE the inline packs in the command line (Semgrep processes `--config` flags in order; local rules have priority over registry packs when patterns overlap).

#### Scenario: Custom rules loaded from repo

- **WHEN** the SAST scan runs
- **THEN** it loads rules from `.semgrep/rules/` (versioned in the repo) via `--config .semgrep/rules`
- **AND** it also loads inline packs via `--config p/...` flags

#### Scenario: Custom rules have priority over packs

- **WHEN** a custom rule in `.semgrep/rules/` covers the same CWE as an inline pack
- **THEN** the custom rule pattern takes precedence (Semgrep resolution: local rules > registry packs)

#### Scenario: Custom rules directory absent

- **WHEN** `.semgrep/rules/` does not exist or is empty
- **THEN** Semgrep loads only inline packs (custom rules are additive, not required for baseline functionality)

### Requirement: Custom rules versioned in repo with tests

All custom rules in `.semgrep/rules/` SHALL be versioned in the git repository. Each rule file MUST be accompanied by test fixtures in `.semgrep/rules/tests/` following the Semgrep "Testing rules" convention: `<rule-name>.test.js` (vulnerable) and `<rule-name>.test.js.fixed.js` (safe remediation).

#### Scenario: Rule files present in repo

- **WHEN** a developer inspects `.semgrep/rules/`
- **THEN** each `.yml` file contains a valid Semgrep rule with `severity: ERROR`, `message`, `patterns`, and `metadata` including CWE ID

#### Scenario: Test fixtures for each rule

- **WHEN** a developer inspects `.semgrep/rules/tests/`
- **THEN** each rule has >=1 true-positive fixture (vulnerable code that triggers the rule) and >=1 true-negative fixture (safe code that does not trigger)

#### Scenario: Validation before merge

- **WHEN** custom rules are added or modified
- **THEN** `semgrep --validate --config .semgrep/rules/` MUST exit 0 (all rules parse correctly)
- **AND** `semgrep --test .semgrep/rules/` MUST exit 0 (all fixtures pass)
- **AND** no rule with unresolved false positives may be merged

### Requirement: Custom rules severity ERROR (coherent with gate)

All custom rules SHALL use `severity: ERROR` to maintain coherence with the governance gate filter (`--severity ERROR --fail-on error`). Rules with lower severity would be invisible to the gate and provide false confidence.

#### Scenario: Custom rule severity matches gate filter

- **WHEN** a custom rule in `.semgrep/rules/` fires on code in a PR diff
- **THEN** its `severity: ERROR` is caught by `--severity ERROR --fail-on error` and causes the job to fail

### Requirement: Snapshot of custom rules (new rules require test before activation)

New custom rules SHALL NOT be activated in CI without accompanying test fixtures. The combination of `--validate` + `--test` acts as a gate: a rule file that fails validation or has failing fixtures prevents merge. Known limitations (e.g., `confidence: MEDIUM` due to intermediate variable tracking) MUST be documented as comments in the rule file.

#### Scenario: New rule added without tests

- **WHEN** a new `.yml` file is added to `.semgrep/rules/` without corresponding test fixtures
- **THEN** `semgrep --test` may still pass (if Semgrep allows it), but the task checklist (1.5) requires fixtures before merge

#### Scenario: Rule with known limitation

- **WHEN** a rule has `confidence: MEDIUM` or `confidence: LOW` (e.g., `xss-dom-intermediate`)
- **THEN** the rule file MUST include a comment explaining the limitation and why it is accepted
- **AND** `nosemgrep` comments in fixture test files document suppressions for known false positives

### Requirement: No SARIF upload in governance gate

The F1/F2 governance gate SHALL NOT upload SARIF reports or write to `security-events`. SARIF upload is reserved for future full scan work (out-of-scope for this change).

#### Scenario: Governance gate has no security-events permission

- **WHEN** the `sast` job runs in `ci.yml`
- **THEN** the job does NOT request `security-events: write` permission and does NOT upload SARIF

### Requirement: Concurrency with PR-scoped group

The job SHALL participate in the existing `ci.yml` concurrency group (`pr-<number>`) with `cancel-in-progress: true`, ensuring only one CI run per PR at a time.

#### Scenario: New push cancels previous run

- **WHEN** a developer pushes a new commit to a PR that already has a running CI
- **THEN** the previous CI run is cancelled and the new run starts

### Requirement: Docker image pinned to specific tag

The `semgrep/semgrep` Docker image SHALL be pinned to a specific version tag (`semgrep/semgrep:1.176.1`) rather than `latest`, ensuring reproducible scans.

#### Scenario: Deterministic scan version

- **WHEN** the job runs on any given day
- **THEN** it uses the exact Semgrep version `1.176.1`, not whatever `latest` resolves to

### Requirement: Timeout protection

The SAST job SHALL have a `timeout-minutes: 15` to prevent runaway scans from blocking the pipeline indefinitely.

#### Scenario: Scan exceeds timeout

- **WHEN** the Semgrep scan runs for more than 15 minutes
- **THEN** the job is killed by GitHub Actions and reports failure

### Requirement: No CI_MINIMAL gate

The SAST job SHALL execute regardless of the `CI_MINIMAL` variable. Unlike quality/build/test jobs (which are gated by `if: false` or `CI_MINIMAL`), the SAST governance gate MUST always run on PRs.

#### Scenario: CI_MINIMAL is true

- **WHEN** `vars.CI_MINIMAL` is `true`
- **AND** a PR targets `main`
- **THEN** the `sast` job still executes (no `CI_MINIMAL` condition in its `if:`)

### Requirement: No ci-complete coupling

The SAST job SHALL NOT be added to `ci-complete.needs`. SAST is a standalone governance gate, not part of the quality/build aggregation.

#### Scenario: ci-complete does not depend on sast

- **WHEN** `ci-complete` evaluates its `needs:` array
- **THEN** `sast` is NOT in the list (SAST failure does not cause ci-complete to fail)
