# Unit Tests Enterprise (Vitest) — Estado, Config y Hoja de Ruta

> **Fecha:** 2026-10-01
> **Alcance:** Unit testing enterprise/profesional en el monorepo (Vitest + GitHub Actions).
> **Fuentes:** `docs/ci-cd-pipeline-empresarial.md` §23.3/§23.6, `docs/testing-architecture.md`,
> `docs/learning/panorama-resumen.md`, `docs/learning/quality-gates.md`, `vitest.shared.js`,
> `apps/{client,server}/vitest.config.js`, `.github/workflows/ci.yml`, `.husky/pre-push`, `.husky/pre-commit`, docs
> Vitest v4 (CLI, coverage, sequence, improving-performance).
> **Veredicto corto:** la arquitectura de testing está **diseñada y declarada**, pero los jobs de
> unit/integration/coverage en CI están **`if: false` (implementado ≠ activo)**. El TIA changed-only existe solo en
> local (pre-push). Sharding, smart ordering explícito y coverage merge gate de shards no existen.

---

## 1. Resumen ejecutivo

El proyecto tiene una pirámide de testing clásica (unit → integration → E2E) con organización **híbrida** (unit tests
colocados junto al source, integration centralizados por módulo, E2E top-level), config Vitest compartida
(`vitest.shared.js`) y thresholds de cobertura por workspace que funcionan como **tripwire de piso**
(`scripts/ci/check-coverage.mjs` como guard). El pipeline local tiene 3 capas shift-left (pre-commit < 10s sin tests,
pre-push ~30s con `vitest --changed origin/main`, CI completo). El pipeline CI (`.github/workflows/ci.yml`) tiene la
topología TESTING completa de §23.3 STAGE 2 — `test-unit-client`, `test-unit-server`, `test-integration`,
`test-smoke`, `client-coverage`, `server-coverage`, agregador `prebuild-unit-tests-complete` y merge gate único
`ci-complete` — pero **todos los jobs de testing están desactivados con `if: false # Disabled for incremental CI`**,
de modo que el merge gate actual no valida ni un solo test. Faltan por completo: sharding (`--shard` + blob +
`--merge-reports`), smart ordering explícito (solo el `BaseSequencer` por defecto de Vitest), TIA en CI (0 referencias
a `test:changed` en `ci.yml`), coverage merge gate de shards, flaky quarantine y snapshots. Property-based testing
tiene `fast-check` instalado (3.23.2) con 0 usos.

---

## 2. Config enterprise de Vitest

### 2.1 Include / naming (contrato de descubrimiento)

Los tests se seleccionan **por sufijo de filename**, no por carpeta — robusto frente a la organización híbrida:

| Workspace | `include`                                                                                        | Convención                                                              |
| --------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| server    | `src/**/*.unit.test.js`, `tests/integration/**/*.integration.test.js`                            | unit colocated, integration por módulo en `tests/integration/<module>/` |
| client    | `src/**/*.unit.test.{js,jsx}`, `src/**/*.ui.test.{js,jsx}`, `src/**/*.integration.test.{js,jsx}` | unit (vi.mock puro), ui (RTL), integration (MSW + Redux real)           |

- Prohibido `*.test.js` / `*.spec.js` genérico sin contexto (`testing-architecture.md` §7).
- Scripts npm refuerzan el filtro por sufijo: `test:unit` = `vitest run ".unit.test.js"` (server), `test:integration` =
  `vitest run ".integration.test.js"`.
- Config compartida vía `mergeConfig(sharedConfig, …)` en `vitest.shared.js`: `globals: true`, timeouts globales
  (`testTimeout: 30000`, `hookTimeout: 15000`, `teardownTimeout: 5000`), `coverage.provider: 'v8'`, reporters `['text',
'json-summary', 'html']`.

### 2.2 Coverage thresholds — tripwire, no gate autoritativo

| Workspace                               | statements | branches | functions | lines |
| --------------------------------------- | ---------- | -------- | --------- | ----- |
| server (`apps/server/vitest.config.js`) | 39         | 18       | 7         | 39    |
| client (`apps/client/vitest.config.js`) | 84         | 49       | 63        | 85    |

