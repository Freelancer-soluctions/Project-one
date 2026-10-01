# ci-prebuild-substage-structure Specification

## Purpose

Delimits STAGE 2 (PRE-BUILD — VALIDATE) of the CI pipeline into 4 named substages via aggregator jobs, activates knip dead-code detection as the first quality gate (Phase 1 non-blocking), and classifies the existing `sast` job within substage 2A Governance.

## Requirements

### Requirement: Aggregator skip on CI_MINIMAL

The system SHALL skip all 4 aggregator jobs when `CI_MINIMAL=true`, preventing false failure reports.

#### Scenario: PR with CI_MINIMAL=true

- **When** a PR targets `main` and `vars.CI_MINIMAL=true`
- **Then** the 4 aggregators `prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-unit-tests-complete` evaluate `if: CI_MINIMAL != 'true' && always()` as false and are marked SKIPPED
- **And** no aggregator reports a failure to the GitHub status check system

### Requirement: Aggregator run on CI_MINIMAL=false

The system SHALL run each aggregator in all circumstances when `CI_MINIMAL=false`, propagating upstream job results.

#### Scenario: All upstream jobs pass

- **When** `CI_MINIMAL=false` and every job in a substage passes or is skipped
- **Then** the corresponding aggregator finalizes with success

#### Scenario: Upstream job fails

- **When** `CI_MINIMAL=false` and at least one job in a substage fails
- **Then** the corresponding aggregator finalizes with failure, propagating the error

### Requirement: prebuild-governance-complete

The `prebuild-governance-complete` aggregator SHALL depend on exactly `[verify-signatures, commit-lint, pr-title-lint, dco]` and the `sast` job SHALL NOT be included in its `needs`. It remains standalone per §9.3.9.

#### Scenario: Governance aggregator needs resolution

- **When** `prebuild-governance-complete` runs
- **Then** its `needs` array contains exactly `verify-signatures`, `commit-lint`, `pr-title-lint`, `dco` — no more, no less

#### Scenario: sast failure does not affect governance aggregator

- **When** the `sast` job fails on a PR
- **Then** `prebuild-governance-complete` does NOT report that failure as a substage failure
- **And** `sast` results are visible only as a standalone check (not gated by CI_MINIMAL)

#### Scenario: CI_MINIMAL=true and sast runs

- **When** `CI_MINIMAL=true` and `sast` runs (it is not gated by CI_MINIMAL)
- **Then** `prebuild-governance-complete` is SKIPPED (per Aggregator skip on CI_MINIMAL)
- **And** `sast` failures are visible as the only active job in the 2A Governance section

### Requirement: prebuild-quality-complete

The `prebuild-quality-complete` aggregator SHALL depend on exactly 15 jobs from Substage 2B CODE QUALITY: `[client-lint, client-format-check, client-typecheck, client-complexity, client-dead-code, client-import-bounds, server-lint, server-format-check, server-typecheck, server-complexity, server-dead-code, server-import-bounds, e2e-lint, actionlint, openspec-validate]`.

#### Scenario: Quality aggregator needs resolution

- **When** `prebuild-quality-complete` runs
- **Then** its `needs` array contains exactly those 15 jobs — no more, no less
- **And** all 15 jobs are from Substage 2B CODE QUALITY
- **And** `e2e-lint` follows the same activation pattern as the other quality jobs: gated on `repo-discovery` output (`e2e == 'true'`), `pull_request` only, and aggregated by the same failure-propagation logic
- **And** `openspec-validate` runs on every `pull_request` (not path-filtered), is aggregated by the same failure-propagation logic, and runs `npx openspec validate --specs --strict` against the canonical specs in `openspec/specs/**`

### Requirement: prebuild-unit-tests-complete

The `prebuild-unit-tests-complete` aggregator SHALL depend on exactly 4 jobs from Substage 2D UNIT TESTING: `[test-unit-client, test-unit-server, test-integration, test-smoke]`. The jobs `test-e2e` and `coverage` do NOT exist as job names in ci.yml; coverage is provided by separate `client-coverage`/`server-coverage` jobs outside Substage 2D.

#### Scenario: Unit-tests aggregator needs resolution

- **When** `prebuild-unit-tests-complete` runs
- **Then** its `needs` array contains exactly those 4 jobs — no more, no less
- **And** all 4 jobs are from Substage 2D UNIT TESTING

### Requirement: ci-complete depends on aggregators

The `ci-complete` aggregator SHALL depend on exactly 7 items: the 4 substage aggregators plus `verify-signatures`, `zombie-workflow-guard`, and `repo-discovery`.

#### Scenario: ci-complete needs resolution

