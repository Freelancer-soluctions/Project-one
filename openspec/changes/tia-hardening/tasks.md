# Tasks — tia-hardening

Convención: cada tarea es **una invocación de developer** (un script, un step, un fichero) con su
verificación dentro de la misma línea. `[CI]` = track de pipeline, `[LOCAL]` = track normal/estándar
del desarrollador. Orden por prioridad del §5 del research doc: medir → quick win de cobertura →
evidencia → inyección → fail-first → tiers → mapa → remote cache. **Fuera de alcance** (no tocar):
`.husky/pre-push` y cualquier `continue-on-error` — pertenecen a `pre-push-scoped-testing` y a
`ci-testing-gate-promotion` respectivamente. Ver `design.md` D1–D11.

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
- [ ] 1.2 Cablear el step **Resolve TIA shadow metric** en `test-unit-client` y `test-unit-server`
      de `.github/workflows/ci.yml` tras el run de tests, con `if: always()` y sin `exit 1`
      posible desde el script — verificación: `actionlint .github/workflows/ci.yml` pasa y el step
      no aparece en ningún `needs` condicional que pueda bloquear.
- [ ] 1.3 Verificar en un PR de prueba que el summary muestra `N/T = %`, `K ficheros`,
      `scope=changed|full` y que un fallo deliberado del script no cambia el resultado del job
      (revertir el fallo) — verificación: captura del step summary + job verde con el script roto
      a propósito (`|| true` efectivo).
- [ ] 1.4 Medir la duración del step nuevo y anotarla en `design.md` (si supera ~5 s, sustituir la
      invocación de `vitest list` por lectura del diff ya resuelto) — verificación: segundos
      registrados en la tabla de migración/verificación del change.

## 2. [CI] `coverage.changed` en corridas diff-scoped (gap 1 — P1)

- [ ] 2.0 Añadir el flag `--advisory` a `scripts/ci/check-coverage.mjs` (hoy solo acepta
      `<workspace> [coverageDir]` y devuelve exit 1 bajo thresholds): con `--advisory` imprime los
      números vs thresholds con un prefijo de log distinto (`[advisory]` / `::notice::`, filtrable
      en el step summary) y termina **siempre** con exit 0, dejando intacto el modo estricto por
      defecto (D18) — verificación: test unitario del script con un fixture
      `coverage-summary.json` bajo threshold que aserta exit 0 + prefijo con `--advisory` y exit 1
      sin él, más la ejecución manual `node scripts/ci/check-coverage.mjs apps/client --advisory`
      con exit 0 en local.
- [ ] 2.1 Añadir `--coverage.changed=origin/main` a `test:changed:ci` en
      `apps/client/package.json` y en `apps/server/package.json` — verificación:
      `npm run test:changed:ci --workspace=apps/client` genera `coverage/coverage-summary.json`
      con solo los ficheros tocados (`git diff --name-only origin/main...HEAD` ⊆ claves del JSON).
- [ ] 2.2 Invocar `node scripts/ci/check-coverage.mjs <workspace> --advisory` (flag creado en la
      task 2.0 — el script no admite hoy otro modo que no sea el estricto) en los jobs
      `client-coverage` / `server-coverage` cuando `tia-scope.txt != full` (rama que hoy hace
      `exit 0` silencioso) — verificación: en un PR diff-scoped el job publica el % diff-limited
      como `::notice::`/warning con el prefijo `[advisory]` y sale 0; un PR `shared` sigue
      exigiendo thresholds reales (sin `--advisory`, exit 1 bajo threshold).
- [ ] 2.3 Confirmar con `openspec show ci-test-impact-analysis --type spec` tras archivar que el
      requirement modificado describe exactamente el flag y el modo advisory (sin huellas de D18
      rotas) — verificación: diff de la spec y salida de `openspec validate tia-hardening --strict`.

## 3. [CI] Ventana de calibración y reparto FASE 1 → FASE 2 (gap 8 — P3)

