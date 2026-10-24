# Spec Delta — ci-prebuild-substage-structure

## MODIFIED Requirements

### Requirement: prebuild-governance-complete

The `prebuild-governance-complete` aggregator SHALL depend on exactly `[verify-signatures, commit-lint, dco, sast]`.
The `sast` entry reflects its FASE 2 graduation (2026-10-20, change `sast-shift-left-hooks-parity`): a new ERROR
finding blocks the merge through this aggregator. The metadata checks `pr-title-lint` and `pr-body-lint` SHALL NOT be
included: both are defined in `.github/workflows/pr-metadata.yml`, and a GitHub Actions `needs` entry can only
reference a job in the same workflow, so listing them would make the aggregator invalid rather than more complete.
Metadata coverage therefore does not reach this aggregator at all: `Governance: PR Body Lint` is bound to the ruleset
directly and `Governance: PR Title Lint` is emitted without being bound at all.

#### Scenario: Governance aggregator needs resolution

- **When** `prebuild-governance-complete` runs
- **Then** its `needs` array contains exactly `verify-signatures`, `commit-lint`, `dco`, `sast` — no more, no less
- **And** it contains no metadata job id, because those jobs live in another workflow

#### Scenario: Metadata failure reaches the PR without the aggregator

- **When** either metadata job fails in `.github/workflows/pr-metadata.yml`
- **Then** the required status check reports failure directly to the pull request
- **And** `prebuild-governance-complete` neither reports that failure nor is able to observe it

#### Scenario: sast failure does not affect governance aggregator

- **When** the `sast` job reports an ERROR finding on a PR
- **Then** the failure is attributed to `sast` and the aggregator reports the substage as failed
- **And** the individual verdicts of `verify-signatures`, `commit-lint` and `dco` are unaffected, because each job reports its own conclusion

#### Scenario: CI_MINIMAL=true and sast runs

- **When** `CI_MINIMAL=true` and `sast` runs (it is not gated by CI_MINIMAL)
- **Then** `prebuild-governance-complete` is SKIPPED (per Aggregator skip on CI_MINIMAL)
- **And** `sast` results remain visible as its own job in the 2A Governance section

### Requirement: Visual substage delimitation

The CI workflow file SHALL contain commented YAML headers that visually delimit each substage of STAGE 2.

The SUBSTAGE 2A header SHALL list only the jobs that are physically defined in the governance block of `ci.yml`. It
SHALL NOT list `pr-title-lint`, because that job is defined in `.github/workflows/pr-metadata.yml`; a header that
advertises a job the file does not contain misleads exactly the reader it is meant to orient.

#### Scenario: Inspecting ci.yml STAGE 2

- **When** a developer opens `.github/workflows/ci.yml` and navigates to STAGE 2
- **Then** the following headers are visible as comments before their respective job groups:
  - `# SUBSTAGE 2A: GOVERNANCE — verify-signatures, commit-lint, dco, sast diff`
  - `# SUBSTAGE 2B: CODE QUALITY — lint, format-check, typecheck, complexity, dead-code, import-bounds, e2e-lint, openspec-validate, docs-validation (advisory)`
  - `# SUBSTAGE 2C: SECURITY — dependency-review, secrets, scancode-license-pr-diff, lockfile-audit, checkov-iac, containerfile-lint, actionlint-advisory, zizmor-advisory, typosquat-guarddog`
  - `# SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server, test-integration, test-smoke, property-tests`

#### Scenario: Metadata job is not advertised in the 2A header

- **When** a developer reads the `# SUBSTAGE 2A: GOVERNANCE` header
- **Then** `pr-title-lint` is not listed, because no such job is defined in `ci.yml`
- **And** the reader looking for the metadata checks is pointed to `.github/workflows/pr-metadata.yml`

#### Scenario: Reading substage 2C header

