# Proposal — Reactivación y maduración del pipeline de testing en CI

> **Change unificado (2026-10-01):** absorbe el change `ci-test-integration` (53/58, deltas nunca sincronizados con naming obsoleto: job `changes`, outputs `frontend`/`backend`). Sus capabilities `ci-caching`, `ci-dependabot`, `ci-dockerignore`, `ci-e2e`, `ci-flaky-retry` y `ci-test-reporting` viven ahora aquí con contenido modernizado; lo aún vigente de su `ci-test-pipeline` (servicio Postgres del job de integración, aislamiento y timeouts) se plegó en `ci-test-jobs-activation`. `ci-testcontainers` NO se absorbe (scope AWS con Testcontainers, change propio).

## Why

El merge gate único `ci-complete` de `.github/workflows/ci.yml` **no valida ni un solo test**: los jobs `test-unit-client` (L735), `test-unit-server` (L765), `test-integration` (L1448), `test-smoke` (L1494), `client-coverage` (L1356) y `server-coverage` (L1414) están declarados con `if: false # Disabled for incremental CI`, de modo que `prebuild-unit-tests-complete` (L1717, `always()`) los ve `skipped` y termina **siempre SUCCESS**. La defensa en profundidad del shift-left se rompió: el pre-push bloqueante con `vitest --changed origin/main` es la única capa que ejecuta tests, y queda sin fallback de CI (un `--no-verify` o un trabajo offline mergea sin validar nada). El tripwire de cobertura (`scripts/ci/check-coverage.mjs`) tampoco corre en PR: nada bloquea la caída de cobertura. Fuente: `docs/learning/unit-tests-enterprise.md` (veredicto y §4.2), `docs/learning/quality-gates.md` L34/L77.

Además, la infraestructura periférica que sostiene el pipeline de testing está desalineada respecto de lo que este repo ya tiene: los deltas heredados de `ci-test-integration` describían caching en la composite action, Dependabot, `.dockerignore`, job `e2e` con Postgres, reporting JUnit y retries con naming y contratos de 2026-08 (job `changes`, `setup-node@v4`, `actions/cache@v4`, workspace `client-react`). El estado real ya implementa gran parte (`.github/dependabot.yml`, `.dockerignore`, `setup-monorepo` con cache Vitest, e2e con `postgres:16-alpine` + cache de Playwright, `retry: 2` en CI); este change moderniza esas capabilities y cierra los gaps residuales con evidencia.

## What Changes

**P0 — Re-activación (FASE 1 advisory → FASE 2 blocking):**

1. Quitar `if: false` a `test-unit-client`, `test-unit-server`, `test-integration` y `test-smoke`, adoptando el patrón de los jobs quality activos: `if: needs.repo-discovery.outputs.<ws> == 'true' || shared == 'true'` y `github.event_name == 'pull_request'` (path-scoped, con `shared` disparando la suite completa del workspace).
2. Activar la FASE 1 del patrón de gobierno del repo: `continue-on-error: true` a nivel job durante la ventana de calibración (2-4 semanas de runs limpios) — el job reporta (`dorny/test-reporter` + anotación roja) pero no bloquea; la FASE 2 quita el flag y actualiza `docs/learning/quality-gates.md` en lockstep.
3. Re-activar `client-coverage` / `server-coverage` (tripwire `check-coverage.mjs`) y **añadirlos a `prebuild-unit-tests-complete.needs`** (requisito explícito de `quality-gates.md` §4.2 / L77), lo que modifica el contrato de `needs` del agregador especificado en `ci-prebuild-substage-structure` (4 → 6 jobs).
4. Corregir los bloqueadores latentes que solo afloran al activar: (a) el guard de server apunta por defecto a `<ws>/coverage` pero el server reporta en `apps/server/tests/coverage`; (b) los jobs `test-unit-*` no emiten `reports/junit.xml` que exige `dorny/test-reporter`; (c) `test:coverage` del server ejecuta también `*.integration.test.js` (sin servicio PostgreSQL en ese job).
5. `e2e` **fuera de alcance para la activación**: permanece `if: false` hasta que el service esté estable (decisión explícita); este change solo especifica su contrato listo-para-activación (`ci-e2e`).

**P1 — TIA en CI, flaky quarantine y retries acotados:**

6. TIA (Test Impact Analysis) en CI: scoping de los jobs de test con los outputs de `repo-discovery` + `vitest run --changed origin/main` (ya soportado por los scripts `test:changed`), con suite completa cuando cambian rutas `shared` y **run full nocturno** como red de seguridad (patrón Affected de Nx/Turborepo).
7. Flaky quarantine: métrica semanal de tests intermitentes (pass-rate <70% → candidato), lista `.github/flaky-quarantine.yml` con restauración **humana**, `retry` limitado a CI y visible en el reporte — nunca "reintentar hasta que pase" en silencio (§23.3 regla 20). Los retries Playwright/Vitest ya configurados (`retries: CI ? 2 : 0`, `retry: 2`) quedan especificados en `ci-flaky-retry` y alineados con `ci-flaky-quarantine`.

**P1b — Infraestructura del pipeline absorbida de `ci-test-integration` (modernizada):**

