# Spec Delta

## ADDED Requirements

### Requirement: Build jobs depend on the prebuild verdicts

The `client-build` and `server-build` jobs SHALL depend on the four prebuild aggregators
`[prebuild-governance-complete, prebuild-quality-complete, prebuild-security-complete,
prebuild-tests-complete]` and on no individual prebuild job. Their previous six-entry `needs` lists SHALL be
replaced, not augmented: a build job that listed individual quality jobs could run while governance, security or
unit testing was red, because no entry in that list carried those verdicts.

Each build job SHALL carry an explicit success predicate over the four aggregator `result` values. An explicit
predicate is required because the aggregators declare `always()`: their _execution_ does not imply a green
_verdict_, so the implicit `success()` of a `needs` entry is not sufficient to catch a red aggregator.

The build jobs SHALL remain disabled by the literal condition `false`, and that literal SHALL compose with the
predicate as a conjunction evaluated left to right: the effective condition is `false AND <predicate>`, which
evaluates to `false` for every possible `needs` state, so the disabled behaviour of the jobs is unchanged. The
activation procedure SHALL be the replacement of the `false` term with `true`, which yields the predicate alone and
therefore the intended gate, without rewriting the expression.

#### Scenario: Build needs resolution

- **WHEN** `client-build` or `server-build` is inspected
- **THEN** its `needs` array contains exactly the four prebuild aggregators — no individual prebuild job, and no
  aggregator omitted
- **AND** neither `client-format-check`, `client-lint`, `server-lint`, `server-format-check`, the two `typecheck`
  jobs, the two `complexity` jobs, the two `dead-code` jobs nor the two `import-bounds` jobs appear in either list

#### Scenario: A red prebuild verdict blocks build

- **WHEN** any of the four prebuild aggregators finalizes with `failure`, while the four aggregator jobs still
  executed because they declare `always()`
- **THEN** the build predicate evaluates to false and the build job does not run with a green verdict attributed to
  it
- **AND** the failure is not absorbed by the implicit `success()` semantics of `needs`

#### Scenario: The disabled state is preserved

- **WHEN** the build jobs are read on this change's commit
- **THEN** both declare the literal condition `false`, so both evaluate to `false` regardless of the `needs` results
- **AND** no build job runs, and no observable behaviour of a pull request changes

#### Scenario: Activation yields the intended gate

- **WHEN** an operator activates a build job by replacing its `false` term with `true`
- **THEN** the surviving expression is the four-aggregator success predicate
- **AND** the operator does not have to reconstruct the predicate, because it was already present in the condition

### Requirement: build-complete

A `build-complete` aggregator job SHALL exist in `ci.yml` with `name: Build Complete` and `needs:
[client-build, server-build]`. It SHALL declare `always()`, so that its two disabled members — which finalize as
`skipped` rather than `success` — do not cascade a skip onto the aggregator itself, and so that a stage verdict
exists for `ci-complete` and for the two post-build aggregators to consume.

The single-point-of-failure shape of this rung is **intentional, not a defect to fix**. Both post-build aggregators
list `build-complete` in their `needs`, so a red `build-complete` makes `postbuild-tests-complete` AND
`postbuild-analysis-complete` red from one root cause: a reader sees three red checks for one failure. The build
verdict is the actionable one — the two post-build verdicts are red _because_ their shared parent is red, and their
own members may be perfectly healthy. Collapsing the three into one would restore the single-verdict-for-two-taxonomies
defect this change removes (Decision 8); suppressing the propagation on the post-build side would let a red stage
domain silently pass. Neither is correct: keep the three checks and read the build verdict first.

#### Scenario: Build aggregator needs resolution

- **WHEN** `build-complete` is inspected
- **THEN** its `needs` array contains exactly `client-build` and `server-build` — no more, no less

#### Scenario: Disabled build jobs do not skip the aggregator

- **WHEN** `client-build` and `server-build` both finalize with `skipped` because they declare the literal condition
  `false`
- **THEN** `build-complete` still executes, because it declares `always()`
- **AND** it finalizes with success, because skipped members are tolerated by its verdict rule

### Requirement: postbuild-tests-complete