- [ ] 3.1 Reutilizar la ventana de calibración **ya abierta** por `ci-testing-gate-promotion`
      (task 1.1 de ese change): ambos editan `docs/learning/quality-gates.md` y
      `.github/workflows/ci.yml`, así que NO se abre una segunda ventana de 2 semanas — añadir en
      esa misma sección la subsección "Calibración TIA (shadow metric)" con las columnas a rellenar
      (% medio seleccionado, inyectados, `map=hit/miss`, fallbacks D7, duración de job) —
      verificación: la subsección existe, `npm run docs:lint` pasa y su fecha de apertura coincide
      con la ventana de ese change.
- [ ] 3.2 Dejar por escrito el reparto de propiedad (design D8): una nota en esa sección indicando
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
- [ ] 4.2 Publicar el historial: step `Record TIA history` (solo `scope=full` o nightly) +
      `actions/upload-artifact` `tia-history-<workspace>` (retención 30 días) en
      `.github/workflows/ci.yml` y `.github/workflows/nightly-full-suite.yml` — verificación: un run
      nocturno produce el artefacto y un run diff-scoped no intenta subirlo.
- [ ] 4.3 Consumirlo en **selección de dos fases**: step `Inject previously-failing tests` en los
      jobs unit que (a) descarga `tia-history-<workspace>` resolviendo el run-id con
      `gh api .../actions/workflows/nightly-full-suite.yml/runs` + `gh run download` (patrón de
      `flaky-weekly.yml`; `actions/download-artifact` solo lee el run actual y `restore-keys` es de
      `actions/cache`, no de los artefactos), best-effort, dejando la lista inyectada para el paso
      (b); y (b) `test:changed:ci` invoca `node scripts/ci/tia-select.mjs` (lector único, D5):
      fase 1 = `vitest list --changed --filesOnly` ∪ ficheros de `tia-history.mjs <ws> --inject`,
      fase 2 = spawn de vitest con la **lista explícita** más el argv original (reporters,
      `--coverage`, `--coverage.changed` y los `--exclude` de cuarentena que CI entrega con
      `npm run ... -- <args>`), conservando D7 si la unión queda vacía. **Nunca** concatenar argv a
      `test:changed:ci`: Vitest 4 intersecta los posicionales con `--changed` y descartaría los
      inyectados (a menudo anulando la selección → D7 full-suite), y `$(...)` no funciona en npm
      scripts bajo cmd.exe (D11); registrando `diff=N` e `injected=M` para la métrica —
      verificación: PR de prueba con un test rojo sembrado en `main` lo ejecuta aunque el diff no
      lo toque (el log muestra la lista explícita que lo incluye); sin artefacto el mismo PR pasa
      con la selección diff pura.
- [ ] 4.4 Añadir la columna "inyectados" a la tabla del step summary (task 1.1) — verificación:
      el summary distingue `diff=N` e `injected=M` en el PR anterior.

## 5. [CI + LOCAL] Fail-first / smart ordering (gap 6 — P3)

- [ ] 5.1 Implementar un sequencer (`vitest.sequencer.js` + `sequence.sequencer` en la config
      shared) que ordene por frecuencia de fallo en `node_modules/.cache/tia/tia-history.json` y,
      sin historial, por ruta estable; con **opt-out explícito para el nightly** (env
      `TIA_SEQUENCER=stable` fijado en `.github/workflows/nightly-full-suite.yml`, o gate en la
      config — la config shared `sequence.sequencer` ordenaría también el nocturno, contradiciendo
      D7 y arriesgando enmascarar order-dependence) — verificación: dos corridas seguidas sin
      historial producen el mismo orden de ficheros y el nº de tests es idéntico al de hoy, y el
      log del nocturno confirma que corre sin el sequencer TIA.
- [ ] 5.2 Verificar con un fallo sembrado que el fichero históricamente rojo aparece primero en
      el log y que la selección no cambia respecto del task 1.1 — verificación: salida de
      `npm run test:tia --workspace=apps/server` con el fallo sembrado + comparación de la lista de
      ficheros ejecutados con y sin sequencer.

## 6. [CI] Extensión del contrato a integration (y e2e) (gap 5 — P3)

