## Purpose

Delimits STAGE 2 (PRE-BUILD — VALIDATE) of the CI pipeline into 4 named substages via aggregator jobs, activates knip dead-code detection as the first quality gate (Phase 1 non-blocking), and classifies the existing `sast` job within substage 2A Governance.

## ADDED Requirements

### Requirement: [Capability A] Aggregator skip on CI_MINIMAL

The system SHALL skip all 4 aggregator jobs when `CI_MINIMAL=true`, preventing false failure reports.

#### Scenario: PR with CI_MINIMAL=true

- **When** a PR targets `main` and `vars.CI_MINIMAL=true`
- **Then** the 4 aggregators `prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-unit-tests-complete` evaluate `if: CI_MINIMAL != 'true' && always()` as false and are marked SKIPPED
- **And** no aggregator reports a failure to the GitHub status check system

### Requirement: [Capability A] Aggregator run on CI_MINIMAL=false

The system SHALL run each aggregator in all circumstances when `CI_MINIMAL=false`, propagating upstream job results.

#### Scenario: All upstream jobs pass

- **When** `CI_MINIMAL=false` and every job in a substage passes or is skipped
- **Then** the corresponding aggregator finalizes with success

#### Scenario: Upstream job fails

- **When** `CI_MINIMAL=false` and at least one job in a substage fails
- **Then** the corresponding aggregator finalizes with failure, propagating the error

### Requirement: [Capability B] prebuild-governance-complete

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
- **Then** `prebuild-governance-complete` is SKIPPED (per [Capability A])
- **And** `sast` failures are visible as the only active job in the 2A Governance section

### Requirement: [Capability B2] prebuild-quality-complete

The `prebuild-quality-complete` aggregator SHALL depend on exactly 13 jobs from Substage 2B CODE QUALITY: `[client-lint, client-format-check, client-typecheck, client-complexity, client-dead-code, client-import-bounds, server-lint, server-format-check, server-typecheck, server-complexity, server-dead-code, server-import-bounds, actionlint]`.

#### Scenario: Quality aggregator needs resolution

- **When** `prebuild-quality-complete` runs
- **Then** its `needs` array contains exactly those 13 jobs — no more, no less
- **And** all 13 jobs are from Substage 2B CODE QUALITY

### Requirement: [Capability B3] prebuild-unit-tests-complete

The `prebuild-unit-tests-complete` aggregator SHALL depend on exactly 4 jobs from Substage 2D UNIT TESTING: `[test-unit-client, test-unit-server, test-integration, test-smoke]`. The jobs `test-e2e` and `coverage` do NOT exist as job names in ci.yml; coverage is provided by separate `client-coverage`/`server-coverage` jobs outside Substage 2D.

#### Scenario: Unit-tests aggregator needs resolution

- **When** `prebuild-unit-tests-complete` runs
- **Then** its `needs` array contains exactly those 4 jobs — no more, no less
- **And** all 4 jobs are from Substage 2D UNIT TESTING

### Requirement: [Capability C] ci-complete depends on aggregators

The `ci-complete` aggregator SHALL depend on exactly 7 items: the 4 substage aggregators plus `verify-signatures`, `zombie-workflow-guard`, and `repo-discovery`.

#### Scenario: ci-complete needs resolution

- **When** `ci-complete` runs
- **Then** its `needs` array contains exactly: `[prebuild-governance-complete, prebuild-quality-complete, prebuild-security-complete, prebuild-unit-tests-complete, verify-signatures, zombie-workflow-guard, repo-discovery]`

### Requirement: [Capability C] Indirect dependency on quality/test jobs

The `ci-complete` aggregator SHALL NOT depend directly on quality or test jobs when they have `if: false` and `CI_MINIMAL=true` — only via the substage aggregators. It treats skipped aggregators/jobs as passing (does not report failure).

#### Scenario: Quality job skipped, ci-complete still passes

- **When** `CI_MINIMAL=true` and quality jobs are skipped (`if: false`)
- **Then** `prebuild-quality-complete` is skipped (per [Capability A])
- **And** `ci-complete` depends on the aggregator (which is skipped), not on the individual quality jobs
- **And** `ci-complete` treats skipped aggregators/jobs as passing (does not report failure)