A `postbuild-tests-complete` aggregator job SHALL exist in `ci.yml` with `name: Postbuild Tests Complete` and
`needs: [build-complete, test-integration, test-smoke, e2e]`. It SHALL declare `always()`, so that its disabled
member `e2e` — which finalizes as `skipped` rather than `success` — does not cascade a skip onto the aggregator
itself, and so that a testing verdict exists for `ci-complete` to consume.

This aggregator is the TESTING branch of the post-build stage. It SHALL NOT aggregate static-analysis jobs: those
belong to `postbuild-analysis-complete`, so that a red `e2e` and a red `depcheck` produce two distinguishable
verdicts instead of collapsing into one `failure`.

#### Scenario: Post-build tests aggregator needs resolution

- **WHEN** `postbuild-tests-complete` is inspected
- **THEN** its `needs` array contains exactly `build-complete`, `test-integration`, `test-smoke`, `e2e` — no more,
  no less
- **AND** no SonarQube or depcheck job appears in it

#### Scenario: A red e2e reaches the root aggregator through the tests branch

- **WHEN** `e2e` is active and finalizes with `failure`
- **THEN** `postbuild-tests-complete` finalizes with failure
- **AND** `postbuild-analysis-complete` is unaffected and still reports its own verdict
- **AND** `ci-complete` finalizes with failure, because it lists `postbuild-tests-complete` in its `needs`

#### Scenario: Post-build tests aggregator runs with a disabled member

- **WHEN** `e2e` finalizes as `skipped` while `test-integration` and `test-smoke` pass
- **THEN** `postbuild-tests-complete` executes and finalizes with success

### Requirement: postbuild-analysis-complete

A `postbuild-analysis-complete` aggregator job SHALL exist in `ci.yml` with `name: Postbuild Analysis Complete` and
`needs: [build-complete, client-sonarqube, server-sonarqube, client-depcheck, server-depcheck]`. It SHALL declare
`always()`, so that its four disabled members — all `if: false` — do not cascade a skip onto the aggregator itself.

This aggregator is the ANALYSIS branch of the post-build stage and SHALL NOT aggregate test jobs: static analysis is
a different taxonomy from testing, and merging the two would make a red `depcheck` indistinguishable from a red
`e2e` in the Checks list.

#### Scenario: Post-build analysis aggregator needs resolution

- **WHEN** `postbuild-analysis-complete` is inspected
- **THEN** its `needs` array contains exactly `build-complete`, `client-sonarqube`, `server-sonarqube`,
  `client-depcheck`, `server-depcheck` — no more, no less
- **AND** no test job appears in it

#### Scenario: A red depcheck reaches the root aggregator through the analysis branch

- **WHEN** `client-depcheck` or `server-depcheck` is active and finalizes with `failure`
- **THEN** `postbuild-analysis-complete` finalizes with failure
- **AND** `postbuild-tests-complete` is unaffected and still reports its own verdict
- **AND** `ci-complete` finalizes with failure, because it lists `postbuild-analysis-complete` in its `needs`

#### Scenario: All analysis members disabled

- **WHEN** `client-sonarqube`, `server-sonarqube`, `client-depcheck` and `server-depcheck` all finalize as `skipped`
- **THEN** `postbuild-analysis-complete` executes and finalizes with success

### Requirement: Stage aggregator verdict semantics

The `build-complete`, `postbuild-tests-complete` and `postbuild-analysis-complete` aggregators SHALL apply the
verdict rule of the four prebuild aggregators: a `failure` among the `needs` results SHALL produce exit code 1, a
`cancelled` SHALL produce exit code 1, and a `skipped` SHALL produce exit code 0. The `cancelled` handling SHALL
match the criterion already recorded in `.github/workflows/pr-metadata.yml` for its concurrency block: a cancelled
run is not a success for a verdict that gates a merge.

The tolerance of `skipped` is mandatory rather than permissive: every member of the three stage aggregators is
either disabled with the literal condition `false` or path-scoped to `pull_request`, so requiring a `success` would
fail every pull request the moment the aggregators are introduced.

#### Scenario: Failure propagates

