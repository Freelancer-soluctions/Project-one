# sast-governance-gate Specification

## Purpose

Provides SAST (Static Application Security Testing) as a CI governance gate using Semgrep in `.github/workflows/ci.yml`. Scans only the PR diff for ERROR-severity findings using the registry packs **plus** the versioned custom rules in `.semgrep/rules/` (loaded before the packs), both supplied by the shared script `scripts/sast-diff.mjs` — the single source of version, packs and exclusions for this job and for the local `pre-push` hook. In F1 the gate is non-blocking for merges: the step is still reported red on an ERROR finding and the result is retained as a 14-day artifact (evidence for the calibration window). F2 removes `continue-on-error` and adds `sast` to `prebuild-governance-complete.needs`; the ruleset 21227644 is not touched.

## Requirements

### Requirement: SAST job runs on every pull request

The system SHALL execute a Semgrep SAST scan as a job named `Governance: SAST (Semgrep)` in `.github/workflows/ci.yml` on every `pull_request` event targeting `main`. The `Governance:` prefix identifies the job's substage (SUBSTAGE 2A GOVERNANCE) in the Checks list; it is part of the name the ruleset would bind in F2.

#### Scenario: PR triggers SAST scan

- **WHEN** a pull request is opened, synchronized, or reopened targeting `main`
- **THEN** the `sast` job in `ci.yml` executes using the `semgrep/semgrep:1.176.1` Docker image

#### Scenario: Merge queue does not trigger SAST

- **WHEN** the workflow is triggered by `merge_group`
- **THEN** the `sast` job is skipped (`if: github.event_name == 'pull_request'` — diff-scoped scan is meaningless in merge queue context)

### Requirement: Diff-scoped scanning via baseline commit

