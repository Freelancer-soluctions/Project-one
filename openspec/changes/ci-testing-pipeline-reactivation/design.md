# Design — Reactivación y maduración del pipeline de testing en CI

## Context

Ver `proposal.md` (Why) para la motivación. Solo el estado que condiciona el enfoque:

- `.github/workflows/ci.yml`: los 6 jobs de testing (`test-unit-client` L735, `test-unit-server` L765, `client-coverage` L1356, `server-coverage` L1414, `test-integration` L1448, `test-smoke` L1494) están en `if: false # Disabled for incremental CI`; `prebuild-unit-tests-complete` (L1717, `always()`) los ve `skipped` y finaliza siempre SUCCESS; `ci-complete` (L1742) es el único required check del ruleset. Ningún job se renombra en este change (restricción dura del ruleset).
- `repo-discovery` ya expone los outputs `client`, `server`, `shared`, `e2e`. `ci.yml` ya declara grupo `concurrency` con `cancel-in-progress: true` (L12) y `on: [pull_request, merge_group]` — **no** tiene `schedule` ni `push`.
- `client-coverage`/`server-coverage` hoy declaran `needs: [client-build, test-unit-client]` / `[server-build, test-unit-server]` y `client-build`/`server-build` están `if: false` → al activar, un `needs` con upstream `skipped` no dispara el job (deadlock silencioso).
- `scripts/ci/check-coverage.mjs <ws> [coverageDir]` ya acepta directorio explícito (default `<ws>/coverage`); `apps/server/vitest.config.js` declara `reportsDirectory: './tests/coverage'` → el job actual **sin** el 3.er argumento evaluaría un path inexistente (exit 1 permanente).
- `vitest.shared.js` reporters = `['text', 'json-summary', 'html']` → **no genera `reports/junit.xml`**; solo `test:smoke:ci` pasa `--reporter=junit`. Al activar, `dorny/test-reporter` fallaría con "no test report files found".
- `test:coverage` del server = `vitest run --coverage` → incluye `*.integration.test.js` (sin servicio PostgreSQL en `test-unit-server`). El server ya limita `retry: 2` a CI (`maxWorkers: 1, isolate: false, retry: 2` bajo condición CI); `e2e/playwright.config.js` ya declara `retries: process.env.CI ? 2 : 0` y `projects: [chromium]`.
- **Estado heredado de `ci-test-integration` (change absorbido, eliminado):** sus 7 capabilities nunca se sincronizaron a main specs y su delta `ci-test-pipeline` describe el job `changes` con outputs `frontend`/`backend` — naming de 2026-08 obsoleto frente al `repo-discovery` real (`client`/`server`). Verificado hoy en el árbol: `.github/dependabot.yml` existe (npm + github-actions, límite 10, labels), `.dockerignore` raíz existe, la composite `.github/actions/setup-monorepo/action.yml` ya cachea npm (`setup-node@v5 cache: 'npm'`) y Vitest (`actions/cache@v5` → `node_modules/.cache`), y el job `e2e` ya tiene service `postgres:16-alpine` con `pg_isready` + `prisma migrate deploy` + cache de browsers de Playwright — aunque sigue `if: false`.
- Precedentes de scheduling en el repo: `.github/workflows/scheduled-security.yml`, `security-digest.yml`. `istanbul-lib-coverage` ya está en `node_modules` (transitivo de `@vitest/coverage-v8`).
- Fuente de verdad del dominio: `docs/learning/unit-tests-enterprise.md` (§2.4 sharding, §2.6 coverage merge gate, §3.4 regla de flaky, §4.2 matriz de gaps, §5 orden de ejecución) y `docs/learning/quality-gates.md` §4.2.

## Goals / Non-Goals

**Goals:**