Política (§23.3 regla 5, línea de análisis 520):

- **Coverage tripwire = floor ratchet absoluto**, no quality gate primario. Atrapa abandono catastrófico (módulo nuevo
  con 0 tests).
- `coverage.thresholds.autoUpdate: false` **siempre en CI** (nunca dejar que CI reescriba el piso; el ratchet se sube
  manualmente en PRs que mejoran cobertura). Vitest 4 soporta `autoUpdate: boolean | function` como mecanismo de ratchet
  asistido — usarlo solo localmente/vía PR, jamás auto-aprobarse en CI.
- El **gate autoritativo** de cobertura es SonarQube new-code ≥80% en STAGE 4 ("Clean as You Code") — hoy **inactivo**
  en `ci.yml` (`if: false`, sin `SONAR_TOKEN`).
- Regla: si unit tests pasan pero cobertura es baja → **build igual, no merge** (cobertura es gate de merge/release, no
  de build).
- Guard ejecutable: `scripts/ci/check-coverage.mjs <workspace>` lee los thresholds **del propio `vitest.config.js`**
  (single source of truth) y los compara contra `coverage-summary.json` (`total`). Exit 1 si baja. Usado por los jobs
  `client-coverage`/`server-coverage` (hoy `if: false`).
- Targets por criticidad (no un global): CRÍTICO ≥80%, ALTO ≥60%, NORMAL best-effort (`testing-architecture.md` §16.1).
  El global bajo es intencional.
- Vitest 4 permite thresholds por glob (`coverage.thresholds['src/critical/**']`) y `perFile: true` — **no
  implementados**; hoy solo globales por workspace.
- `coverage.changed` (Vitest 4): coleccionar cobertura solo de archivos cambiados — **no implementado**; candidato a TIA
  de cobertura en pre-push.

### 2.3 TIA (Test Impact Analysis) — changed-only

- **Local (implementado):** `.husky/pre-push` ejecuta `vitest run --changed origin/main --config
apps/server/vitest.config.js` y lo mismo para client, ambos bloqueantes (`set -e` + `|| exit 1`). Diff base
  `origin/main` (no `HEAD~1`): cubre todos los commits de la rama, estándar de industria (Nx affected, Turborepo
  `--filter`), compatible con trunk-based development.
- Scripts `test:changed` (`vitest run --changed`) en ambos `package.json` de workspace.
- **CI (implementado en P1, change `ci-testing-pipeline-reactivation`):** scripts `test:changed:ci` en ambos
  workspaces (`vitest run --changed origin/main …` + filtro `.unit.test.js` en server). Los jobs `test-unit-client` /
  `test-unit-server` resuelven el scope en un paso previo: diff-scoped si `origin/main` es resoluble (el checkout ya
  declara `fetch-depth: 0`), **suite completa** si `repo-discovery.outputs.shared == 'true'` (root manifest, lockfile o
  workflows) **o si `origin/main` no resuelve** — el fallback es explícito y ruidoso, nunca "0 tests afectados" en
  silencio.
- **El guard de thresholds NO come cobertura diff-scoped (D18):** `check-coverage.mjs` compara totales de
  suite completa contra los thresholds globales; una corrida `--changed` solo carga los tests afectados, así que sus
  totales no son comparables. `client-coverage` / `server-coverage` verifican la **presencia del artefacto** y difieren
  el umbral a la próxima full-suite. Las salidas que cierran el círculo: los PRs `shared` y el nocturno.
- **Red de seguridad:** `.github/workflows/nightly-full-suite.yml` corre las suites completas a diario (advisory, con
  `dorny/test-reporter` y guard de cobertura informational). Es la superficie que detecta lo que el diff-scoped dejó
  fuera (orden, cache, deriva de dependencias).
- Limitación documentada (`docs/adr/turborepo-evaluation.md`): `vitest --changed` es **local y no persistente
  cross-machine** — en CI no hay cache de la memoria de tests entre runs (R5 del design: por eso el nocturno).
- Excluidos por diseño de pre-push: E2E (Playwright) e integration con DB (requieren PostgreSQL) — pertenecen a CI.

