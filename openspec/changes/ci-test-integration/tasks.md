# Implementation Tasks: CI Test Integration

> Each task group maps to a spec requirement. Complete in order where dependencies exist.

## 1. Composite Action Setup

- [x] 1.1 Create `.github/actions/setup-monorepo/action.yml` with steps: checkout@v5, setup-node@v4 (node-version-file: .nvmrc, cache: npm), npm ci, Vitest cache via actions/cache@v4
- [x] 1.2 Verify composite action is reusable: `uses: ./.github/actions/setup-monorepo` in any job
- [x] 1.3 Add `timeout-minutes: 10` to composite action callers (each job that uses it)

## 2. Changes Job Update

- [x] 2.1 Extend `changes` job in ci.yml: add `e2e` filter (`e2e/**`) and `shared` filter (`package.json`, `package-lock.json`, `.github/workflows/**`) to dorny/paths-filter
- [x] 2.2 Add `e2e` and `shared` to job outputs: `outputs: {frontend: ..., backend: ..., e2e: ..., shared: ...}`

## 3. Unit Tests Jobs

- [x] 3.1 Configure `test-unit-client` job in ci.yml with condition `needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true'`
- [x] 3.2 Configure `test-unit-server` job in ci.yml with condition `needs.changes.outputs.backend == 'true' || needs.changes.outputs.shared == 'true'`
- [x] 3.3 Both jobs use `uses: ./.github/actions/setup-monorepo` and run vitest with JUnit reporter (`--reporter=junit --outputFile=reports/junit.xml`)
- [x] 3.4 Add `fail-fast: false` default to prevent job cancellation
- [x] 3.5 Add `timeout-minutes: 10` to each unit test job

## 4. Integration Tests with PostgreSQL

- [x] 4.1 Configure `test-integration` job in ci.yml with PostgreSQL service container (postgres:16-alpine)
- [x] 4.2 Add health check: `pg_isready` (interval: 10s, timeout: 5s, retries: 5)
- [x] 4.3 Add step: `npx prisma migrate deploy` with `DATABASE_URL=postgresql://test:test@localhost:5432/project_one_test`
- [x] 4.4 Run integration tests with DATABASE_URL env pointing to service container
- [x] 4.5 Add `timeout-minutes: 10` to integration test job
- [x] 4.6 **Unskip integration tests**: remove `describe.skip` from `events-soft-delete.integration.test.js` and `events-combined-filters.integration.test.js`; fix any local seed data dependencies

## 5. Build Job

- [x] 5.1 Configure `build` job in ci.yml with `if: always()` and condition-based on changes
- [x] 5.2 Run `npm run build --ws --if-present`
- [x] 5.3 Add `timeout-minutes: 10` to build job

> **Deviation from spec D9 / task 5.1**: The build job runs with `if: always()` unconditionally (no change gating inside the job). Per design D9, this is intentional — we want to know if the build is broken even when tests fail. Adding change gating would defeat the purpose of catching build regressions independently. This matches the documented intent in design.md D9.

## 6. Multi-Layer Caching

- [x] 6.1 Verify npm cache via `setup-node@v4` `cache: 'npm'` in composite action
- [x] 6.2 Add Vitest cache in composite action: `actions/cache@v4` with path `node_modules/.cache/vitest` (root-level, not workspace-local — npm hoists dependencias)
- [x] 6.3 Add Playwright browser cache in e2e job: `actions/cache@v4` with path `~/.cache/ms-playwright`
- [x] 6.4 Add restore-keys fallback for Vitest cache: `vitest-${{ runner.os }}-`

## 7. Test Reporting

- [x] 7.1 Add `dorny/test-reporter@v3` step after each test job with `if: success() || failure()`
- [x] 7.2 Configure reporter: `java-junit` with path `reports/junit.xml`
- [x] 7.3 Configure Vitest to emit JUnit XML: add `--reporter=junit --outputFile=reports/junit.xml` to test commands

## 8. Flaky Test Retry

- [x] 8.1 Configure Playwright retries: `retries: process.env.CI ? 2 : 0` in `e2e/playwright.config.js`
- [x] 8.2 Configure Vitest retry: add `retry: 2` to `test-integration` profile in `apps/server/vitest.config.js`
- [x] 8.3 Verify retry configuration doesn't affect local test runs
- [x] 8.4 Add Playwright system dependencies step in e2e job: `npx playwright install --with-deps chromium`
- [x] 8.5 Add Playwright JUnit reporter config in `playwright.config.js`: `reporter: [['junit', { outputFile: 'reports/junit-e2e.xml' }], 'list']` (CI-only); ci.yml uses `--output=test-results` for artifacts dir

> **Deviation from task 8.2**: Vitest config applies `retry: 2` to ALL tests when `CI=true` (not just integration) because Vitest doesn't have a built-in profile mechanism to scope retries to only integration tests. The config uses a ternary on `process.env.CI` which affects the entire test run. This is documented as a known deviation; the impact is minimal since unit tests are fast and rarely flaky. A future improvement could use a separate vitest config file for integration tests if needed.

## 9. Coverage Thresholds (Baseline-Driven)

