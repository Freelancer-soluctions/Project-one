# ci-pr-metadata-governance Specification

## Purpose

Enforces PR-level metadata governance (title lint, DCO sign-off, and a structured PR template) to close the squash-message gap and satisfy enterprise compliance traceability, consistent reviews, and IP chain-of-custody on every change.

## Requirements

### Requirement: PR Title Lint Validation

**Priority**: P1
**Component**: `.github/workflows/pr-metadata.yml`

The system SHALL validate that every pull request title follows Conventional Commits format via the `pr-title-lint`
job, rejecting non-conforming titles while permitting `merge_group` events to pass. The job SHALL be defined in the
dedicated metadata workflow `.github/workflows/pr-metadata.yml`, not in `.github/workflows/ci.yml`, so that a title
edit re-evaluates the check without re-running the code pipeline. The job's display name SHALL be
`Governance: PR Title Lint`, prefixed with the block the job belongs to.

The display name is a contract rather than cosmetics: the ruleset matches required status-check contexts against the
job `name:` as an exact string, so a job whose context is bound cannot be renamed without updating the ruleset in the
same operation — otherwise the required check is never emitted and every pull request stays blocked with
`Expected — Waiting for status to be reported`, an error that names nothing. Ruleset 21227644 was audited through the
API on 2026-10-23: it requires two contexts, `Governance: PR Body Lint` (bound directly) and
`Prebuild Governance Complete` (the governance aggregator, whose `needs` is
`[verify-signatures, commit-lint, dco, sast]`). The four per-job contexts this capability used to rely on —
`Verify Commit Signatures`, `Commit Lint (Conventional Commits)`, `PR Title Lint` and `DCO` — are no longer bound
individually, and the governance job names were prefixed with `Governance:` as part of that revision. This title check
is therefore emitted and reported on every pull request but blocks nothing today: it has no binding path — a
cross-workflow `needs` entry is impossible, and the ruleset does not bind its context directly. That gap is a recorded
finding of the 2026-10-23 binding model, not a defect of this capability. Any future binding MUST use the exact string
`Governance: PR Title Lint`.

The action configuration SHALL be unchanged by the relocation: the same `amannn/action-semantic-pull-request@v6`
action, the same allowed types (including `ops`), `requireScope: false`, `subjectPattern: '^(?![A-Z]).+$'`, and the
same `ignoreLabels` values.

#### Scenario: Valid PR title

- **WHEN** a pull request is opened, edited, synchronized or reopened
- **AND** the PR title follows Conventional Commits format (`type(scope): description`)
- **THEN** the `Governance: PR Title Lint` job succeeds
- **AND** the status check `Governance: PR Title Lint` reports success

#### Scenario: Invalid PR title

- **WHEN** a pull request is opened, edited, synchronized or reopened
- **AND** the PR title does NOT follow Conventional Commits format
- **THEN** the `Governance: PR Title Lint` job fails
- **AND** the status check `Governance: PR Title Lint` reports failure
- **AND** the failure is visible on the pull request as a red governance check; blocking the merge additionally
  requires the context to be bound to the ruleset (see the binding note above)

#### Scenario: Title corrected without a new commit

- **WHEN** a pull request's title failed validation and the author edits the title in place
- **THEN** the `edited` trigger re-runs the job
- **AND** the status check reports a fresh verdict for the corrected title without a new commit being pushed

#### Scenario: PR title with valid type but missing description

- **WHEN** a pull request with title "feat:" is opened
- **THEN** the `Governance: PR Title Lint` job fails with error indicating missing description

#### Scenario: PR title with invalid type

- **WHEN** a pull request with title "feature: add login" is opened
- **THEN** the `Governance: PR Title Lint` job fails with error indicating invalid type
- **AND** suggests valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, ops

#### Scenario: Bot-authored PR (dependabot)

- **WHEN** a pull request authored by `dependabot[bot]` is opened
- **THEN** the `Governance: PR Title Lint` job executes normally (bots are NOT exempt from title lint)
- **AND** the PR title must still follow Conventional Commits

#### Acceptance Criteria

| ID      | Criterion                                                         | Status |
| ------- | ----------------------------------------------------------------- | ------ |
| AC-001a | Job `pr-title-lint` exists in `.github/workflows/pr-metadata.yml` | ✅     |
| AC-001b | Job is parallel (no `needs` dependency)                           | ✅     |
| AC-001c | Uses `amannn/action-semantic-pull-request@v6`                     | ✅     |
| AC-001d | Types match `@commitlint/config-conventional` plus `ops`          | ✅     |
| AC-001e | `requireScope: false`                                             | ✅     |
| AC-001f | `subjectPattern` rejects capital-first (`^(?![A-Z]).+$`)          | ✅     |
| AC-001g | Display name is `Governance: PR Title Lint`; emitted, not bound   | ✅     |
| AC-001h | Job is defined in no more than one workflow (single emitter)      | ✅     |

