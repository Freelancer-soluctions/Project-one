# Spec Delta — pr-metadata-workflow

## Purpose

Defines the dedicated workflow that owns PR metadata governance: it is triggered by edits to a pull request's title
and body (not only by code pushes), runs the metadata checks under a concurrency policy that never cancels a code
validation run, and guarantees that every required metadata check is emitted by exactly one place — including on
`merge_group`, where a silently absent required check blocks the merge queue forever.

## ADDED Requirements

### Requirement: Metadata checks live in their own workflow

The system SHALL define a workflow file `.github/workflows/pr-metadata.yml` that owns PR metadata validation, and
SHALL NOT define the metadata jobs inside `.github/workflows/ci.yml`.

The separation exists because the two workflows answer different questions on different inputs: `ci.yml` validates
the code at a commit SHA, while this workflow validates mutable metadata. Merging them would force one trigger set
and one concurrency policy onto both.

The file name SHALL be `pr-metadata.yml`. It SHALL NOT be `pr-validation.yml`, `lint.yml`, `formatter.yml` or
`quality.yml`, because `zombie-workflow-guard` fails the build when any of those names reappears and these names were
retired deliberately.

#### Scenario: Metadata jobs are not in ci.yml

- **WHEN** the job definitions of `.github/workflows/ci.yml` are inspected
- **THEN** neither `pr-title-lint` nor `pr-body-lint` is defined there
- **AND** the metadata check names are emitted only by `.github/workflows/pr-metadata.yml`

#### Scenario: A forbidden workflow file name is reintroduced

- **WHEN** a file named `pr-validation.yml`, `lint.yml`, `formatter.yml` or `quality.yml` is added under
  `.github/workflows/`
- **THEN** the `zombie-workflow-guard` job fails the build

### Requirement: Workflow triggers on metadata changes and merge queue

The workflow SHALL trigger on `pull_request` with exactly the types `opened`, `edited`, `synchronize` and `reopened`,
and SHALL also trigger on `merge_group`.

`edited` is the reason the workflow exists: a title or body correction must re-evaluate the metadata checks without
requiring a new commit. `synchronize` and `reopened` are kept because a push or a reopen also re-renders the metadata
state. `merge_group` is mandatory because the metadata checks are required status checks: a required check that never
reports on a merge-queue entry leaves the entry blocked indefinitely.

The workflow SHALL NOT declare `workflow_dispatch`. A dispatch run carries no pull request payload, so it could not
evaluate the check it was meant to backfill; a head commit that has never been evaluated is backfilled by nudging a
real event (a no-op body edit), and that is the documented procedure when a context is attached to the ruleset.

#### Scenario: PR body corrected after a failure

- **WHEN** a pull request fails the body check and its author edits the body without pushing a commit
- **THEN** the workflow runs again on the `edited` event
- **AND** the metadata checks report a fresh verdict for the corrected body
- **AND** no new commit is required for the re-evaluation

#### Scenario: PR title corrected after a failure

- **WHEN** a pull request fails the title check and its author edits the title without pushing a commit
- **THEN** the workflow runs again on the `edited` event
- **AND** the title check reports a fresh verdict for the corrected title

#### Scenario: Code push re-runs the metadata checks

- **WHEN** commits are pushed to a pull request branch
- **THEN** the workflow runs on the `synchronize` event
- **AND** both metadata jobs report

#### Scenario: Merge queue entry is evaluated

- **WHEN** the pull request enters the merge queue and a `merge_group` event is emitted
- **THEN** the workflow runs and both metadata jobs report a status
- **AND** neither required metadata check is left pending in the merge-queue entry

### Requirement: Concurrent metadata runs never cancel each other or a code run

The workflow SHALL declare a concurrency group derived from the pull request number, falling back to the git ref when
no pull request number exists (as on `merge_group`), and SHALL set `cancel-in-progress: false`.

`cancel-in-progress: false` is required rather than preferred. GitHub keeps at most one in-progress and one pending run
per group: with the flag false, a newly created run waits instead of killing the one in flight, and if yet another run
is queued the earlier _pending_ one is cancelled. That is acceptable, because a run that never started never reported
anything and cannot strand a check, while a cancelled in-progress run does report `cancelled` — a conclusion the
ruleset treats as blocking, on a commit whose metadata the author has already fixed.

The group is namespaced (`pr-metadata-<number>`), which is what prevents any collision with `ci.yml`'s `pr-<number>`
group; the flag itself governs only runs inside this workflow.

The fallback for the group expression is required because `merge_group` events carry no `pull_request` object; an
unguarded pull-request-number reference evaluates to an empty string there and collapses every merge-queue entry into
a single shared group.

#### Scenario: Two rapid metadata edits

- **WHEN** a PR body is edited twice in quick succession
- **THEN** the second run waits for the first instead of cancelling it
- **AND** the newest run completes last, so the verdict the required check observes is the one for the latest edit

#### Scenario: Three rapid metadata edits

- **WHEN** a PR body is edited three times in quick succession
- **THEN** the newest run is created last and therefore completes last
- **AND** any superseded _pending_ run may be cancelled, which is harmless because it never reported a conclusion

#### Scenario: Merge queue entry has no pull request number