### Requirement: [Capability D] Phase 1 non-blocking knip activation

The system SHALL activate `client-dead-code` and `server-dead-code` jobs with `continue-on-error: true` so they report but do not block the merge.

#### Scenario: PR touches client workspace

- **When** a PR targets `main` and `repo-discovery` outputs `client=true`
- **Then** the `client-dead-code` job runs `npx knip` with `continue-on-error: true`
- **And** the job does NOT block the merge regardless of knip findings

#### Scenario: PR touches server workspace

- **When** a PR targets `main` and `repo-discovery` outputs `server=true`
- **Then** the `server-dead-code` job runs `npx knip` with `continue-on-error: true`
- **And** the job does NOT block the merge regardless of knip findings

#### Scenario: PR does not touch the workspace

- **When** a PR targets `main` and `repo-discovery` outputs `client=false` (or `server=false`)
- **Then** the corresponding dead-code job is skipped via `if: needs.repo-discovery.outputs.client == 'true'` (or server equivalent)

### Requirement: [Capability D] Phase 2 blocking promotion

The system SHALL remove `continue-on-error` from dead-code jobs after 1 sprint of calibration, making them blocking quality gates.

#### Scenario: Phase 2 promotion

- **When** the team confirms knip stability (false positive rate acceptable, ignores calibrated)
- **Then** `continue-on-error: true` is removed from `client-dead-code` and `server-dead-code`
- **And** knip failures block the merge (same pattern as pr-title-lint/dco per §9.3.3/§9.3.4)

### Requirement: [Capability E] Per-workspace knip.json with correct schema

knip SHALL use per-workspace configuration files with `$schema: "https://unpkg.com/knip@6/schema.json"` matching the installed version (6.32.2).

#### Scenario: knip runs in CI and locally

- **When** knip runs via `client-dead-code` or `server-dead-code` in CI, or via `npx knip --workspace apps/client` locally
- **Then** it uses `apps/client/knip.json` or `apps/server/knip.json` respectively
- **And** the `$schema` field references `knip@6` (not `knip@5`)

### Requirement: [Capability E] Baseline calibration of ignores

The system SHALL calibrate ignores in per-workspace `knip.json` files when the knip baseline reports false positives, and document them in the change.

#### Scenario: False positives on first run

- **When** `npx knip` runs for the first time against the codebase and reports false positives
- **Then** the false positives are added to the `ignore` array in the corresponding `knip.json`
- **And** the calibration is documented in the change artifacts

### Requirement: [Capability F] Visual substage delimitation

The CI workflow file SHALL contain commented YAML headers that visually delimit each substage of STAGE 2.

#### Scenario: Inspecting ci.yml STAGE 2

- **When** a developer opens `.github/workflows/ci.yml` and navigates to STAGE 2
- **Then** the following headers are visible as comments before their respective job groups:
  - `# SUBSTAGE 2A: GOVERNANCE — verify-signatures, commit-lint, pr-title-lint, dco, sast`
  - `# SUBSTAGE 2B: CODE QUALITY — lint, format-check, typecheck, complexity, dead-code, import-bounds, actionlint`
  - `# SUBSTAGE 2C: SECURITY — dependency-review (+ security.yml when enabled)`
  - `# SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server`

### Requirement: [Capability F] sast documented as standalone in substage 2A

The substage 2A header SHALL list `sast` for visual grouping, but document that sast is standalone (not gated by CI_MINIMAL).

#### Scenario: Reading substage 2A header

- **When** a developer reads the `# SUBSTAGE 2A: GOVERNANCE` header
- **Then** `sast` is listed among the governance jobs for visual classification
- **And** the header implies sast is in this substage even though it is not in `prebuild-governance-complete.needs` (asymmetric classification per design D5)

## Notes

- **Traceability**: knip ignore calibration (Capability E) relates to `ci-shifting-left` A5 (knip root avoidance). This cross-reference is tracked in `proposal.md` rather than inline in the spec.