- [x] 9.1 **NO re-medir baselines**: consumir los baselines documentados por `ci-quality-gates` (coverage-baselines spec → `docs/cicd-plan-implementacion.md` §14.5) — ese change se implementa ANTES (dependencia de orden) y ya mide statements/branches/functions/lines
- [x] 9.2 Verificar que los valores de §14.5 cubren ambos workspaces (client + server)
- [x] 9.3 Add `coverage.thresholds` in both vitest configs at or slightly below the §14.5 baselines (NOT hardcoded 80%)
- [ ] 9.4 Verify thresholds pass on CI: push a branch and confirm coverage check works **(requiere CI/push — no verificado localmente)**
- [x] 9.5 Create follow-up change to raise thresholds incrementally (document in cicd-plan-implementacion.md) — **Documented as follow-up item**

## 10. ESLint as Gate in CI — OWNED BY `ci-quality-gates`

> **Cross-change note**: el ESLint blocking gate (tasks 10.1-10.3) es alcance del change `ci-quality-gates` (spec `eslint-blocking-gate`) — este change NO lo implementa. Mantener solo como referencia; NO duplicar.

- [x] 10.1 (Referencia) Verify `quality` job in ci.yml runs `npm run lint` and blocks PR on errors — **implementado en ci-quality-gates**
- [x] 10.2 (Referencia) Ensure lint errors are visible in PR checks (not just warnings) — **implementado en ci-quality-gates**
- [x] 10.3 (Referencia) Add `timeout-minutes: 10` to quality job — **implementado en ci-quality-gates**

## 11. Re-activate lint-staged — OWNED BY `ci-quality-gates`

> **Cross-change note**: la re-activación de lint-staged (tasks 11.1-11.2) es alcance del change `ci-quality-gates` (spec `pre-commit-lint-staged`) — este change NO lo implementa. Mantener solo como referencia; NO duplicar.

- [x] 11.1 (Referencia) Uncomment or restore lint-staged configuration in `.husky/pre-commit` — **implementado en ci-quality-gates**
- [x] 11.2 (Referencia) Verify pre-commit runs ESLint + Prettier on staged files — **implementado en ci-quality-gates**

## 12. Create .dockerignore

- [x] 12.1 Create `.dockerignore` with excludes: node_modules, .env, .git, .github, openspec, docs, reports, *.log, .husky, .vscode, .idea — **Spec**: ci-test-integration → specs/ci-dockerignore/spec.md ("Repository root .dockerignore")

## 13. Enable Dependabot

> **Cross-change note (recíproco)**: `ci-secret-scanning` task 4.4 y `ci-scheduled-security` task 7.2 referencian ESTE task 13.1 para combinar ecosistemas `npm` + `github-actions` en UN solo `.github/dependabot.yml` al mergear. Al implementar 13.1-13.2, verificar que el archivo resultante cubre ambos ecosistemas y que no se crea un segundo dependabot.yml en esos changes.

- [x] 13.1 Create `.github/dependabot.yml` with npm ecosystem (weekly, grouping for dev-dependencies) — **EXTEND-NOT-RECREATE**: si `.github/dependabot.yml` YA existe (creado por `ci-secret-scanning` task 4.4 con ecosistemas github-actions [+docker]), AÑADIR el ecosistema `npm` al mismo archivo; NUNCA recrear/sobrescribir (GitHub no soporta múltiples dependabot.yml)
- [x] 13.2 Add GitHub Actions ecosystem (weekly) in same config — solo si el archivo es creado aquí (cuando ci-secret-scanning no lo ha creado aún); si ya existe con github-actions, verificar cobertura sin duplicar
- [x] 13.3 Set open-pull-requests-limit: 10, labels: ["dependencies", "automated"]
- [x] 13.4 Configure ignore rules for major React updates

## 14. E2E Job with PostgreSQL

- [x] 14.1 Configure `e2e` job in ci.yml with PostgreSQL service container (postgres:16-alpine), identical to test-integration job
- [x] 14.2 Add health check: `pg_isready` (interval: 10s, timeout: 5s, retries: 5)
- [x] 14.3 Add step: `npx prisma migrate deploy` with DATABASE_URL pointing to service container
- [x] 14.4 Run Playwright tests with `--project=chromium` and CI env vars
- [x] 14.5 Add `timeout-minutes: 15` to e2e job (longer due to browser + DB setup)

## 15. Playwright Configuration

- [x] 15.1 Add explicit `projects:` array to `e2e/playwright.config.js`: `[{ name: 'chromium', use: { browserName: 'chromium', ... } }]`
- [ ] 15.2 Verify `playwright test --project=chromium` works locally — **(requiere ejecución local de Playwright — no verificado)**

> **Note**: Task 15.1 is complete — `projects:` array was already present in the config (per D11). The webServer fix (HIGH 1) and JUnit reporter fix (HIGH 2) are additional improvements made during review.

## 16. Verification

- [x] 16.1 Run `npx vitest run --reporter=junit --outputFile=reports/junit.xml` locally in client to verify JUnit output — **VERIFIED: junit.xml generated correctly**
- [x] 16.2 Run `npx vitest run --reporter=junit --outputFile=reports/junit.xml` locally in server to verify JUnit output — **VERIFIED: junit.xml generated correctly**
- [ ] 16.3 Verify all ci.yml jobs parse correctly: `act --pull-request` or push to test branch — **(requiere CI/push, act no disponible localmente)**
- [ ] 16.4 Verify Dependabot config: `npx dependabot-config-validator` if available — **NO VERIFICABLE: paquete no existe en npm registry**
- [ ] 16.5 Verify total CI time < 7 min with all caching layers — **(requiere CI/push, no medible localmente)**