- **WHEN** the workflow runs on a `merge_group` event
- **THEN** the concurrency group falls back to the git ref instead of resolving to an empty value
- **AND** distinct merge-queue entries do not share a single concurrency group

### Requirement: Minimal read-only permissions

The workflow SHALL declare `contents: read` at workflow level. The title job SHALL declare `pull-requests: read`; the
body job SHALL declare `contents: read` and `pull-requests: read`.

The workflow SHALL NOT use the `pull_request_target` trigger, SHALL NOT request `pull-requests: write`, and SHALL NOT
post comments on the pull request. Metadata validation only reads the payload and reports a conclusion: a job that
needs write access to a pull request is not performing validation, and `pull_request_target` runs with a privileged
token against untrusted code, which is precisely the combination that turns a lint job into an attack surface.

#### Scenario: Workflow token is read-only

- **WHEN** the workflow's `permissions` blocks are inspected
- **THEN** the workflow level grants `contents: read`
- **AND** no job requests `pull-requests: write` or any other write scope

#### Scenario: Forbidden trigger or privileged token

- **WHEN** a proposed change adds `pull_request_target` to the workflow, or requests `pull-requests: write`
- **THEN** the change is rejected during review because it widens the token beyond what validation requires
- **AND** the validation result is reported through the job conclusion, not through a PR comment

### Requirement: Both metadata jobs report under the contract names

The workflow SHALL define two jobs whose display names are exactly `PR Title Lint` and `Governance: PR Body Lint`.

`PR Title Lint` preserves the name it already has as a required status check of ruleset 21227644
(`integration_id=15368`): the ruleset matches required contexts as an exact string, so changing it silently detaches
the requirement. `Governance: PR Body Lint` carries the `Governance:` prefix of the block it is defined in, per the
job-naming convention.

#### Scenario: Job names match the required contexts

- **WHEN** the `name:` values of the two jobs are read
- **THEN** they are exactly `PR Title Lint` and `Governance: PR Body Lint`
- **AND** `PR Title Lint` is identical to the context already required by ruleset 21227644

#### Scenario: Renaming a required context without the ruleset

- **WHEN** either job's `name:` is changed and the ruleset's required contexts are not updated in the same operation
- **THEN** the pull requests stay blocked with `Expected — Waiting for status to be reported`
- **AND** that state is treated as a defect, because the message does not reveal that a rename caused it

### Requirement: Each required metadata check has exactly one emitter

The required status check `PR Title Lint` SHALL be emitted by exactly one job in exactly one workflow at any commit.
The migration of that job into this workflow SHALL add the new workflow and remove the job from
`.github/workflows/ci.yml` atomically, so that no commit exists in which both workflows define a job with that
display name.

Two workflows emitting the same context name do not merge into one check: they produce two runs with identical
names, and the ruleset requirement is satisfied by whichever reports a success first. A red verdict from one emitter
can therefore be masked by a green verdict from the other.

#### Scenario: Atomic migration

- **WHEN** the commit that introduces `.github/workflows/pr-metadata.yml` is inspected
- **THEN** the same commit removes the `pr-title-lint` job from `.github/workflows/ci.yml`
- **AND** no commit in the history defines `PR Title Lint` in both workflow files

#### Scenario: Duplicate emitter is detected

- **WHEN** a search for the display name `PR Title Lint` across `.github/workflows/` returns more than one definition
- **THEN** the duplication is treated as a contract violation to fix before merge

### Requirement: Both jobs report on merge_group

Both jobs SHALL be defined on a `merge_group` event and SHALL conclude with a definitive status on it. No job-level
`if` SHALL evaluate false for `merge_group`.

The title job concludes through an explicit no-op step guarded by `if: github.event_name == 'merge_group'`, which
echoes that the squash commit title is validated by `commitlint --last`.

The body job SHALL evaluate its policy only for `pull_request` events, because a merge-queue entry has no pull request
body; on `merge_group` its validation steps are skipped and it concludes successfully through its own explicit no-op
step. The body job's only job-level exclusion is bot authors, which is a documented exemption from the policy itself
and is verified against the ruleset in the migration tasks.

A required status check that is never emitted on a merge-queue entry blocks that entry permanently, with no error
other than a missing status. The no-ops are explicit (a step that echoes why it does nothing) rather than implicit, so
the reason is readable in the job log instead of being inferred from an empty job.

#### Scenario: Merge group no-op for the title job

- **WHEN** the title job runs on a `merge_group` event
- **THEN** the title-lint validation step is skipped and the merge-group step runs, echoing that the squash commit
  title is validated by `commitlint --last`
- **AND** the job concludes successfully

#### Scenario: Merge group no-op for the body job

- **WHEN** the body job runs on a `merge_group` event
- **THEN** the body validation steps are skipped and the merge-group step runs, echoing that a merge-queue entry has
  no pull request body to validate
- **AND** the job concludes successfully instead of reporting nothing

#### Scenario: A job excludes merge_group

- **WHEN** either job declares a job-level condition that evaluates false on `merge_group`
- **THEN** the job reports nothing for the queue entry
- **AND** the configuration is treated as a defect because the required check no longer guarantees a conclusion