### 2.3-bis Flaky quarantine, métrica semanal y retries (implementado en P1)

- **Lista versionada** `.github/flaky-quarantine.yml` — **única** fuente de exclusión en los runs bloqueantes. Esquema
  por entrada: `test`, `file`, `date`, `reason`, `owner` (los cinco obligatorios; el parser valida y falla ruidosamente
  ante un fichero mal formado en vez de degenerar en "excluir nada").
- **`scripts/ci/quarantine-exclude.mjs`** deriva el conjunto excluido de esa lista y lo pasa a Vitest como
  `--exclude=<glob>` (aditivo en Vitest 4: `resolved.exclude.push(...cliExclude)`, no pisa los defaults). El paso
  también escribe un informe Markdown en el `$GITHUB_STEP_SUMMARY` del run, para que el PR vea **qué se excluyó y por
  qué**. Prohibido silenciar un intermitente con `test.skip` o borrando el test (§3.4.7).
- **El nocturno NO aplica las exclusiones**: ejecuta los tests en cuarentena y su resultado es la evidencia de
  restauración que necesita el owner.
- **Métrica semanal** `.github/workflows/flaky-weekly.yml` → `scripts/ci/flaky-metric.mjs`: agrega los artifacts de
  las corridas de `ci.yml` de los últimos 14 días (ventana, ≥10 ejecuciones, pass-rate <70% = candidato a
  cuarentena; <10 ejecuciones = "insufficient data", **no** se marcan). Calcula además el **share de cuarentena** sobre
  el total de la suite: objetivo <1%, y al alcanzarlo emite alerta **advisory** (no toca `ci-complete` ni el merge).
- **Evidencia de retries.** Hallazgo de implementación: en Vitest 4.1.11 el reporter `junit` escribe **un `testcase`
  por test con el estado final** (los reintentos se colapsan) y el `json` tampoco expone `retryCount`/`flaky` — un
  "pasó tras retry" sería indistinguible de un verde limpio. Por eso los scripts `*:ci` encadenan un **reporter
  custom** (`scripts/ci/vitest-flaky-reporter.mjs`) que vuelca `reports/flaky-retries.json`; los jobs lo publican como
  artifact `flaky-evidence-{client,server}` (retención 30d) y la métrica lo cruza con el JUnit para distinguir
  _verde limpio_ de _verde tras retry_.
- **Retries acotados, solo CI y visibles:** `e2e/playwright.config.js` `retries: process.env.CI ? 2 : 0` y
  `apps/server/vitest.config.js` `retry: 2` bajo la condición CI (con `maxWorkers: 1, isolate: false`). Cero retries en
  `.husky/*` (el tier local no enmascara flakiness).
- **Restauración = PR humano.** La métrica lista los tests en cuarentena con pass-rate ≥70% como _ready for review_;
  ningún workflow crea, modifica ni borra entradas. Borrar una entrada es siempre un PR humano.

### 2.4 Sharding

- **No implementado** (0 evidencia, `panorama-resumen.md`). Debe usar el patrón Vitest 4:
  - `vitest run --reporter=blob --shard=1/3` … `--shard=3/3` por runner (matrix strategy con `max-parallel` explícito).
    - `vitest --merge-reports --reporter=junit` en un job `merge-reports` que descarga los artifacts
      (`include-hidden-files: true` para `.vitest/` o `.vitest-reports/`).
    - `--shard` parte **archivos** (no casos), determinista por hash SHA-1 del path — un split por conteo; **no balancea
      por duración** (issue `vitest-dev/vitest#9184`, `balanceShardsByTime` propuesto, no implementado). Balanceo por
      duración = custom `sequence.sequencer` user-land.
    - Costo: cada matrix necesita `max-parallel` explícito + `concurrency` group a nivel workflow para cancelar runs
      obsoletos por push (§23.3, línea 3465) — sin esto la factura escala linealmente.
- **Prerrequisito:** solo tiene sentido cuando el duration de la suite lo justifica (>5-8 min). Hoy los jobs ni corren.

### 2.5 Smart test ordering