- [ ] 6.1 Añadir el step `Resolve TIA scope` + `tia-scope.txt` propio y la rama
      `test:integration:changed` (`.integration.test.js --changed origin/main`) con guard D7 en el
      job `test-integration` de `ci.yml` — verificación: PR que solo toca `events/` ejecuta un
      subconjunto y publica `scope=changed`; PR `shared` ejecuta la suite completa de integration.
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
- [ ] 7.2 Publicarlo desde los runs full-suite (`scope=full` y nocturno) como artefacto
      `coverage-map-<workspace>-<baseSha>` — verificación: el artefacto aparece en el run y su
      nombre contiene el sha; los diff-scoped no lo suben.
- [ ] 7.3 Consumirlo en los jobs unit resolviendo el run-id que publica
      `coverage-map-<workspace>-<baseSha>` con `gh api .../actions/workflows/<full-suite>/runs` +
      `gh run download` (patrón de `flaky-weekly.yml` — `actions/download-artifact` solo lee el
      run actual sin `run-id` y `restore-keys` pertenece a `actions/cache`, no a los artefactos),
      best-effort + validación del `baseSha` interno: `hit` → la selección parte del mapa;
      `miss`/corrupto → grafo estático + `::notice:: map=miss` en la métrica — verificación: PR
      sin artefacto coincide ⇒ `map=miss` y job verde; con artefacto ⇒ `map=hit` y misma selección
      que D7 garantiza.
- [ ] 7.4 Verificación cruzada de safety: borrar el mapa a mitad de run y confirmar que D7 sigue
      activo (0 tests ⇒ full) — verificación: log con el warning de D7 y `scope=full` escrito.

## 8. [CI] Remote cache build+test (gap 7 — P3, ADR)

- [ ] 8.1 Declarar inputs/outputs consistentes de hash (lockfile, manifests, configs de
      Vitest/ESLint/dependency-cruiser, workflows, env) para build y test en la raíz del repo —
      verificación: `npm run depcruise:ci` y `npm run build` pasan con las configs declaradas, y la
      lista de inputs queda escrita en el ADR.
- [ ] 8.2 Actualizar `docs/adr/turborepo-evaluation.md` con la evidencia (métrica shadow de la
      ventana, % re-ejecutado hoy, inputs ya alineados) y registrar la decisión
      **adoptar / no adoptar** `--affected` + remote cache — verificación: el ADR pasa
      `npm run docs:lint` y su Status deja de decir `Proposed` con la decisión y la fecha.

## 9. [LOCAL] Auditoría de selección on-demand (`local-tia-workflow`)

- [ ] 9.1 Añadir `test:tia:audit` a `apps/client/package.json` y `apps/server/package.json`
      (`vitest list --changed origin/main --filesOnly` con el filtro unit del workspace) —
      verificación: `npm run test:tia:audit --workspace=apps/server` lista ficheros y no ejecuta
      tests (exit 0, salida sin resultados de test).
- [ ] 9.2 Exponer `test:tia:audit` en la raíz (`--workspaces --if-present`) y comprobar el caso
      sin base: `git update-ref -d refs/remotes/origin/main` en una rama de prueba → mensaje
      "git fetch origin main" y exit ≠ 0 — verificación: ambos comandos ejecutados y salida
      capturada; restaurar la ref después.
- [ ] 9.3 Comparar la auditoría con lo que corre CI en un PR (ficheros del step summary vs
      `test:tia:audit`) — verificación: la lista local es un subconjunto igual o igual a la de CI,
      y la diferencia queda anotada en la tarea 12.1.

## 10. [LOCAL] Scoped run estándar + estado persistente local

- [ ] 10.1 Añadir `test:tia` a ambos workspaces (mismo diff base y filtro unit que CI +
      `--coverage.changed=origin/main`) y a la raíz — verificación:
      `npm run test:tia --workspace=apps/client` ejecuta el subconjunto y su
      `coverage/coverage-summary.json` solo contiene ficheros del diff.