### Requirement: DCO Sign-off Enforcement

**Priority**: P1.5
**Component**: `.github/workflows/ci.yml`

The system SHALL validate that every commit in a pull request carries a `Signed-off-by` trailer matching the commit author email via the `dco` job, skipping merge commits and whitelisted bots.

#### Scenario: PR with all commits signed off

- **WHEN** a pull request has commits where every commit contains `Signed-off-by: Name <email>` matching the author email
- **THEN** the `DCO` job succeeds
- **AND** the status check `DCO` reports success

#### Scenario: PR with unsigned commit

- **WHEN** a pull request has a commit missing `Signed-off-by` trailer
- **THEN** the `DCO` job fails
- **AND** the status check `DCO` reports failure
- **AND** the PR cannot be merged (required check in ruleset 21227644)
- **AND** the error message identifies the specific commit(s) missing sign-off

#### Scenario: PR with wrong sign-off email

- **WHEN** a commit has `Signed-off-by: DevJuan <wrong@email.com>` but author is `DevJuan <juan@empresa.com>`
- **THEN** the `DCO` job fails
- **AND** the error identifies the email mismatch

#### Scenario: Dependabot PR

- **WHEN** a pull request authored by `dependabot[bot]` is opened
- **THEN** the `DCO` job is SKIPPED (bot is whitelisted via `well-known` policy)
- **AND** the status check `DCO` reports success (not required for this PR)

#### Scenario: Merge commits in PR

- **WHEN** a pull request contains merge commits
- **THEN** merge commits are SKIPPED (default behavior)
- **AND** only non-merge commits are validated for `Signed-off-by`

#### Scenario: Squash-merge preserves trailers

- **WHEN** a PR with signed-off commits is merged via squash and `squash_merge_commit_message` is `COMMIT_MESSAGES`
- **THEN** the `Signed-off-by` trailers from original commits are PRESERVED in the squash commit body

#### Acceptance Criteria

| ID      | Criterion                                                                       | Status |
| ------- | ------------------------------------------------------------------------------- | ------ |
| AC-002a | Job `dco` exists in ci.yml                                                      | ✅     |
| AC-002b | Job is parallel (no `needs` dependency)                                         | ✅     |
| AC-002c | Uses `KineticCafe/actions-dco@v3.2.0`                                           | ✅     |
| AC-002d | Config TOML: `[bot] policy = "well-known" categories = ["dependency-updaters"]` | ✅     |
| AC-002e | Validates ALL commits in PR (base..head range)                                  | ✅     |
| AC-002f | Skips merge commits (default behavior)                                          | ✅     |
| AC-002g | Email matching: sign-off email == author email (case-insensitive)               | ✅     |
| AC-002h | Registered as required check in ruleset 21227644                                | ✅     |
| AC-002i | Rollout: `continue-on-error: true` first cycle, then Active                     | ✅     |

---

### Requirement: Squash Setting Configuration

**Priority**: P1 (admin action)
**Component**: GitHub repo settings (manual)

The system SHALL use the PR title as the squash commit subject so that PR Title Lint-validated titles become the final commit message on `main`.

#### Scenario: Squash merge uses PR title

- **WHEN** a PR is merged via squash with `squash_merge_commit_title` = `PR_TITLE` and `squash_merge_commit_message` = `COMMIT_MESSAGES`
- **THEN** the commit subject equals the PR title
- **AND** the commit body contains the original commit messages
- **AND** `Signed-off-by` trailers are preserved in the body

#### Scenario: Single-commit PR squash

- **WHEN** a single-commit PR with a Conventional Commits title is merged via squash with `squash_merge_commit_title` = `PR_TITLE`
- **THEN** the commit subject equals the PR title (NOT the original commit message)
- **AND** `PR Title Lint` validated the title before merge
- **AND** `commit-lint` validated the commit message in the commit-msg hook

#### Acceptance Criteria

| ID      | Criterion                                                                   | Status      |
| ------- | --------------------------------------------------------------------------- | ----------- |
| AC-003a | `squash_merge_commit_title` changed from `COMMIT_OR_PR_TITLE` to `PR_TITLE` | ⬜ (admin)  |
| AC-003b | `squash_merge_commit_message` confirmed as `COMMIT_MESSAGES`                | ⬜ (verify) |
| AC-003c | Documented in CONTRIBUTING.md that PR title = final commit message          | ⬜          |

---

### Requirement: PR Template

**Priority**: P2
**Component**: `.github/PULL_REQUEST_TEMPLATE.md`

