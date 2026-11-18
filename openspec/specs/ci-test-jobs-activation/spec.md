# ci-test-jobs-activation Specification

## Purpose

Reactiva en CI los jobs de testing de STAGE 2 (unit client/server, integration, smoke, y los dos guards de cobertura) con el patrón de gobernanza del repo FASE 1 advisory → FASE 2 blocking, garantizando que produzcan y consuman correctamente sus artefactos (JUnit y cobertura) y que `ci-complete` pase a reflejar la salud real de los tests.

## Requirements

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

The advisory posture described here is **historical**, not the current contract. The initial activation used
job-level `continue-on-error: true` for `test-unit-client`, `test-unit-server`, `client-coverage` and
`server-coverage` so that test or coverage failures were reported — job log, `dorny/test-reporter` annotations,
uploaded artifacts — without blocking `prebuild-tests-complete` or `ci-complete`; `test-integration` and
`test-smoke` were activated without the flag and have always failed `postbuild-tests-complete`. That posture is
superseded for the five promoted jobs by `Requirement: FASE 2 blocking promotion` of this same capability: none of
`test-unit-client`, `test-unit-server`, `client-coverage`, `server-coverage` or `property-tests` SHALL carry
`continue-on-error` today, and a job-level `continue-on-error` on any of them is only admissible as the explicitly
recorded, per-job rollback of the promotion (`design.md` D9), never as a leftover of FASE 1.

#### Scenario: Red test during calibration window

- **WHEN** a unit test fails in `test-unit-server` during the advisory window (2026-10-03 → 2026-10-29)
- **THEN** the job log and the JUnit report showed the failure and the test report check was annotated
- **AND** `prebuild-tests-complete` and `ci-complete` still finalized with success, the advisory state recorded at the
  time in `docs/learning/quality-gates.md`
- **AND** the same failure today fails both aggregators, because the FASE 2 promotion removed that absorption

#### Scenario: Calibration window elapses cleanly

- **WHEN** the calibration window completed with the prerequisites green (module isolation, strict coverage in both
  workspaces, `test-integration`/`test-smoke` verified in CI)
- **THEN** the five jobs were promoted to FASE 2 in a single atomic change, per `Requirement: FASE 2 blocking
promotion` of this capability
- **AND** the window itself continues after the promotion as the observation period whose flakes would trigger the
  per-job rollback

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
- **THEN** `check-coverage.mjs` exits 1, the coverage job fails, and the failure propagates to `prebuild-tests-complete`

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
- **THEN** `prebuild-tests-complete`, `postbuild-tests-complete` and `ci-complete` finalize with success

#### Scenario: Suite red after FASE 2

- **WHEN** `test-integration` fails after promotion
- **THEN** `ci-complete` fails and the PR cannot merge (the gate no longer passes without running any test)
- **AND** the failure reaches `ci-complete` through `postbuild-tests-complete`, the aggregator that carries `test-integration` after the prebuild/post-build tier split

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

### Requirement: FASE 2 blocking promotion

`continue-on-error` SHALL be removed from the 5 jobs that carry it — `test-unit-client`, `test-unit-server`,
`client-coverage`, `server-coverage`, `property-tests`, the 5 `needs` of `prebuild-tests-complete`
(`ci.yml:2552-2562`) — in a single promotion change, so a test or coverage failure in any of them reports FAILURE and
makes its chain's aggregator fail. The testing surface reaches `ci-complete` through two chains: the 5 promoted jobs
through `prebuild-tests-complete`, and `test-integration`/`test-smoke` (which carry no `continue-on-error` and SHALL
NOT be modified) through `postbuild-tests-complete` (`ci.yml:2609-2613`). `docs/learning/quality-gates.md` SHALL be
updated in lockstep with the new blocking state. The promotion SHALL NOT be presented as merge-blocking: ruleset
21227644 requires exactly two contexts, none of them a test check (API 2026-10-28), so binding a testing context to
the ruleset is a separate future governance change, recorded in `tasks.md` 3.4 (body-lint FASE 3 precedent,
`docs/CONTEXT-CICD.md` §3.2/§5.1; Rule 8: renaming breaks bindings).