The SAST scan SHALL analyze only the diff between the PR base and head commits, not the entire codebase. The scan
SHALL use `semgrep scan --baseline-commit <base_sha>` (with `fetch-depth: 0` on checkout) and SHALL obtain that
command from the shared script `scripts/sast-diff.mjs` rather than from an inline command line in the job. The
`semgrep ci` subcommand SHALL NOT be used: it does not support `--severity` or `--fail-on` (upstream issue #5075),
and its preset behaviour conflicts with the severity-filtered gate.

#### Scenario: Scan covers only PR changes

- **WHEN** a PR modifies 3 files out of 500
- **THEN** Semgrep scans only the diff of those 3 files against baseline rules, not all 500

#### Scenario: Full codebase on first PR

- **WHEN** a PR targets a baseline with no prior Semgrep scan history
- **THEN** Semgrep falls back to scanning the full diff (baseline commit behavior)

#### Scenario: Job does not embed the scan command

- **WHEN** the `sast` job's scan step is inspected
- **THEN** it runs `SAST_MODE=ci node scripts/sast-diff.mjs`
- **AND** it contains no inline `docker run … semgrep …` invocation

### Requirement: Severity-filtered gate

The scan SHALL fail (exit 1) only on findings with severity `ERROR`. Findings with severity `WARNING` or `INFO` SHALL NOT cause the job to fail.

#### Scenario: ERROR finding blocks job

- **WHEN** the scan detects a finding with severity `ERROR` (e.g., SQL injection, command injection)
- **THEN** the job exits with code 1, propagating failure to the CI status

#### Scenario: WARNING finding does not block job

- **WHEN** the scan detects a finding with severity `WARNING` (e.g., `no-console-log`)
- **THEN** the job exits with code 0 and the finding is reported in logs only

### Requirement: Inline packs (no local config dependency)

The scan SHALL use packs as its governing rule set, with every `--config p/...` flag: `p/owasp-top-ten`,
`p/security-audit`, `p/secrets`, `p/nodejs`, `p/expressjs`, `p/sql-injection`, `p/command-injection`, `p/react`,
`p/xss`. The pack list SHALL be defined in exactly one place — the shared script `scripts/sast-diff.mjs` — and used
verbatim by both the hook and the job; the job SHALL NOT maintain a pack list of its own. The scan SHALL also load
the versioned custom rules via `--config .semgrep/rules`, passed **before** the packs so local rules keep priority.
The job SHALL NOT reference `.semgrep/.semgrep.yml` (the legacy single-file config, whose packs are commented out).

`## Purpose` note: the capability Purpose states the scan uses inline packs with **no local config dependency**.
That sentence is stale twice over — the job has always passed `--config .semgrep/rules`, and the capability itself
reclaims versioned custom rules in two other requirements. A delta over an existing capability cannot carry a
`## Purpose`, so the correction is owned by the documentation task of this change (task 7.6).

#### Scenario: Packs resolve from Semgrep registry

- **WHEN** the scan runs
- **THEN** it loads the nine rule packs from the Semgrep registry via `--config p/...` flags
- **AND** those flags come from the shared script, not from the workflow file

#### Scenario: Local config file ignored by CI

- **WHEN** `.semgrep/.semgrep.yml` is modified (e.g., uncommenting packs, adding rules)
- **THEN** the CI job behavior is unchanged (it uses the packs and `.semgrep/rules/` from the shared script, not that file)

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

The job SHALL be deployed in two phases **within the same change**, whose calibration window stays open for 2-4
weeks of real runs:

- **F1**: `continue-on-error: true` (non-blocking) — the finding is reported, retained as a 14-day artifact and
  left visible in the job log, without blocking merges.
- **F2**: remove `continue-on-error` and add `sast` to `prebuild-governance-complete.needs`, so a new ERROR
  finding fails the governance aggregator — and, because that aggregator is itself a required status check of the
  ruleset 21227644 (the exact context `Prebuild Governance Complete`, one of its two required contexts), the
  finding blocks the merge. The ruleset 21227644 is NOT modified: binding `Governance: SAST (Semgrep)` directly as
  a required status check remains out of scope for this change and is unnecessary for the blocking effect.

F2 SHALL NOT be applied until the graduation criterion recorded in the workflow file is met.

`## Purpose` note: the capability Purpose describes F2 as **blocking in F2 after ruleset binding**. That is not the
agreed scope: F2 is `continue-on-error` removal plus inclusion in `prebuild-governance-complete.needs`, and the
ruleset 21227644 is not touched — the blocking effect already arrives through that aggregator, which is a required
status check of the ruleset (`Prebuild Governance Complete`), so no new binding is needed. The correction is owned
by the documentation task of this change (task 7.6).

#### Scenario: F1 mode — finding does not block merge

- **WHEN** the job has `continue-on-error: true` (F1)
- **AND** the scan finds an ERROR severity issue
- **THEN** the job reports failure but the PR merge is not blocked

#### Scenario: F2 mode — finding blocks merge

- **WHEN** the job has `continue-on-error` removed (F2)
- **AND** `sast` is listed in `prebuild-governance-complete.needs`
- **AND** the scan finds an ERROR severity issue
- **THEN** the `sast` job fails
- **AND** `prebuild-governance-complete` fails as a result (its gate fails on `contains(needs.*.result, 'failure')`)
- **AND** that aggregator is itself a required status check of the ruleset 21227644, under the exact required
  context `Prebuild Governance Complete` — not `Governance: SAST (Semgrep)`
- **AND** the PR merge is blocked by that ruleset until the finding is resolved

#### Scenario: F2 is not applied ahead of its criterion

- **WHEN** the calibration window has not satisfied the documented graduation criterion
- **THEN** `continue-on-error: true` remains in place and `sast` is absent from
  `prebuild-governance-complete.needs`

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

All custom rules SHALL use `severity: ERROR` to maintain coherence with the governance gate filter
(`--severity ERROR --error`). Rules with lower severity would be invisible to the gate and provide false
confidence. The flag in force is `--error`; `--fail-on error` does not exist in `semgrep scan` and SHALL NOT be
referenced.

#### Scenario: Custom rule severity matches gate filter

- **WHEN** a custom rule in `.semgrep/rules/` fires on code in a PR diff
- **THEN** its `severity: ERROR` is caught by `--severity ERROR --error` and causes the job to fail

### Requirement: Snapshot of custom rules (new rules require test before activation)

New custom rules SHALL NOT be activated in CI without accompanying test fixtures. The combination of `--validate` + `--test`
acts as a gate: a rule file that fails validation or has failing fixtures prevents merge. Known limitations (e.g., `confidence: MEDIUM` due to intermediate variable tracking) MUST be documented as comments in the rule file.

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

The SAST job SHALL NOT be listed directly in `ci-complete.needs` in either phase. SAST is a standalone governance
gate, not part of the quality/build aggregation. The direct-coupling prohibition is scoped to FASE 1 below; FASE 2
reaches `CI Complete` only **transitively**, through `prebuild-governance-complete`, which is the intended effect and
does not amount to a direct coupling (`CI Complete` is not a ruleset status check).

#### Scenario: ci-complete does not depend on sast

- **WHEN** `ci-complete` evaluates its `needs:` array while FASE 1 was in force
- **THEN** `sast` is NOT in the list (SAST failure does not cause `ci-complete` to fail on its own account)
- **AND** `sast` was absent from every aggregator `needs:` list

#### Scenario: FASE 2 — failure propagates transitively, by design

- **WHEN** `ci-complete` evaluates its `needs:` array after FASE 2 has been applied
- **THEN** `sast` is STILL not listed directly
- **AND** `ci-complete` nevertheless fails when `sast` fails, because `prebuild-governance-complete` is in its
  `needs:` and that aggregator now includes `sast`
- **AND** the propagation traverses the aggregator tree as it stands after #147: the four `prebuild-*` substage
  aggregators feed `build-complete`, which feeds `postbuild-tests-complete` and `postbuild-analysis-complete`, and
  `ci-complete` consumes all of them (9 entries in its `needs:`)
- **AND** `sast` remains absent from the three stage aggregators' `needs:` lists (`build-complete`,
  `postbuild-tests-complete`, `postbuild-analysis-complete`)