- Devolver testing real al merge gate con el patrón de gobierno del repo (FASE 1 advisory → FASE 2 blocking), sin romper el contrato de `needs` ni renombrar ningún required status check.
- Consolidar en UN change la totalidad del pipeline de testing: reactivación + TIA + quarantine + sharding + la infraestructura periférica absorbida (caching, dependabot, dockerignore, e2e, retries, reporting) — un solo dueño, sin changes duplicados ni deltas huérfanos.
- Cerrar los bloqueadores latentes (JUnit, directorio de cobertura del server, suite unit-scoped) **antes** de quitar `if: false`.
- Mantener un único punto de verdad: thresholds en `vitest.config.js`, scoping en `repo-discovery`, gobierno en `quality-gates.md`.

**Non-Goals:**

- Activar `e2e` (solo se especifica su contrato en `ci-e2e`), SonarQube, `client-build`/`server-build`/`server-format-check`/`client-depcheck`/`server-depcheck` (siguen `if: false`).
- Tests AWS con Testcontainers/Floci (dueño: change `ci-testcontainers`, NO absorbido por decisión del usuario).
- Balanceo de shards por duración (limitación upstream `vitest-dev/vitest#9184`).
- Property-based testing, snapshots, thresholds por glob/`perFile`, `coverage.changed` (P3, otros changes).
- Cambiar `.husky/pre-commit` / `.husky/pre-push` (ya correctos según `unit-tests-enterprise.md` §2.8).
- Recrear `.github/dependabot.yml` o `.dockerignore` (ya existen; EXTEND-NOT-RECREATE).

## Decisions

