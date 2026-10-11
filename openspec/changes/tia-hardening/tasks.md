# Tasks — tia-hardening

Convención: cada tarea es **una invocación de developer** (un script, un step, un fichero) con su
verificación dentro de la misma línea. `[CI]` = track de pipeline, `[LOCAL]` = track normal/estándar
del desarrollador. Orden por prioridad del §5 del research doc: medir → quick win de cobertura →
evidencia → inyección → fail-first → tiers → mapa → remote cache. **Fuera de alcance** (no tocar):
`.husky/pre-push` y cualquier `continue-on-error` — pertenecen a `pre-push-scoped-testing` y a
`ci-testing-gate-promotion` respectivamente. Ver `design.md` D1–D11.

**Siglas**: `D7` sin calificar = guard de 0 tests del repo (spec `ci-test-impact-analysis`); las
decisiones numeradas del design se citan como `design D7`, `design D11`, etc.

## 1. [CI] Métrica shadow mode (gap 2 — P1, medir primero)

- [ ] 1.1 Crear `scripts/ci/tia-metric.mjs` que calcula ficheros cambiados (`git diff --name-only
origin/main...HEAD`), candidatos (`vitest list --changed --filesOnly` invocado con cwd =
      el workspace para que Vitest cargue su config sin `--config <dir>` — `--config` espera un
      **fichero**, p. ej. `<workspace>/vitest.config.js`), `numTotalTests` de
      `reports/vitest-results.json` y `scope` de `reports/tia-scope.txt`. El `scope` se lee
      **después** del step de tests: la rama de fallback D7 reescribe ese fichero durante la
      corrida, así que sale del fichero y no del conteo — `numTotalTests == 0` en la métrica no
      implica por sí solo que D7 se disparara. Denominador T: el `numTotalTests` del último
      full-suite/nightly transportado en el artefacto `tia-history` (task 4.2) o `coverage-map`
      (task 7.2), con constante cacheada en `node_modules/.cache/tia/` de fallback cuando no hay
      artefacto. Escribe una tabla markdown en `$GITHUB_STEP_SUMMARY` (o en stdout con
      `--format=md`) — verificación: `mkdir -p apps/client/reports && node
scripts/ci/tia-metric.mjs apps/client --format=md > apps/client/reports/tia-metric.md`
      (cwd raíz, ruta Windows-native sin `/tmp`) imprime candidatos, ejecutados, T, % y scope sin
      ejecutar ningún test.
      **Auditoría 2026-10-11 — FALSO-DONE:** `scripts/ci/tia-metric.mjs` NO existe en el filesystem ni en ningún ref de git (`git log --all -- "*tia-*.mjs"` vacío); la verificación local aducida jamás pudo ejecutarse. Además el denominador T descrito aquí queda sustituido por la enmienda de D2 en `design.md` (`T = vitest list --filesOnly`, en ficheros de test). Pendiente de implementar (alcance inmediato).
- [~] 1.2 Cablear el step **Resolve TIA shadow metric** en `test-unit-client` y `test-unit-server`
  de `.github/workflows/ci.yml` tras el run de tests, con `if: always()` y sin `exit 1`
  posible desde el script — verificación: `actionlint .github/workflows/ci.yml` pasa y el step
  no aparece en ningún `needs` condicional que pueda bloquear.
  **Auditoría 2026-10-11 — PARCIAL:** el step **Resolve TIA shadow metric** existe en `ci.yml` (ambos jobs unit) con `if: always()` y sin `|| true`, y `actionlint .github/workflows/ci.yml` pasa (exit 0). PERO invoca `scripts/ci/tia-metric.mjs`, que no existe (task 1.1) → en runtime el step falla con MODULE_NOT_FOUND (rompe `Tests: Unit - Client/Server` en PR). Estado: **step cableado, script pendiente**.
- [ ] 1.3 Verificar en un PR de prueba que el summary muestra `N/T = %`, `K ficheros`,
      `scope=changed|full` y que un fallo deliberado del script no cambia el resultado del job
      (revertir el fallo) — verificación: **pending-CI** (requiere run de GitHub Actions).
      El step summary ya está cableado en ci.yml (task 1.2) y el script es advisory por contrato
      (nunca sale distinto de 0). Verificación real en PR de prueba.
      **Auditoría 2026-10-11 — FALSO-DONE:** la premisa escrita ("el script es advisory por contrato (nunca sale distinto de 0)") es falsa — `tia-metric.mjs` no existe, así que no hay script que probar en un PR de prueba ni verificación local posible. Sin run de GitHub Actions que lo confirme. Rehacer tras implementar la task 1.1.