- **WHEN** any member of `build-complete`, `postbuild-tests-complete` or `postbuild-analysis-complete` finalizes with
  `failure`
- **THEN** the aggregator exits with code 1 and reports failure

#### Scenario: Cancellation is not a success

- **WHEN** any member of `build-complete`, `postbuild-tests-complete` or `postbuild-analysis-complete` finalizes with
  `cancelled`
- **THEN** the aggregator exits with code 1
- **AND** the behaviour differs from `ci-complete`, which treats `cancelled` as success — a divergence recorded as
  out of scope for this change

#### Scenario: Skipped members are tolerated

- **WHEN** every member of `build-complete` finalizes as `skipped`
- **THEN** the aggregator exits with code 0 and reports the stage as succeeded or skipped
- **AND** no pull request is failed by the mere absence of a build run

### Requirement: Stage aggregator names are registered as stage siblings

The aggregator naming convention SHALL distinguish substage aggregators from stage aggregators. Substage
aggregators of STAGE 2 SHALL keep the `Prebuild <Substage> Complete` pattern. Stage aggregators SHALL be named
`<Stage> Complete`: `Build Complete` for STAGE 3 BUILD, and `Postbuild Tests Complete` and `Postbuild Analysis
Complete` for the two branches of STAGE 4 POST-BUILD. The root aggregator SHALL remain `CI Complete`.

The deviation is intentional: none of the three stage aggregators carries the `Prebuild ` prefix, because they
aggregate a whole stage rather than a substage of STAGE 2, and prefixing them would place a STAGE 3 or STAGE 4
verdict inside the STAGE 2 substage family it does not belong to. The job ids (`build-complete`,
`postbuild-tests-complete`, `postbuild-analysis-complete`) SHALL NOT be renamed by this convention.

#### Scenario: A stage aggregator is named

- **WHEN** the aggregators of `ci.yml` are listed
- **THEN** the STAGE 2 aggregators read `Prebuild Governance Complete`, `Prebuild Quality Complete`,
  `Prebuild Security Complete`, `Prebuild Tests Complete`
- **AND** the STAGE 3 aggregator reads `Build Complete`
- **AND** the two STAGE 4 aggregators read `Postbuild Tests Complete` and `Postbuild Analysis Complete`
- **AND** the root aggregator reads `CI Complete`

#### Scenario: A stage aggregator is not mistaken for a substage aggregator

- **WHEN** a reader scans the Checks list for the name of a STAGE 2 substage verdict
- **THEN** no STAGE 3 or STAGE 4 aggregator carries the `Prebuild ` prefix
- **AND** the `Prebuild ` prefix continues to identify exactly the four substage aggregators

## RENAMED Requirements

- FROM: `### Requirement: prebuild-unit-tests-complete`
- TO: `### Requirement: prebuild-tests-complete`

## MODIFIED Requirements

### Requirement: prebuild-tests-complete

The `prebuild-tests-complete` aggregator SHALL depend on exactly 5 jobs: `[test-unit-client, test-unit-server,
client-coverage, server-coverage, property-tests]`. `test-unit-client`, `test-unit-server` and `property-tests` are
the tier-1 unit-test jobs of the prebuild testing tier; `client-coverage` and `server-coverage` are the
coverage-tripwire jobs and SHALL remain defined outside the Substage 2D block (their physical location does not
move).

`test-integration` and `test-smoke` SHALL NOT be part of this `needs` array: both are physically defined in STAGE 4
POST-BUILD, so listing them here gave a prebuild verdict two post-build members. They belong to
`postbuild-tests-complete` exclusively.

`property-tests` SHALL be listed even though it declares `continue-on-error: true`. Its inclusion is **record-only**:
it closes a taxonomy gap — a tier-1 test that was absent from the tier-1 verdict — and SHALL NOT be read as making
that job blocking. The `continue-on-error` flag SHALL NOT be removed, so a property-test failure remains absorbed at
job level and cannot fail this aggregator.

