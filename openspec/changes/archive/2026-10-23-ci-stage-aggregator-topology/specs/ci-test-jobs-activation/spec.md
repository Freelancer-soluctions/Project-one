# Spec Delta

## MODIFIED Requirements

### Requirement: Test jobs execute on pull requests

The CI jobs `test-unit-client`, `test-unit-server`, `test-integration`, `test-smoke`, `client-coverage` and `server-coverage` SHALL execute on `pull_request` events instead of being disabled with `if: false`, and each test job SHALL be scoped by the `repo-discovery` path filter of its workspace (with `shared` changes triggering it as well). On `merge_group` events these 6 jobs SHALL be skipped by design (decision D17): their `if:` condition SHALL include `github.event_name == 'pull_request'`, consistent with every other `repo-discovery`-dependent job of `ci.yml`, because path discovery and PR-scoped impact analysis are computed for the `pull_request` event; with the merge queue currently disabled the trigger is inert, and re-validating tests on `merge_group` is a separate re-evaluation (paths discovery + TIA base for that event) to perform before the merge queue is ever enabled.

#### Scenario: PR touches one workspace

- **WHEN** a PR targeting `main` changes only `apps/client/**`
- **THEN** `test-unit-client` runs (and `client-coverage` runs after it) while `test-unit-server`, `test-integration` and `test-smoke` are skipped by their path condition
- **AND** no test job in the substage carries `if: false` any more

#### Scenario: PR touches shared paths

- **WHEN** a PR changes `package.json`, `package-lock.json` or `.github/workflows/**` (`repo-discovery.outputs.shared == 'true'`)
- **THEN** the 4 test jobs execute (dependency or workflow changes can affect any workspace), plus their coverage jobs
- **AND** the coverage jobs follow their own test job (they never run when their test job was skipped)

#### Scenario: PR touches neither workspace nor shared paths

- **WHEN** a PR changes only documentation outside the filters
- **THEN** all 6 jobs are skipped, `prebuild-tests-complete` finalizes with success over its 5 tier-1 members and `postbuild-tests-complete` finalizes with success over its 3 members (skipped treated as passing)
- **AND** the two aggregators are the paths by which these jobs still reach `ci-complete`: `test-unit-client`, `test-unit-server`, `client-coverage` and `server-coverage` through `prebuild-tests-complete`, and `test-integration`/`test-smoke` through `postbuild-tests-complete`

#### Scenario: merge_group event skips the test jobs

- **WHEN** `ci.yml` is triggered by a `merge_group` event
- **THEN** the 6 test jobs are skipped by their `github.event_name == 'pull_request'` condition (documented decision D17, not an accident)
- **AND** `prebuild-tests-complete` and `postbuild-tests-complete` finalize with success (skipped counted as passing), while enabling tests on `merge_group` remains an explicit follow-up if the merge queue is ever enabled — no required status check is renamed

### Requirement: FASE 1 advisory activation

The first activation of the 6 jobs SHALL use job-level `continue-on-error: true` (the repo's FASE 1 pattern), so that test or coverage failures are reported — job log, `dorny/test-reporter` annotations, uploaded artifacts — without blocking `prebuild-tests-complete`, `postbuild-tests-complete` or `ci-complete`.

#### Scenario: Red test during calibration window

- **WHEN** a unit test fails in `test-unit-server` while FASE 1 is active
- **THEN** the job log and the JUnit report show the failure and the test report check is annotated
- **AND** `prebuild-tests-complete` and `ci-complete` still finalize with success (advisory state, documented in `docs/learning/quality-gates.md`)

#### Scenario: Calibration window elapses cleanly

- **WHEN** the calibration window (2-4 weeks of runs) completes without infrastructure-caused failures
- **THEN** the change is promoted to FASE 2 per the promotion requirement of `ci-testing-gate-promotion`

> **Alcance recortado al archivar (2026-10-03).** El requirement "FASE 2 blocking promotion" se retiró de este delta
> y vive en el change `ci-testing-gate-promotion`. Motivo: la calibración es esperar a que la realidad ocurra, no
> implementación pendiente — sincronizar aquí un requirement con `SHALL` incumplido habría dejado el spec asserting
> un estado que el repo no tiene. Los 6 jobs quedan en FASE 1 advisory al archivar este change.

### Requirement: Coverage artifact contract between test and coverage jobs

Each unit test job SHALL upload its coverage output from the directory its workspace Vitest config declares as `reportsDirectory` (client: `apps/client/coverage`, server: `apps/server/tests/coverage`), and the corresponding `*-coverage` job SHALL download that artifact and run `scripts/ci/check-coverage.mjs` against the SAME directory, reading thresholds from the workspace `vitest.config.js` as single source of truth with `coverage.thresholds.autoUpdate` never enabled in CI. When the artifact was produced by a diff-scoped TIA run (`test:changed:ci`), the guard SHALL still require the artifact to exist but SHALL defer threshold evaluation to the next full-suite run, because global totals from a partial run are not comparable to the thresholds (decision D18).

#### Scenario: Server coverage guard resolves its summary

- **WHEN** `server-coverage` runs after `test-unit-server`
- **THEN** it evaluates `coverage-summary.json` at `apps/server/tests/coverage` (the server `reportsDirectory`), not at the script's default `apps/server/coverage`
- **AND** a missing or stale summary makes the guard exit 1 and fail the job

#### Scenario: Coverage below the tripwire floor

- **WHEN** measured statements/branches/functions/lines fall below the thresholds declared in the workspace config
- **THEN** `check-coverage.mjs` exits 1, the coverage job fails, and the failure propagates to `prebuild-tests-complete`

#### Scenario: Diff-scoped TIA run defers threshold evaluation

- **WHEN** a PR without `shared` path changes runs `test:changed:ci` and uploads a diff-scoped coverage artifact
- **THEN** `client-coverage`/`server-coverage` verify the artifact exists but do not evaluate global thresholds against partial totals
- **AND** thresholds are evaluated on the next full-suite run (a `shared` PR or the nightly workflow)

### Requirement: ci-complete reflects real test health

Once the jobs are active, `ci-complete` SHALL fail whenever a non-advisory test or coverage job fails, and SHALL treat skipped (path-filtered) jobs as passing.

#### Scenario: All suites green

- **WHEN** every activated test and coverage job succeeds or is path-skipped
- **THEN** `prebuild-tests-complete`, `postbuild-tests-complete` and `ci-complete` finalize with success

#### Scenario: Suite red after FASE 2

- **WHEN** `test-integration` fails after promotion
- **THEN** `ci-complete` fails and the PR cannot merge (the gate no longer passes without running any test)
- **AND** the failure reaches `ci-complete` through `postbuild-tests-complete`, the aggregator that carries `test-integration` after the prebuild/post-build tier split
