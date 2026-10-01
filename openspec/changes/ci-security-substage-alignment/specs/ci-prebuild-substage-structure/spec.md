# Spec Delta — ci-prebuild-substage-structure

## MODIFIED Requirements

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

## ADDED Requirements

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