#### Scenario: Red test after promotion

- **WHEN** a promoted test job fails after FASE 2 promotion
- **THEN** `prebuild-tests-complete` reports failure and `ci-complete` fails — visible red on the PR
- **AND** `docs/learning/quality-gates.md` lists the promoted jobs as blocking (no stale `if: false` rows)

#### Scenario: Red is visible; merge blocking waits for a future governance change

- **WHEN** a promoted job fails and its aggregator reports failure
- **THEN** the merge is not blocked by GitHub, because ruleset 21227644 requires exactly two contexts, none of them
  a test check (API 2026-10-28)
- **AND** binding a testing context (`CI Complete` or a testing aggregator) to ruleset 21227644 is recorded as a
  separate future governance change (`tasks.md` 3.4), following `docs/CONTEXT-CICD.md` §3.2/§5.1 and the body-lint
  FASE 3 precedent (GET → modify → PUT, never PATCH), with Rule 8: renaming the job breaks the binding

#### Scenario: Promotion is atomic, never partial

- **WHEN** the promotion PR is opened
- **THEN** `continue-on-error: true` is removed from all 5 jobs in that single change — `test-unit-client`,
  `test-unit-server`, `client-coverage`, `server-coverage`, `property-tests`
- **AND** `test-integration` and `test-smoke` are left unmodified (they already fail `postbuild-tests-complete`)
- **AND** no intermediate commit leaves some jobs blocking while others remain advisory, because the aggregator's
  `needs` chain is transitive and a half-promoted state has no useful property

#### Scenario: Promotion does not rename required checks

- **WHEN** the promotion PR is reviewed
- **THEN** `prebuild-tests-complete.needs` still contains exactly the same 5 job ids
- **AND** no job `name:` is changed, so no required status check in ruleset 21227644 needs rebinding (Rule 8,
  `docs/CONTEXT-CICD.md` §3.2)

> **Ampliación 2026-10-28.** Además del requirement de FASE 2, este delta añade un requirement de integridad del
> enforcer de cobertura previo a la promoción (pasos 1-3): sin él, el gate blocking promovido fallaría por
> cobertura rota pre-existente, no por tests rojos (evidencia en `proposal.md`, baseline medido 2026-10-28).

### Requirement: Coverage enforcer integrity before blocking promotion

Before `continue-on-error` is removed from the 5 jobs, the coverage threshold configuration SHALL be repaired so the strict gate can pass: every declared glob threshold SHALL match at least one instrumented file, per-file threshold evaluation SHALL have exactly one enforcer whose documented semantics match the actual engine behavior, and the client per-file breaches SHALL be resolved — re-baselined with tests, or lowered with the justification recorded in the PR that lowers them. `scripts/ci/check-coverage.mjs` is the sole per-file enforcer for glob thresholds; Vitest 4.1.11 evaluates those glob thresholds in aggregate and ignores a nested `perFile` option.

#### Scenario: Strict coverage gate is green before promotion

- **WHEN** the promotion PR removes `continue-on-error` from the 5 jobs
- **THEN** `node scripts/ci/check-coverage.mjs apps/client` and `node scripts/ci/check-coverage.mjs apps/server` both exit 0 in strict mode against full-suite coverage
- **AND** no glob threshold in either workspace vitest config matches zero instrumented files (no `no files matched` warnings)

#### Scenario: Per-file semantics have a single enforcer

- **WHEN** a glob threshold declares per-file strictness
- **THEN** exactly one evaluator enforces it in the pipeline — either Vitest with a configuration its engine actually honors per-file, or `check-coverage.mjs` as the sole per-file enforcer
- **AND** the `apps/client/vitest.config.js` comment and the `scripts/ci/check-coverage.mjs` docstring describe what the engine actually does (no promise of symmetry the engine does not implement)

#### Scenario: Lowering a threshold is recorded, never silent

- **WHEN** a coverage threshold is lowered so the strict gate passes
- **THEN** the PR that lowers it records the justification, per the PRD anti-pattern rule ("Bajar el umbral para que pase. Si el umbral se mueve, queda registrado en el PR que lo mueve, con justificación")