- [ ] 10.2 Inyectar historial local en `test:tia` por la **misma selección en dos fases** del
      wrapper `node scripts/ci/tia-select.mjs` (fase 1 = `vitest list --changed --filesOnly` ∪
      ficheros de `tia-history.mjs <ws> --inject`, que lee `node_modules/.cache/tia/tia-history.json`
      escrito por la tarea 10.3; fase 2 = spawn de vitest con la lista explícita más el argv
      original). Sin concatenar argv a `test:tia` ni usar `$(...)`: falla bajo cmd.exe (D11) y los
      inyectados quedarían fuera por la intersección positional ∩ `--changed` de Vitest 4 —
      verificación: con un historial sembrado el test inyectado corre (el log muestra la lista
      explícita que lo incluye); sin historial la salida es la selección pura del diff.
- [ ] 10.3 Persistir el estado: `test:tia` escribe cache/historial en `node_modules/.cache/tia/`
      y verificar que git lo ignora — verificación:
      `git check-ignore node_modules/.cache/tia/tia-history.json` sale 0 y `git status` no lo
      muestra; segunda corrida reutiliza el fichero (mtime anterior intacto).
- [ ] 10.4 Recuperación ante estado corrupto: sembrar un JSON inválido y confirmar que la
      selección cae al grafo estático y que el mensaje aconseja `npm run test` /
      `npm run test:coverage` — verificación: salida del comando con el historial corrupto y exit 0
      (nunca verde vacío).

## 11. [LOCAL] Documentación y checklist de uso diario

- [ ] 11.1 Extender `docs/testing-architecture.md` §7.5 con el workflow estándar (audit →
      `test:tia` → cuándo full local → paridad local↔CI → cómo leer el % del step summary) y su
      checklist pre-PR — verificación: `npm run docs:lint` pasa y la sección contiene
      `test:tia:audit`, `test:tia` y el trigger de rutas shared.
- [ ] 11.2 Actualizar `docs/learning/test-impact-analysis.md` §4.3/§5 con los comandos ya
      implementados (gap marcado como cubierto, estado "implementado en
      `openspec/changes/tia-hardening`") — verificación: `npm run docs:lint` pasa y cada gap de la
      tabla §5 apunta a su task group.
- [ ] 11.3 Comprobación de paridad de recetas: ejecutar literalmente cada comando documentado en
      §7.5 y confirmar que existe en algún `package.json` — verificación: salida de
      `npm run test:tia:audit` y `npm run test:tia` desde la raíz sin errores de script inexistente.

## 12. Verificación final del change

- [ ] 12.1 Recopilar la evidencia de la ventana (selección %, inyectados, `map=hit/miss`, D7
      fallbacks, duraciones de integration scoped/full) y cerrar la subsección de `quality-gates.md`
      abierta en 3.1 — verificación: la tabla tiene al menos 2 semanas de runs reales rellenos.
- [ ] 12.2 `openspec validate tia-hardening --strict` en verde y `openspec status --change
    tia-hardening --json` con los 4 artefactos `done` — verificación: salida literal de ambos
      comandos.
- [ ] 12.3 Revisar que ningún safety net cambió: `grep -c "continue-on-error" .github/workflows/ci.yml`
      idéntico a `main`, `.husky/pre-push` sin diff, el nocturno sigue corriendo suite completa
      (sus `run:` de test intactos, sin `--changed`) y con el opt-out del sequencer TIA de la task
      5.1 — verificación: `git diff main -- .husky/pre-push` vacío (el único diff permitido en
      `.github/workflows/nightly-full-suite.yml` es el step `Record TIA history` de la task 4.2 y
      `TIA_SEQUENCER=stable`), `grep -n "TIA_SEQUENCER" .github/workflows/nightly-full-suite.yml`
      encuentra el opt-out, y el conteo de `continue-on-error` anotado.
- [ ] 12.4 Confirmar la coordinación: anotar en el change `ci-testing-gate-promotion` (nota en su
      `proposal.md` o en `quality-gates.md`) que la evidencia TIA de este change alimenta su grupo
      de promoción **y registrar el riesgo de conflicto** — ambos changes editan
      `docs/learning/quality-gates.md` (una sola ventana de calibración, task 3.1) y
      `.github/workflows/ci.yml` (steps advisory de este change vs. quitar `continue-on-error` del
      otro), así que hay que secuenciar los PRs o resolver el merge — verificación: la nota existe,
      el riesgo de conflicto queda escrito por ambos nombres de change, y ninguna línea
      `continue-on-error` fue editada por este change.