The system SHALL provide a structured PR template pre-filling the PR body with Summary, Type/Scope, Related Issue, Testing, Screenshots, and a Pre-merge Checklist.

#### Scenario: PR created with template

- **WHEN** a contributor creates a new pull request
- **THEN** the body is pre-filled with the template structure
- **AND** the template includes: Summary, Type/Scope, Related Issue, Testing, Screenshots, Checklist

#### Scenario: PR created with empty template

- **WHEN** a contributor creates a new pull request and does NOT fill in any template sections
- **THEN** the PR is created (GitHub does not enforce template content)
- **AND** reviewers are notified via CODEOWNERS review requirement

#### Scenario: PR with linked issue

- **WHEN** a PR with `Closes #123` in the body is opened
- **THEN** a reviewer can see the linked issue
- **AND** the issue is auto-closed when the PR merges (GitHub native behavior)

#### Acceptance Criteria

| ID      | Criterion                                   | Status |
| ------- | ------------------------------------------- | ------ |
| AC-004a | `.github/PULL_REQUEST_TEMPLATE.md` exists   | ✅     |
| AC-004b | Template includes all 6 sections            | ✅     |
| AC-004c | Checklist includes `Signed-off-by` reminder | ✅     |
| AC-004d | Template uses HTML comments for guidance    | ✅     |
| AC-004e | CONTRIBUTING.md updated with PR guidelines  | ✅     |

---

### Requirement: CI Composition

**Priority**: P1
**Component**: `.github/workflows/ci.yml`

The system SHALL keep `dco` as a parallel job of `ci.yml` and SHALL keep it in the
`prebuild-governance-complete.needs` array, which is the array that aggregates the governance jobs. It SHALL preserve
the `CI_MINIMAL` guard and the `contains(needs.*.result, ...)` gate of both aggregators.

`pr-title-lint` SHALL NOT be a job of `ci.yml`: it is defined in `.github/workflows/pr-metadata.yml` (see PR Title
Lint Validation) and SHALL NOT appear in `prebuild-governance-complete.needs`, because a GitHub Actions `needs` entry
cannot reference a job in another workflow. Metadata coverage therefore does not reach the aggregate at all: the body
check is bound to the ruleset directly (`Governance: PR Body Lint`), and the title check is reported by the metadata
workflow without being a required context under the 2026-10-23 binding model.

#### Scenario: CI_MINIMAL (PR)

- **WHEN** a pull request event triggers ci.yml
- **THEN** it executes: repo-discovery, verify-signatures, commit-lint, dco, sast, zombie-workflow-guard, the active
  quality and security jobs, and the test jobs whose `if:` evaluates true
- **AND** `dco` runs in PARALLEL (no `needs` dependency)
- **AND** jobs disabled by design (`if: false`, such as `e2e` and the `*-build` jobs) remain skipped and are not
  counted as part of the composition
- **AND** the aggregators wait for their `needs` via `if: ${{ vars.CI_MINIMAL != 'true' && always() }}`

#### Scenario: CI_COMPLETE gate

- **WHEN** all CI jobs have completed and the `ci-complete` job evaluates
- **THEN** it checks `contains(needs.*.result, 'failure')` and `contains(needs.*.result, 'cancelled')`
- **AND** if ANY result is `failure` → ci-complete fails
- **AND** if ANY result is `cancelled` → ci-complete succeeds (it treats `cancelled` as success, unlike the substage
  aggregators, which treat it as failure — recorded debt, out of scope here)
- **AND** if ALL results are `success` or `skipped` → ci-complete succeeds

#### Scenario: Metadata jobs are absent from ci.yml

- **WHEN** the jobs of ci.yml are listed
- **THEN** neither `pr-title-lint` nor `pr-body-lint` is among them
- **AND** `prebuild-governance-complete.needs` contains no metadata job id

#### Scenario: PR Title Lint job in CI_MINIMAL

- **WHEN** a pull request event triggers ci.yml
- **THEN** `pr-title-lint` is NOT part of the CI_MINIMAL composition, because the job is no longer defined in `ci.yml`
- **AND** the job runs from `.github/workflows/pr-metadata.yml`, which is not gated by `CI_MINIMAL` at all
- **AND** its job name is exactly `Governance: PR Title Lint`
- **AND** it keeps `permissions: pull-requests: read` and validates the PR title against Conventional Commits
- **AND** ci.yml's own composition is unaffected by the move: repo-discovery, verify-signatures, commit-lint, dco,
  sast, the quality and security jobs and the test jobs still run exactly as before

#### Scenario: PR Title Lint handles merge_group

- **WHEN** a merge queue event (merge_group) triggers the metadata workflow
- **THEN** the `pr-title-lint` job defined in `.github/workflows/pr-metadata.yml` emits success through its explicit
  no-op step
