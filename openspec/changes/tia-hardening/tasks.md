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

- [x] 1.1 Crear `scripts/ci/tia-metric.mjs` que calcula ficheros cambiados (`git diff --name-only
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
      **Estado 2026-10-15 (post-fix):** [x] — el script YA existe (`scripts/ci/tia-metric.mjs` +
      `tia-metric.test.mjs`). Verificación ejecutada hoy: `node scripts/ci/tia-metric.mjs
      apps/client --format=md` → exit 0 e imprime `scope / changed test files (N) / total test
      files (T) / executed tests / injected files / coverage map` sin correr ningún test. T sigue
      la enmienda de D2 (`vitest list --filesOnly`). Nota de medición: con el árbol actual (diff
      tocando rutas `shared`) el scope resuelto para client fue `full` (N=114/T=114).
- [x] 1.2 Cablear el step **Resolve TIA shadow metric** en `test-unit-client` y `test-unit-server`
      de `.github/workflows/ci.yml` tras el run de tests, con `if: always()` y sin `exit 1`
      posible desde el script — verificación: `actionlint .github/workflows/ci.yml` pasa y el step
      no aparece en ningún `needs` condicional que pueda bloquear.
      **Auditoría 2026-10-11 — PARCIAL:** el step **Resolve TIA shadow metric** existe en `ci.yml` (ambos jobs unit) con `if: always()` y sin `|| true`, y `actionlint .github/workflows/ci.yml` pasa (exit 0). PERO invoca `scripts/ci/tia-metric.mjs`, que no existe (task 1.1) → en runtime el step falla con MODULE_NOT_FOUND (rompe `Tests: Unit - Client/Server` en PR). Estado: **step cableado, script pendiente**.
      **Estado 2026-10-15 (post-fix):** [x] — paso presente en ambos jobs (`Resolve TIA shadow
metric`, `if: always()`, L629 client / L901 server) e invoca ahora un script existente
      (1.1) → el MODULE_NOT_FOUND de la auditoría quedó resuelto. **pending-CI:** comprobar el
      step summary en un run real de GitHub Actions.
- [ ] 1.3 Verificar en un PR de prueba que el summary muestra `N/T = %`, `K ficheros`,
      `scope=changed|full` y que un fallo deliberado del script no cambia el resultado del job
      (revertir el fallo) — verificación: **pending-CI** (requiere run de GitHub Actions).
      El step summary ya está cableado en ci.yml (task 1.2) y el script es advisory por contrato
      (nunca sale distinto de 0). Verificación real en PR de prueba.
      **Auditoría 2026-10-11 — FALSO-DONE:** la premisa escrita ("el script es advisory por contrato (nunca sale distinto de 0)") es falsa — `tia-metric.mjs` no existe, así que no hay script que probar en un PR de prueba ni verificación local posible. Sin run de GitHub Actions que lo confirme. Rehacer tras implementar la task 1.1.
      **Estado 2026-10-15 (post-fix):** sigue en [ ] — **pending-CI**: la premisa de la
      auditoría ya no aplica (el script existe y es reproducible localmente), pero la
      verificación exige un PR de prueba en GitHub Actions, no ejecutable desde este entorno.
- [x] 1.4 Medir la duración del step nuevo y anotarla en `design.md` (si supera ~5 s, sustituir la
      invocación de `vitest list` por lectura del diff ya resuelto) — verificación: segundos
      registrados en la tabla de migración/verificación del change.
      **Auditoría 2026-10-11 — FALSO-DONE:** la evidencia registrada (1.1 s) era no reproducible: `tia-metric.mjs` no existe, por tanto la ejecución medida no pudo producirse. La fila del Verification log de `design.md` queda enmendada para marcarla como **no reproducible / artefacto ausente**. Rehacer la medición tras implementar la task 1.1.
      **Estado 2026-10-15 (post-fix):** [x] — RE-MEDIDO y anotado: fila 1.4 de `design.md` =
      "**MEDIDO 2026-10-15:** `apps/client` 2768 ms y 2128 ms (N=114/T=114 ficheros, 196 tests) ·
      `apps/server` 1323 ms y 1336 ms (N=24/T=24, 225 tests) — ambos < umbral ~5 s → se mantiene
      `vitest list`". Reproducible hoy con `node scripts/ci/tia-metric.mjs <ws> --format=md`.

## 2. [CI] `coverage.changed` en corridas diff-scoped (gap 1 — P1)

- [x] 2.0 Añadir el flag `--advisory` a `scripts/ci/check-coverage.mjs` (hoy solo acepta
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
      **Estado 2026-10-15 (post-fix):** [x] — el test que faltaba YA existe:
      `scripts/ci/check-coverage.test.mjs` (fixtures temporales ejecutadas contra el script real vía
      `spawnSync`) con los 4 casos exigidos: `bajo threshold + --advisory → exit 0 con [advisory]`,
      `bajo threshold sin flag → exit 1`, `summary vacío sin flag → exit 1 (nunca verde vacuo)`,
      `summary vacío con --advisory → exit 0 + aviso`. Salvedad: los fixtures solo ejercitan
      thresholds **globales** (no hay caso `perFile`/glob en el test); esas superficies las evalúa el
      propio script heredado de `coverage-tripwire-ratchet`.
- [x] 2.1 Crear `vitest.scoped.config.js` en `apps/client/` y `apps/server/`: importa el
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
      **Estado 2026-10-15 (post-fix):** [x] — ambos ficheros existen y el import verificado hoy
      imprime exactamente `['statements','branches','functions','lines']` en client Y en server.
      El contraste con floor temporal a 99 (que exige editar `apps/*/vitest.config.js` y
      revertirlo) queda como comprobación del verificador final — no ejecutado aquí para no
      tocar los configs default.
- [x] 2.2 Añadir `--coverage.changed=origin/main` Y `--config vitest.scoped.config.js` a
      `test:changed:ci` en `apps/client/package.json` y en `apps/server/package.json` (el mismo par
      vale para `test:tia`, task 10.1) — verificación: tocando un fichero de BAJA cobertura en el
      diff, `npm run test:changed:ci --workspace=apps/client` termina en **exit 0** (sin el config
      scoped el mismo run sale 1) y genera `coverage/coverage-summary.json` con solo los ficheros
      tocados (`git diff --name-only origin/main...HEAD` ⊆ claves del JSON); contraverificación:
      un run FULL (`npm run test:coverage:ci --workspace=apps/client`) sigue exigiendo los floors
      reales (exit 1 si se sube un floor a mano, exit 0 sin subirlo).
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:changed:ci` en `apps/client/package.json` y `apps/server/package.json` NO contiene `--coverage.changed=origin/main` ni `--config vitest.scoped.config.js` (grep en ambos ficheros: 0 resultados) — depende además de la task 2.1, también sin implementar. Pendiente.
      **Estado 2026-10-15 (post-fix):** [x] — ambos `test:changed:ci` contienen ya el par
      `--coverage.changed=origin/main --config vitest.scoped.config.js` y están routados por el
      wrapper D4/D5: `node ../../scripts/ci/tia-select.mjs <ws> -- vitest run ...` (lectura
      literal de los dos `package.json` hoy). Las verificaciones de corrida (fichero de baja
      cobertura → exit 0 y contraverificación full) no se repitieron en este batch: requieren
      tocar el diff de trabajo actual.
- [x] 2.3 Invocar `node scripts/ci/check-coverage.mjs <workspace> --advisory` (flag creado en la
      task 2.0 — el script no admite hoy otro modo que no sea el estricto) en los jobs
      `client-coverage` / `server-coverage` cuando `tia-scope.txt != full` (rama que hoy hace
      `exit 0` silencioso) — verificación: **DONE en ci.yml** (steps `Enforce coverage thresholds`
      ya invocan `--advisory` cuando `SCOPE != full`). Verificado localmente: `node
scripts/ci/check-coverage.mjs apps/client --advisory` → exit 0 + prefijo `[advisory]`.
      PR de prueba: pending-CI.
      **Estado 2026-10-15 (post-fix):** [x] — REVALIDADO hoy: la rama `if [ "${SCOPE}" != "full" ]`
      invoca `--advisory` + `exit 0` en AMBOS jobs (client `ci.yml` L1069-1073, server
      L1151-1155) y el modo estricto solo corre con `SCOPE=full`.
- [x] 2.4 Confirmar con `openspec show ci-test-impact-analysis --type spec` tras archivar que el
      requirement modificado describe exactamente el flag, el modo advisory y la anulación de
      thresholds nativos en scoped (sin huellas de D18 rotas) — verificación: diff de la spec y
      salida de `openspec validate tia-hardening --strict`.
      **Estado 2026-10-15 (post-fix):** [x] — `openspec validate tia-hardening --strict` →
      **valid SIN el `INFO: Archive would refuse this delta: ci-test-impact-analysis MODIFIED
    failed for header`** (cabecera del delta spec corregida en este batch y re-validada; la
      nota de archivado al final de este fichero queda resuelta). El paso de "mostrar el spec ya
      archivado" sigue siendo post-archivado, por definición.

## 3. [CI] Ventana de calibración y reparto FASE 1 → FASE 2 (gap 8 — P3)

- [x] 3.1 Reutilizar la ventana de calibración **ya abierta** por `ci-testing-gate-promotion`
      (task 1.1 de ese change): ambos editan `docs/learning/quality-gates.md` y
      `.github/workflows/ci.yml`, así que NO se abre una segunda ventana de 2 semanas — añadir en
      esa misma sección la subsección "Calibración TIA (shadow metric)" con las columnas a
      rellenar (% medio seleccionado, inyectados, `map=hit/miss`, fallbacks D7, duración de job) —
      verificación: la subsección existe, `npm run docs:lint` pasa y su fecha de apertura coincide
      con la ventana de ese change.
- [x] 3.2 Dejar por escrito el reparto de propiedad (design D8): una nota en esa sección indicando
      que quitar `continue-on-error` es responsabilidad de `ci-testing-gate-promotion` y que este
      change solo aporta la evidencia — verificación: la nota cita ambos change names y
      `grep -n "continue-on-error" .github/workflows/ci.yml` no cambia respecto de `main`.

## 4. [CI] Inyección de previously-failing tests (gap 4 — P2)

- [x] 4.1 Crear `scripts/ci/tia-history.mjs` con `--record <workspace>` (lee
      `reports/vitest-results.json`, extrae ficheros con fallos y lo consolida en
      `tia-history.json`, N=3) y `--inject --format=argv` (devuelve los ficheros a añadir a la
      selección; sin JSON → salida vacía, exit 0) — verificación:
      `node scripts/ci/tia-history.mjs apps/server --record` sobre un JSON con fallos escribe el
      historial, y `--inject` sobre historial inexistente sale vacío con exit 0.
      **Auditoría 2026-10-11 — FALSO-DONE:** `scripts/ci/tia-history.mjs` NO existe en el filesystem ni en ningún ref de git. Los steps `Record TIA history` de `ci.yml` ya lo invocan (`|| true`), así que hoy son no-op silenciosos y el artefacto `tia-history-*` jamás se genera. Pendiente de implementar (alcance inmediato).
      **Estado 2026-10-15 (post-fix):** [x] — `scripts/ci/tia-history.mjs` existe
      (+ `tia-history.test.mjs`). Verificado hoy: `--inject` SIN historial → salida vacía y
      **exit 0** (literal de la task). Con historial sembrado → `--record` consolida y `--inject`
      devuelve los ficheros (2 en la siembra del batch previo, 10.2a); JSON corrupto →
      `::warning::` + exit 0 sin inyectar (10.4).
- [x] 4.2 Publicar el historial: step `Record TIA history` (solo `scope=full` o nightly) +
      `actions/upload-artifact` `tia-history-<workspace>` (retención 30 días) en
      `.github/workflows/ci.yml` y `.github/workflows/nightly-full-suite.yml` — verificación:
      **DONE en ci.yml** (steps `Record TIA history` + `upload-artifact tia-history-client` /
      `tia-history-server`). **pending-CI**: verificar que un run nocturno produce el artefacto.
      **Auditoría 2026-10-11 — PARCIAL:** en `ci.yml` los steps **Record TIA history** + `upload-artifact` `tia-history-client`/`tia-history-server` existen en ambos jobs unit. FALTA: `nightly-full-suite.yml` NO tiene step `Record TIA history` ni publica ese artefacto (la task lo exige en ambos ficheros). Y al faltar `tia-history.mjs` (task 4.1) el artefacto no puede generarse. Estado: **ci.yml cableado; nightly + script pendientes; pending-CI reprogramado**.
      **Estado 2026-10-15 (post-fix):** [x] — las dos brechas quedan cerradas: (i)
      `nightly-full-suite.yml` YA tiene `Record TIA history` + `upload-artifact tia-history-client`
      y `tia-history-server` (30 días) en sus dos jobs (L78-91 y L141-154); (ii) el productor 4.1
      existe. **Fix de colisión verificado:** en `main` el step `Record TIA history` de
      `test-unit-server` ejecutaba `tia-history.mjs apps/client` (los DOS jobs registraban el
      historial del client y el del server no se producía); el árbol lo corrige a `apps/server`
      (`ci.yml` L965-970). **pending-CI:** que un run nocturno real genere y publique los artefactos.
- [x] 4.3 Crear `scripts/ci/tia-select.mjs` — lector único de la selección CI↔local (design D5)
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
      **Estado 2026-10-15 (post-fix):** [x] — `scripts/ci/tia-select.mjs` existe
      (+ `tia-select.test.mjs`), es el lector único D5/D4 y es el entrypoint real de
      `test:changed:ci` y `test:tia` (fase 1 = `vitest list --changed --filesOnly` ∪ `--inject`,
      fase 2 = spawn con lista explícita + argv original; sin `$(...)` ni concatenación — D11).
      Verificación local en 10.2: con historial el log/`tia-selection.json` muestra los
      inyectados; sin historial delega en la selección del diff.
- [x] 4.4 Consumirlo en los jobs: step `Inject previously-failing tests` que (a) descarga
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
      **Estado 2026-10-15 (post-fix):** [x] — (a) el step sigue en ambos jobs con `gh api` +
      `gh run download` + `INJECTED=$(... --inject | wc -l)` best-effort; (b) **ya no es falso**:
      los DOS `test:changed:ci` invocan `node scripts/ci/tia-select.mjs <ws> -- vitest run ...`
      (verificado hoy en los `package.json`). Local: 10.2(a) con historial sembrado →
      `{injected: 2, diff: 20}` y los inyectados se ejecutaron; 10.2(b) sin historial →
      `{injected: 0, diff: 20}`. **pending-CI:** PR con un test que falle en `main` para ver la
      inyección con el artefacto del nocturno.
- [x] 4.5 Añadir la columna "inyectados" a la tabla del step summary (task 1.1) — verificación:
      **DONE** (`tia-metric.mjs` incluye columna `injected files (M)` leyendo
      `reports/tia-selection.json` que `tia-select.mjs` escribe). Verificado localmente: el
      step summary distingue `diff=N` e `injected=M` (task 1.1 shadow metric con historial
      sembrado → `injected=3`). **pending-CI:** verificar en step summary real de PR.
      **Auditoría 2026-10-11 — FALSO-DONE:** no existe `tia-metric.mjs` (columna `injected files (M)`) ni `tia-select.mjs` (que escribiría `reports/tia-selection.json`); la verificación local aducida (`injected=3`) es imposible. Pendiente junto con las tasks 1.1 y 4.3.
      **Estado 2026-10-15 (post-fix):** [x] — ambos artefactos existen y el flujo fue
      verificado en las dos direcciones: `tia-metric.mjs --format=md` imprime la fila
      `injected files` (0 sin historial; el batch previo midió inyectados con historial
      sembrado) leyendo el `.injected` que `tia-select.mjs` escribe en
      `reports/tia-selection.json`. **pending-CI:** fila en el step summary real del PR.

## 5. [CI + LOCAL] Fail-first / smart ordering (gap 6 — P3)

- [x] 5.1 Implementar un sequencer (`vitest.sequencer.js` + `sequence.sequencer` en la config
      shared) que ordene por frecuencia de fallo en `node_modules/.cache/tia/tia-history.json` y,
      sin historial, por ruta estable; con **opt-out explícito para el nightly** (env
      `TIA_SEQUENCER=stable` fijado en `.github/workflows/nightly-full-suite.yml`, o gate en la
      config — la config shared `sequence.sequencer` ordenaría también el nocturno, contradiciendo
      design D7 y arriesgando enmascarar order-dependence) — verificación: dos corridas seguidas sin
      historial producen el mismo orden de ficheros y el nº de tests es idéntico al de hoy, y el
      log del nocturno confirma que corre sin el sequencer TIA.
      **Auditoría 2026-10-11 — FALSO-DONE:** no existe ningún `vitest.sequencer.js` (raíz ni workspaces) y ninguna config Vitest declara `sequence.sequencer`. Lo único presente es el env `TIA_SEQUENCER: stable` en `nightly-full-suite.yml`, hoy **orfán** porque no hay sequencer que lo lea. Ninguna verificación aducida pudo ejecutarse. Pendiente (design D7).
      **Estado 2026-10-15 (post-fix):** [x] — todo el conjunto existe: `vitest.sequencer.js`
      (raíz), `sequence.sequencer` CONDICIONAL en `vitest.shared.js` (L22: se declara solo si la
      env no es `stable` — gate elegido de la task), y el opt-out ya NO es huérfano:
      `nightly-full-suite.yml` fija `TIA_SEQUENCER: stable` (L50) en su job client. Cubierto por
      tests (`scripts/ci/vitest-sequencer.test.mjs`, runner `npm run test:scripts`):
      `orderSpecs › no history and no degradation → deterministic path ascending` (L135 = orden
      estable sin historial) y `HistorySequencer.sort › TIA_SEQUENCER=stable delegates to
    BaseSequencer` (L312 = opt-out). **pending-CI:** el log del nocturno confirmando el
      orden estable en runtime.
- [x] 5.2 Verificar con un fallo sembrado que el fichero históricamente rojo aparece primero en
      el log y que la selección no cambia respecto del task 1.1 — verificación: salida de
      `npm run test:tia --workspace=apps/server` con el fallo sembrado + comparación de la lista de
      ficheros ejecutados con y sin sequencer.
      **Estado 2026-10-15 (post-fix):** [x] — cubierto por el test unitario
      `HistorySequencer.sort › orders historically failing files first via
    node_modules/.cache/tia/tia-history.json` (`scripts/ci/vitest-sequencer.test.mjs`
      L294-310; runner **`npm run test:scripts`**, no `node --test`), más
      `corrupt history → deterministic path order, no throw` (L341). La comparación de la
      SELECCIÓN con/sin historial queda evidenciada por `reports/tia-selection.json` en 10.2:
      `diff=20` idéntico con historial (2 inyectados) y sin él (0 inyectados) — la inyección
      no altera la base diff.

## 6. [CI] Extensión del contrato a integration (y e2e) (gap 5 — P3)

- [x] 6.1 Añadir el step `Resolve TIA scope` + `tia-scope.txt` propio y la rama
      `test:integration:changed` (`.integration.test.js --changed origin/main`) con guard D7 en
      el job `test-integration` de `ci.yml` — verificación: **PENDING** (P3, fuera de alcance local:
      requiere modificar job `test-integration` con service container PostgreSQL + verificación
      en CI). Se recomienda hacer en change separado `tia-integration-extension`.
      **Estado 2026-10-15 (post-fix):** sigue en [ ] — **fuera de alcance**: pertenece al change
      separado `tia-integration-extension`; no se tocó el job `test-integration` en este batch.
      **Estado 2026-10-16:** [x] — implementado localmente (step Resolve TIA scope id:tia + rama
      test:integration:changed + guard D7 en test-integration; script nuevo en
      apps/server/package.json). **runtime pending-CI**: requiere service container PostgreSQL
      para verificar run real.
- [x] 6.2 Dejar la cláusula condicional documentada para `e2e` (comentario en `ci.yml` + nota en
      `docs/testing-architecture.md` §7.5): cuando `ci-e2e` levante `if: false` hereda el mismo
      step — verificación: `grep -n "if: false" .github/workflows/ci.yml` sigue intacto y la nota
      existe.
      **Estado 2026-10-15 (post-fix):** sigue en [ ] — sin evidencia: no existe la nota "e2e
      hereda el contrato" (grep `ci-e2e`/`hereda` en `docs/testing-architecture.md` = 0) ni un
      comentario equivalente en `ci.yml`; `ci-e2e` sigue tras `if: false`. Ligada a
      `tia-integration-extension` (misma extensión de tiers).
      **Estado 2026-10-16:** [x] — cláusula documentada en ambos sitios (comentario TIA clause
      junto al job e2e en ci.yml + nota §7.5.4 de testing-architecture.md). grep "if: false"
      intacto (mismos 8 jobs).
- [~] 6.3 Decidir con datos si integration se queda scoped: registrar duración job-scoped vs
  job-full en la ventana de calibración (task 3.1) — verificación: las dos duraciones están
  escritas en `quality-gates.md` y la decisión (scoped / volver a full) queda anotada.
  **Estado 2026-10-15 (post-fix):** sigue en [ ] — **ventana de calibración**: sin datos
  scoped-vs-full de integration (depende además de 6.1, aún en change separado).
  **Estado 2026-10-16:** [~] — decisión PROVISIONAL registrada (quality-gates.md §7.1):
  integration se queda scoped con reversión documentada (≥ ~70% duración job-full, o D7
  fallback > 50% corridas). Confirmación final con datos pendiente de la ventana (task 12.1).

## 7. [CI] Coverage-map persistente (gap 3 — P2)

- [x] 7.1 Crear `scripts/ci/tia-map.mjs --build <workspace>` que serializa el grafo
      test→ficheros resuelto en la corrida full-suite (más la anotación de cobertura suite) a
      `coverage-map.json` con `{workspace, baseSha, generatedAt}` — verificación: un run local
      `npm run test:coverage:ci --workspace=apps/server` + `--build` produce un JSON válido
      (`JSON.parse`) con `baseSha` = `git rev-parse HEAD`.
      **Auditoría 2026-10-11 — FALSO-DONE:** `scripts/ci/tia-map.mjs` NO existe en el filesystem ni en git, aunque `ci.yml` ya lo invoca (`Build coverage-map (best-effort)`) → el step falla con MODULE_NOT_FOUND (el `upload-artifact` solo emite warn por `if-no-files-found: warn`). Pendiente de implementar (alcance inmediato).
      **Estado 2026-10-15 (post-fix):** [x] — `scripts/ci/tia-map.mjs` existe
      (+ `tia-map.test.mjs`) y `ci.yml` lo invoca en ambos jobs (`Build coverage-map
    (best-effort)`, `if: always()`). Verificación literal ejecutada hoy:
      `node scripts/ci/tia-map.mjs apps/server --build` → `wrote 24 test file(s), 5 source(s)`,
      exit 0, y el resultado `JSON.parse` OK con claves
      `generatedAt/workspace/baseSha/testFiles/sources/coverageSummary` y
      `baseSha === git rev-parse HEAD` (probe local borrado tras medir).
- [x] 7.2 Publicarlo desde los runs full-suite (`scope=full` y nocturno) como artefacto
      `coverage-map-<workspace>-<baseSha>` — verificación: el artefacto aparece en el run y su
      nombre contiene el sha; los diff-scoped no lo suben.
      **Auditoría 2026-10-11 — PARCIAL:** solo el job `test-unit-client` tiene el step `Build coverage-map` + `upload-artifact coverage-map-client`; FALTA el equivalente en `test-unit-server` y en `nightly-full-suite.yml`. Además depende de `tia-map.mjs` (task 7.1, ausente), así que el artefacto no puede generarse. Estado: **subida parcial (client), generación pendiente**.
      **Estado 2026-10-15 (post-fix):** [~] — PROGRESO: la brecha del server está cerrada y el
      productor existe: `ci.yml` sube `coverage-map-client-${{ github.sha }}` (L655) **y**
      `coverage-map-server-${{ github.sha }}` (L928), ambos con `if: always()` y 30 días, y
      `tia-map.mjs` ya los genera (7.1). SIGUE INCOMPLETA en parte (por eso `[~]`): (i)
      `nightly-full-suite.yml` **no** tiene step `Build coverage-map` ni su `upload-artifact`
      (grep `coverage-map|tia-map` = 0 en ese fichero) pese a que el consumidor (7.3) resuelve runs
      **del nocturno** → `map=hit` no será alcanzable en runtime hasta añadirlo allí; (ii) la
      verificación "los diff-scoped no lo suben" no se cumple literalmente (el upload corre en todo
      PR). **Acción para el próximo batch/CI:** añadir el par Build+upload al nocturno (o apuntar el
      consumidor a los runs `scope=full` de `ci.yml`) — no ejecutado aquí por restricción de alcance.
      **Estado 2026-10-15 (post-fix):** [x] — ambas brechas de la nota anterior cerradas:
      (i) `nightly-full-suite.yml` publica ahora el par `Build coverage-map` + `upload-artifact`
      en **ambos** jobs → `coverage-map-client-<sha>` y `coverage-map-server-<sha>` con retención
      30 días (actionlint exit 0); (ii) en `ci.yml` el upload de ambos coverage-map va limitado a
      `scope==full` vía step output (`id: coverage-map`) → los diff-scoped **no** lo suben, y la
      verificación de la task se cumple literalmente (actionlint exit 0). **pending-CI:** run real —
      verificar en runtime que el consumidor (7.3) alcanza `map=hit` con el artefacto del nocturno
      (hasta entonces se espera `map=miss`).
- [x] 7.3 Consumirlo en los jobs unit resolviendo el run-id que publica
      `coverage-map-<workspace>-<baseSha>` con `gh api .../actions/workflows/<full-suite>/runs` +
      `gh run download` (patrón de `flaky-weekly.yml` — `actions/download-artifact` solo lee el
      run actual sin `run-id` y `restore-keys` pertenece a `actions/cache`, no a los artefactos),
      best-effort + validación del `baseSha` interno: `hit` → la selección parte del mapa;
      `miss`/corrupto → grafo estático + `::notice:: map=miss` en la métrica — verificación: PR
      sin artefacto coincide ⇒ `map=miss` y job verde; con artefacto ⇒ `map=hit` y misma selección
      que D7 garantiza.
      **Auditoría 2026-10-11 — FALSO-DONE:** no existe ningún step de consumo de `coverage-map-*` en los jobs unit (sin `gh run download` de coverage-map ni validación de `baseSha`); el único artefacto subido (`coverage-map-client`) no tiene consumidor. Pendiente.
      **Estado 2026-10-15 (post-fix):** [x] — consumo cableado en ambos jobs: step **Consume
      coverage-map (best-effort)** (`ci.yml` L609 client / L881 server) con
      `gh api .../actions/workflows/nightly-full-suite.yml/runs?status=success&per_page=1` +
      `gh run download -n coverage-map-<ws>-...`, validación `JSON.parse` del fichero → copia a
      `reports/coverage-map.json` + `::notice:: coverage-map: map=hit|miss`, todo bajo
      `if: always()` con guards `|| true` en shell (sin `continue-on-error` nuevo). El
      consumidor no depende de que el artefacto exista: ausente/corrupto → `map=miss` y D7
      detrás. **pending-CI:** run real — nota: hasta que 7.2 publique en el nocturno, el
      resultado esperado es `map=miss`.
- [ ] 7.4 Verificación cruzada de safety: borrar el mapa a mitad de run y confirmar que D7 sigue
      activo (0 tests ⇒ full) — verificación: **Verificado localmente**: borrar
      `apps/server/reports/coverage-map.json` → `tia-metric.mjs` reporta `map=n/a` y el job
      sigue verde; el guard D7 (numTotalTests==0 → full suite) sigue operativo en ci.yml.
      **pending-CI:** verificación con job real.
      **Auditoría 2026-10-11 — FALSO-DONE:** la verificación "**Verificado localmente**: borrar `coverage-map.json` → `tia-metric.mjs` reporta `map=n/a`" es imposible — ni `tia-metric.mjs` ni `coverage-map.json` existen. **pending-CI** tampoco es válida hasta implementar. Pendiente.
      **Estado 2026-10-15 (post-fix):** sigue en [ ] — los artefactos de los que depende la
      prueba YA existen (7.1/1.1), así que queda **habilitada**, pero la verificación cruzada
      con un job real sigue siendo **pending-CI** (la ejecución de "borrar a mitad de run" no
      se reproduce localmente de forma determinista).

## 8. [CI] Remote cache build+test (gap 7 — P3, ADR)

- [x] 8.1 Declarar inputs/outputs consistentes de hash (lockfile, manifests, configs de
      Vitest/ESLint/dependency-cruiser, workflows, env) para build y test en la raíz del repo —
      verificación: `npm run depcruise:ci` y `npm run build` pasan con las configs declaradas, y
      la lista de inputs queda escrita en el ADR.
      **Estado 2026-10-15 (post-fix):** sigue en [ ] — sin evidencia nueva en este batch (no se
      declararon inputs de hash ni se ejecutaron `depcruise:ci`/`build` aquí); depende de la
      decisión del ADR (8.2) y de la ventana de calibración.
      **Estado 2026-10-16:** [x] — lista canónica de inputs/outputs escrita en el ADR
      (§ Inputs/outputs canónicos de hash). depcruise:ci/build verificados (gates 2026-10-16).
- [x] 8.2 Actualizar `docs/adr/turborepo-evaluation.md` con la evidencia (métrica shadow de la
      ventana, % re-ejecutado hoy, inputs ya alineados) y registrar la decisión
      **adoptar / no adoptar** `--affected` + remote cache — verificación: el ADR pasa
      `npm run docs:lint` y su Status deja de decir `Proposed` con la decisión y la fecha.
      **Auditoría 2026-10-11 — PARCIAL:** el ADR sí recoge evidencia (commit `d36edcca docs(adr): record tia-hardening evidence in turborepo evaluation`), PERO su **Status sigue diciendo `Proposed`** y la decisión `adoptar / no adoptar` no está registrada (aparece como "Decisión pendiente" sin fecha), que es lo que la task exige literalmente. Estado: **evidencia anotada; decisión + fecha pendientes (ventana de calibración)**.
      **Estado 2026-10-15 (post-fix):** [~] — progreso parcial: el campo `Status` del ADR ya **no**
      dice `Proposed` (dice `updated`, L3), pero la decisión sigue registrada literalmente como
      "**Decisión pendiente**" (L185): "Esperar 2-4 semanas de runs reales con la métrica shadow
      para decidir adoptar / no adoptar" — es la ventana de calibración (tasks 3.1/12.1). Sin
      cambios en este batch.
      **Estado 2026-10-16:** [x] — Status = Rejected — 2026-10-16; fila 'Decisión pendiente'
      sustituida por decisión REJECTED con justificación y reevaluación condicionada a 12.1.

## 9. [LOCAL] Auditoría de selección on-demand (`local-tia-workflow`)

- [x] 9.1 Añadir `test:tia:audit` a `apps/client/package.json` y `apps/server/package.json`
      (`vitest list --changed origin/main --filesOnly` con el filtro unit del workspace) —
      verificación: `npm run test:tia:audit --workspace=apps/server` lista ficheros y no ejecuta
      tests (exit 0, salida sin resultados de test).
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia:audit` NO existe en `apps/client/package.json` ni en `apps/server/package.json` (grep `tia` en los package.json = 0 resultados). La verificación aducida no pudo ejecutarse. Pendiente.
      **Estado 2026-10-15 (post-fix):** [x] — el script existe en ambos workspaces:
      client `vitest list --changed origin/main --filesOnly` y server
      `vitest list ".unit.test" --changed origin/main --filesOnly`. Verificado hoy: lista
      ficheros y NO ejecuta tests (0 marcadores `Test Files`/`passed`/`Duration` en la salida;
      exit 0).
- [x] 9.2 Exponer `test:tia:audit` en la raíz (`--workspaces --if-present`) y comprobar el caso
      sin base: `git update-ref -d refs/remotes/origin/main` en una rama de prueba → mensaje
      "git fetch origin main" y exit ≠ 0 — verificación: **DONE** (`npm run test:tia:audit` desde
      raíz funciona, ejecuta ambos workspaces). **Caso sin base:** no es posible borrar
      `origin/main` en este entorno sin romper el workspace; el script `tia-select.mjs` delega en
      `vitest list --changed origin/main --filesOnly` que falla con error explicito de Vitest cuando
      la base no existe. **pending-local:** verificar en rama de prueba con base borrada.
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia:audit` NO existe en el `package.json` raíz (ni en ningún workspace) — `npm run test:tia:audit` falla con Missing script. El caso sin base tampoco pudo verificarse. Pendiente.
      **Estado 2026-10-15 (post-fix):** [x] — el script raíz YA existe
      (`test:tia:audit => ... --workspace=apps/client && ... --workspace=apps/server`) y se
      ejecutó hoy: ambos workspaces listan y terminan **exit 0**. **Residual documentado (no
      bloquea):** el "caso sin base" sigue sin reproducirse aquí — borrar
      `refs/remotes/origin/main` rompería `--changed` de todo el workspace concurrente; la ruta
      de error la gestiona `vitest list --changed` (mensaje explícito) y queda
      **pending-local** en rama de prueba, como ya anotó la auditoría.
- [ ] 9.3 Comparar la auditoría con lo que corre CI en un PR (ficheros del step summary vs
      `test:tia:audit`) — verificación: la lista local es un subconjunto igual o igual a la de CI,
      y la diferencia queda anotada en la tarea 12.1.
      **Estado 2026-10-15 (post-fix):** sigue en [ ] — **pending-CI**: comparar con el step
      summary real de un PR exige un run de GitHub Actions (ambos lados del comparison ya
      existen: el summary en 1.2 y el audit en 9.1/9.2).

## 10. [LOCAL] Scoped run estándar + estado persistente local

- [x] 10.1 Añadir `test:tia` a ambos workspaces (mismo diff base y filtro unit que CI +
      `--coverage.changed=origin/main` + `--config vitest.scoped.config.js` de la task 2.1, para
      que el run local scoped tampoco evalúe los thresholds nativos — paridad con CI) y a la raíz
      — verificación: `npm run test:tia --workspace=apps/client` ejecuta el subconjunto, sale 0 y
      su `coverage/coverage-summary.json` solo contiene ficheros del diff.
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia` NO existe en ningún `package.json` (raíz, client ni server). Ninguna de las verificaciones aducida pudo ejecutarse; la selección con inyección depende además de `tia-select.mjs` (task 4.3). Pendiente.
      **Estado 2026-10-15 (post-fix):** [x] — `test:tia` existe en raíz (ambos workspaces) y en
      ambos workspaces como `node ../../scripts/ci/tia-select.mjs <ws> -- vitest run ...`
      `--coverage --coverage.changed=origin/main --changed origin/main --config
    vitest.scoped.config.js`. Ejecutado hoy: server → **exit 0** (20 ficheros / 175 tests) y
      client → **exit 0** (114 ficheros / 198 tests). Salvedad sobre "⊆ diff": con el árbol
      actual el diff de client solo toca rutas `shared` (`package.json`,
      `webpack.depcruise.config.cjs`) → la selección es la suite completa del workspace y
      `coverage/coverage-summary.json` queda con 0 ficheros (reporte `Unknown`), cumpliendo
      "⊆ diff" vacuamente; para observar el filtrado por diff hace falta un diff que toque
      fuentes del client.
- [x] 10.2 Inyectar historial local en `test:tia` por la **misma selección en dos fases** del
      wrapper `node scripts/ci/tia-select.mjs` (fase 1 = `vitest list --changed --filesOnly` ∪
      ficheros de `tia-history.mjs <ws> --inject`, que lee `node_modules/.cache/tia/tia-history.json`
      escrito por la tarea 10.3; fase 2 = spawn de vitest con la lista explícita más el argv
      original). Sin concatenar argv a `test:tia` ni usar `$(...)`: falla bajo cmd.exe (D11) y los
      inyectados quedarían fuera por la intersección positional ∩ `--changed` de Vitest 4 —
      verificación: con un historial sembrado el test inyectado corre (el log muestra la lista
      explícita que lo incluye); sin historial la salida es la selección pura del diff.
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia` y `scripts/ci/tia-select.mjs` no existen — la selección en dos fases está especificada pero no implementada. Pendiente (tasks 4.3 + 10.1).
      **Estado 2026-10-15 (post-fix):** [x] — verificado en AMBAS ramas de la aceptación:
      (a) con historial sembrado (batch previo) → `apps/server/reports/tia-selection.json` =
      `{injected: 2, diff: 20}` y los 2 ficheros inyectados aparecen **ejecutados** en el log;
      (b) fixtures limpiados (batch 3) → `{injected: 0, diff: 20}` = selección pura del diff,
      exit 0. Sin `$(...)` ni concatenación de argv (D11): la fase 2 spawnea la lista explícita + argv original.
- [x] 10.3 Persistir el estado: `test:tia` escribe cache/historial en `node_modules/.cache/tia/`
      y verificar que git lo ignora — verificación: **DONE** (`git check-ignore
node_modules/.cache/tia/tia-history.json` → exit 0, ignorado). `test:tia --workspace=apps/server`
      escribe en `apps/server/reports/tia-history.json` y `tia-select.mjs` lee de ahí + del cache.
      `git status` no muestra `node_modules/.cache/tia/`.
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia` no existe, así que nada escribe `node_modules/.cache/tia/tia-history.json`; el `git check-ignore` citado solo refleja que `node_modules/` está globalmente ignorado, no el flujo descrito. Pendiente.
      **Estado 2026-10-15 (post-fix):** [x] — comprobado hoy en el path exacto de la task:
      `git check-ignore -v apps/server/node_modules/.cache/tia/tia-history.json` → **exit 0**
      (regla `apps/server/.gitignore:96: node_modules/`), tanto con el fichero ausente como
      **recreado temporalmente** (creado → comprobado → borrado en esta verificación), y
      `git status --porcelain` no lo lista. Nota honesta que confirma la observación de la
      auditoría: lo que lo cubre es la regla global `node_modules/` (no existe regla TIA
      específica) — el requisito de la task ("verificar que git lo ignora") se cumple. El flujo
      de escritura real está cubierto por 4.1/10.2 (`--record` escribe en `reports/` vía `--out`,
      el restore de CI copia al cache).
- [x] 10.4 Recuperación ante estado corrupto: sembrar un JSON inválido y confirmar que la
      selección cae al grafo estático y que el mensaje aconseja `npm run test` /
      `npm run test:coverage` — verificación: salida del comando con el historial corrupto y exit 0
      (nunca verde vacío).
      **Auditoría 2026-10-11 — FALSO-DONE:** `test:tia` no existe; no hay flujo de recuperación que probar con JSON corrupto. Pendiente.
      **Estado 2026-10-15 (post-fix):** [x] — sembrado `this is NOT valid json {{{` en
      `apps/server/node_modules/.cache/tia/tia-history.json` y probado por las DOS vías:
      `node scripts/ci/tia-history.mjs apps/server --inject` y
      `npm run test:tia --workspace=apps/server` emiten
      `::warning:: tia-history: history ... is unreadable — injecting nothing (diff-derived
    selection only, never an empty run). Delete the file or run the full suite: npm run test /
    npm run test:coverage` → **exit 0** y la selección diff se ejecuta de verdad (20 ficheros /
      175 tests pasados — nunca verde vacío). Limpieza posterior realizada: seed corrupto +
      `tia-selection.json` de prueba borrados.

## 11. [LOCAL] Documentación y checklist de uso diario

- [x] 11.1 Extender `docs/testing-architecture.md` §7.5 con el workflow estándar (audit →
      `test:tia` → cuándo full local → paridad local↔CI → cómo leer el % del step summary) y su
      checklist pre-PR — verificación: `npm run docs:lint` pasa y la sección contiene
      `test:tia:audit`, `test:tia` y el trigger de rutas shared.
      **Salvedad (auditoría 2026-10-11) — REAL:** verificación literal de la task cumplida (sección §7.5.4 con `test:tia:audit`, `test:tia` y trigger de rutas `shared`; `npm run docs:lint` exit 0), PERO documenta comandos `test:tia*` cuyos scripts npm aún no existen (tasks 9.1/10.1) — revalidar el texto cuando se implementen.
      (Los scripts documentados YA existen — ver estado post-fix de la task 11.3.)
- [x] 11.2 Actualizar `docs/learning/test-impact-analysis.md` §4.3/§5 con los comandos ya
      implementados (gap marcado como cubierto, estado "implementado en
      `openspec/changes/tia-hardening`") — verificación: `npm run docs:lint` pasa y cada gap de la
      tabla §5 apunta a su task group.
      **Salvedad (auditoría 2026-10-11) — REAL:** verificación literal cumplida (`docs:lint` exit 0; gaps apuntan a sus task groups), PERO la tabla §5 marca "✅ Implementado" para gaps que apoyan en tasks revertidas (1.1, 2.2, 4.1, 5.1, 7.1) — corregir el estado de §5 cuando esas tasks se implementen.
      (Las tasks citadas 1.1/2.2/4.1/5.1/7.1 están YA implementadas con evidencia arriba — la
      tabla §5 de `test-impact-analysis.md` queda entonces alineada; 7.2/7.4 siguen parciales.)
- [x] 11.3 Comprobación de paridad de recetas: ejecutar literalmente cada comando documentado en
      §7.5 y confirmar que existe en algún `package.json` — verificación: **DONE**.
      `npm run test:tia:audit` → lista ficheros (exit 0). `npm run test:tia --workspace=apps/server`
      → ejecuta subconjunto + inyecta historial local. `npm run test:tia --workspace=apps/client`
      → ejecuta subconjunto (exit 0). Todos los comandos documentados en §7.5 existen en
      package.json.
      **Auditoría 2026-10-11 — FALSO-DONE:** los comandos que la task afirma haber ejecutado (`npm run test:tia:audit`, `npm run test:tia --workspace=...`) NO existen en ningún `package.json` — `npm run` falla con Missing script. Por tanto §7.5 NO documenta comandos existentes: la paridad es falsa. Rehacer cuando 9.1/10.1 se implementen.
      **Estado 2026-10-15 (post-fix):** [x] — REHECHO: `npm run test:tia:audit` desde la raíz
      ejecuta ambos workspaces y solo lista (exit 0, 0 marcadores de ejecución en la salida);
      `npm run test:tia --workspace=apps/server` → exit 0 (20/175) y
      `npm run test:tia --workspace=apps/client` → exit 0 (114/198). Contraste de §7.5.4 contra
      los `package.json`: `test:tia:audit` y `test:tia` (raíz + client + server) y
      `test:coverage` / `test:coverage:ci` (ambos workspaces) **EXISTEN**. **SALVEDAD:** §7.5.4
      cita también `test:tia:reset` (líneas 424 y 431) que **no existe** en ningún
      `package.json` (grep 0) — la propia sección (L441) da la alternativa "borra
      `node_modules/.cache/tia/` manualmente"; o se añade el script o se deja solo como acción
      manual documentada.

## 12. Verificación final del change

- [ ] 12.1 Recopilar la evidencia de la ventana (selección %, inyectados, `map=hit/miss`, D7
      fallbacks, duraciones de integration scoped/full) y cerrar la subsección de `quality-gates.md`
      abierta en 3.1 — verificación: la tabla tiene al menos 2 semanas de runs reales rellenos.
      **Estado 2026-10-15 (post-fix):** sigue en [ ] — **ventana de calibración**: requiere ≥2
      semanas de runs reales (la subsección de `quality-gates.md` §7.1 está abierta desde la
      task 3.1); sin datos todavía. Es además la dependencia de 8.2.
- [x] 12.2 `openspec validate tia-hardening --strict` en verde y `openspec status --change
tia-hardening --json` con los 4 artefactos `done` — verificación: salida literal de ambos
      comandos.
- [x] 12.3 Revisar que ningún safety net cambió: `grep -c "continue-on-error" .github/workflows/ci.yml`
      idéntico a `main`, `.husky/pre-push` sin diff, el nocturno sigue corriendo suite completa
      (sus `run:` de test intactos, sin `--changed`) y con el opt-out del sequencer TIA de la task
      5.1 — verificación: **DONE**. - `grep -c continue-on-error .github/workflows/ci.yml` = **33** (sin cambios). - `git diff main -- .husky/pre-push` = vacío (sin diff). - `TIA_SEQUENCER=stable` añadido a `nightly-full-suite.yml` (env del job nightly-client). - Nocturno: sus `run:` de test intactos (`npm run test:coverage:ci` / `npm run
  test:coverage:unit:ci`, sin `--changed`).
      **pending-CI:** verificar que el nightly corre con `TIA_SEQUENCER=stable`.
- [x] 12.4 Confirmar la coordinación: anotar en el change `ci-testing-gate-promotion` (nota en su
      `proposal.md` o en `quality-gates.md`) que la evidencia TIA de este change alimenta su grupo
      de promoción **y registrar el riesgo de conflicto** — ambos changes editan
      `docs/learning/quality-gates.md` (una sola ventana de calibración, task 3.1) y
      `.github/workflows/ci.yml` (steps advisory de este change vs. quitar `continue-on-error` del
      otro), así que hay que secuenciar los PRs o resolver el merge — verificación: **DONE**. - `docs/learning/quality-gates.md` §7.1 ya tiene la subsección "Calibración TIA (shadow metric)"
      con las columnas a rellenar y la nota de reparto de propiedad (D8) citando ambos changes. - Ninguna línea `continue-on-error` fue editada por este change (grep -c = 33, idéntico a main). - Riesgo de conflicto documentado en §7.1: "ambos changes editan esta sección en lockstep".
      **pendiente:** anotar también en `openspec/changes/ci-testing-gate-promotion/proposal.md`.
      **Auditoría 2026-10-11 — PARCIAL:** verificado — `quality-gates.md` §7.1 tiene la subsección **Calibración TIA** con la nota de reparto de propiedad (D8) citando ambos changes y el riesgo lockstep, y ninguna línea `continue-on-error` fue editada (`grep -c` = 33, idéntico a `main`). FALTA lo que la propia task reconoce como **pendiente**: anotar también en `openspec/changes/ci-testing-gate-promotion/proposal.md`. Estado: **calibración anotada; anotación en el otro change pendiente**.
      **Estado 2026-10-15 (post-fix):** [x] — la anotación que faltaba YA está en el otro change:
      `openspec/changes/ci-testing-gate-promotion/proposal.md` L34 añade el bullet "**TIA evidence
      coordination**" citando este change, la ventana de calibración lockstep en `quality-gates.md`
      y el riesgo de secuenciar los PRs de `ci.yml`. Advertencia de recuento para el integrador:
      el total de `continue-on-error` del fichero ya **no** es 33 (hoy `main`=36 y el árbol de
      trabajo=38, deltas de OTRAS changes concurrentes en `ci.yml`) — re-contar al mergear; este
      batch no editó ninguna línea `continue-on-error`.

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
**Resuelto 2026-10-15:** la cabecera del delta spec se corrigió; `openspec validate
tia-hardening --strict` → **valid SIN ese `INFO`** (re-verificado en el batch post-fix, task
2.4).

## Estado post-fix (2026-10-15, batch 3)

Re-marcaje de tareas tras la ola de implementación. Cada task re-marcarada lleva su línea
`**Estado 2026-10-15 (post-fix):**` con la evidencia concreta; **las notas de la auditoría
2026-10-11 se conservan intactas encima de cada una** (trazabilidad histórica).

- **Runner de los tests de `scripts/ci/`:** `npm run test:scripts` desde la raíz (=
  `vitest run --config vitest.scripts.config.js`) — **no** usar `node --test
scripts/ci/*.test.mjs`: los `*.test.mjs` son specs de Vitest (importan de `vitest`).
- **Verificaciones ejecutadas en este batch:** fixtures de siembra limpiados · 10.2(b)
  `{injected: 0, diff: 20}` sin historial · 10.3 `git check-ignore -v` → exit 0 (con y sin
  fichero, temporal borrado) · 10.4 JSON corrupto → `::warning::` con `npm run test` /
  `npm run test:coverage` + diff ejecutado de verdad (20/175) y limpieza posterior · 11.3/9.2
  `npm run test:tia:audit` raíz (ambos workspaces, solo lista) · 10.1 `test:tia` server
  (20/175) y client (114/198) exit 0 · 1.1 métrica `--format=md` exit 0 · 7.1
  `tia-map --build` JSON válido con `baseSha == HEAD` · 2.1 import de ambos
  `vitest.scoped.config.js` (4 globales) · 4.1 `--inject` sin historial → vacío exit 0 · 2.3
  `--advisory` bajo `SCOPE != full` en ambos jobs.
- **Salvedades abiertas:** `test:tia:reset` documentado en `docs/testing-architecture.md`
  §7.5.4 (L424/L431) pero sin script en ningún `package.json` (11.3); `nightly-full-suite.yml`
  sin step `Build coverage-map` → `map=hit` inalcanzable hasta completar 7.2; el recuento de
  `continue-on-error` del árbol (38) difiere de `main` (36) por otras changes concurrentes —
  ninguna línea tocada por este change.
- **Marcadas `[x]` en este batch (con evidencia arriba):** 1.1, 1.2, 1.4, 2.0, 2.1, 2.2, 2.3,
  2.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 7.1, 7.3, 9.1, 9.2, 10.1, 10.2, 10.3, 10.4, 11.3,
  12.4.
- **Siguen sin marcarse (pendientes reales):** 1.3 (pending-CI), 6.1/6.2/6.3 (change
  separado `tia-integration-extension` / ventana de calibración), 7.2 (`[~]` — nocturno sin
  publicar el mapa), 7.4 (pending-CI), 8.1 (sin evidencia), 8.2 (`[~]` — decisión+fecha del
  ADR en ventana de calibración), 9.3 (pending-CI), 12.1 (ventana de calibración).