Not only `property-tests`: **all five members of this aggregator carry `continue-on-error: true`** — `test-unit-client`
(`ci.yml:470`), `test-unit-server` (`ci.yml:766`), `client-coverage` (`ci.yml:1055`), `server-coverage`
(`ci.yml:1148`) and `property-tests` (`ci.yml:1219`). That is the repo's FASE 1 advisory posture, so this aggregator
currently reports **success regardless of the individual failures of any of its members**, and its verdict carries no
blocking force today. Only the governance, quality and security verdicts block anything. The tier-1 rung is therefore
structurally present but **vacuous in effect** until the `ci-testing-gate-promotion` change removes
`continue-on-error`; this requirement is what makes that state explicit instead of implied.

The jobs `test-e2e` and `coverage` do NOT exist as job names in ci.yml, and `e2e` stays excluded (`if: false`,
explicitly out of scope).

#### Scenario: Unit-tests aggregator needs resolution

- **WHEN** `prebuild-tests-complete` runs
- **THEN** its `needs` array contains exactly those 5 jobs — no more, no less
- **AND** `test-integration` and `test-smoke` are absent from it

#### Scenario: property-tests is recorded but not made blocking

- **WHEN** `property-tests` finalizes with `failure` while retaining `continue-on-error: true`
- **THEN** the job-level flag absorbs the failure and the job reports as successful or neutral to its dependents
- **AND** `prebuild-tests-complete` does not fail because of it
- **AND** the job is listed in the aggregator's `needs` regardless, so the tier-1 inventory is complete on paper

#### Scenario: Post-build jobs are not aggregated by a prebuild verdict

- **WHEN** the `needs` of the four prebuild aggregators are inspected for jobs physically defined in STAGE 3 BUILD or
  STAGE 4 POST-BUILD
- **THEN** no such job appears in any of them
- **AND** `test-integration` and `test-smoke` appear only in `postbuild-tests-complete.needs`

#### Scenario: Path-skipped jobs count as passing

- **WHEN** a PR touches only `apps/client/**`, so `test-unit-server` and `server-coverage` are skipped by their path
  conditions
- **THEN** the aggregator treats the skipped `needs` as passing and finalizes with success if the client-side chain
  (`test-unit-client`, `client-coverage`) is green

#### Scenario: Coverage tripwire failure propagates

- **WHEN** the `ci-testing-gate-promotion` change has removed `continue-on-error: true` from `server-coverage`, and
  `server-coverage` then finalizes with `failure` (coverage below the workspace thresholds or a missing/stale summary)
- **THEN** `prebuild-tests-complete` finalizes with failure and `ci-complete` blocks the merge
- **AND** this propagation does not hold before FASE 2: under the current advisory posture the coverage job is
  reported but the aggregator still finalizes with success

### Requirement: ci-complete depends on aggregators

The `ci-complete` aggregator SHALL depend on exactly 9 items: the 4 prebuild substage aggregators, the 3 stage
aggregators `build-complete`, `postbuild-tests-complete` and `postbuild-analysis-complete`, plus
`zombie-workflow-guard` and `repo-discovery`.

The dependency chain SHALL be prebuild → build → {postbuild tests, postbuild analysis} → ci-complete:
`build-complete` consumes the four prebuild verdicts through the build jobs, the two post-build aggregators consume
`build-complete` plus their own tier's jobs, and `ci-complete` consumes every stage verdict. This chain is what makes
a red build, a red post-build test or a red post-build analysis job reach the root verdict; without the three stage
aggregators, those stages had no path into `ci-complete` at all.

#### Scenario: ci-complete needs resolution

- **When** `ci-complete` runs
- **Then** its `needs` array contains exactly: `[prebuild-governance-complete, prebuild-quality-complete,
prebuild-security-complete, prebuild-tests-complete, build-complete, postbuild-tests-complete,
postbuild-analysis-complete, zombie-workflow-guard, repo-discovery]`

#### Scenario: The stage chain reaches the root verdict

- **When** a member of `postbuild-tests-complete` or of `postbuild-analysis-complete` fails
- **Then** that aggregator reports failure
- **And** `ci-complete` reports failure through its entry for that aggregator
- **And** both post-build aggregators in turn report failure when `build-complete` fails

#### Scenario: The two post-build branches stay distinguishable