- **No configurado explícitamente**, pero Vitest trae un `BaseSequencer` con orden por cache: **failed first → longer
  first** (y sin cache: unknown first → larger first). Es "fail-first" parcial por defecto.
- `sequence.sequencer` permite custom (extender `BaseSequencer` de `vitest/node`, métodos `sort`/`shard`);
  `sequence.shuffle.files/tests` para aleatorización (detecta interdependencias; pierde el beneficio de precarga de
  tests lentos primero).
- §23.3 regla 21 (línea 859) pide fail-first basado en histórico (Launchable/Nx/Vitest `--changed`) como stage
  pre-build. **Estado: 0 evidencia de configuración ni de persistencia de cache de orden en CI.**
- Recomendación: en CI con `--shard`, el orden dentro del shard es irrelevante para el wall-time total; el valor del
  fail-first está en **pre-push y en el job unit single-runner**.

### 2.6 Coverage Merge Gate (requerido con sharding — §23.6)

- Sharding implica cobertura **parcial por shard**: sin un job de merge, el tripwire ratchet **miente** (fallo falso o
  pase falso).
- Diseño §23.6: job `coverage-merge-gate` con `needs: [test-shard-1..3]` → descarga artifacts de cobertura → merge
  (blob/`json-summary` merge) → `check-coverage` contra thresholds absolutos.
- Estado: gate **por workspace** existe (`scripts/ci/check-coverage.mjs`, usado en `client-coverage`/`server-coverage`,
  ambos `if: false`); merge de shards **no** (es N/A hasta que haya sharding).

### 2.7 CI jobs — blocking vs advisory (estado real)

| Job / agregador                                                                        | Rol                                                                                                                                             | Estado en `ci.yml`                                                                     |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `test-unit-client`                                                                     | Unit tests client **diff-scoped (TIA)** + coverage artifact + `dorny/test-reporter` (junit) + evidencia de flakiness                            | **FASE 1 advisory** — scoping `(client                                                 |
| `test-unit-server`                                                                     | Unit tests server **diff-scoped (TIA)**, suite unit-scoped + coverage + reporter + evidencia de flakiness                                       | **FASE 1 advisory** — mismo patrón                                                     |
| `client-coverage` / `server-coverage`                                                  | `node scripts/ci/check-coverage.mjs <ws>` — tripwire (**solo en full suite**, D18)                                                              | **FASE 1 advisory** — `needs` = su test job; difiere el umbral en corridas diff-scoped |
| `test-integration`                                                                     | Suite integration server + service `postgres:16-alpine` + `prisma migrate deploy` + junit                                                       | **`if: false`** (L1449)                                                                |
| `test-smoke`                                                                           | `test:smoke:ci` + postgres service                                                                                                              | **`if: false`** (L1495)                                                                |
| `e2e`                                                                                  | Playwright + cache de browsers + postgres                                                                                                       | **`if: false`** (L1541)                                                                |
| `prebuild-unit-tests-complete`                                                         | Agregador `needs:` los **6** jobs (4 test + 2 coverage) + `always()` + chequeo `failure`/`cancelled`                                            | **Activo** — propagando los resultados reales de los 6 jobs                            |
| `nightly-full-suite.yml` (workflow aparte)                                             | Suites completas diarias de ambos workspaces + cobertura advisory + `dorny/test-reporter`                                                       | **Activo** (advisory) — red de seguridad del TIA, sin exclusiones de cuarentena        |
| `flaky-weekly.yml` (workflow aparte)                                                   | Métrica semanal de pass-rate (14d) desde los artifacts de `ci.yml` + share de cuarentena                                                        | **Activo** (advisory) — nunca edita la lista de cuarentena                             |
| `ci-complete`                                                                          | Merge gate único (required check del ruleset) — depende de los 4 agregadores + `verify-signatures` + `zombie-workflow-guard` + `repo-discovery` | **Activo** — hoy mergea **sin ejecutar ningún test**                                   |
| `client-sonarqube` / `server-sonarqube`                                                | Gate autoritativo de cobertura new-code                                                                                                         | `if: false` (sin `SONAR_TOKEN`)                                                        |
| `docs-validation`, `sast`, `lockfile-audit`, `checkov-iac`, `scancode-license-pr-diff` | **Advisory** (`continue-on-error: true` / fuera de `needs`) — patrón FASE 1 → FASE 2 tras 2-4 semanas de runs limpios                           | Activo (advisory)                                                                      |

Patrón del repo para gates: **FASE 1 advisory** (`continue-on-error` a nivel job, `actions/toolkit#581` → el agregador
ve `success`) → **FASE 2 blocking** (quitar flag + actualizar docs) tras ventana de runs limpios. Aplicar exactamente
ese patrón al re-activar los jobs de test.