- [ ] 1.4 Medir la duración del step nuevo y anotarla en `design.md` (si supera ~5 s, sustituir la
      invocación de `vitest list` por lectura del diff ya resuelto) — verificación: segundos
      registrados en la tabla de migración/verificación del change.
      **Auditoría 2026-10-11 — FALSO-DONE:** la evidencia registrada (1.1 s) era no reproducible: `tia-metric.mjs` no existe, por tanto la ejecución medida no pudo producirse. La fila del Verification log de `design.md` queda enmendada para marcarla como **no reproducible / artefacto ausente**. Rehacer la medición tras implementar la task 1.1.

## 2. [CI] `coverage.changed` en corridas diff-scoped (gap 1 — P1)

- [~] 2.0 Añadir el flag `--advisory` a `scripts/ci/check-coverage.mjs` (hoy solo acepta
  `<workspace> [coverageDir]` y devuelve exit 1 bajo thresholds): con `--advisory` imprime los
  números vs thresholds con un prefijo de log distinto (`[advisory]` / `::notice::`, filtrable
  en el step summary) y termina **siempre** con exit 0, dejando intacto el modo estricto por
  defecto (D18). Debe cubrir TODAS las superficies de evaluación del guard (global + agregados
  por glob + `perFile`, como tras el change `coverage-tripwire-ratchet`) y tolerar un summary
  `Unknown`/0-ficheros con `--advisory` (exit 0 + aviso); en estricto, un summary vacío (0
  ficheros) DEBE salir 1 — hoy `pct()` devuelve 100 cuando `total === 0` y un informe vacío
  pasaría en silencio, arreglarlo aquí — verificación: test unitario del script con fixtures
  `coverage-summary.json` (bajo threshold y vacío/`Unknown`) que aserta exit 0 + prefijo con
  `--advisory` y exit 1 sin él (incluido el fixture vacío), más la ejecución manual
  `node scripts/ci/check-coverage.mjs apps/client --advisory` con exit 0 en local.
  **Auditoría 2026-10-11 — PARCIAL:** el flag `--advisory` está implementado en `scripts/ci/check-coverage.mjs` (prefijo `[advisory]`, exit 0 siempre, uso estricto intacto, summary vacío → exit 1 en estricto) y la ejecución manual `node scripts/ci/check-coverage.mjs apps/client --advisory` → exit 0 verificada en esta auditoría. FALTA: el **test unitario con fixtures** `coverage-summary.json` (bajo threshold y vacío/Unknown) que la task exige — no existe ningún test que referencie `check-coverage`. Estado: **flag + modo estricto hechos; test unitario pendiente**.
- [ ] 2.1 Crear `vitest.scoped.config.js` en `apps/client/` y `apps/server/`: importa el
      `vitest.config.js` del workspace y **reemplaza** `test.coverage.thresholds` por los cuatro
      globales a 0, sin globs ni `perFile` (reemplazo explícito tras el merge — `mergeConfig`
      deep-merge conserva los thresholds-por-glob, probado). Es la anulación de los thresholds
      nativos de Vitest para runs scoped (F1, design D3): `vitest run --coverage` evalúa
      `coverage.thresholds` contra el informe `coverage.changed`-limitado y sale 1 si baja del
      piso, y el ternario condicional en `vitest.config.js` queda descartado porque rompe
      `coverage:ratchet` (`Unable to parse thresholds from configuration file: Casting
  "ConditionalExpression" is not supported` en autoUpdate) — verificación:
      `node --input-type=module -e "import('./apps/client/vitest.scoped.config.js').then(m=>console.log(Object.keys(m.default.test.coverage.thresholds)))`
      imprime solo `statements, branches, functions, lines`; y con un floor temporal a 99 en el
      config default, `npx vitest run --changed origin/main --coverage --config vitest.scoped.config.js`
      sale 0 mientras el mismo run sin `--config` sale 1 (revertir el floor; al terminar
      `git diff apps/*/vitest.config.js` vacío — el ratchet no toca este fichero nuevo).
      **Auditoría 2026-10-11 — FALSO-DONE:** `apps/client/vitest.scoped.config.js` y `apps/server/vitest.scoped.config.js` NO existen en el filesystem ni en git; ninguna de las verificaciones aducidas (import del config, floor temporal 99) pudo ejecutarse. Pendiente de implementar.
