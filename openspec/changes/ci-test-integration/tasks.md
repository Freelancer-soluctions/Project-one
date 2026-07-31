# Implementation Tasks: CI Test Integration

> Each task group maps to a spec requirement. Complete in order where dependencies exist.

## 1. Composite Action Setup

- [ ] 1.1 Create `.github/actions/setup-monorepo/action.yml` with steps: checkout@v5, setup-node@v4 (node-version-file: .nvmrc, cache: npm), npm ci, Vitest cache via actions/cache@v4
- [ ] 1.2 Verify composite action is reusable: `uses: ./.github/actions/setup-monorepo` in any job
- [ ] 1.3 Add `timeout-minutes: 10` to composite action callers (each job that uses it)

## 2. Changes Job Update

- [ ] 2.1 Extend `changes` job in ci.yml: add `e2e` filter (`e2e/**`) and `shared` filter (`package.json`, `package-lock.json`, `.github/workflows/**`) to dorny/paths-filter
- [ ] 2.2 Add `e2e` and `shared` to job outputs: `outputs: {frontend: ..., backend: ..., e2e: ..., shared: ...}`

## 3. Unit Tests Jobs

- [ ] 3.1 Configure `test-unit-client` job in ci.yml with condition `needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true'`
- [ ] 3.2 Configure `test-unit-server` job in ci.yml with condition `needs.changes.outputs.backend == 'true' || needs.changes.outputs.shared == 'true'`
- [ ] 3.3 Both jobs use `uses: ./.github/actions/setup-monorepo` and run vitest with JUnit reporter (`--reporter=junit --outputFile=reports/junit.xml`)
- [ ] 3.4 Add `fail-fast: false` default to prevent job cancellation
- [ ] 3.5 Add `timeout-minutes: 10` to each unit test job

## 4. Integration Tests with PostgreSQL

- [ ] 4.1 Configure `test-integration` job in ci.yml with PostgreSQL service container (postgres:16-alpine)
- [ ] 4.2 Add health check: `pg_isready` (interval: 10s, timeout: 5s, retries: 5)
- [ ] 4.3 Add step: `npx prisma migrate deploy` with `DATABASE_URL=postgresql://test:test@localhost:5432/project_one_test`
- [ ] 4.4 Run integration tests with DATABASE_URL env pointing to service container
- [ ] 4.5 Add `timeout-minutes: 10` to integration test job
- [ ] 4.6 **Unskip integration tests**: remove `describe.skip` from `events-soft-delete.integration.test.js` and `events-combined-filters.integration.test.js`; fix any local seed data dependencies

## 5. Build Job

- [ ] 5.1 Configure `build` job in ci.yml with `if: always()` and condition-based on changes
- [ ] 5.2 Run `npm run build --ws --if-present`
- [ ] 5.3 Add `timeout-minutes: 10` to build job

## 6. Multi-Layer Caching

- [ ] 6.1 Verify npm cache via `setup-node@v4` `cache: 'npm'` in composite action
- [ ] 6.2 Add Vitest cache in composite action: `actions/cache@v4` with path `node_modules/.cache/vitest` (root-level, not workspace-local — npm hoists dependencias)
- [ ] 6.3 Add Playwright browser cache in e2e job: `actions/cache@v4` with path `~/.cache/ms-playwright`
- [ ] 6.4 Add restore-keys fallback for Vitest cache: `vitest-${{ runner.os }}-

## 7. Test Reporting

- [ ] 7.1 Add `dorny/test-reporter@v3` step after each test job with `if: success() || failure()`
- [ ] 7.2 Configure reporter: `java-junit` with path `reports/junit.xml`
- [ ] 7.3 Configure Vitest to emit JUnit XML: add `--reporter=junit --outputFile=reports/junit.xml` to test commands

## 8. Flaky Test Retry

- [ ] 8.1 Configure Playwright retries: `retries: process.env.CI ? 2 : 0` in `e2e/playwright.config.js`
- [ ] 8.2 Configure Vitest retry: add `retry: 2` to `test-integration` profile in `apps/server/vitest.config.js`
- [ ] 8.3 Verify retry configuration doesn't affect local test runs
- [ ] 8.4 Add Playwright system dependencies step in e2e job: `npx playwright install --with-deps chromium`
- [ ] 8.5 Add Playwright JUnit reporter config: `--reporter=junit,list --output=reports/junit-e2e.xml`

## 9. Coverage Thresholds (Baseline-Driven)

- [ ] 9.1 Run `npm run test:coverage` in both `apps/client` and `apps/server` to establish current coverage baselines
- [ ] 9.2 Record baseline values from 9.1 (statements, branches, functions, lines)
- [ ] 9.3 Add `coverage.thresholds` in both vitest configs at or slightly below recorded baselines (NOT hardcoded 80%)
- [ ] 9.4 Verify thresholds pass on CI: push a branch and confirm coverage check works
- [ ] 9.5 Create follow-up change to raise thresholds incrementally (document in cicd-plan-implementacion.md)

## 10. ESLint as Gate in CI

- [ ] 10.1 Verify `quality` job in ci.yml runs `npm run lint` and blocks PR on errors
- [ ] 10.2 Ensure lint errors are visible in PR checks (not just warnings)
- [ ] 10.3 Add `timeout-minutes: 10` to quality job

## 11. Re-activate lint-staged

- [ ] 11.1 Uncomment or restore lint-staged configuration in `.husky/pre-commit`
- [ ] 11.2 Verify pre-commit runs ESLint + Prettier on staged files

## 12. Create .dockerignore

- [ ] 12.1 Create `.dockerignore` with excludes: node_modules, .env, .git, .github, openspec, docs, reports, *.log, .husky, .vscode, .idea

## 13. Enable Dependabot

- [ ] 13.1 Create `.github/dependabot.yml` with npm ecosystem (weekly, grouping for dev-dependencies)
- [ ] 13.2 Add GitHub Actions ecosystem (weekly) in same config
- [ ] 13.3 Set open-pull-requests-limit: 10, labels: ["dependencies", "automated"]
- [ ] 13.4 Configure ignore rules for major React updates

## 14. E2E Job with PostgreSQL

- [ ] 14.1 Configure `e2e` job in ci.yml with PostgreSQL service container (postgres:16-alpine), identical to test-integration job
- [ ] 14.2 Add health check: `pg_isready` (interval: 10s, timeout: 5s, retries: 5)
- [ ] 14.3 Add step: `npx prisma migrate deploy` with DATABASE_URL pointing to service container
- [ ] 14.4 Run Playwright tests with `--project=chromium` and CI env vars
- [ ] 14.5 Add `timeout-minutes: 15` to e2e job (longer due to browser + DB setup)

## 15. Playwright Configuration

- [ ] 15.1 Add explicit `projects:` array to `e2e/playwright.config.js`: `[{ name: 'chromium', use: { browserName: 'chromium', ... } }]`
- [ ] 15.2 Verify `playwright test --project=chromium` works locally

## 16. Verification

- [ ] 16.1 Run `npx vitest run --reporter=junit --outputFile=reports/junit.xml` locally in client to verify JUnit output
- [ ] 16.2 Run `npx vitest run --reporter=junit --outputFile=reports/junit.xml` locally in server to verify JUnit output
- [ ] 16.3 Verify all ci.yml jobs parse correctly: `act --pull-request` or push to test branch
- [ ] 16.4 Verify Dependabot config: `npx dependabot-config-validator` if available
- [ ] 16.5 Verify total CI time < 7 min with all caching layers
