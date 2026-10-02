# Spec Delta — ci-e2e (absorbida de `ci-test-integration`, verificada 2026-10-01)

## Purpose

Contrato del job `e2e` de Playwright listo-para-activación: service container PostgreSQL idéntico al del job de integración, cache de browsers y `projects:` explícito. El job ya está completamente configurado en `ci.yml` pero permanece `if: false` — su activación queda explícitamente FUERA de alcance de este change (decisión del proposal); esta capability fija el contrato para cuando se active.

## ADDED Requirements

### Requirement: E2E job contract with PostgreSQL service container

The `e2e` job definition in `ci.yml` SHALL keep a `postgres:16-alpine` service container identical in shape to the one used by the `test-integration` job, with a `pg_isready` health check and a `prisma migrate deploy` step pointing `DATABASE_URL` at the service, so that when the job is activated the Playwright webServer can connect to a real database.

#### Scenario: E2E job definition carries the full contract

- **WHEN** the `e2e` job definition in `ci.yml` is read
- **THEN** it declares a `postgres:16-alpine` service with `pg_isready` health options (`interval: 10s`, `timeout: 5s`, `retries: 5`)
- **AND** a `npx prisma migrate deploy` step runs with `DATABASE_URL` pointing to the service container
- **AND** the job carries `timeout-minutes: 15`

#### Scenario: Job stays disabled while out of scope

- **WHEN** this change is applied
- **THEN** the `e2e` job remains `if: false` (activation is an explicit non-goal until the service is stable)
- **AND** no `prebuild-unit-tests-complete.needs` entry references `e2e`

### Requirement: Playwright configuration with explicit projects array

The `e2e/playwright.config.js` file SHALL define an explicit `projects:` array declaring the `chromium` project, so CI runs a deterministic browser set instead of relying on defaults.

#### Scenario: Explicit chromium project declared

- **WHEN** `e2e/playwright.config.js` is read
- **THEN** it defines an explicit `projects:` array containing `{ name: 'chromium', use: { browserName: 'chromium', ... } }`
- **AND** `playwright test --project=chromium` is the invocation used by the job

### Requirement: Playwright browser caching

The `e2e` job SHALL cache Playwright browsers so Chromium is not re-downloaded on every run.

#### Scenario: Playwright browsers cached

- **WHEN** the `e2e` job runs after activation
- **THEN** Playwright browsers are cached (`~/.cache/ms-playwright`) with a key derived from the lockfile
- **AND** browsers are installed only on cache miss with `--with-deps` for system libraries
