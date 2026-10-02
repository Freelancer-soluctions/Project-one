# Spec Delta — ci-test-jobs-activation

## Purpose

Reactiva en CI los jobs de testing de STAGE 2 (unit client/server, integration, smoke, y los dos guards de cobertura) con el patrón de gobernanza del repo FASE 1 advisory → FASE 2 blocking, garantizando que produzcan y consuman correctamente sus artefactos (JUnit y cobertura) y que `ci-complete` pase a reflejar la salud real de los tests.

## ADDED Requirements

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
- **THEN** all 6 jobs are skipped and `prebuild-unit-tests-complete` finalizes with success (skipped treated as passing)

#### Scenario: merge_group event skips the test jobs

- **WHEN** `ci.yml` is triggered by a `merge_group` event
- **THEN** the 6 test jobs are skipped by their `github.event_name == 'pull_request'` condition (documented decision D17, not an accident)
- **AND** `prebuild-unit-tests-complete` finalizes with success (skipped counted as passing), while enabling tests on `merge_group` remains an explicit follow-up if the merge queue is ever enabled — no required status check is renamed

### Requirement: FASE 1 advisory activation

The first activation of the 6 jobs SHALL use job-level `continue-on-error: true` (the repo's FASE 1 pattern), so that test or coverage failures are reported — job log, `dorny/test-reporter` annotations, uploaded artifacts — without blocking `prebuild-unit-tests-complete` or `ci-complete`.

#### Scenario: Red test during calibration window

- **WHEN** a unit test fails in `test-unit-server` while FASE 1 is active
- **THEN** the job log and the JUnit report show the failure and the test report check is annotated
- **AND** `prebuild-unit-tests-complete` and `ci-complete` still finalize with success (advisory state, documented in `docs/learning/quality-gates.md`)

#### Scenario: Calibration window elapses cleanly

- **WHEN** the calibration window (2-4 weeks of runs) completes without infrastructure-caused failures
- **THEN** the change is promoted to FASE 2 per the promotion requirement below

### Requirement: FASE 2 blocking promotion

After the calibration window, `continue-on-error` SHALL be removed from the 6 jobs so test and coverage failures block the merge through `prebuild-unit-tests-complete` → `ci-complete`, and `docs/learning/quality-gates.md` SHALL be updated in lockstep with the new blocking state.

#### Scenario: Red test after promotion

- **WHEN** a test job fails after FASE 2 promotion
- **THEN** `prebuild-unit-tests-complete` reports failure and `ci-complete` fails, blocking the merge
- **AND** `docs/learning/quality-gates.md` lists the 6 jobs as blocking (no stale `if: false` rows)

### Requirement: JUnit report production by test jobs

Every activated test job SHALL emit the JUnit XML file at the exact path its `dorny/test-reporter` step consumes (`apps/client/reports/junit.xml`, `apps/server/reports/junit.xml`) via an explicit `--outputFile=reports/junit.xml` in the workspace CI script — the Vitest junit reporter without `outputFile` writes no file at all, so the path must never be left to a default —, and the reporter step SHALL still run on failure (`if: success() || failure()`) so red runs are annotated.

#### Scenario: Reporter finds its report file

- **WHEN** `test-unit-client` finishes (pass or fail)
- **THEN** `apps/client/reports/junit.xml` exists and `dorny/test-reporter` publishes the "Client Unit Tests" check without a "no test report files found" error
- **AND** failing runs still publish annotations

### Requirement: Coverage artifact contract between test and coverage jobs

Each unit test job SHALL upload its coverage output from the directory its workspace Vitest config declares as `reportsDirectory` (client: `apps/client/coverage`, server: `apps/server/tests/coverage`), and the corresponding `*-coverage` job SHALL download that artifact and run `scripts/ci/check-coverage.mjs` against the SAME directory, reading thresholds from the workspace `vitest.config.js` as single source of truth with `coverage.thresholds.autoUpdate` never enabled in CI. When the artifact was produced by a diff-scoped TIA run (`test:changed:ci`), the guard SHALL still require the artifact to exist but SHALL defer threshold evaluation to the next full-suite run, because global totals from a partial run are not comparable to the thresholds (decision D18).

#### Scenario: Server coverage guard resolves its summary

- **WHEN** `server-coverage` runs after `test-unit-server`
- **THEN** it evaluates `coverage-summary.json` at `apps/server/tests/coverage` (the server `reportsDirectory`), not at the script's default `apps/server/coverage`
- **AND** a missing or stale summary makes the guard exit 1 and fail the job

#### Scenario: Coverage below the tripwire floor

- **WHEN** measured statements/branches/functions/lines fall below the thresholds declared in the workspace config
- **THEN** `check-coverage.mjs` exits 1, the coverage job fails, and the failure propagates to `prebuild-unit-tests-complete`

#### Scenario: Diff-scoped TIA run defers threshold evaluation

- **WHEN** a PR without `shared` path changes runs `test:changed:ci` and uploads a diff-scoped coverage artifact
- **THEN** `client-coverage`/`server-coverage` verify the artifact exists but do not evaluate global thresholds against partial totals
- **AND** thresholds are evaluated on the next full-suite run (a `shared` PR or the nightly workflow)

### Requirement: Coverage jobs depend only on their test job

`client-coverage` SHALL depend on exactly `[test-unit-client]` and `server-coverage` on exactly `[test-unit-server]`; the coverage guard only consumes the coverage artifact, so it SHALL NOT depend on `client-build`/`server-build`, which stay disabled out of scope.

#### Scenario: Build jobs remain disabled while coverage runs

- **WHEN** the change is applied and `client-build` still carries `if: false`
- **THEN** `client-coverage` still executes after `test-unit-client` (no skipped-`needs` deadlock) and enforces the client tripwire

### Requirement: Server unit job runs a database-free suite

The `test-unit-server` job SHALL execute only the `*.unit.test.js` suite with coverage through the workspace script `test:coverage:unit:ci` (`vitest run ".unit.test.js" --coverage --reporter=junit --outputFile=reports/junit.xml`) — no PostgreSQL service, no `DATABASE_URL` —, keeping integration and smoke coverage of the server in their own jobs.

#### Scenario: Unit suite runs without a database

- **WHEN** `test-unit-server` runs on a PR
- **THEN** only `src/**/*.unit.test.js` files execute with `--coverage` and the run writes `apps/server/reports/junit.xml`
- **AND** no `*.integration.test.js` file is picked up (those run in `test-integration` with the `postgres:16-alpine` service)

### Requirement: ci-complete reflects real test health

Once the jobs are active, `ci-complete` SHALL fail whenever a non-advisory test or coverage job fails, and SHALL treat skipped (path-filtered) jobs as passing.

#### Scenario: All suites green

- **WHEN** every activated test and coverage job succeeds or is path-skipped
- **THEN** `prebuild-unit-tests-complete` and `ci-complete` finalize with success

#### Scenario: Suite red after FASE 2

- **WHEN** `test-integration` fails after promotion
- **THEN** `ci-complete` fails and the PR cannot merge (the gate no longer passes without running any test)

### Requirement: Integration test job structure (absorbed from `ci-test-pipeline`)

The `test-integration` job SHALL run the server integration suite (including `*.integration.test.js`) against a `postgres:16-alpine` service container with a `pg_isready` health check, applying `npx prisma migrate deploy` before the tests with `DATABASE_URL` pointing to the service. Test jobs SHALL be isolated (no shared service containers between jobs) and SHALL declare job-level `timeout-minutes`; the workspace referenced in every test step SHALL be the npm workspace path (`apps/client`, `apps/server`), never the stale `client-react` alias.

#### Scenario: Integration job carries its own database

- **WHEN** `test-integration` executes on a PR (FASE 1 or FASE 2)
- **THEN** it runs with its own `postgres:16-alpine` service container (health check `pg_isready`), independent from the unit jobs which run database-free
- **AND** `prisma migrate deploy` runs against the service before the suite

#### Scenario: Workspace names follow the monorepo contract

- **WHEN** any test step in the pipeline references a workspace
- **THEN** it uses `--workspace=apps/client` / `--workspace=apps/server` / `--workspace=e2e` (the `workspaces` declared in the root `package.json`)
- **AND** no step references the obsolete `client-react` workspace alias
