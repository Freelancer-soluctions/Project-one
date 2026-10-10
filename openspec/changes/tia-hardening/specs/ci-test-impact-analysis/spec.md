# Spec Delta — ci-test-impact-analysis (hardening)

## MODIFIED Requirements

### Requirement: MODIFIED Diff-scoped unit test execution in CI

When a workspace test job runs for a PR, it SHALL execute the tests selected by the TIA selection
contract: every test affected by the diff between the PR head and `origin/main`, plus any
previously-failing test injected from recent full-suite history (see "Previously-failing test
injection"), via the workspace CI script `test:changed:ci`, defined in BOTH workspaces on top of
`vitest run --changed origin/main --coverage` (client) and `vitest run ".unit.test.js" --changed
origin/main --coverage` (server, unit filter first) with reporters and output paths explicit, never
left to defaults — JUnit AND JSON (`--outputFile.junit=reports/junit.xml`,
`--outputFile.json=reports/vitest-results.json`, which the shadow-mode metric reads) plus the flaky
reporter — extended with `--coverage.changed=origin/main` so the coverage report of a scoped run is
limited to the files the diff touched instead of mixing executed with merely imported code, and
executed with coverage thresholds neutralized for the scoped run itself,
with the full git history already provided by the checkout of `ci.yml` (`fetch-depth: 0` is declared
today — confirm, nothing to add) so `origin/main` is available, and with threshold evaluation of this
diff-scoped coverage deferred to full-suite runs (decision D18): in diff-scoped scope the test run
itself SHALL NOT evaluate coverage thresholds against the limited report — Vitest enforces
`coverage.thresholds` natively, so the scoped run executes with them neutralized (a scoped Vitest
config that zeroes the four global thresholds and declares no per-glob/per-file thresholds) — AND
`scripts/ci/check-coverage.mjs` runs in advisory mode (it reports the diff-limited numbers but never
fails the job), while `scope=full` keeps evaluating thresholds exactly as today, natively in the run
and via the guard.

#### Scenario: PR touches a single client module

- **WHEN** a PR changes one module under `apps/client/src/**`
- **THEN** `test-unit-client` runs `npm run test:changed:ci --workspace=apps/client`, executing the client test files whose sources changed (plus any injected previously-failing tests)
- **AND** the job stays in `prebuild-unit-tests-complete.needs`, so its result (including "no affected tests") still counts for the merge gate

#### Scenario: origin/main unavailable

- **WHEN** the checkout cannot resolve `origin/main` (shallow or detached fetch)
- **THEN** the job fails loudly (or falls back to the full suite) instead of silently reporting zero affected tests

#### Scenario: Scoped coverage is diff-limited and advisory

- **WHEN** a `scope=changed` run finishes and produces `coverage-summary.json`
- **THEN** the summary contains only the source files changed by the diff (`--coverage.changed=origin/main`)
- **AND** the test run itself finishes without failing on coverage thresholds (neutralized for scoped runs)
- **AND** `check-coverage.mjs` reports the numbers as advisory output without failing the job (D18 deferral preserved)

#### Scenario: Full-suite coverage keeps enforcing thresholds

- **WHEN** `scope=full` (shared path change, unresolvable base, or D7 zero-test fallback)
- **THEN** the coverage report covers the whole suite and `check-coverage.mjs` evaluates thresholds as before this change

## ADDED Requirements

### Requirement: ADDED Shadow-mode selection metric

Every workspace test job SHALL publish a shadow-mode selection metric to the GitHub step summary that
records what TIA selected without ever changing what runs: the candidate test set computed with
`vitest list --changed --filesOnly` for the workspace, the changed-file count of the diff, the number
of tests actually executed (`numTotalTests`), and the full-suite total used as denominator, so the
percentage of the suite selected per PR and false-positive fan-out (e.g. dynamic imports pulling a
router and half the app) are observable on every run. The metric SHALL be advisory: a failure or an
empty result of the measurement step SHALL leave the job outcome and the executed selection untouched
(D7 remains the only zero-test safety net).

#### Scenario: Diff-scoped PR publishes the metric

- **WHEN** a PR run resolves `scope=changed`, the diff touches K files and the selection executes N of T tests
- **THEN** the step summary shows K changed files, N/T selected tests and the resulting percentage
- **AND** runs resolved to `scope=full` are labelled as full-suite so selection averages exclude them

#### Scenario: Measurement never gates

- **WHEN** `vitest list --changed --filesOnly` fails (tooling error or base not resolvable for the audit)
- **THEN** the job still executes the selection defined by `test:changed:ci` and the metric is reported as unavailable
- **AND** the job result is not flipped by the missing metric alone

### Requirement: ADDED Previously-failing test injection

The TIA selection SHALL be extended with the tests that failed in the most recent N full-suite runs
of `main` (nightly and `scope=full` PR runs), Microsoft-TIA style, independent of the diff graph, so
a red test on the default branch is re-checked on the next PR instead of waiting for the next nightly.
Injection SHALL be bounded (N configurable, default 3), SHALL be a no-op when no history exists
(first run, missing artifact, corrupt file — never a failure and never an empty selection), and SHALL
be reported separately from the diff-derived selection in the shadow-mode metric.

#### Scenario: A test red on main runs on an unrelated PR

- **WHEN** `auth.service.unit.test.js` failed in the latest full-suite run of `main` and a new PR touches only `events/`
- **THEN** the scoped run executes both the diff-derived selection and `auth.service.unit.test.js`

#### Scenario: No history available

- **WHEN** no full-suite history artifact can be read
- **THEN** the selection is exactly the diff-derived one and the run proceeds normally

#### Scenario: Injection is visible

- **WHEN** injection adds M tests to the selection
- **THEN** the shadow-mode metric reports M injected tests separately from the diff-derived count

### Requirement: ADDED Persistent test-to-source coverage map

Full-suite runs (nightly and `scope=full` PR runs) SHALL publish a persistent test-to-source map
artifact per workspace — the per-test dependency graph recorded during that run, including source
files loaded dynamically at execution time when the runner reports them — keyed with the base
revision it describes, and diff-scoped PR runs SHALL consume the map matching their base so the
selection is computed from the recorded map instead of being rebuilt from the working tree alone.
When the map is absent, stale or corrupt, selection SHALL be recomputed from the static import graph
of the checkout and the run SHALL report the miss (`map=miss`) — never a silently empty selection
(falls through to D7).

#### Scenario: Full-suite run publishes the map

- **WHEN** a nightly or `scope=full` run completes with coverage
- **THEN** the coverage map is uploaded as an artifact together with the revision it was computed from

#### Scenario: PR consumes a matching map

- **WHEN** a diff-scoped run downloads a coverage map keyed to its base revision
- **THEN** the selection uses it and the shadow-mode metric records `map=hit`

#### Scenario: Missing or corrupt map

- **WHEN** no matching map can be downloaded, or the downloaded map fails validation
- **THEN** the run falls back to the static import-graph selection and records `map=miss`
- **AND** the D7 zero-test guard still applies

### Requirement: ADDED TIA scope extension to integration and e2e tiers

The `Resolve TIA scope` contract (diff-scoped vs full, shared-path override, unresolvable-base
fallback) and the D7 zero-test guard SHALL be extended to the integration test job, and to the e2e
job whenever `ci-e2e` activates it (it is `if: false` today — activation stays owned by that
capability), so every test tier answers the same scope question with the same fallbacks. The local
pre-push tier stays unit-only and DB/e2e-free as specified by `pre-push-scoped-testing`.

#### Scenario: Integration job runs scoped

- **WHEN** a PR changes sources covered by integration tests and `repo-discovery.outputs.shared == 'false'`
- **THEN** the integration job runs the integration tests affected by the diff instead of the full integration suite

#### Scenario: Integration selection is empty

- **WHEN** the diff-scoped integration selection matches zero tests
- **THEN** the job falls back to the full integration suite and records `scope=full`, never a vacuous green

#### Scenario: e2e follows the contract when active

- **WHEN** the `e2e` job is enabled and runs for a PR
- **THEN** it resolves its scope with the same `Resolve TIA scope` logic and the same D7 fallback

### Requirement: ADDED Fail-first ordering of scoped runs

Scoped runs SHALL order the selected test files so that files with a recorded failure in the recent
history run first, surfacing the first failure as early as possible (rule 21 / smart ordering of
`docs/ci-cd-pipeline-empresarial.md` §23.3). Ordering SHALL NOT change _which_ tests run, and with
no history available the order SHALL be deterministic (stable across runs on the same input) so
order-dependence bugs stay reproducible.

#### Scenario: Historical failure surfaces first

- **WHEN** the selection contains a file that failed in the last full-suite runs and the diff introduces a new failure in another file
- **THEN** the historically failing file runs first and its failure appears earliest in the log

#### Scenario: Deterministic order without history

- **WHEN** no ordering history exists
- **THEN** the selected files run in a stable, reproducible order and every selected test still executes

### Requirement: ADDED Shadow-mode evidence before gate promotion

The diff-scoped TIA jobs SHALL treat the accumulated shadow-mode metric as the evidence of the
calibration window: any promotion of these jobs from advisory (FASE 1) to blocking (FASE 2) SHALL be
preceded by recording the metric (percentage of suite selected per PR, injected-test counts,
`map=hit/miss` rate, D7 fallback frequency) over the calibration window in
`docs/learning/quality-gates.md`. Promotion SHALL NOT weaken any existing safety net: nightly
full-suite, full suite on shared paths and the D7 zero-test guard remain in force after promotion.

#### Scenario: Promotion is justified by data

- **WHEN** someone proposes removing the advisory status from the diff-scoped test jobs
- **THEN** the step-summary metrics of the calibration window are aggregated and recorded in `docs/learning/quality-gates.md`

#### Scenario: Safety nets survive promotion

- **WHEN** the diff-scoped jobs become blocking
- **THEN** the nightly full suite, the shared-path full suite and D7 still run unchanged