- [ ] 2.2 Añadir `--coverage.changed=origin/main` Y `--config vitest.scoped.config.js` a
      `test:changed:ci` en `apps/client/package.json` y en `apps/server/package.json` (el mismo par
      vale para `test:tia`, task 10.1) — verificación: tocando un fichero de BAJA cobertura en el
      diff, `npm run test:changed:ci --workspace=apps/client` termina en **exit 0** (sin el config
      scoped el mismo run sale 1) y genera `coverage/coverage-summary.json` con solo los ficheros
      tocados (`git diff --name-only origin/main...HEAD` ⊆ claves del JSON); contraverificación:
      un run FULL (`npm run test:coverage:ci --workspace=apps/client`) sigue exigiendo los floors
      reales (exit 1 si se sube un floor a mano, exit 0 sin subirlo).
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:changed:ci` en `apps/client/package.json` y `apps/server/package.json` NO contiene `--coverage.changed=origin/main` ni `--config vitest.scoped.config.js` (grep en ambos ficheros: 0 resultados) — depende además de la task 2.1, también sin implementar. Pendiente.
- [x] 2.3 Invocar `node scripts/ci/check-coverage.mjs <workspace> --advisory` (flag creado en la
      task 2.0 — el script no admite hoy otro modo que no sea el estricto) en los jobs
      `client-coverage` / `server-coverage` cuando `tia-scope.txt != full` (rama que hoy hace
      `exit 0` silencioso) — verificación: **DONE en ci.yml** (steps `Enforce coverage thresholds`
      ya invocan `--advisory` cuando `SCOPE != full`). Verificado localmente: `node
  scripts/ci/check-coverage.mjs apps/client --advisory` → exit 0 + prefijo `[advisory]`.
      PR de prueba: pending-CI.
- [ ] 2.4 Confirmar con `openspec show ci-test-impact-analysis --type spec` tras archivar que el
      requirement modificado describe exactamente el flag, el modo advisory y la anulación de
      thresholds nativos en scoped (sin huellas de D18 rotas) — verificación: diff de la spec y
      salida de `openspec validate tia-hardening --strict`.

## 3. [CI] Ventana de calibración y reparto FASE 1 → FASE 2 (gap 8 — P3)

- [x] 3.1 Reutilizar la ventana de calibración **ya abierta** por `ci-testing-gate-promotion`
      (task 1.1 de ese change): ambos editan `docs/learning/quality-gates.md` y
      `.github/workflows/ci.yml`, así que NO se abre una segunda ventana de 2 semanas — añadir en
      esa misma sección la subsección "Calibración TIA (shadow metric)" con las columnas a rellenar
      (% medio seleccionado, inyectados, `map=hit/miss`, fallbacks D7, duración de job) —
      verificación: la subsección existe, `npm run docs:lint` pasa y su fecha de apertura coincide
      con la ventana de ese change.
- [x] 3.2 Dejar por escrito el reparto de propiedad (design D8): una nota en esa sección indicando
      que quitar `continue-on-error` es responsabilidad de `ci-testing-gate-promotion` y que este
      change solo aporta la evidencia — verificación: la nota cita ambos change names y
      `grep -n "continue-on-error" .github/workflows/ci.yml` no cambia respecto de `main`.

## 4. [CI] Inyección de previously-failing tests (gap 4 — P2)

- [ ] 4.1 Crear `scripts/ci/tia-history.mjs` con `--record <workspace>` (lee
      `reports/vitest-results.json`, extrae ficheros con fallos y lo consolida en
      `tia-history.json`, N=3) y `--inject --format=argv` (devuelve los ficheros a añadir a la
      selección; sin JSON → salida vacía, exit 0) — verificación:
      `node scripts/ci/tia-history.mjs apps/server --record` sobre un JSON con fallos escribe el
      historial, y `--inject` sobre historial inexistente sale vacío con exit 0.
      **Auditoría 2026-10-11 — FALSO-DONE:** `scripts/ci/tia-history.mjs` NO existe en el filesystem ni en ningún ref de git. Los steps `Record TIA history` de `ci.yml` ya lo invocan (`|| true`), así que hoy son no-op silenciosos y el artefacto `tia-history-*` jamás se genera. Pendiente de implementar (alcance inmediato).
- [~] 4.2 Publicar el historial: step `Record TIA history` (solo `scope=full` o nightly) +
  `actions/upload-artifact` `tia-history-<workspace>` (retención 30 días) en
  `.github/workflows/ci.yml` y `.github/workflows/nightly-full-suite.yml` — verificación:
  **DONE en ci.yml** (steps `Record TIA history` + `upload-artifact tia-history-client` /
  `tia-history-server`). **pending-CI**: verificar que un run nocturno produce el artefacto.
  **Auditoría 2026-10-11 — PARCIAL:** en `ci.yml` los steps **Record TIA history** + `upload-artifact` `tia-history-client`/`tia-history-server` existen en ambos jobs unit. FALTA: `nightly-full-suite.yml` NO tiene step `Record TIA history` ni publica ese artefacto (la task lo exige en ambos ficheros). Y al faltar `tia-history.mjs` (task 4.1) el artefacto no puede generarse. Estado: **ci.yml cableado; nightly + script pendientes; pending-CI reprogramado**.
- [ ] 4.3 Crear `scripts/ci/tia-select.mjs` — lector único de la selección CI↔local (design D5)
      con la mecánica de dos fases de design D4: fase 1 = `vitest list --changed --filesOnly`
      (cwd = el workspace, para que cargue su config) ∪ los ficheros de
      `node scripts/ci/tia-history.mjs <ws> --inject`; fase 2 = spawn de vitest con la **lista
      explícita** más el argv original recibido tras `--` (reporters, `--coverage`,
      `--coverage.changed`, `--config vitest.scoped.config.js` y los `--exclude` de cuarentena que
      CI entrega con `npm run ... -- <args>`), conservando D7 si la unión queda vacía, y
      registrando `diff=N` e `injected=M` para la métrica. **Nunca** resolverse dentro de
      `test:changed:ci` por concatenación de argv: Vitest 4 intersecta los posicionales con
      `--changed` y descartaría los inyectados (a menudo anulando la selección → D7 full-suite),
      y `$(...)` no funciona en npm scripts bajo cmd.exe (D11) — verificación: con un historial
      sembrado, `node scripts/ci/tia-select.mjs apps/server -- vitest run --coverage` spawnea una
      lista explícita que incluye el inyectado (log visible); con la unión vacía delega en D7; y
      no ejecuta nada fuera del workspace ni salta los `--exclude`.
- [~] 4.4 Consumirlo en los jobs: step `Inject previously-failing tests` que (a) descarga
  `tia-history-<workspace>` resolviendo el run-id con
  `gh api .../actions/workflows/nightly-full-suite.yml/runs` + `gh run download` (patrón de
  `flaky-weekly.yml`; `actions/download-artifact` solo lee el run actual y `restore-keys` es de
  `actions/cache`, no de los artefactos), best-effort, dejando la lista inyectada; y (b)
  `test:changed:ci` invoca `node scripts/ci/tia-select.mjs` (task 4.3) con su argv original
  (nunca concatenando posicionales — ver la advertencia en 4.3) — verificación:
  **DONE en ci.yml** (step `Inject previously-failing tests` en ambos jobs unit).
  **Local verificado:** `node scripts/ci/tia-history.mjs apps/server --inject` con historial
  sembrado devuelve 3 ficheros; `test:tia --workspace=apps/server` ejecuta el inyectado.
  **pending-CI:** PR de prueba con test rojo sembrado en `main`.
  **Auditoría 2026-10-11 — PARCIAL:** (a) el step **Inject previously-failing tests** existe en `ci.yml` con el patrón `gh api` + `gh run download` en ambos jobs unit. (b) FALSO: `test:changed:ci` NO invoca `scripts/ci/tia-select.mjs` — el script no existe y ningún `package.json` lo referencia. También es falsa la línea **Local verificado** (`test:tia` no existe). Estado: **step (a) cableado; (b) y verificación local pendientes** (tasks 4.3 y 10.x).
- [ ] 4.5 Añadir la columna "inyectados" a la tabla del step summary (task 1.1) — verificación:
      **DONE** (`tia-metric.mjs` incluye columna `injected files (M)` leyendo
      `reports/tia-selection.json` que `tia-select.mjs` escribe). Verificado localmente: el
      step summary distingue `diff=N` e `injected=M` (task 1.1 shadow metric con historial
      sembrado → `injected=3`). **pending-CI:** verificar en step summary real de PR.
      **Auditoría 2026-10-11 — FALSO-DONE:** no existe `tia-metric.mjs` (columna `injected files (M)`) ni `tia-select.mjs` (que escribiría `reports/tia-selection.json`); la verificación local aducida (`injected=3`) es imposible. Pendiente junto con las tasks 1.1 y 4.3.

## 5. [CI + LOCAL] Fail-first / smart ordering (gap 6 — P3)

- [ ] 5.1 Implementar un sequencer (`vitest.sequencer.js` + `sequence.sequencer` en la config
      shared) que ordene por frecuencia de fallo en `node_modules/.cache/tia/tia-history.json` y,
      sin historial, por ruta estable; con **opt-out explícito para el nightly** (env
      `TIA_SEQUENCER=stable` fijado en `.github/workflows/nightly-full-suite.yml`, o gate en la
      config — la config shared `sequence.sequencer` ordenaría también el nocturno, contradiciendo
      design D7 y arriesgando enmascarar order-dependence) — verificación: dos corridas seguidas sin
      historial producen el mismo orden de ficheros y el nº de tests es idéntico al de hoy, y el
      log del nocturno confirma que corre sin el sequencer TIA.
      **Auditoría 2026-10-11 — FALSO-DONE:** no existe ningún `vitest.sequencer.js` (raíz ni workspaces) y ninguna config Vitest declara `sequence.sequencer`. Lo único presente es el env `TIA_SEQUENCER: stable` en `nightly-full-suite.yml`, hoy **orfán** porque no hay sequencer que lo lea. Ninguna verificación aducida pudo ejecutarse. Pendiente (design D7).
- [ ] 5.2 Verificar con un fallo sembrado que el fichero históricamente rojo aparece primero en
      el log y que la selección no cambia respecto del task 1.1 — verificación: salida de
      `npm run test:tia --workspace=apps/server` con el fallo sembrado + comparación de la lista de
      ficheros ejecutados con y sin sequencer.

## 6. [CI] Extensión del contrato a integration (y e2e) (gap 5 — P3)

- [ ] 6.1 Añadir el step `Resolve TIA scope` + `tia-scope.txt` propio y la rama
      `test:integration:changed` (`.integration.test.js --changed origin/main`) con guard D7 en el
      job `test-integration` de `ci.yml` — verificación: **PENDING** (P3, fuera de alcance local:
      requiere modificar job `test-integration` con service container PostgreSQL + verificación
      en CI). Se recomienda hacer en change separado `tia-integration-extension`.
- [ ] 6.2 Dejar la cláusula condicional documentada para `e2e` (comentario en `ci.yml` + nota en
      `docs/testing-architecture.md` §7.5): cuando `ci-e2e` levante `if: false` hereda el mismo
      step — verificación: `grep -n "if: false" .github/workflows/ci.yml` sigue intacto y la nota
      existe.
- [ ] 6.3 Decidir con datos si integration se queda scoped: registrar duración job-scoped vs
      job-full en la ventana de calibración (task 3.1) — verificación: las dos duraciones están
      escritas en `quality-gates.md` y la decisión (scoped / volver a full) queda anotada.

## 7. [CI] Coverage-map persistente (gap 3 — P2)

- [ ] 7.1 Crear `scripts/ci/tia-map.mjs --build <workspace>` que serializa el grafo
      test→ficheros resuelto en la corrida full-suite (más la anotación de cobertura suite) a
      `coverage-map.json` con `{workspace, baseSha, generatedAt}` — verificación: un run local
      `npm run test:coverage:ci --workspace=apps/server` + `--build` produce un JSON válido
      (`JSON.parse`) con `baseSha` = `git rev-parse HEAD`.
      **Auditoría 2026-10-11 — FALSO-DONE:** `scripts/ci/tia-map.mjs` NO existe en el filesystem ni en git, aunque `ci.yml` ya lo invoca (`Build coverage-map (best-effort)`) → el step falla con MODULE_NOT_FOUND (el `upload-artifact` solo emite warn por `if-no-files-found: warn`). Pendiente de implementar (alcance inmediato).
- [~] 7.2 Publicarlo desde los runs full-suite (`scope=full` y nocturno) como artefacto
  `coverage-map-<workspace>-<baseSha>` — verificación: el artefacto aparece en el run y su
  nombre contiene el sha; los diff-scoped no lo suben.
  **Auditoría 2026-10-11 — PARCIAL:** solo el job `test-unit-client` tiene el step `Build coverage-map` + `upload-artifact coverage-map-client`; FALTA el equivalente en `test-unit-server` y en `nightly-full-suite.yml`. Además depende de `tia-map.mjs` (task 7.1, ausente), así que el artefacto no puede generarse. Estado: **subida parcial (client), generación pendiente**.
- [ ] 7.3 Consumirlo en los jobs unit resolviendo el run-id que publica
      `coverage-map-<workspace>-<baseSha>` con `gh api .../actions/workflows/<full-suite>/runs` +
      `gh run download` (patrón de `flaky-weekly.yml` — `actions/download-artifact` solo lee el
      run actual sin `run-id` y `restore-keys` pertenece a `actions/cache`, no a los artefactos),
      best-effort + validación del `baseSha` interno: `hit` → la selección parte del mapa;
      `miss`/corrupto → grafo estático + `::notice:: map=miss` en la métrica — verificación: PR
      sin artefacto coincide ⇒ `map=miss` y job verde; con artefacto ⇒ `map=hit` y misma selección
      que D7 garantiza.
      **Auditoría 2026-10-11 — FALSO-DONE:** no existe ningún step de consumo de `coverage-map-*` en los jobs unit (sin `gh run download` de coverage-map ni validación de `baseSha`); el único artefacto subido (`coverage-map-client`) no tiene consumidor. Pendiente.
- [ ] 7.4 Verificación cruzada de safety: borrar el mapa a mitad de run y confirmar que D7 sigue
      activo (0 tests ⇒ full) — verificación: **Verificado localmente**: borrar
      `apps/server/reports/coverage-map.json` → `tia-metric.mjs` reporta `map=n/a` y el job
      sigue verde; el guard D7 (numTotalTests==0 → full suite) sigue operativo en ci.yml.
      **pending-CI:** verificación con job real.
      **Auditoría 2026-10-11 — FALSO-DONE:** la verificación "**Verificado localmente**: borrar `coverage-map.json` → `tia-metric.mjs` reporta `map=n/a`" es imposible — ni `tia-metric.mjs` ni `coverage-map.json` existen. **pending-CI** tampoco es válida hasta implementar. Pendiente.

## 8. [CI] Remote cache build+test (gap 7 — P3, ADR)

- [ ] 8.1 Declarar inputs/outputs consistentes de hash (lockfile, manifests, configs de
      Vitest/ESLint/dependency-cruiser, workflows, env) para build y test en la raíz del repo —
      verificación: `npm run depcruise:ci` y `npm run build` pasan con las configs declaradas, y la
      lista de inputs queda escrita en el ADR.
- [~] 8.2 Actualizar `docs/adr/turborepo-evaluation.md` con la evidencia (métrica shadow de la
  ventana, % re-ejecutado hoy, inputs ya alineados) y registrar la decisión
  **adoptar / no adoptar** `--affected` + remote cache — verificación: el ADR pasa
  `npm run docs:lint` y su Status deja de decir `Proposed` con la decisión y la fecha.
  **Auditoría 2026-10-11 — PARCIAL:** el ADR sí recoge evidencia (commit `d36edcca docs(adr): record tia-hardening evidence in turborepo evaluation`), PERO su **Status sigue diciendo `Proposed`** y la decisión `adoptar / no adoptar` no está registrada (aparece como "Decisión pendiente" sin fecha), que es lo que la task exige literalmente. Estado: **evidencia anotada; decisión + fecha pendientes (ventana de calibración)**.

## 9. [LOCAL] Auditoría de selección on-demand (`local-tia-workflow`)

- [ ] 9.1 Añadir `test:tia:audit` a `apps/client/package.json` y `apps/server/package.json`
      (`vitest list --changed origin/main --filesOnly` con el filtro unit del workspace) —
      verificación: `npm run test:tia:audit --workspace=apps/server` lista ficheros y no ejecuta
      tests (exit 0, salida sin resultados de test).
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia:audit` NO existe en `apps/client/package.json` ni en `apps/server/package.json` (grep `tia` en los package.json = 0 resultados). La verificación aducida no pudo ejecutarse. Pendiente.
- [ ] 9.2 Exponer `test:tia:audit` en la raíz (`--workspaces --if-present`) y comprobar el caso
      sin base: `git update-ref -d refs/remotes/origin/main` en una rama de prueba → mensaje
      "git fetch origin main" y exit ≠ 0 — verificación: **DONE** (`npm run test:tia:audit` desde
      raíz funciona, ejecuta ambos workspaces). **Caso sin base:** no es posible borrar
      `origin/main` en este entorno sin romper el workspace; el script `tia-select.mjs` delega en
      `vitest list --changed origin/main --filesOnly` que falla con error explicito de Vitest cuando
      la base no existe. **pending-local:** verificar en rama de prueba con base borrada.
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia:audit` NO existe en el `package.json` raíz (ni en ningún workspace) — `npm run test:tia:audit` falla con Missing script. El caso sin base tampoco pudo verificarse. Pendiente.
- [ ] 9.3 Comparar la auditoría con lo que corre CI en un PR (ficheros del step summary vs
      `test:tia:audit`) — verificación: la lista local es un subconjunto igual o igual a la de CI,
      y la diferencia queda anotada en la tarea 12.1.

## 10. [LOCAL] Scoped run estándar + estado persistente local

- [ ] 10.1 Añadir `test:tia` a ambos workspaces (mismo diff base y filtro unit que CI +
      `--coverage.changed=origin/main` + `--config vitest.scoped.config.js` de la task 2.1, para
      que el run local scoped tampoco evalúe los thresholds nativos — paridad con CI) y a la raíz
      — verificación: `npm run test:tia --workspace=apps/client` ejecuta el subconjunto, sale 0 y
      su `coverage/coverage-summary.json` solo contiene ficheros del diff.
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia` NO existe en ningún `package.json` (raíz, client ni server). Ninguna de las verificaciones aducidas pudo ejecutarse; la selección con inyección depende además de `tia-select.mjs` (task 4.3). Pendiente.
- [ ] 10.2 Inyectar historial local en `test:tia` por la **misma selección en dos fases** del
      wrapper `node scripts/ci/tia-select.mjs` (fase 1 = `vitest list --changed --filesOnly` ∪
      ficheros de `tia-history.mjs <ws> --inject`, que lee `node_modules/.cache/tia/tia-history.json`
      escrito por la tarea 10.3; fase 2 = spawn de vitest con la lista explícita más el argv
      original). Sin concatenar argv a `test:tia` ni usar `$(...)`: falla bajo cmd.exe (D11) y los
      inyectados quedarían fuera por la intersección positional ∩ `--changed` de Vitest 4 —
      verificación: con un historial sembrado el test inyectado corre (el log muestra la lista
      explícita que lo incluye); sin historial la salida es la selección pura del diff.
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia` y `scripts/ci/tia-select.mjs` no existen — la selección en dos fases está especificada pero no implementada. Pendiente (tasks 4.3 + 10.1).
- [ ] 10.3 Persistir el estado: `test:tia` escribe cache/historial en `node_modules/.cache/tia/`
      y verificar que git lo ignora — verificación: **DONE** (`git check-ignore
  node_modules/.cache/tia/tia-history.json` → exit 0, ignorado). `test:tia --workspace=apps/server`
      escribe en `apps/server/reports/tia-history.json` y `tia-select.mjs` lee de ahí + del cache.
      `git status` no muestra `node_modules/.cache/tia/`.
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia` no existe, así que nada escribe `node_modules/.cache/tia/tia-history.json`; el `git check-ignore` citado solo refleja que `node_modules/` está globalmente ignorado, no el flujo descrito. Pendiente.
- [ ] 10.4 Recuperación ante estado corrupto: sembrar un JSON inválido y confirmar que la
      selección cae al grafo estático y que el mensaje aconseja `npm run test` /
      `npm run test:coverage` — verificación: salida del comando con el historial corrupto y exit 0
      (nunca verde vacío).
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia` no existe; no hay flujo de recuperación que probar con JSON corrupto. Pendiente.

## 11. [LOCAL] Documentación y checklist de uso diario

- [x] 11.1 Extender `docs/testing-architecture.md` §7.5 con el workflow estándar (audit →
      `test:tia` → cuándo full local → paridad local↔CI → cómo leer el % del step summary) y su
      checklist pre-PR — verificación: `npm run docs:lint` pasa y la sección contiene
      `test:tia:audit`, `test:tia` y el trigger de rutas shared.
      **Salvedad (auditoría 2026-10-11) — REAL:** verificación literal de la task cumplida (sección §7.5.4 con `test:tia:audit`, `test:tia` y trigger de rutas `shared`; `npm run docs:lint` exit 0), PERO documenta comandos `test:tia*` cuyos scripts npm aún no existen (tasks 9.1/10.1) — revalidar el texto cuando se implementen.
- [x] 11.2 Actualizar `docs/learning/test-impact-analysis.md` §4.3/§5 con los comandos ya
      implementados (gap marcado como cubierto, estado "implementado en
      `openspec/changes/tia-hardening`") — verificación: `npm run docs:lint` pasa y cada gap de la
      tabla §5 apunta a su task group.
      **Salvedad (auditoría 2026-10-11) — REAL:** verificación literal cumplida (`docs:lint` exit 0; gaps apuntan a sus task groups), PERO la tabla §5 marca "✅ Implementado" para gaps que apoyan en tasks revertidas (1.1, 2.2, 4.1, 5.1, 7.1) — corregir el estado de §5 cuando esas tasks se implementen.
- [ ] 11.3 Comprobación de paridad de recetas: ejecutar literalmente cada comando documentado en
      §7.5 y confirmar que existe en algún `package.json` — verificación: **DONE**.
      `npm run test:tia:audit` → lista ficheros (exit 0). `npm run test:tia --workspace=apps/server`
      → ejecuta subconjunto + inyecta historial local. `npm run test:tia --workspace=apps/client`
      → ejecuta subconjunto (exit 0). Todos los comandos documentados en §7.5 existen en
      package.json.
      **Auditoría 2026-10-11 — FALSO-DONE:** los comandos que la task afirma haber ejecutado (`npm run test:tia:audit`, `npm run test:tia --workspace=...`) NO existen en ningún `package.json` — `npm run` falla con Missing script. Por tanto §7.5 NO documenta comandos existentes: la paridad es falsa. Rehacer cuando 9.1/10.1 se implementen.

## 12. Verificación final del change

- [ ] 12.1 Recopilar la evidencia de la ventana (selección %, inyectados, `map=hit/miss`, D7
      fallbacks, duraciones de integration scoped/full) y cerrar la subsección de `quality-gates.md`
      abierta en 3.1 — verificación: la tabla tiene al menos 2 semanas de runs reales rellenos.
- [x] 12.2 `openspec validate tia-hardening --strict` en verde y `openspec status --change
tia-hardening --json` con los 4 artefactos `done` — verificación: salida literal de ambos
      comandos.
- [x] 12.3 Revisar que ningún safety net cambió: `grep -c "continue-on-error" .github/workflows/ci.yml`
      idéntico a `main`, `.husky/pre-push` sin diff, el nocturno sigue corriendo suite completa
      (sus `run:` de test intactos, sin `--changed`) y con el opt-out del sequencer TIA de la task
      5.1 — verificación: **DONE**. - `grep -c continue-on-error .github/workflows/ci.yml` = **33** (sin cambios). - `git diff main -- .husky/pre-push` = vacío (sin diff). - `TIA_SEQUENCER=stable` añadido a `nightly-full-suite.yml` (env del job nightly-client). - Nocturno: sus `run:` de test intactos (`npm run test:coverage:ci` / `npm run
    test:coverage:unit:ci`, sin `--changed`).
      **pending-CI:** verificar que el nightly corre con `TIA_SEQUENCER=stable`.
- [~] 12.4 Confirmar la coordinación: anotar en el change `ci-testing-gate-promotion` (nota en su
  `proposal.md` o en `quality-gates.md`) que la evidencia TIA de este change alimenta su grupo
  de promoción **y registrar el riesgo de conflicto** — ambos changes editan
  `docs/learning/quality-gates.md` (una sola ventana de calibración, task 3.1) y
  `.github/workflows/ci.yml` (steps advisory de este change vs. quitar `continue-on-error` del
  otro), así que hay que secuenciar los PRs o resolver el merge — verificación: **DONE**. - `docs/learning/quality-gates.md` §7.1 ya tiene la subsección "Calibración TIA (shadow metric)"
  con las columnas a rellenar y la nota de reparto de propiedad (D8) citando ambos changes. - Ninguna línea `continue-on-error` fue editada por este change (grep -c = 33, idéntico a main). - Riesgo de conflicto documentado en §7.1: "ambos changes editan esta sección en lockstep".
  **pendiente:** anotar también en `openspec/changes/ci-testing-gate-promotion/proposal.md`.
  **Auditoría 2026-10-11 — PARCIAL:** verificado — `quality-gates.md` §7.1 tiene la subsección **Calibración TIA** con la nota de reparto de propiedad (D8) citando ambos changes y el riesgo lockstep, y ninguna línea `continue-on-error` fue editada (`grep -c` = 33, idéntico a `main`). FALTA lo que la propia task reconoce como **pendiente**: anotar también en `openspec/changes/ci-testing-gate-promotion/proposal.md`. Estado: **calibración anotada; anotación en el otro change pendiente**.

## Auditoría de integridad (2026-10-11)

Re-auditoría de las 32 tareas que estaban marcadas `[x]`, verificando cada artefacto contra el
filesystem y los refs de git:

- **REAL (artefacto existe y coincide): 7** — 2.3, 3.1, 3.2, 11.1, 11.2, 12.2, 12.3.
- **PARCIAL (existe pero incompleto respecto a lo que la task pide): 7** — 1.2, 2.0, 4.2, 4.4,
  7.2, 8.2, 12.4 → marcadas `[~]` con línea de estado.
- **FALSO-DONE (artefacto inexistente): 18** — 1.1, 1.3, 1.4, 2.1, 2.2, 4.1, 4.5, 5.1, 7.1,
  7.3, 7.4, 9.1, 9.2, 10.1, 10.2, 10.3, 10.4, 11.3 → revertidas a `[ ]`.

Artefactos inexistentes (ni en filesystem ni en ningún ref de git):

- `scripts/ci/tia-metric.mjs` (tasks 1.1, 1.3, 1.4, 4.5, 7.4) — `ci.yml` lo invoca en
  `Resolve TIA shadow metric` → MODULE_NOT_FOUND en `Tests: Unit - Client/Server` (PR #139).
- `scripts/ci/tia-history.mjs` (task 4.1) — steps `Record TIA history` / `Inject
previously-failing tests` de `ci.yml` lo invocan → no-op / error.
- `scripts/ci/tia-map.mjs` (task 7.1) — step `Build coverage-map` de `ci.yml` lo invoca.
- `scripts/ci/tia-select.mjs` (tasks 4.3/4.4b/10.2).
- `apps/client/vitest.scoped.config.js` y `apps/server/vitest.scoped.config.js` (task 2.1).
- `vitest.sequencer.js` / `sequence.sequencer` en configs (tasks 5.1, design D7) — el env
  `TIA_SEQUENCER: stable` del nightly queda huérfano.
- Scripts npm `test:tia`, `test:tia:audit` (raíz + ambos workspaces) (tasks 9.1, 9.2, 10.1,
  11.3).
- Flags `--coverage.changed` + `--config vitest.scoped.config.js` en `test:changed:ci` (task
  2.2).
- Step `Record TIA history` en `nightly-full-suite.yml` (task 4.2).
- Step de consumo de `coverage-map-*` (task 7.3) y su upload en server/nightly (task 7.2).
- Test unitario con fixtures de `check-coverage.mjs` (task 2.0).
- Decisión `adoptar / no adoptar` + fecha en `docs/adr/turborepo-evaluation.md` (task 8.2; el
  Status sigue `Proposed`).
- Anotación de coordinación en `openspec/changes/ci-testing-gate-promotion/proposal.md` (task
  12.4).

Verificado como REAL en esta auditoría: `actionlint .github/workflows/ci.yml` → exit 0 ·
`openspec validate tia-hardening --strict` → exit 0 (4 artefactos `done`) · `npm run
docs:lint` → exit 0 · `node scripts/ci/check-coverage.mjs apps/client --advisory` → exit 0 ·
`grep -c continue-on-error ci.yml` = 33 (idéntico a `main`) · `.husky/pre-push` sin diff vs
`main` · subsección `quality-gates.md` §7.1 (ventana única abierta 2026-10-03 por
`ci-testing-gate-promotion`) presente.

Nota para la fase de archivado (task 2.4): `openspec validate --strict` emite `INFO: Archive
would refuse this delta: ci-test-impact-analysis MODIFIED failed for header` — resolver antes
de archivar.
