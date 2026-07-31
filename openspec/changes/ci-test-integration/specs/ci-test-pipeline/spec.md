## Purpose

Adds a complete CI test pipeline to the monorepo: workspace-aware change detection, unit tests for the React client and Express server, integration tests with a PostgreSQL service container, a build job, shared dependency detection, job isolation, job-level timeouts, and baseline-driven coverage thresholds so every pull request is validated before merge.

## ADDED Requirements

### Requirement: Change detection via dorny/paths-filter
The `changes` job SHALL use `dorny/paths-filter@v3` on every pull request opened or synchronized against `main` to detect which workspaces changed and set the `frontend`, `backend`, `e2e`, and `shared` outputs.

#### Scenario: Workspace changes detected on PR
- **WHEN** a pull request is opened or synchronized against `main`
- **THEN** `dorny/paths-filter@v3` detects which workspaces changed
- **AND** outputs `frontend`, `backend`, `e2e`, and `shared` are set based on:
  - `frontend`: `apps/client/**`
  - `backend`: `apps/server/**`
  - `e2e`: `e2e/**`
  - `shared`: `package.json`, `package-lock.json`, `.github/workflows/**`

### Requirement: Frontend unit tests
The `test-unit-client` job SHALL run the React client unit tests when the frontend or shared workspaces change, using the shared composite action for setup and generating a JUnit XML report.

#### Scenario: Frontend tests run on frontend changes
- **WHEN** `frontend == 'true'` OR `shared == 'true'`
- **THEN** the `test-unit-client` job runs `npm run test --workspace=client-react`
- **AND** the job uses the composite action `.github/actions/setup-monorepo` for setup
- **AND** a JUnit XML report is generated for test reporting
- **AND** the job has `timeout-minutes: 10`

### Requirement: Backend unit tests
The `test-unit-server` job SHALL run the Express server unit tests when the backend or shared workspaces change, using the shared composite action for setup and generating a JUnit XML report.

#### Scenario: Backend tests run on backend changes
- **WHEN** `backend == 'true'` OR `shared == 'true'`
- **THEN** the `test-unit-server` job runs `npm run test:unit --workspace=server-express`
- **AND** the job uses the composite action `.github/actions/setup-monorepo` for setup
- **AND** a JUnit XML report is generated for test reporting
- **AND** the job has `timeout-minutes: 10`

### Requirement: Integration tests with PostgreSQL
The `test-integration` job SHALL run server integration tests against a `postgres:16-alpine` service container with the schema deployed via Prisma migrations before the tests execute.

#### Scenario: Integration tests run with PostgreSQL service
- **WHEN** `backend == 'true'` OR `shared == 'true'`
- **THEN** the `test-integration` job runs with a `postgres:16-alpine` service container
- **AND** the PostgreSQL service has a health check via `pg_isready` (interval: 10s, timeout: 5s, retries: 5)
- **AND** `npx prisma migrate deploy` runs before the integration tests
- **AND** `DATABASE_URL=postgresql://test:test@localhost:5432/project_one_test` is set
- **AND** a JUnit XML report is generated for test reporting
- **AND** the job has `timeout-minutes: 10`

### Requirement: Build job always runs
The `build` job SHALL run `npm run build --ws --if-present` on every PR and execute even if test jobs failed, so build breakage is reported independently of test failures.

#### Scenario: Build runs on workspace changes
- **WHEN** any workspace changed
- **THEN** the `build` job runs `npm run build --ws --if-present`
- **AND** the job uses the composite action `.github/actions/setup-monorepo` for setup
- **AND** the job runs with `if: always()` to execute even if test jobs fail
- **AND** the job has `timeout-minutes: 10`

### Requirement: Shared dependency detection
Changes to `package.json` or `package-lock.json` SHALL trigger ALL test jobs regardless of workspace-specific changes, because dependency changes can affect any workspace.

#### Scenario: Shared changes run the full suite
- **WHEN** `package.json` or `package-lock.json` changed
- **THEN** all test jobs run regardless of workspace-specific changes
- **AND** the `shared` output from `dorny/paths-filter` triggers the frontend, backend, integration, and e2e jobs

### Requirement: Unskip integration tests in CI
The integration tests previously skipped in development SHALL run in CI now that a real PostgreSQL service container is provided.

#### Scenario: Previously skipped tests execute
- **WHEN** integration tests run in CI
- **THEN** `events-soft-delete.integration.test.js` and `events-combined-filters.integration.test.js` MUST NOT use `describe.skip`
- **AND** any seed data dependencies are resolved to work with the fresh PostgreSQL service container

### Requirement: Job isolation
CI jobs SHALL be isolated so a failure in one job does not cancel the others.

#### Scenario: Failure does not cancel other jobs
- **WHEN** a test job fails
- **THEN** the other jobs continue (`fail-fast: false`)
- **AND** each job has independent setup and teardown

### Requirement: Job timeouts
Every CI job SHALL have an explicit `timeout-minutes` so a hung job cannot run indefinitely.

#### Scenario: Timeout configured per job type
- **WHEN** any CI job runs
- **THEN** it has `timeout-minutes` set:
  - Unit test jobs: 10 min
  - Integration test job: 10 min
  - E2E job: 15 min
  - Build job: 10 min
  - Quality/lint job: 10 min

### Requirement: Baseline-driven coverage thresholds
Coverage thresholds SHALL be configured from measured baselines rather than hardcoded values, so the gate is real from the first run and improves incrementally.

#### Scenario: Baselines recorded on first CI run
- **WHEN** the first CI run completes
- **THEN** current coverage baselines are recorded from actual output
- **AND** `coverage.thresholds` in the Vitest configs are set at or slightly below those baselines
- **AND** a follow-up change is created to raise thresholds incrementally
