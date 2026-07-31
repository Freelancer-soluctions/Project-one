## Spec: CI Test Pipeline

### WHEN/THEN Requirements

#### R1: Change Detection
- **WHEN** a PR is opened or synchronized against `main`
- **THEN** `dorny/paths-filter@v3` detects which workspaces changed
- **AND** outputs `frontend`, `backend`, `e2e`, and `shared` are set based on:
  - `frontend`: `apps/client/**`
  - `backend`: `apps/server/**`
  - `e2e`: `e2e/**`
  - `shared`: `package.json`, `package-lock.json`, `.github/workflows/**`

#### R2: Frontend Unit Tests
- **WHEN** `frontend == 'true'` OR `shared == 'true'`
- **THEN** `test-unit-client` job runs `npm run test --workspace=client-react`
- **AND** job uses composite action `.github/actions/setup-monorepo` for setup
- **AND** JUnit XML report is generated for test reporting
- **AND** job has `timeout-minutes: 10`

#### R3: Backend Unit Tests
- **WHEN** `backend == 'true'` OR `shared == 'true'`
- **THEN** `test-unit-server` job runs `npm run test:unit --workspace=server-express`
- **AND** job uses composite action `.github/actions/setup-monorepo` for setup
- **AND** JUnit XML report is generated for test reporting
- **AND** job has `timeout-minutes: 10`

#### R4: Integration Tests with PostgreSQL
- **WHEN** `backend == 'true'` OR `shared == 'true'`
- **THEN** `test-integration` job runs with `postgres:16-alpine` service container
- **AND** PostgreSQL service has health check via `pg_isready` (interval: 10s, timeout: 5s, retries: 5)
- **AND** `npx prisma migrate deploy` runs before integration tests
- **AND** `DATABASE_URL=postgresql://test:test@localhost:5432/project_one_test` is set
- **AND** JUnit XML report is generated for test reporting
- **AND** job has `timeout-minutes: 10`

#### R5: Test Reporting
- **WHEN** any test job completes (success or failure)
- **THEN** `dorny/test-reporter@v3` runs with `if: success() || failure()`
- **AND** creates GitHub Check Run with JUnit annotations in the PR diff

#### R6: Build
- **WHEN** any workspace changed
- **THEN** `build` job runs `npm run build --ws --if-present`
- **AND** job uses composite action `.github/actions/setup-monorepo` for setup
- **AND** job runs with `if: always()` to execute even if test jobs fail
- **AND** job has `timeout-minutes: 10`

#### R7: E2E Tests with PostgreSQL
- **WHEN** `e2e == 'true'`
- **THEN** `e2e` job runs with `postgres:16-alpine` service container (identical to test-integration)
- **AND** PostgreSQL service has health check via `pg_isready` (interval: 10s, timeout: 5s, retries: 5)
- **AND** `npx prisma migrate deploy` runs before Playwright tests with `DATABASE_URL` pointing to service container
- **AND** Playwright browsers are cached via `actions/cache@v4` with key `playwright-${{ runner.os }}-${{ hashFiles('e2e/package-lock.json') }}`
- **AND** browsers are installed only on cache miss with `--with-deps` for system libraries
- **AND** Playwright runs with `--project=chromium` and `--reporter=junit,list --output=reports/junit-e2e.xml`
- **AND** job has `timeout-minutes: 15`

#### R8: Shared Dependency Detection
- **WHEN** `package.json` or `package-lock.json` changed
- **THEN** ALL test jobs run regardless of workspace-specific changes
- **AND** `shared` output from `dorny/paths-filter` triggers frontend, backend, integration, and e2e jobs

#### R9: Unskip Integration Tests
- **WHEN** integration tests run in CI (R4)
- **THEN** `events-soft-delete.integration.test.js` and `events-combined-filters.integration.test.js` MUST NOT use `describe.skip`
- **AND** any seed data dependencies are resolved to work with fresh PostgreSQL service container

### Non-Functional Requirements

#### NFR1: Performance
- **WHEN** all jobs run in parallel
- **THEN** total CI time < 7 minutes with all caching layers active

#### NFR2: Isolation
- **WHEN** a test job fails
- **THEN** other jobs continue (fail-fast: false)
- **AND** each job has independent setup and teardown

#### NFR3: Flaky Test Handling
- **WHEN** Playwright test fails
- **THEN** it retries up to 2 times before reporting failure
- **WHEN** Vitest integration test fails
- **THEN** it retries up to 2 times before reporting failure

#### NFR4: Cache Strategy
- **WHEN** `setup-node@v4` runs
- **THEN** `~/.npm` is cached with `cache: 'npm'` using `package-lock.json` hash
- **WHEN** `actions/cache@v4` runs for Vitest
- **THEN** `node_modules/.cache/vitest` (root-level — npm hoists dependencias) is cached with key `vitest-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`
- **WHEN** `actions/cache@v4` runs for Playwright
- **THEN** `~/.cache/ms-playwright` is cached with key `playwright-${{ runner.os }}-${{ hashFiles('e2e/package-lock.json') }}`

#### NFR5: Job Timeouts
- **WHEN** any CI job runs
- **THEN** it has `timeout-minutes` set:
  - Unit test jobs: 10 min
  - Integration test job: 10 min
  - E2E job: 15 min
  - Build job: 10 min
  - Quality/lint job: 10 min

### Coverage Thresholds (Baseline-Driven)

- **WHEN** first CI run completes
- **THEN** current coverage baselines are recorded from actual output
- **AND** `coverage.thresholds` in vitest configs are set at or slightly below those baselines
- **AND** a follow-up change is created to raise thresholds incrementally