- **When** `ci-complete` runs
- **Then** its `needs` array contains exactly: `[prebuild-governance-complete, prebuild-quality-complete, prebuild-security-complete, prebuild-unit-tests-complete, verify-signatures, zombie-workflow-guard, repo-discovery]`

### Requirement: Indirect dependency on quality/test jobs

The `ci-complete` aggregator SHALL NOT depend directly on quality or test jobs when they have `if: false` and `CI_MINIMAL=true` — only via the substage aggregators. It treats skipped aggregators/jobs as passing (does not report failure).

#### Scenario: Quality job skipped, ci-complete still passes

- **When** `CI_MINIMAL=true` and quality jobs are skipped (`if: false`)
- **Then** `prebuild-quality-complete` is skipped (per Aggregator skip on CI_MINIMAL)
- **And** `ci-complete` depends on the aggregator (which is skipped), not on the individual quality jobs
- **And** `ci-complete` treats skipped aggregators/jobs as passing (does not report failure)

### Requirement: Phase 1 non-blocking knip activation

The system SHALL activate `client-dead-code` and `server-dead-code` jobs with `continue-on-error: true` so they report but do not block the merge. Each dead-code job SHALL run knip from the repository root against the root `knip.jsonc` (`npx knip --workspace=apps/client …`, `npx knip --workspace=apps/server …`).

#### Scenario: PR touches client workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `client=true`
- **THEN** the `client-dead-code` job runs `npx knip --workspace=apps/client --no-progress` with `continue-on-error: true`, with the repository root as working directory
- **AND** the job does NOT block the merge regardless of knip findings

#### Scenario: PR touches server workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `server=true`
- **THEN** the `server-dead-code` job runs `npx knip --workspace=apps/server --no-progress` with `continue-on-error: true`, with the repository root as working directory
- **AND** the job does NOT block the merge regardless of knip findings

#### Scenario: PR does not touch the workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `client=false` (or `server=false`)
- **THEN** the corresponding dead-code job is skipped via `if: needs.repo-discovery.outputs.client == 'true'` (or server equivalent)

### Requirement: Phase 2 blocking promotion

The system SHALL remove `continue-on-error` from dead-code jobs after 1 sprint of calibration, making them blocking quality gates.

#### Scenario: Phase 2 promotion

- **When** the team confirms knip stability (false positive rate acceptable, ignores calibrated)
- **Then** `continue-on-error: true` is removed from `client-dead-code` and `server-dead-code`
- **And** knip failures block the merge (same pattern as pr-title-lint/dco per §9.3.3/§9.3.4)

### Requirement: Per-workspace knip.json with correct schema

knip SHALL use a single configuration file, the root `/knip.jsonc`, with `$schema: "https://unpkg.com/knip@6/schema-jsonc.json"` (the JSONC variant of the official schema) matching the installed version (6.32.2). Per-workspace behavior SHALL be expressed through its `workspaces` sections (`"."`, `"apps/client"`, `"apps/server"`, `"e2e"`), never through nested per-workspace config files.

#### Scenario: knip runs in CI and locally

- **WHEN** knip runs via `client-dead-code` or `server-dead-code` in CI, or via `npx knip --workspace apps/client` locally
- **THEN** it uses the root `knip.jsonc` in every case — `--workspace` filters the analyzed workspaces but does NOT switch configuration files
- **AND** the `$schema` field references `knip@6` (not `knip@5`)

#### Scenario: No nested config files

- **WHEN** the repository is inspected after this change
- **THEN** `apps/client/knip.json` and `apps/server/knip.json` do not exist
- **AND** all knip invocations from any working directory resolve `/knip.jsonc`

### Requirement: Baseline calibration of ignores

The system SHALL calibrate ignores in the `workspaces` sections of the root `knip.jsonc` when the knip baseline reports false positives, and document them in the change.

#### Scenario: False positives on first run

- **WHEN** `npx knip` runs for the first time against the codebase and reports false positives
- **THEN** the false positives are added to the `ignore` (or more surgically, `ignoreIssues`) array of the corresponding workspace section in the root `knip.jsonc`
- **AND** the calibration is documented in the change artifacts

### Requirement: Visual substage delimitation

The CI workflow file SHALL contain commented YAML headers that visually delimit each substage of STAGE 2.

#### Scenario: Inspecting ci.yml STAGE 2