**D1 — Activación en FASE 1 con `continue-on-error: true` a nivel job.**
Los 6 jobs se activan primero advisory: reportan (log, `dorny/test-reporter`, artifacts) pero el agregador ve `success` (actions/toolkit#581) y `ci-complete` no bloquea. Alternativa descartada: activar directamente blocking — el estado real de las suites tras meses de `if: false` es desconocido (tests rojos, `timeout-minutes: 10` insuficiente) y un fallo masivo bloquearía todos los PRs; también se descarta mantener `if: false` hasta "todo verde": perpetúa el agujero de defensa en profundidad que motiva el change.

**D2 — Scoping con los outputs existentes de `repo-discovery`.**
`if: needs.repo-discovery.outputs.<ws> == 'true' || needs.repo-discovery.outputs.shared == 'true'` por job (shared ⇒ suite completa del workspace). Alternativa descartada: añadir un segundo `dorny/paths-filter` por job — duplica configuración y crea dos fuentes de verdad de paths. _(Esta decisión también resuelve el drift del delta heredado `ci-test-pipeline`: el job `changes` con outputs `frontend`/`backend` ya no existe y su requisito estructural vive ahora en `ci-test-jobs-activation`.)_

**D3 — `prebuild-unit-tests-complete.needs` 4 → 6, y `needs` de coverage solo contra su test job.**
`client-coverage` pasa a `needs: [test-unit-client]` y `server-coverage` a `[test-unit-server]` (fuera `client-build`/`server-build`, que están `if: false` y provocarían que el job nunca se ejecute). Requisito de `quality-gates.md` §4.2/L77: los guards de cobertura deben agregarse al `needs`. Alternativa descartada: sacar la cobertura del agregador y confiar en checks independientes — la cobertura dejaría de bloquear vía `ci-complete` y se incumpliría la spec `ci-prebuild-substage-structure` modificada (6 jobs exactos).

**D4 — Directorio de cobertura del server vía argumento explícito, no moviendo `reportsDirectory`.**
El job pasa `node scripts/ci/check-coverage.mjs apps/server apps/server/tests/coverage`. Alternativa descartada: cambiar `reportsDirectory` a `apps/server/coverage` — rompería el `upload-artifact` (L785) y el download de `server-sonarqube` (L1404-1405), que ya usan `apps/server/tests/coverage`; mover el config obliga a tocar 3 sitios para arreglar 1.

**D5 — Suite unit-scoped del server vía script dedicado `test:coverage:unit`.**
`apps/server/package.json`: `test:coverage:unit` = `vitest run ".unit.test.js" --coverage` (misma convención de sufijo que `test:unit`), usado por `test-unit-server`. Alternativa descartada: `--exclude *.integration.test.js` inline en el workflow — crea drift entre CI y config local y no queda como comportamiento testeable del workspace.

**D6 — JUnit en scripts `*:ci` de los workspaces, no en `vitest.shared.js`.**
Añadir `test:coverage:ci` (o equivalente) en client y server con `--reporter=junit` escribiendo `reports/junit.xml`, dejando los reporters locales como están (local/watch no necesita JUnit). Alternativa descartada: meter `junit` en los `reporters` de `vitest.shared.js` — satura watch mode con archivos de reporte en cada corrida local. _(Especifica `ci-test-reporting` absorbida.)_

**D7 — TIA en CI reutilizando `test:changed`; nocturno en workflow nuevo.**
Los jobs usan `npm run test:changed --workspace=…` con `fetch-depth: 0`, cayendo a suite completa cuando `shared == 'true'`. El run full nocturno vive en un workflow nuevo tipo `.github/workflows/nightly-full-suite.yml` (precedente `scheduled-security.yml`), FASE 1 advisory. Alternativa descartada: añadir `schedule:` a `ci.yml` — su bloque `concurrency` referencia `github.event.pull_request.number` (inexistente en `schedule`, colisionaría el grupo `pr-` de todos los scheduled) y `on:` de `ci.yml` está pensado solo para PR/merge_group; además separar el nocturno simplifica el FASE-gating.

**D8 — Métrica flaky semanal desde los JUnit XML ya publicados, descargados vía GitHub API; sin infraestructura nueva.**
El workflow semanal (bloque `schedule:`, precedente `scheduled-security.yml`) consulta las corridas de `ci.yml` de los últimos 14 días, descarga vía API los artifacts `reports/junit.xml` de los jobs de test (retención por defecto de artifacts 90d > ventana de 14d) y calcula pass-rate por test id (classname + nombre). Criterio: candidato a quarantine = ejecutado en ≥10 runs de la ventana con pass-rate <70%; con <10 runs se lista como "insufficient data" (no se adivina); el reporte es advisory y nunca bloquea PRs. Un test que pasa tras retry cuenta como flaky en la métrica (visibilidad exigida por la spec `ci-flaky-quarantine`). Alternativas descartadas: base de datos o estado persistente entre corridas (infra nueva, sin precedente en el repo); GitHub test-analytics API (requisito de plan); calcular solo sobre la corrida actual (1 run ≪ 10 → nada se detecta).

**D9 — `.github/flaky-quarantine.yml` versionado como única fuente de exclusión, con restauración humana.**
Lista en el repo con entradas `test` (id), `file`, `date`, `reason`, `owner`. Los runs bloqueantes de PR derivan su conjunto de exclusión parseando este fichero (paso/scriptId al inicio del job); el nocturno NO aplica exclusión (esa corrida aporta la evidencia de restauración); ninguna workflow escribe en el fichero — añadir/quitar entradas solo vía PR humano. Alternativas descartadas: `test.skip`/borrar tests en la fuente (anti-patrón documentado `unit-tests-enterprise.md` §3.4.7 y violación explícita de la spec); quarantine automático por la métrica semanal (rompe la propiedad de restauración humana que la spec prohíbe); markers dentro de los ficheros de test (doble fuente de verdad frente al fichero commiteado).

**D14 — Retries acotados ya configurados: especificar, no reimplementar (absorbe `ci-flaky-retry`).**
El delta heredado pedía retry ≤2 para Playwright y Vitest: el repo YA lo tiene (`retries: process.env.CI ? 2 : 0` en `e2e/playwright.config.js`; `retry: 2` solo-CI en `apps/server/vitest.config.js` con `maxWorkers: 1, isolate: false`). La capability `ci-flaky-retry` absorbida especifica ese contrato vigente y su alineación con `ci-flaky-quarantine` (el retry es visible en la métrica semanal; nunca "reintentar hasta que pase" en silencio, §23.3 regla 20). Alternativa descartada: copiar el texto heredado como trabajo pendiente — habría creado tasks que el árbol ya cumple.

**D15 — Capabilities de infraestructura absorbidas: modo verificación, no recreación.**
`ci-caching` (npm + Vitest en `setup-monorepo`, majors v5), `ci-dependabot` (archivo único npm + github-actions), `ci-dockerignore` (raíz) y parte de `ci-e2e` (service Postgres, cache de browsers, projects explícito) ya están implementadas en el árbol. El change las especifica con el estado real verificado y añade tasks de verificación (grep/diff contra el árbol), no de implementación. Esto resuelve el riesgo central de la absorción: no duplicar trabajo ya hecho ni "re-implementar" archivos existentes. La parte de `ci-e2e` que falta de verdad es nada: el job ya está completo pero desactivado, y su activación queda explícitamente fuera de alcance (non-goal).

**D16 — Supersede formal de `ci-test-integration` (sustituye al antiguo D13).**
Decisión del usuario (2026-10-01): en lugar de "no reutilizar deltas + reconciliar al archivar", este change ABSORBE las capabilities vigentes del change antiguo y la carpeta `openspec/changes/ci-test-integration/` se elimina (`git rm`). Los deltas heredados se incorporan modernizados al naming y majors vigentes: job `changes`→`repo-discovery`, outputs `frontend`/`backend`→`client`/`server`, `setup-node@v4`→`@v5`, `actions/cache@v4`→`@v5`, workspace `client-react`→`apps/client` (los workspaces reales del `package.json` raíz). El delta heredado `ci-test-pipeline` NO se copia tal cual: su contenido estructural (service PostgreSQL del job de integración, aislamiento, timeouts) se plegó en `ci-test-jobs-activation` y el resto quedó cubierto por las capabilities nuevas. Referencia externa a corregir: `openspec/specs/coverage-baselines/spec.md` aún nombra a `ci-test-integration` como dueño de los thresholds (tarea 8.4). Alternativa descartada: mantener el change antiguo con nota SUPERSEDED — deja 2 changes solapados visibles en `openspec list` (el problema que motiva la unificación).

**D10 — Sharding como `strategy.matrix` bajo los job ids existentes, con merge-gate y merge de reportes dentro de los coverage jobs.**
Cada matriz declara `max-parallel` explícito; cada shard sube su blob report (`include-hidden-files: true` para `.vitest/`) y su salida de cobertura con nombre por shard. El merge vive en `client-coverage`/`server-coverage`, que ya hacen `needs` de su job de test: un `needs` sobre un job con matriz espera a TODOS los shards, sin carrera. El coverage job descarga todos los artifacts, ejecuta `merge-coverage.mjs` (D11) y evalúa los totales merged con `check-coverage.mjs`; también mergea blobs con `vitest --merge-reports --reporter=junit` a un único `reports/junit.xml` que `dorny/test-reporter` publica bajo el nombre de check existente (`if: success() || failure()`). Artifact de shard ausente → exit 1 (nunca evaluar un merge parcial). La activación exige evidencia de duración registrada (requisito "duration-based activation precondition"). Alternativas descartadas: job `merge-reports` independiente — o no está en `prebuild-unit-tests-complete.needs` (su fallo no llega a `ci-complete`) o añadirlo rompe el contrato de exactamente 6 job ids y hace que coverage dependa de 2 jobs (viola "exactamente `[test-unit-*]`"); guard `if: matrix.shard == M` dentro de la matriz (no espera a shards hermanos → carrera por publicación); thresholds por shard (cobertura parcial = tripwire que miente, §2.6).

**D11 — `scripts/ci/merge-coverage.mjs` con `istanbul-lib-coverage`, ya presente en `node_modules`.**
Script que fusiona los `coverage-final.json` de los shards en un único mapa y regenera `coverage-summary.json` (via `istanbul-reports`) en el directorio que el job pasa a `check-coverage.mjs`; exit 1 si falta algún input o si el merge queda vacío. Los thresholds siguen leyéndose del `vitest.config.js` del workspace (única fuente de verdad; `coverage.thresholds.autoUpdate` nunca en CI). Alternativas descartadas: `nyc merge` (`nyc` no está instalado); usar el `coverage-summary.json` de un solo shard (falso positivo/negativo, §23.6); añadir una dependencia nueva cuando `istanbul-lib-coverage` ya es transitiva de `@vitest/coverage-v8`.

**D12 — Docs en lockstep por fase, en el mismo PR que el cambio de comportamiento.**
Cada fase actualiza sus documentos atados: activación → `quality-gates.md` (§2 filas + §4.2: los 6 jobs de `if: false` a advisory) y `unit-tests-enterprise.md` (§2.7, §4.2 matriz de gaps, §5 orden); FASE 2 → `quality-gates.md` (advisory → blocking) + `testing-architecture.md` §7.5 (los 3 tiers como estrategia coherente: pre-push local, CI diff-scoped, nocturno full); sharding → evidencia de duración en los artefactos del change + `unit-tests-enterprise.md` §2.4/§2.6 (estado "implementado"). `CONTEXT-CICD.md` solo si cambia un término del dominio. La spec `ci-test-jobs-activation` hace explícito el lockstep de `quality-gates.md` en FASE 2; no se actualiza doc a destiempo (doc viejo = estado mentiroso, el mismo fallo que motiva el change).

## Risks

| #   | Riesgo                                                                                                    | Mitigación                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | La primera activación revela tests rojos acumulados tras meses de `if: false`                             | FASE 1 `continue-on-error: true` a nivel job: reporta sin bloquear durante la ventana de calibración (2-4 semanas); nunca se activa directo blocking                |
| R2  | Suites que exceden `timeout-minutes: 10`                                                                  | visible primero en FASE 1; ajustar el timeout con datos, o partir con TIA/sharding (P1/P2)                                                                          |
| R3  | Rutas de JUnit/cobertura mal alineadas → `dorny/test-reporter` sin fichero o guard con exit 1 permanente  | Bloqueadores corregidos ANTES de quitar `if: false` (P0-a); tareas de verificación que ejecutan los scripts y comprueban cada path                                  |
| R4  | `needs` con upstream `if: false` (builds) → deadlock silencioso de coverage                               | D3: coverage depende solo de su test job; escenario de spec "builds disabled while coverage runs"                                                                   |
| R5  | TIA con `--changed` sin cache cross-machine (limitación `turborepo-evaluation.md`) deja pasar regresiones | Red de seguridad nocturno full-suite (D7) + `shared` dispara suite completa + pre-push local intacto                                                                |
| R6  | Reintentos que enmascaran flaky ("reintentar hasta que pase")                                             | Retry ≤2, solo CI, visible en reporte y en la métrica semanal (D8/D9/D14); restauración solo humana                                                                 |
| R7  | Coste de Actions: matrices de shard, nocturno y métrica semanal                                           | `max-parallel` explícito + `concurrency` con `cancel-in-progress` ya presentes; sharding condicionado a evidencia de duración; workflows `scheduled` con precedente |
| R8  | Absorción duplica trabajo ya implementado (dependabot, dockerignore, caching, e2e)                        | D15: capabilities absorbidas en modo verificación; tasks confirman el estado del árbol en vez de reimplementarlo                                                    |
| R9  | Romper el ruleset renombrando required checks                                                             | Restricción dura: ningún job se renombra; matriz bajo los ids existentes; validación `actionlint` exit 0                                                            |
| R10 | Referencias colgantes tras eliminar `ci-test-integration`                                                 | D16: `coverage-baselines` spec actualizada (tarea 8.4); xrefs en archive/ quedan como historia inmutable                                                            |

## Migration Plan

**P0-a — Cierre de bloqueadores latentes (sin tocar `if: false` todavía):**

1. Scripts `*:ci` con JUnit en client y server (D6) → `reports/junit.xml` en la ruta que consume `dorny/test-reporter`.
2. `test:coverage:unit` en `apps/server/package.json` (suite `*.unit.test.js` + coverage, D5).
3. `server-coverage` pasa el directorio explícito `apps/server/tests/coverage` a `check-coverage.mjs` (D4).
4. Verificación: ejecutar cada script localmente y comprobar paths; los 6 jobs siguen `if: false` en este punto (cambio reviewable en aislamiento).

**P0-b — Activación FASE 1 (advisory):**

1. Quitar `if: false` en los 4 test jobs + scoping con outputs de `repo-discovery` (D2) + `continue-on-error: true` (D1).
2. Activar `client-coverage`/`server-coverage` con `needs` = solo su test job (D3) y scoping.
3. `prebuild-unit-tests-complete.needs` 4 → 6 (spec `ci-prebuild-substage-structure`).
4. Docs lockstep de activación (D12). Verificación: `actionlint .github/workflows/ci.yml` exit 0; grep confirma 0 `if: false` en los 6 jobs; `openspec validate --strict`.

**P0-c — Calibración y FASE 2 (bloqueante):**

1. Ventana de 2-4 semanas de corridas: revisar cada fallo (¿test rojo? ¿timeout? ¿infra?) y corregir.
2. Quitar `continue-on-error` de los 6 jobs; `quality-gates.md` en lockstep (requisito de la spec).
3. Verificación: un PR con test rojo hace fallar `prebuild-unit-tests-complete` → `ci-complete` (escenario "Suite red after FASE 2").

**P1 — TIA + flaky quarantine + retries:**

1. `fetch-depth: 0` + `test:changed` en los jobs de unit, suite completa cuando `shared == 'true'` (D7).
2. Workflow nocturno `nightly-full-suite.yml` full-suite, FASE 1 advisory.
3. `.github/flaky-quarantine.yml` (D9) + exclusión derivada del fichero en runs bloqueantes + workflow semanal de métrica (D8: ventana 14d, ≥10 runs, <70%, share <1%).
4. Verificar retries existentes contra la spec `ci-flaky-retry` absorbida (D14) — sin reimplementar.

**P1b — Infraestructura absorbida (verificación):**

1. Verificar caching en `setup-monorepo` contra la spec `ci-caching` (majors v5, keys, restore-keys).
2. Verificar `.github/dependabot.yml` contra `ci-dependabot` (ecosistemas, límite, labels) — EXTEND-NOT-RECREATE.
3. Verificar `.dockerignore` contra `ci-dockerignore` (exclusiones no-runtime, `.env`).
4. Reconciliar `ci-e2e` con el job `e2e` real (todo presente, `if: false` permanece).

**P2 — Sharding (condicionado):**

1. Registrar evidencia de duración en los artefactos del change (>5–8 min, 3 corridas) — precondition de la spec; sin ella, no se activa.
2. Matrices `--shard=N/M --reporter=blob` con `max-parallel` bajo los ids existentes (D10).
3. `merge-coverage.mjs` (D11) + merge de blobs en los coverage jobs; artifact de shard ausente → exit 1.
4. Verificación: `needs` del agregador sigue con exactamente 6 ids; un shard rojo hace fallar el job id dueño; totals merged = unión de shards; un único check por workspace.

## Open Questions

1. **Duración real de las suites hoy** — solo la ventana FASE 1 produce la evidencia que decide P2; ¿el umbral se fija en 5 o 8 min según el wall-time objetivo del equipo?
2. **Alcance del quarantine** — ¿aplica a los 4 test jobs (unit + integration + smoke) o solo a unit? La spec dice "blocking PR runs" (genérico); decidir al implementar P1 mirando cuál genera ruido.
3. **Permisos del workflow de métrica** — necesita `actions: read` para descargar artifacts de corridas previas; confirmar que el GITHUB_TOKEN del repo lo permite sin elevación.
4. **Duración de la ventana de calibración** — 2 o 4 semanas: depende del volumen de PRs tras la activación (más corridas = datos antes).