### 2.8 Shift-left: pre-commit vs pre-push (decisión ya tomada y correcta)

| Capa       | Timeout                  | Ejecuta tests                                                                                                                      | Archivo                     |
| ---------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Pre-commit | < 10s                    | **NO** — solo lint-staged + Semgrep + secrets (+ capas advisory: audit, checkov, hadolint, actionlint, zizmor, manifest, guarddog) | `.husky/pre-commit`         |
| Pre-push   | ~30s (límite SSH GitHub) | **SÍ** — `vitest run --changed origin/main` (server + client), bloqueante                                                          | `.husky/pre-push` (L52/L56) |
| CI         | ilimitado                | Suite completa + coverage + security                                                                                               | `ci.yml`                    |

Razones (§23.3 regla 16, `testing-architecture.md` §7.5):

- Los tests van en **pre-push**, no en pre-commit: lint/fix es <10s y puede mutar archivos (lint-staged autofix); los
  tests con `--changed` necesitan el diff `origin/main..HEAD` que solo es completo en push, y el presupuesto de 30s lo
  permite.
- `origin/main` como base en vez de `HEAD~1` (multi-commit, TBD, estándar Nx/Turbo).
- Defense-in-depth: si el dev usa `--no-verify` o trabaja offline, **CI es el fallback obligatorio** — por eso la
  re-activación de `test-unit-*` en CI es la pieza crítica (hoy el fallback no existe).
- Evitar `npx` en los hooks (D12 cross-platform) — el hook ya invoca `vitest` directo.

---

## 3. Patrones enterprise: AAA, aislamiento y mocking

### 3.1 AAA (Arrange–Act–Assert)

- Estructura obligatoria por test: **Arrange** (setup/datos/doubles) → **Act** (una sola acción sobre el SUT) →
  **Assert** (comportamiento observable). Alternativa Given–When–Then.
- **Un comportamiento por test**; el nombre lee como spec:
  `evento_registro_rsvp_cuando_ya_esta_inscrito_lanza_conflict`.
- **Ratio AAA como métrica de salud**: ~1:1:1 es sano; >60% Arrange indica doubles excesivos o setup repetido (DRY +
  builders); **>80% Arrange = test frágil acoplado a internals, re-subir de nivel** (integration) o rediseñar. (Fuente:
  freestyletesting.org, 2025-12.)
- Aserciones específicas: `expect(result.status).toBe('CANCELLED')` > `expect(result).toBeTruthy()`; múltiples asserts
  OK si describen **un** comportamiento.

### 3.2 Aislamiento (propiedades FAST)

Fast · Isolated · Repeatable · Self-validating · Timely. En este repo (`testing-architecture.md` §6):

- Sin estado compartido entre tests; determinismo (reloj, red, DB siempre dobleados o controlados).
- Server: `pool: 'forks'`, en CI `maxWorkers: 1, isolate: false` (server además `retry: 2`) — nota: `isolate: false` en
  CI es una **optimización de memoria** que debilita el aislamiento; aceptable solo si no hay estado entre archivos, y
  es la causa típica de order-dependence.
- Reporter `hanging-process` para diagnosticar handles abiertos (cross-platform §18.3).
- Timeouts explícitos (D11): 30s/15s/5s — un test que necesite >30s es candidato a integration/smoke, no a unit.

### 3.3 Mocking — estrategia por capas (§9)