### Requirement: CI job delegates the scan to the shared script

The `sast` job SHALL run the scan exclusively through `scripts/sast-diff.mjs` with `SAST_MODE=ci`, so that the CI
gate and the local `pre-push` gate share one implementation, one Semgrep version, one pack list and one exclusion
list. The job SHALL keep its name (`Governance: SAST (Semgrep)`), its `timeout-minutes: 15`, its
`if: github.event_name == 'pull_request'` condition, its `permissions: contents: read` and its participation in the
`ci.yml` concurrency group. The step's exit code SHALL be the script's exit code.

#### Scenario: Job invokes the script in CI mode

- **WHEN** the `sast` job runs on a pull request
- **THEN** its scan step runs `SAST_MODE=ci node scripts/sast-diff.mjs`
- **AND** the job keeps its name, timeout, trigger condition, permissions and concurrency participation

#### Scenario: Tool failure propagates in CI mode

- **WHEN** the shared script cannot run the scan in CI mode
- **THEN** the step's non-zero exit code is propagated to the job (fail-closed)

### Requirement: FASE 1 kept the result as a 14-day artifact

While FASE 1 was in force, the job retained the scan result as a build artifact with a retention of 14 days, so
the calibration window accumulated evidence even though the finding did not block; the artifact was uploaded with
`if: always()` and an explicit behaviour when no file is produced. FASE 1 has graduated, but the 14-day artifact
**persists in FASE 2**: the upload step SHALL remain in place (verified in `ci.yml:444-452`) with `if: always()`
and `if-no-files-found: warn`, so every post-graduation run SHALL keep writing `.tmp/sast-report.json` as triage
evidence.

#### Scenario: Finding in F1 produced an artifact

- **WHEN** the scan reported a new ERROR finding during FASE 1
- **THEN** the PR was not blocked
- **AND** the scan result was available as an artifact retained for 14 days

#### Scenario: Clean run does not break the upload

- **WHEN** the scan produces no report file
- **THEN** the upload step does not fail the job (`if-no-files-found` handled explicitly)

### Requirement: Graduation criterion documented in the workflow

The graduation criterion from FASE 1 to FASE 2 SHALL be written as a comment in `.github/workflows/ci.yml`, next to
the `sast` job, so the two-phase rollout is discoverable without reading the change. The criterion SHALL state the
calibration window (2-4 weeks) and the condition (no untriaged false positives), and SHALL be updated in lockstep
with the shared calibration-window section of `docs/learning/quality-gates.md`.

#### Scenario: Criterion is visible in the workflow

- **WHEN** a maintainer opens the `sast` job definition
- **THEN** a comment states the FASE 1/FASE 2 split, the 2-4 week window and the graduation condition

#### Scenario: Criterion stays consistent with the calibration section

- **WHEN** the criterion changes
- **THEN** the same wording is reflected in the single calibration-window section of
  `docs/learning/quality-gates.md` (no second window is opened by this change)

### Requirement: FASE 2 promotion is deferred inside this change

The promotion requirement (remove `continue-on-error`, add `sast` to `prebuild-governance-complete.needs`) SHALL
remain in force as part of this change rather than being written off as out of scope. Its implementation tasks
SHALL be explicitly marked as deferred until the graduation criterion is met, and the change stays open across the
calibration window.

#### Scenario: Deferred tasks are explicit

- **WHEN** the change's task list is reviewed
- **THEN** the FASE 2 tasks appear in their own group, marked as deferred pending the calibration window

#### Scenario: Promotion is reversible

- **WHEN** FASE 2 has been applied and the criterion is later found not to hold
- **THEN** restoring `continue-on-error: true` and removing `sast` from
  `prebuild-governance-complete.needs` returns the gate to FASE 1 with no other change
