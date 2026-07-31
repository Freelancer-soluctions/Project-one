## Why

El monorepo Project One (Node.js/Express + React + E2E Playwright) carece de integración continua efectiva. Los tests en `.github/workflows/ci.yml` están comentados, no se ejecutan en CI, y los Pull Requests se mergean sin validación automatizada de pruebas ni build. Esto permite que errores de compilación y regresiones lleguen a `main` sin detección.

**Estado actual:**
- Tests unitarios, de integración y build comentados en `ci.yml`
- Solo corre `quality.yml` (lint + format) con detección de cambios vía `dorny/paths-filter`
- PRs mergean sin ejecutar `npm run test` ni `npm run build`
- Sin caching multi-capa → CI lento si se habilitaran tests
- Sin test reporting → fallos difíciles de depurar sin anotaciones en PR

**Qué resuelve:**
- Cada PR ejecuta tests unitarios (client + server), tests de integración (server con PostgreSQL), y build antes de mergear
- Cambios detectados por workspace via `dorny/paths-filter` para ejecutar solo lo relevante
- Test reporting con `dorny/test-reporter` + JUnit XML para anotaciones en PR
- Caching multi-capa (npm, Vitest root-level, Playwright) para CI < 7 minutos
- Manejo de tests flaky con retries automáticos
- PostgreSQL service container para E2E también (backend requiere DB para arrancar)
- Coverage thresholds baseline-driven (medir primero, thresholds realistas)

## What Changes

- Implementar pipeline CI completo en `ci.yml` con jobs independientes por workspace
- Extender `changes` job con outputs `e2e` y `shared` para detección completa
- Crear composite action `.github/actions/setup-monorepo/action.yml` para setup unificado
- Configurar PostgreSQL service container para tests de integración Y E2E con Prisma migrate deploy
- Agregar caching multi-capa: npm (built-in), Vitest root-level (`actions/cache`), Playwright browsers
- Configurar test reporting con `dorny/test-reporter@v3` + JUnit XML (incluyendo E2E)
- Agregar `coverage.thresholds` baseline-driven en configuración Vitest
- Configurar flaky test retry (Playwright `retries: 2`, Vitest `retry: 2`)
- Agregar Playwright system dependencies installation en e2e job
- Agregar Playwright `projects:` config explícito para `--project=chromium`
- Agregar `timeout-minutes` a todos los jobs (10-15 min según tipo)
- Re-activar `lint-staged` en `.husky/pre-commit`
- Crear `.dockerignore`
- Habilitar Dependabot (`.github/dependabot.yml`)
- Remover `describe.skip` de integration tests que ahora tienen PostgreSQL real

## Capabilities

### New Capabilities

- `ci-test-unit-client`: Ejecuta Vitest unit tests del cliente React cuando `apps/client/**` cambia
- `ci-test-unit-server`: Ejecuta Vitest unit tests del servidor Express cuando `apps/server/**` cambia
- `ci-test-integration`: Ejecuta tests de integración del servidor con PostgreSQL service container + Prisma migrate deploy (incluye tests antes skipeados)
- `ci-build`: Ejecuta `npm run build --ws --if-present` en cada PR
- `ci-e2e`: Ejecuta Playwright E2E tests con PostgreSQL service container + browser cache + system deps
- `ci-test-reporting`: Anotaciones de tests en PR vía `dorny/test-reporter@v3` + JUnit XML
- `ci-caching`: Multi-layer caching (npm, Vitest root-level, Playwright) para CI < 7 min
- `ci-flaky-retry`: Reintentos automáticos para tests flaky (Playwright retries:2, Vitest retry:2)
- `ci-dependabot`: Dependabot con grouping config para PRs automáticos de seguridad
- `ci-setup-monorepo`: Composite action reutilizable para checkout + Node + npm ci + caches

### Modified Capabilities

- `changes` job en `ci.yml`: Se extiende con filtros `e2e` y `shared` y sus outputs
- `quality` job en `ci.yml`: Se mantiene como gate de lint obligatorio antes de tests
- `lint-staged` en `.husky/pre-commit`: Se reactiva para ejecutar ESLint + Prettier en staged files
- Configuración Vitest existente: Se agregan `coverage.thresholds` (baseline-driven) y `retry: 2` en integration tests
- `playwright.config.js`: Se agrega `projects:` array explícito y `retries: process.env.CI ? 2 : 0`
- Integration tests: Se remueve `describe.skip` de events-soft-delete y events-combined-filters

## Impact

- **`.github/actions/setup-monorepo/action.yml`**: Nueva composite action (checkout + Node + npm ci + Vitest cache root-level)
- **`.github/workflows/ci.yml`**: Jobs changes extendido + test-unit-client, test-unit-server, test-integration, build, e2e descomentados y configurados con timeouts
- **`.github/dependabot.yml`**: Nueva configuración con grouping para npm y GitHub Actions
- **`.husky/pre-commit`**: Reactivar lint-staged
- **`.dockerignore`**: Nuevo archivo para excludes de Docker build
- **apps/client/vitest.config.js** / **apps/server/vitest.config.js**: Agregar coverage.thresholds baseline-driven y retry config
- **e2e/playwright.config.js**: Agregar projects array, retries CI-only, JUnit reporter config
- **apps/server/**/*.integration.test.js**: Remover `describe.skip` de tests con DB
- **ci.yml**: Agregar `fail-fast: false`, `timeout-minutes`, shared detection para package.json/package-lock.json