- **When** a developer reads the `# SUBSTAGE 2C: SECURITY` header
- **Then** all 9 security jobs of the pre-build security block are listed in file order
- **And** the header no longer references `security.yml` (its PR-time security responsibility was absorbed by `ci.yml` since change `secret-scanning`; `security.yml` remains as push-main defense-in-depth per §23.3 mapping)

### Requirement: Checks bound to the ruleset are exempt from renaming

The job `name:` values that the branch ruleset binds as status-check contexts SHALL NOT be renamed without a
coordinated update of the ruleset itself, because the ruleset matches a required context against the job `name:` as an
exact string: renaming a bound job makes the required check never be emitted and leaves pull requests blocked
indefinitely with `Expected — Waiting for status to be reported`, a message that gives no hint that a renamed job is
the cause.

Two contexts are bound today (ruleset 21227644 audited through the API on 2026-10-23): `Governance: PR Body Lint`
(job `pr-body-lint`, `.github/workflows/pr-metadata.yml`) and `Prebuild Governance Complete` (job
`prebuild-governance-complete`, `ci.yml`).

The three governance jobs of `ci.yml` — `Governance: Verify Commit Signatures` (`verify-signatures`),
`Governance: Commit Lint (Conventional Commits)` (`commit-lint`) and `Governance: DCO` (`dco`) — are not bound
individually: they reach the ruleset through the `Prebuild Governance Complete` aggregator, which lists them in its
`needs`. Their own names therefore carry no freeze on their own, while the aggregator's name does — renaming it
detaches the requirement for the whole governance substage, not for a single check.

`Governance: PR Title Lint` (`pr-title-lint`) is emitted by `.github/workflows/pr-metadata.yml` and is bound by neither
path: a `needs` entry cannot reference a job in another workflow, and the ruleset does not bind it directly.

The exemption follows the requirement, not the workflow: `Governance: PR Body Lint` is bound from
`.github/workflows/pr-metadata.yml` rather than from `ci.yml`, and `Prebuild Governance Complete` is bound from
`ci.yml`; neither is exempt because of the file it happens to live in.

#### Scenario: Renaming a ruleset-bound check is a coordinated operation

- **WHEN** a change intends to rename one of the jobs bound to the ruleset
- **THEN** the ruleset's required status check context is updated in the same operation
- **AND** no commit lands where the YAML name and the ruleset context disagree, because that state blocks every
  pull request with no actionable error

#### Scenario: Exemption is documented rather than enforced by convention

- **WHEN** a future normalization change inventories job names for missing prefixes
- **THEN** the ruleset-bound checks are treated as a known, documented exception
- **AND** they are not reported as an inconsistency to fix

#### Scenario: A check bound to the ruleset in another workflow keeps its exemption

- **WHEN** `Governance: PR Body Lint` is defined in `.github/workflows/pr-metadata.yml` rather than in `ci.yml`
- **THEN** it is bound exactly as a `ci.yml` job would be, because the ruleset binds the context name and not the file
  location
- **AND** `Prebuild Governance Complete` carries the same binding from inside `ci.yml`

### Requirement: Jobs with no block are enumerated as role exceptions

The `name:` of a job that does not belong to any substage SHALL NOT be given a block prefix. The complete set of such
jobs is enumerated here so that a future normalization change evaluates them against this list instead of reporting
them as inconsistencies:

- `repo-discovery` (`Detect Changes`) — the ENTRY path-filter; it precedes every substage and decides which jobs run.
- `zombie-workflow-guard` (`Zombie Workflow Guard`) — a GUARD assertion about the repository itself, outside the DAG's
  stage structure.
- `ci-complete` (`CI Complete`) — the root aggregator; by definition it does not belong to a substage.

A job outside this list and outside the ruleset exemption SHALL be reported as an inconsistency to fix.

#### Scenario: An unprefixed job is judged against the exception list

- **WHEN** a future change inventories job names for missing prefixes
- **THEN** the three role-exception jobs above and the ruleset-bound contexts covered by
  _Checks bound to the ruleset are exempt from renaming_ are treated as known, documented exceptions
- **AND** any other unprefixed job is reported as an inconsistency to fix