| Nivel                                | Estrategia                                         | Regla                                                                                                               |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Unit (`*.unit.test.*`)               | `vi.mock` — sin red, sin MSW, sin store Redux real | Mockear solo dependencias **externas**                                                                              |
| UI (`*.ui.test.*`)                   | RTL + mocks puntules (`react-router`, etc.)        | Comportamiento, no implementación                                                                                   |
| Integration (`*.integration.test.*`) | **MSW + Redux/router/hooks reales**                | `server.listen()` / `resetHandlers()` / `close()`; overrides por test con `server.use(...)` para errores/edge cases |
| E2E                                  | Sin mocks (o mínimos)                              | Sistema real                                                                                                        |

**Se mockea:** HTTP (vía MSW — fuente única de verdad), navegación, tiempo (`Date`, timers), librerías no deterministas.
**NO se mockea:** lógica de negocio, selectores de Redux, hooks propios, estado global en integration, RTK Query en
integration.

Test doubles: preferir **stub/spy/fake** (p. ej. `InMemoryRepository`); `mock` con expectativas de interacción solo
cuando el contrato importa (`toHaveBeenCalledTimes(1)`). Tabla mental: Dummy/Stub/Spy/Mock/Fake con propósito único.

### 3.4 Anti-patrones (verificar en code review)

1. **Testear el mock, no el comportamiento** — aserciones sobre elementos del mock que prueban que el mock existe.
2. **Over-mocking / AAA desbalanceado (>80% Arrange)** — tests que rompen con cualquier refactor; subir de nivel o
   mockear más abajo en la cadena.
3. **Mockear sin entender los side effects** — el mock elimina el efecto del que dependía el test (p. ej. escribir
   config) → pasa por la razón equivocada. Regla: si el test depende de un side effect, mockear la operación
   lenta/externa de abajo, no el método de alto nivel.
4. **Métodos solo-para-test en producción** (`destroyForTests()` etc.) → utilidades de test en su lugar.
5. **Tests dependientes entre sí** (orden, estado compartido) — agravado por `isolate: false`.
6. **Fetch manual cuando hay MSW**; mezclar estrategias de mocking sin control (§9.9).
7. **Flaky silenciado**: `sleep`/reintentos ciegos, `test.skip` de tests intermitentes — política §23.3 regla 20:
   diagnosticar y corregir con prioridad; **quarantine con restauración humana** (pass-rate <70% → quarantine), nunca
   "reintentar hasta que pase" en silencio. `retry: 2` solo en CI y como red de red, no como política.
8. **Lógica en los tests** (ifs/loops) → parameterized tests / `test.each` / tablas de datos.
9. **Mega-setups de 50 líneas** → builders/fixtures reutilizables (`tests/mocks/fixtures/`).
10. **Cobertura como meta** — tests triviales que solo suben el %; usar la matriz por criticidad (§16.1) y `perFile`
    para código crítico.
11. **Snapshots de UI como gate** — 0 snapshots en el repo hoy; si se usan, revisarlos siempre en PR (los snapshots
    grandes/autogenerados ocultan regresiones).

---

## 4. Matriz implementado vs faltante

### 4.1 Implementado (verificado en repo)

| Elemento                                                                                         | Evidencia                                                                 |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Config enterprise base (include por sufijo, shared config, timeouts, v8, reporters)              | `vitest.shared.js`, `apps/*/vitest.config.js`                             |
| Thresholds de cobertura por workspace + guard ejecutable                                         | thresholds en configs; `scripts/ci/check-coverage.mjs`                    |
| TIA changed-only **local** (pre-push, bloqueante, base `origin/main`)                            | `.husky/pre-push:52,56`                                                   |
| Scripts `test:changed` por workspace                                                             | `apps/{server,client}/package.json`                                       |
| Shift-left en 3 capas con presupuestos (<10s / ~30s / ilimitado)                                 | `.husky/pre-commit` (0 tests), `pre-push`, `testing-architecture.md` §7.5 |
| Topología CI TESTING completa (4 jobs + 2 coverage + agregador + merge gate `ci-complete`)       | `ci.yml` L735-793, L1356-1446, L1717-1765                                 |
| JUnit + `dorny/test-reporter` + artifacts de cobertura                                           | `ci.yml` test jobs                                                        |
| Integration con `postgres:16-alpine` service + `prisma migrate deploy`                           | `ci.yml` `test-integration`/`test-smoke`                                  |
| Organización híbrida completada (161 unit tests colocated)                                       | `testing-architecture.md` §8.4                                            |
| Estrategia de mocks documentada por capa + anti-patrones                                         | `testing-architecture.md` §9                                              |
| Targets de cobertura por criticidad (80/60/best-effort)                                          | `testing-architecture.md` §16.1                                           |
| Diagnóstico cross-platform (`hanging-process`, `pool: forks`, timeouts D11, hooks sin `npx` D12) | `testing-architecture.md` §18                                             |
| Patrón de gobierno blocking/advisory (FASE 1 → FASE 2)                                           | `ci.yml`, `quality-gates.md`                                              |