- **AND** the required check is satisfiable in merge queue
- **AND** the job is not excluded from `merge_group` by any job-level `if`

#### Scenario: DCO job in CI_MINIMAL

- **WHEN** a pull request event triggers ci.yml
- **THEN** the `dco` job is included in CI_MINIMAL
- **AND** the job name is `Governance: DCO` (block prefix; the ruleset binds the `Prebuild Governance Complete`
  aggregator, of which `dco` is a `needs` entry, instead of this job's own context)
- **AND** the job has `permissions: contents: read`
- **AND** the job handles both `pull_request` and `merge_group` events
- **AND** on `pull_request`: validates Signed-off-by on all commits
- **AND** on `merge_group`: emits success (PR-level check)

#### Scenario: DCO handles merge_group

- **WHEN** a merge queue event (merge_group) triggers ci.yml
- **THEN** the `dco` job emits success
- **AND** the required check is satisfiable in merge queue

#### Acceptance Criteria

| ID      | Criterion                                                                                | Status |
| ------- | ---------------------------------------------------------------------------------------- | ------ |
| AC-005a | `pr-title-lint` job absent from ci.yml                                                   | ✅     |
| AC-005b | `dco` job present in ci.yml                                                              | ✅     |
| AC-005c | `dco` is parallel (no `needs`)                                                           | ✅     |
| AC-005d | `dco` present in `prebuild-governance-complete.needs` array                              | ✅     |
| AC-005e | `dco` has `permissions: contents: read`                                                  | ✅     |
| AC-005f | `dco` handles `pull_request` and `merge_group` events                                    | ✅     |
| AC-005g | Job name is `Governance: DCO`; it reaches the ruleset via `Prebuild Governance Complete` | ✅     |
| AC-005h | `ci-complete` preserves `if: ${{ vars.CI_MINIMAL != 'true' && always() }}`               | ✅     |
| AC-005i | No metadata check is listed in `prebuild-governance-complete.needs`                      | ✅     |

### Requirement: Ruleset Update

**Priority**: P1 (admin action)
**Component**: GitHub ruleset 21227644

The system SHALL register `PR Title Lint` and `DCO` as required status checks in ruleset 21227644 with zero bypass actors.

#### Scenario: Ruleset includes PR Title Lint

- **WHEN** a PR targets `main` under ruleset 21227644
- **THEN** `PR Title Lint` is a required status check
- **AND** the check must pass before merge is allowed

#### Scenario: Ruleset includes DCO

- **WHEN** a PR targets `main` under ruleset 21227644
- **THEN** `DCO` is a required status check
- **AND** the check must pass before merge is allowed

#### Scenario: Dependabot PR bypasses DCO

- **WHEN** a dependabot PR has DCO check skipped (whitelisted in action config) and merge is attempted
- **THEN** GitHub sees the DCO check as `success` (skipped = success for required checks)
- **AND** the merge is allowed

#### Acceptance Criteria

| ID      | Criterion                                                      | Status      |
| ------- | -------------------------------------------------------------- | ----------- |
| AC-006a | `PR Title Lint` added to ruleset 21227644 required checks      | ⬜ (admin)  |
| AC-006b | `DCO` added to ruleset 21227644 required checks                | ⬜ (admin)  |
| AC-006c | Zero bypass actors maintained                                  | ⬜ (admin)  |
| AC-006d | Verify: dependabot PRs still mergeable (DCO skipped = success) | ⬜ (verify) |

---

### Requirement: Documentation

**Priority**: P2
**Component**: `CONTRIBUTING.md`

The system SHALL document PR governance in CONTRIBUTING.md covering PR title format, DCO requirement, template usage, and review process.

#### Scenario: Contributor reads PR guidelines

- **WHEN** a contributor opens CONTRIBUTING.md and reads the PR section
- **THEN** they find: PR title format, DCO requirement (`git commit -s`), template usage, review process

#### Scenario: Contributor sees DCO requirement

- **WHEN** a contributor opens CONTRIBUTING.md and reaches the DCO section
- **THEN** they find: what DCO is, why it's required, how to sign off (`git commit -s`), dependabot exemption

#### Acceptance Criteria

| ID      | Criterion                                               | Status |
| ------- | ------------------------------------------------------- | ------ |
| AC-007a | CONTRIBUTING.md exists or is created                    | ✅     |
| AC-007b | PR title format documented (Conventional Commits)       | ✅     |
| AC-007c | DCO sign-off requirement documented                     | ✅     |
| AC-007d | PR template usage documented                            | ✅     |
| AC-007e | Review process documented (CODEOWNERS, required checks) | ✅     |
