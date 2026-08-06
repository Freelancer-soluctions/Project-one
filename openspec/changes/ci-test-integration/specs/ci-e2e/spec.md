## Purpose

Adds a Playwright E2E job to the CI pipeline that runs against a PostgreSQL service container (identical to the integration test job) so the Express backend can start against a real database, with Playwright browsers cached to avoid re-downloading Chromium on every run.

## ADDED Requirements

### Requirement: E2E tests with PostgreSQL service container
The `e2e` job SHALL run Playwright E2E tests with a `postgres:16-alpine` service container identical to the test-integration job, so the Playwright webServer can connect to a database.

#### Scenario: E2E job runs with PostgreSQL
- **WHEN** `e2e == 'true'`
- **THEN** the `e2e` job runs with a `postgres:16-alpine` service container (identical to test-integration)
- **AND** the PostgreSQL service has a health check via `pg_isready` (interval: 10s, timeout: 5s, retries: 5)
- **AND** `npx prisma migrate deploy` runs before the Playwright tests with `DATABASE_URL` pointing to the service container
- **AND** Playwright runs with `--project=chromium` and `--reporter=junit,list --output=reports/junit-e2e.xml`
- **AND** the job has `timeout-minutes: 15`

### Requirement: Playwright configuration with explicit projects array
The `e2e/playwright.config.js` file SHALL define an explicit `projects:` array (declaring the `chromium` project) so CI runs a deterministic browser set instead of relying on defaults.

#### Scenario: Explicit chromium project declared
- **WHEN** `e2e/playwright.config.js` is configured
- **THEN** it SHALL define an explicit `projects:` array containing `{ name: 'chromium', use: { browserName: 'chromium', ... } }`
- **AND** `playwright test --project=chromium` SHALL work locally

### Requirement: Playwright browser caching
The `e2e` job SHALL cache Playwright browsers so Chromium is not re-downloaded on every run.

#### Scenario: Playwright browsers cached
- **WHEN** the `e2e` job runs
- **THEN** Playwright browsers are cached via `actions/cache@v4` with key `playwright-${{ runner.os }}-${{ hashFiles('e2e/package-lock.json') }}`
- **AND** browsers are installed only on cache miss with `--with-deps` for system libraries