8. `ci-caching`: cache npm (via `setup-node@v5` `cache: 'npm'`) y cache Vitest (`node_modules/.cache` con `actions/cache@v5`) centralizados en la composite `setup-monorepo` — ya implementados; la capability los especifica con los majors vigentes.
9. `ci-dependabot`: `.github/dependabot.yml` único (ya existe) con ecosistemas npm + github-actions, límite 10 y labels; EXTEND-NOT-RECREATE si algún change futuro lo amplía.
10. `ci-dockerignore`: `.dockerignore` en raíz (ya existe) excluyendo contexto no-runtime y `.env`.
11. `ci-e2e`: contrato del job `e2e` listo-para-activación — service `postgres:16-alpine` idéntico al de integración, `pg_isready`, `prisma migrate deploy`, `--project=chromium`, cache de browsers de Playwright, `timeout-minutes: 15`. Sin fecha de activación (fuera de alcance).
12. `ci-test-reporting`: cada job de test publica JUnit vía `dorny/test-reporter@v3` con `if: success() || failure()` — annotations en el PR.

**P2 — Sharding (solo si la duración lo justifica):**

13. Sharding de suites con matriz `--shard=N/M --reporter=blob` + merge en los coverage jobs (`merge-coverage.mjs` + `vitest --merge-reports`) + `max-parallel` explícito, y **`coverage-merge-gate` obligatorio antes de habilitar sharding** (§23.6): sin merge de cobertura el tripwire miente (falso positivo/negativo).

**Fuera de alcance (explícito):** activación de `e2e` (solo contrato), SonarQube (`if: false`, sin `SONAR_TOKEN`); property-based testing (`fast-check` sin usar); snapshots; thresholds por glob/`perFile` y `coverage.changed`; balanceo de shards por duración (issue `vitest-dev/vitest#9184`); cambios en `.husky/pre-commit` / `.husky/pre-push` (ya correctos); activación de `client-build`/`server-build`/`server-format-check`/`client-depcheck`/`server-depcheck`; tests AWS con Testcontainers (dueño: change `ci-testcontainers`).

## Capabilities

### New Capabilities

- `ci-test-jobs-activation`: re-activación de los 6 jobs de testing de STAGE 2 en CI (scoping `repo-discovery`, gobernanza FASE 1 advisory → FASE 2 blocking), la correcta producción/consumo de artefactos (junit + cobertura), el reflejo honesto de la salud de tests en `ci-complete`, y el contrato estructural del pipeline de tests heredado de `ci-test-pipeline` (service PostgreSQL del job de integración, aislamiento de jobs y timeouts) con el naming vigente.
- `ci-test-impact-analysis`: ejecución en CI scopeada al diff del PR (`--changed origin/main`) con red de seguridad de suite completa nocturna y disparo total ante rutas `shared`.
- `ci-flaky-quarantine`: detección cuantitativa de tests intermitentes, lista de quarantine con propiedad humana de restauración y métrica semanal (<1%).
- `ci-test-sharding`: sharding de suites Vitest con merge de reportes y **coverage merge gate** previo, con controles de coste.
- `ci-caching`: cache npm y Vitest en la composite `setup-monorepo` (`setup-node@v5` + `actions/cache@v5`), objetivo de duración del pipeline.
- `ci-dependabot`: `.github/dependabot.yml` único con ecosistemas npm (agrupación de dev-deps) y github-actions.
- `ci-dockerignore`: `.dockerignore` raíz que excluye contexto no-runtime y secretos del build.
- `ci-e2e`: contrato listo-para-activación del job `e2e` (Playwright + service PostgreSQL + cache de browsers + projects explícito).
- `ci-flaky-retry`: retries automáticos acotados (≤2, solo CI, visibles) para Playwright E2E y tests Vitest, alineados con `ci-flaky-quarantine`.
- `ci-test-reporting`: publicación de resultados JUnit en el PR vía `dorny/test-reporter` con annotations.

### Modified Capabilities

- `ci-prebuild-substage-structure`: el requirement `prebuild-unit-tests-complete` pasa de "exactamente 4 jobs" a "exactamente 6 jobs" (`+ client-coverage, server-coverage`), preservando la exclusión de `e2e` y la ubicación de cobertura fuera del substage 2D.

## Impact

- **Código/CI**: `.github/workflows/ci.yml` (6 jobs reactivados, `needs` del agregador 4→6, FASE flags); workflow nuevo para el run nocturno y la métrica flaky (`scheduled-*` ya existen como precedente); `.github/flaky-quarantine.yml` (nuevo); `apps/server/package.json` (script de cobertura unit-scoped y reporters `*:ci`) y `apps/client/package.json` (reporter CI); `scripts/ci/check-coverage.mjs` (directorio de cobertura del server) y `scripts/ci/merge-coverage.mjs` (nuevo, solo si P2 se activa).
- **Docs**: `docs/learning/quality-gates.md` (§2/§4.2 filas de los jobs y promoción FASE 2), `docs/learning/unit-tests-enterprise.md` (matriz implementado vs activo), `docs/testing-architecture.md` (§7.5 tiers + quarantine), `docs/CONTEXT-CICD.md` si aplica.
- **Specs**: reconciliación de la prosa de `openspec/specs/coverage-baselines/spec.md` que aún nombra a `ci-test-integration` como dueño de los thresholds (tarea 8.4).
- **Riesgo principal**: la primera activación puede revelar tests rojos o suites que exceden `timeout-minutes: 10` → mitigado por el arranque en FASE 1 advisory (nunca bloqueante en la ventana de calibración) y por el path-scoping (solo corre el workspace tocado).
- **Validación**: `openspec validate ci-testing-pipeline-reactivation --strict` y `openspec validate --specs --strict`; en CI `actionlint` exit 0 sobre `ci.yml` (no se renombra ningún required status check).