- **When** `postbuild-tests-complete` fails and `postbuild-analysis-complete` succeeds
- **Then** the Checks list shows one red testing verdict and one green analysis verdict
- **And** `ci-complete` fails because of the testing branch alone, without the analysis branch inheriting the failure

#### Scenario: A skipped stage aggregator does not fail the root verdict

- **When** `build-complete`, `postbuild-tests-complete` or `postbuild-analysis-complete` finalizes as `skipped`
- **Then** `ci-complete` treats the skipped entry as passing and finalizes with success if every other entry passed

### Requirement: Aggregator skip on CI_MINIMAL

The system SHALL skip all 4 aggregator jobs when `CI_MINIMAL=true`, preventing false failure reports.

The 4 jobs are the STAGE 2 substage aggregators, whose ids are `prebuild-governance-complete`,
`prebuild-quality-complete`, `prebuild-security-complete` and `prebuild-tests-complete`. The three stage aggregators
introduced alongside this requirement (`build-complete`, `postbuild-tests-complete`,
`postbuild-analysis-complete`) deliberately do **not** carry the `CI_MINIMAL` clause, so "all 4" remains exact.

#### Scenario: PR with CI_MINIMAL=true

- **When** a PR targets `main` and `vars.CI_MINIMAL=true`
- **Then** the 4 aggregators `prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-tests-complete` evaluate `if: CI_MINIMAL != 'true' && always()` as false and are marked SKIPPED
- **And** no aggregator reports a failure to the GitHub status check system

#### Scenario: The stage aggregators are not part of the CI_MINIMAL gate

- **When** `vars.CI_MINIMAL=true`
- **Then** `build-complete`, `postbuild-tests-complete` and `postbuild-analysis-complete` still evaluate their own
  `always()` condition and still report
- **And** their skipped members are tolerated by the verdict rule, so they report success rather than being skipped

### Requirement: Jobs with no block are enumerated as role exceptions

The `name:` of a job that does not belong to any substage SHALL NOT be given a block prefix. The complete set of such
jobs is enumerated here so that a future normalization change evaluates them against this list instead of reporting
them as inconsistencies:

- `repo-discovery` (`Detect Changes`) — the ENTRY path-filter; it precedes every substage and decides which jobs run.
- `zombie-workflow-guard` (`Zombie Workflow Guard`) — a GUARD assertion about the repository itself, outside the DAG's
  stage structure.
- `ci-complete` (`CI Complete`) — the root aggregator; by definition it does not belong to a substage.
- `build-complete` (`Build Complete`) — a STAGE aggregator (STAGE 3 BUILD), not a substage aggregator.
- `postbuild-tests-complete` (`Postbuild Tests Complete`) — a STAGE aggregator (STAGE 4 POST-BUILD, testing branch).
- `postbuild-analysis-complete` (`Postbuild Analysis Complete`) — a STAGE aggregator (STAGE 4 POST-BUILD, analysis
  branch).

The three stage aggregators are exempt for a structural reason, not by oversight: the `Prebuild … Complete` family
prefix names a _substage of STAGE 2_, and a STAGE 3 or STAGE 4 verdict does not belong to that family. Their role is the
role of `ci-complete` — they exist to aggregate, not to be aggregated into a stage — one level below the root.

A job outside this list and outside the ruleset exemption SHALL be reported as an inconsistency to fix.

#### Scenario: An unprefixed job is judged against the exception list

- **WHEN** a future change inventories job names for missing prefixes
- **THEN** the six role-exception jobs above and the ruleset-bound contexts covered by
  _Checks bound to the ruleset are exempt from renaming_ are treated as known, documented exceptions
- **AND** any other unprefixed job is reported as an inconsistency to fix

#### Scenario: A stage aggregator is not reported as a missing-prefix inconsistency

- **WHEN** a normalization pass finds `Build Complete`, `Postbuild Tests Complete` or `Postbuild Analysis Complete`
  without a `Build:` or `Quality:` block prefix
- **THEN** each is matched against this enumeration and treated as correct as-is
- **AND** no `Build:` prefix is added to `Build Complete`, because it aggregates the build stage rather than belonging
  to it
