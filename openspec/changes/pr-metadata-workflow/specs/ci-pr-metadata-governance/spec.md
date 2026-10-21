# Spec Delta — ci-pr-metadata-governance

## MODIFIED Requirements

### Requirement: PR Title Lint Validation

**Priority**: P1
**Component**: `.github/workflows/pr-metadata.yml`

The system SHALL validate that every pull request title follows Conventional Commits format via the `pr-title-lint`
job, rejecting non-conforming titles while permitting `merge_group` events to pass. The job SHALL be defined in the
dedicated metadata workflow `.github/workflows/pr-metadata.yml`, not in `.github/workflows/ci.yml`, so that a title
edit re-evaluates the check without re-running the code pipeline. The job's display name SHALL remain `PR Title Lint`
because that exact string is a required status check of ruleset 21227644 (`integration_id=15368`).

The action configuration SHALL be unchanged by the relocation: the same `amannn/action-semantic-pull-request@v6`
action, the same allowed types (including `ops`), `requireScope: false`, `subjectPattern: '^(?![A-Z]).+$'`, and the
same `ignoreLabels` values.

#### Scenario: Valid PR title

- **WHEN** a pull request is opened, edited, synchronized or reopened
- **AND** the PR title follows Conventional Commits format (`type(scope): description`)
- **THEN** the `PR Title Lint` job succeeds
- **AND** the status check `PR Title Lint` reports success

#### Scenario: Invalid PR title

- **WHEN** a pull request is opened, edited, synchronized or reopened
- **AND** the PR title does NOT follow Conventional Commits format
- **THEN** the `PR Title Lint` job fails
- **AND** the status check `PR Title Lint` reports failure
- **AND** the PR cannot be merged (required check in ruleset 21227644)

#### Scenario: Title corrected without a new commit

- **WHEN** a pull request's title failed validation and the author edits the title in place
- **THEN** the `edited` trigger re-runs the job
- **AND** the status check reports a fresh verdict for the corrected title without a new commit being pushed

#### Scenario: PR title with valid type but missing description

- **WHEN** a pull request with title "feat:" is opened
- **THEN** the `PR Title Lint` job fails with error indicating missing description

#### Scenario: PR title with invalid type

- **WHEN** a pull request with title "feature: add login" is opened
- **THEN** the `PR Title Lint` job fails with error indicating invalid type
- **AND** suggests valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, ops

#### Scenario: Bot-authored PR (dependabot)

- **WHEN** a pull request authored by `dependabot[bot]` is opened
- **THEN** the `PR Title Lint` job executes normally (bots are NOT exempt from title lint)
- **AND** the PR title must still follow Conventional Commits

#### Acceptance Criteria

| ID      | Criterion                                                         | Status       |
| ------- | ----------------------------------------------------------------- | ------------ |
| AC-001a | Job `pr-title-lint` exists in `.github/workflows/pr-metadata.yml` | ⏳ pendiente |
| AC-001b | Job is parallel (no `needs` dependency)                           | ✅           |
| AC-001c | Uses `amannn/action-semantic-pull-request@v6`                     | ✅           |
| AC-001d | Types match `@commitlint/config-conventional` plus `ops`          | ✅           |
| AC-001e | `requireScope: false`                                             | ✅           |
| AC-001f | `subjectPattern` rejects capital-first (`^(?![A-Z]).+$`)          | ✅           |
| AC-001g | Registered as required check in ruleset 21227644                  | ⏳ pendiente |
| AC-001h | Job is defined in no more than one workflow (single emitter)      | ⏳ pendiente |

### Requirement: CI Composition

**Priority**: P1
**Component**: `.github/workflows/ci.yml`

The system SHALL keep `dco` as a parallel job of `ci.yml` and SHALL keep it in the
`prebuild-governance-complete.needs` array, which is the array that aggregates the governance jobs. It SHALL preserve
the `CI_MINIMAL` guard and the `contains(needs.*.result, ...)` gate of both aggregators.

`pr-title-lint` SHALL NOT be a job of `ci.yml`: it is defined in `.github/workflows/pr-metadata.yml` (see PR Title
Lint Validation) and SHALL NOT appear in `prebuild-governance-complete.needs`, because a GitHub Actions `needs` entry
cannot reference a job in another workflow. Metadata coverage reaches the aggregate only through the dedicated
metadata workflow's own required checks, which the ruleset binds directly.

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
- **AND** its job name remains exactly `PR Title Lint` (exact string for ruleset 21227644)
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
- **AND** the job name is `DCO` (exact string for ruleset)
- **AND** the job has `permissions: contents: read`
- **AND** the job handles both `pull_request` and `merge_group` events
- **AND** on `pull_request`: validates Signed-off-by on all commits
- **AND** on `merge_group`: emits success (PR-level check)

#### Scenario: DCO handles merge_group

- **WHEN** a merge queue event (merge_group) triggers ci.yml
- **THEN** the `dco` job emits success
- **AND** the required check is satisfiable in merge queue

#### Acceptance Criteria

| ID      | Criterion                                                                  | Status       |
| ------- | -------------------------------------------------------------------------- | ------------ |
| AC-005a | `pr-title-lint` job absent from ci.yml                                     | ⏳ pendiente |
| AC-005b | `dco` job present in ci.yml                                                | ✅           |
| AC-005c | `dco` is parallel (no `needs`)                                             | ✅           |
| AC-005d | `dco` present in `prebuild-governance-complete.needs` array                | ⏳ pendiente |
| AC-005e | `dco` has `permissions: contents: read`                                    | ✅           |
| AC-005f | `dco` handles `pull_request` and `merge_group` events                      | ✅           |
| AC-005g | `DCO` job name exactly matches the required check name in the ruleset      | ✅           |
| AC-005h | `ci-complete` preserves `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` | ✅           |
| AC-005i | No metadata check is listed in `prebuild-governance-complete.needs`        | ⏳ pendiente |
