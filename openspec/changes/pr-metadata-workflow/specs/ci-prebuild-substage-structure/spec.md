# Spec Delta — ci-prebuild-substage-structure

## MODIFIED Requirements

### Requirement: prebuild-governance-complete

The `prebuild-governance-complete` aggregator SHALL depend on exactly `[verify-signatures, commit-lint, dco, sast]`.
The `sast` entry reflects its FASE 2 graduation (2026-10-20, change `sast-shift-left-hooks-parity`): a new ERROR
finding blocks the merge through this aggregator. The metadata checks `pr-title-lint` and `pr-body-lint` SHALL NOT be
included: both are defined in `.github/workflows/pr-metadata.yml`, and a GitHub Actions `needs` entry can only
reference a job in the same workflow, so listing them would make the aggregator invalid rather than more complete.
Metadata coverage is reported by the metadata workflow's own required checks, which the ruleset binds directly.

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
  - `# SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server, test-integration, test-smoke`

#### Scenario: Metadata job is not advertised in the 2A header

- **When** a developer reads the `# SUBSTAGE 2A: GOVERNANCE` header
- **Then** `pr-title-lint` is not listed, because no such job is defined in `ci.yml`
- **And** the reader looking for the metadata checks is pointed to `.github/workflows/pr-metadata.yml`

#### Scenario: Reading substage 2C header

- **When** a developer reads the `# SUBSTAGE 2C: SECURITY` header
- **Then** all 9 security jobs of the pre-build security block are listed in file order
- **And** the header no longer references `security.yml` (its PR-time security responsibility was absorbed by `ci.yml` since change `secret-scanning`; `security.yml` remains as push-main defense-in-depth per §23.3 mapping)

### Requirement: Checks bound to the ruleset are exempt from renaming

The job `name:` values that the branch ruleset requires as status checks SHALL NOT be renamed without a coordinated
update of the ruleset itself. Four are required today: `Verify Commit Signatures` (`verify-signatures`),
`Commit Lint (Conventional Commits)` (`commit-lint`), `PR Title Lint` (`pr-title-lint`) and `DCO` (`dco`).
`Governance: PR Body Lint` (`pr-body-lint`) joins that set when the administrator attaches it to the ruleset at its
FASE 3 step; from then on it is bound and frozen exactly like the other four.

The ruleset matches required contexts against the job `name:` as an exact string. Renaming a job whose name the
ruleset requires makes the required check never be emitted, leaving pull requests blocked indefinitely with
`Expected — Waiting for status to be reported` — a message that gives no hint that a renamed job is the cause.

The exemption follows the requirement, not the workflow: `PR Title Lint` stays exempt after moving to
`.github/workflows/pr-metadata.yml`, and `Governance: PR Body Lint` joins the list as soon as the administrator adds
it to the ruleset.

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

- **WHEN** `PR Title Lint` is defined in `.github/workflows/pr-metadata.yml` rather than in `ci.yml`
- **THEN** it remains exempt from renaming, because the ruleset binds the context name and not the file location
- **AND** `Governance: PR Body Lint` is exempt on the same terms once it is a required context