- **When** a developer opens `.github/workflows/ci.yml` and navigates to STAGE 2
- **Then** the following headers are visible as comments before their respective job groups:
  - `# SUBSTAGE 2A: GOVERNANCE — verify-signatures, commit-lint, pr-title-lint, dco, sast`
  - `# SUBSTAGE 2B: CODE QUALITY — lint, format-check, typecheck, complexity, dead-code, import-bounds, e2e-lint, actionlint, openspec-validate, docs-validation (advisory)`
  - `# SUBSTAGE 2C: SECURITY — dependency-review, secrets, scancode-license-pr-diff, lockfile-audit, checkov-iac, containerfile-lint, actionlint-advisory, zizmor-advisory, typosquat-guarddog`
  - `# SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server, test-integration, test-smoke`

#### Scenario: Reading substage 2C header

- **When** a developer reads the `# SUBSTAGE 2C: SECURITY` header
- **Then** all 9 security jobs of the pre-build security block are listed in file order
- **And** the header no longer references `security.yml` (its PR-time security responsibility was absorbed by `ci.yml` since change `secret-scanning`; `security.yml` remains as push-main defense-in-depth per §23.3 mapping)

### Requirement: sast documented as standalone in substage 2A

The substage 2A header SHALL list `sast` for visual grouping, but document that sast is standalone (not gated by CI_MINIMAL).

#### Scenario: Reading substage 2A header

- **When** a developer reads the `# SUBSTAGE 2A: GOVERNANCE` header
- **Then** `sast` is listed among the governance jobs for visual classification
- **And** the header implies sast is in this substage even though it is not in `prebuild-governance-complete.needs` (asymmetric classification per design D5)

### Requirement: Security substage 2C job placement

The substage 2C security block of `ci.yml` SHALL contain exactly the 9 jobs of the pre-build security layers of `docs/ci-cd-pipeline-empresarial.md` §23.3 (`dependency-review`, `secrets`, `scancode-license-pr-diff`, `lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`), and no other job SHALL be defined inside the block. The 3 advisory jobs `actionlint-advisory`, `zizmor-advisory` and `typosquat-guarddog` SHALL be defined after `containerfile-lint` at the close of the block; the relative order of the 6 pre-existing jobs SHALL be unchanged. The relocation SHALL be physical only (cut-and-paste): job `id`, `name:`, `needs`, `if`, `continue-on-error`, steps, SARIF categories, artifacts and timeouts SHALL be unchanged.

#### Scenario: Security block composition

- **When** a developer inspects the job definitions between the `# SUBSTAGE 2C: SECURITY` header and the `# STAGE 3: BUILD` banner
- **Then** the job ids found are exactly the 9 listed above, in the order stated, with no other job definitions interleaved
- **And** the 3 relocated jobs appear after `containerfile-lint` in the order `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`

#### Scenario: Advisory jobs relocated without semantic changes

- **When** the relocation diff is reviewed or `actionlint` runs against `ci.yml`
- **Then** each relocated job keeps its exact `name:` (the `Security: …` check titles), `needs: [repo-discovery]`, `if: github.event_name == 'pull_request'`, `continue-on-error: true`, steps and SARIF categories/artifacts
- **And** no required status check name of the ruleset changes (relocation does not rename jobs)

#### Scenario: Blocking actionlint stays in substage 2B

- **When** a developer inspects where the blocking `actionlint` job (workflow syntax lint) is defined
- **Then** it remains inside the substage 2B quality block (before the 2C header) and in `prebuild-quality-complete.needs`
- **And** it is NOT part of the 2C security block (documented deviation from §23.3, decision 2026-09-30: syntax lint = quality; `zizmor` = the security layer of pipeline config via `unpinned-uses`)

### Requirement: prebuild-security-complete needs contract

The `prebuild-security-complete` aggregator SHALL depend on exactly 3 jobs: `[dependency-review, secrets, scancode-license-pr-diff]`. The advisory jobs of the substage (`lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`) SHALL NOT be part of its `needs` in FASE 1; their promotion to FASE 2 blocking is governed by their origin changes (`sca-lockfile-compliance`, `iac-scanning`, `containerfile-lint`, `pipeline-config-scan`, `typosquatting-detection`), not by this capability.

#### Scenario: Security aggregator needs resolution

- **When** `prebuild-security-complete` runs
- **Then** its `needs` array contains exactly `dependency-review`, `secrets`, `scancode-license-pr-diff` — no more, no less

#### Scenario: Advisory job failure does not affect security aggregator

- **When** any advisory job of substage 2C fails on a PR
- **Then** `prebuild-security-complete` does not report that failure (the job is not in its `needs` and the job-level `continue-on-error: true` absorbs it)
- **And** the finding remains visible via the job's SARIF upload and artifact

## Notes

- **Traceability**: knip ignore calibration (Baseline calibration of ignores) relates to `ci-shifting-left` A5 (knip root avoidance). This cross-reference is tracked in `proposal.md` rather than inline in the spec.