### 4.2 Faltante o desactivado (gap → impacto)

| Gap                                                        | Estado                                         | Impacto                                                                            | Prioridad                           |
| ---------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------- |
| `test-integration`, `test-smoke`, `e2e` en CI              | **`if: false`** — declarados, no corren        | `ci-complete` sigue mergeando sin validar integration/E2E                          | **P1**                              |
| Promoción FASE 2 (blocking) de los 6 jobs de unit/coverage | FASE 1 advisory (`continue-on-error: true`)    | Hoy los fallos no bloquean el merge: ventana de calibración de 2-4 semanas abierta | **P0** (tras calibrar)              |
| Sharding (`--shard` + blob + `--merge-reports`)            | 0 evidencia                                    | Wall-time alto en cuanto la suite crezca                                           | P2 (activar cuando suite > 5-8 min) |
| Coverage Merge Gate de shards                              | N/A (sin shards); guard por workspace sí       | Sin sharding no aplica; **obligatorio antes de habilitar sharding**                | P2                                  |
| Smart ordering explícito / fail-first persistido           | Solo `BaseSequencer` por defecto (cache local) | Feedback fail-first no garantizado en CI                                           | P2                                  |
| Snapshot tests                                             | 0 `.snap` / `toMatchSnapshot`                  | §23.3 lo contempla en STAGE 2; gap de regresión de UI                              | P3                                  |
| Property-based testing                                     | `fast-check@3.23.2` instalado, **0 usos**      | Invariantes/parsers sin cubrir (§23.3 `[SL]`)                                      | P2                                  |
| Gate autoritativo de cobertura (SonarQube new-code ≥80%)   | `if: false`, sin `SONAR_TOKEN`                 | El tripwire es el único guard y está desactivado                                   | P1                                  |
| Balanceo de shards por duración                            | No existe en Vitest (#9184); custom sequencer  | Shards desbalanceados                                                              | P3                                  |
| `coverage.changed` / thresholds por glob / `perFile`       | No implementados                               | TIA de cobertura y granularidad crítica no disponibles                             | P3                                  |
| CONTEXT.md términos TESTING (0/10)                         | Pendiente (`panorama-resumen.md` §4)           | Onboarding/decisions drift                                                         | P3                                  |

---

## 5. Recomendación (orden de ejecución sugerido)

1. ~~**P0 — Re-activar el pipeline de tests**~~ — **HECHO** (FASE 1 advisory): los 4 test jobs y los 2 coverage jobs
   corren en PR con `continue-on-error: true`; el agregador `prebuild-unit-tests-complete` los sigue incluyendo en
   `needs` (4 → 6). **Pendiente**: ventana de calibración de 2-4 semanas y promoción a FASE 2 (quitar el
   `continue-on-error`) — mientras tanto `ci-complete` refleja el resultado pero no bloquea por fallos de test.
2. ~~**P1 — TIA en CI**~~ — **HECHO**: scripts `test:changed:ci` en ambos workspaces + resolución de scope en los jobs
   (diff-scoped si `origin/main` resuelve, full suite si `shared` o si la base no resuelve) + guard de thresholds que
   difiere en corridas diff-scoped (D18) + nocturno `nightly-full-suite.yml` como red de seguridad.
3. ~~**P1 — Flaky quarantine**~~ — **HECHO**: lista versionada `.github/flaky-quarantine.yml` + derivación de
   exclusiones en los runs bloqueantes + nocturno que la ignora + métrica semanal (`flaky-weekly.yml`) con pass-rate,
   insufficient-data y share <1% + reporter custom para la evidencia de retries.
4. **P1 — Promover a FASE 2 tras la calibración** (2-4 semanas de runs con fallos triados): quitar
   `continue-on-error: true` de los 6 jobs en un único PR con su doc en lockstep (`quality-gates.md` §2 y §4.2). Es el
   paso que hace que `ci-complete` bloquee de verdad por un test rojo.
5. **P1 — Reactivar `test-integration` / `test-smoke` / `e2e`**: declarados y configurados, aún `if: false` (su
   activación depende de la estabilidad del service PostgreSQL en CI).
6. **P2 — Sharding solo si duration lo justifica**: matrix `--shard=N/M --reporter=blob` + job `merge-reports` +
   **`coverage-merge-gate` obligatorio** (§23.6) + `max-parallel` y `concurrency` group (control de costos, línea 3465).
7. **P2 — Property-based** con `fast-check` ya instalado para parsers/invariantes (`mentionParser`, sanitizers, state
   machines).
8. **P3 — Snapshots, thresholds por glob/`perFile`, SonarQube** (cuando haya token).

---

## 6. Fuentes

**Repo (verificadas):**

- `docs/ci-cd-pipeline-empresarial.md` — §23.3 (diagrama STAGE 2 TESTING L2824-2832; reglas 16/18/20/21
  L284/L856/L858/L859; matriz TESTING L3409-3413; costos L3465; coverage tripwire L520), §23.6 Coverage Merge Gate
  (L3469-3494).
- `docs/testing-architecture.md` — §4 capas, §6 principios, §7.5 estrategia pre-commit/pre-push/CI, §8 híbrido, §9
  mocks/anti-patrones, §16 coverage targets, §18 cross-platform.
- `docs/learning/panorama-resumen.md` — matriz implementado≠activo y faltantes explícitos.
- `docs/learning/quality-gates.md` — estado blocking/advisory por job y requisitos de activación.
- `vitest.shared.js`, `apps/server/vitest.config.js`, `apps/client/vitest.config.js`, `scripts/ci/check-coverage.mjs`.
- `.github/workflows/ci.yml` (test jobs L735-793/L1448-1596, coverage L1356-1446, agregadores L1637-1765).
- `.husky/pre-push`, `.husky/pre-commit`, `apps/{server,client}/package.json`.
- `docs/adr/turborepo-evaluation.md` (límites de `--changed` cross-machine), `docs/changelog.md` (migración del hook a
  scoped).

**Externas (consultadas 2026-10-01):**

- Vitest v4 CLI (`--changed`, `--shard`, `--merge-reports`, `coverage.changed`): <https://v4.vitest.dev/guide/cli>
- Vitest coverage (`thresholds`, `autoUpdate`, `perFile`, globs): <https://v4.vitest.dev/config/coverage>
- Vitest sharding + blob reporter + merge-reports: <https://vitest.dev/guide/improving-performance> ·
  <https://vitest.dev/guide/reporters>
- Vitest sequence/sequencer (fail-first, shuffle, custom sequencer): <https://vitest.dev/config/sequence>
- Issue duration-aware sharding (#9184): <https://github.com/vitest-dev/vitest/issues/9184>
- BaseSequencer (failed first → longer first):
  <https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/sequencers/BaseSequencer.ts>
- AAA y unit testing best practices: <https://www.ibm.com/think/insights/unit-testing-best-practices> ·
  <https://billyokeyo.dev/posts/unit-testing-in-depth/> ·
  <https://www.augmentcode.com/guides/unit-testing-best-practices-that-focus-on-quality-over-quantity>
- AAA ratio / abuso de test doubles: <https://freestyletesting.org/stop-abusing-test-doubles/>
- Anti-patrones de mocking:
  <https://github.com/aiskillstore/marketplace/blob/main/skills/dyai2025/testing-anti-patterns/SKILL.md>
