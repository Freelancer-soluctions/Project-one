# Tasks — smart-test-ordering

Convención: cada tarea es **una invocación de developer** (un script, un step, un fichero) con su
verificación dentro de la misma línea. `[CI]` = track de pipeline, `[LOCAL]` = track de
desarrollador/docs. **Prerrequisitos referenciados, NO duplicados** (change `tia-hardening`, ver
design D1): tasks 4.1/4.2 = producción del artefacto `tia-history-<workspace>`; 4.4 = patrón de
descarga con run-id (`gh api` + `gh run download`); 5.1 = `vitest.sequencer.js` +
`sequence.sequencer` + opt-out `TIA_SEQUENCER=stable` en el nocturno; 5.2 = verificación con fallo
sembrado. Este change se ejecuta **después** de esas tasks. **Fuera de alcance** (no tocar):
`.husky/pre-push` (`pre-push-scoped-testing`), `continue-on-error` y los jobs de test de `ci.yml`
(`ci-testing-gate-promotion`), `apps/client/vitest.config.js`/`package.json`
(`client-snapshot-testing`), `scripts/ci/quarantine-exclude.mjs` y `.github/flaky-quarantine.yml`
(`ci-flaky-quarantine`), `.github/actions/setup-monorepo` (`ci-caching`),
`nightly-full-suite.yml` (solo `tia-hardening` lo edita). Ver `design.md` D1–D7.

## 1. [CI] Historial visible para el sequencer en CI (gap 4 — P2)

- [x] 1.1 Tras mergear la task 4.4 de `tia-hardening`, comprobar dónde deposita su step el JSON
      descargado; si `tia-history.json` no acaba en `node_modules/.cache/tia/tia-history.json`
      (la ruta que lee el sequencer de D7), añadir en ese mismo step la copia best-effort a esa
      ruta — verificación: en un PR con artefacto descargado, `test -f
node_modules/.cache/tia/tia-history.json` antes del step de tests y el log del orden muestra
      los ficheros históricos rojos primero; sin artefacto el step termina 0 y el orden es el
      determinista documentado (job verde).
- [x] 1.2 Medir y dejar por escrito la alternativa de caché: registrar en `design.md` D2 la
      evidencia de si quitar `exclude: node_modules/.cache/vitest` de `setup-monorepo` aportaría
      orden cross-run (duración/validez de la `results.json` por lockfile) y la decisión final de
      no tocar la composite — verificación: la medición queda escrita en D2 y
      `grep -n "exclude: node_modules/.cache/vitest" .github/actions/setup-monorepo/action.yml`
      es idéntico a `main`.

## 2. [CI] Métrica TTFF / first-fail (gap 5 — P3)

- [x] 2.1 Crear `scripts/ci/ttff-metric.mjs` que lea `reports/vitest-results.json` (reporter
      JSON habilitado por la task 1.1 de `tia-hardening`) y
      `node_modules/.cache/tia/tia-history.json` y publique en `$GITHUB_STEP_SUMMARY` (o
      `--format=md` a stdout): TTFF wall-clock (primer test fallido − `startTime` de la corrida),
      % de suite ejecutado hasta el primer fallo (duración de los ficheros previos al primero
      rojo / duración total), % de fallos en el primer X% (X=20 por defecto) e historial hit-rate
      (ficheros rojos presentes en el top-N del historial / ficheros rojos) — siempre exit 0,
      con "sin primer fallo" en corrida verde y `metric=unavailable` si el JSON falta o es
      inválido — verificación: `node scripts/ci/ttff-metric.mjs apps/server --format=md` con
      fixtures (fallo temprano, fallo tardío, sin fallo, JSON corrupto) imprime los valores
      esperados y termina 0 en los cuatro casos.
- [x] 2.2 Cablear el step `Resolve first-failure metric` en `test-unit-client` y
      `test-unit-server` de `.github/workflows/ci.yml`, tras el run de tests, con
      `if: always()` y `|| true` (mismo contrato no-gating del summary TIA de `tia-hardening`
      1.2/4.5, sin editar sus steps) — verificación: `actionlint .github/workflows/ci.yml` pasa
      y el step nuevo no aparece en ningún `needs` condicional.
- [ ] 2.3 Verificar en un PR de prueba con un fallo sembrado que el summary muestra TTFF, % y
      hit-rate, que una corrida verde publica "sin primer fallo" y que un fallo deliberado del
      script no cambia el resultado del job (revertir el fallo) — verificación: capturas del step
      summary en los tres casos + job verde con el script roto a propósito.

## 3. [CI] Degradación flaky-aware del ranking (gap 6 — P3)

- [x] 3.1 Extender `vitest.sequencer.js` (prerequisito: task 5.1 de `tia-hardening` ya mergeda —
      solo añadir, no reescribir) para que el ranking **degrade** (nunca ascienda) los ficheros
      con evidencia de flaky: unión de `.github/flaky-quarantine.yml` (leído, no modificado) y de
      los `retryCount > 0` del último `flaky-retries.json` recuperable de `flaky-evidence-*`
      (descarga best-effort con el patrón de run-id de la task 4.4; ver design D3) — sin datos la
      salida es idéntica al orden de la task 5.1 — verificación: fixture con dos ficheros de igual
      conteo de fallos, uno marcado flaky ⇒ el determinista sale primero en el log; sin evidencia
      flaky la comparación de listas con/sequencer base da el mismo orden exacto; JSON de flaky
      corrupto ⇒ orden base y job verde.
- [x] 3.2 Verificar que la cuarentena no es resucitada por el ranking: un fichero listado en
      `.github/flaky-quarantine.yml` con fallos en el historial sigue quedando fuera del tier PR
      bloqueante (la exclusión ocurre por argv en `quarantine-exclude.mjs`, que no se toca) y el
      ranking no lo promueve cuando sí corre (nightly) — verificación: PR de prueba cuyo diff
      incluye el fichero en cuarentena ⇒ el log de exclusión aparece y
      `git diff main -- scripts/ci/quarantine-exclude.mjs .github/flaky-quarantine.yml` queda
      vacío.

## 4. [CI + LOCAL] Auditoría de order-dependence con shuffle sembrado (gap 7 — P3)

- [x] 4.1 [LOCAL] Dejar documentado y comprobar el comando de auditoría reproducible
      `npx vitest run --sequence.shuffle --sequence.seed=4242` (seed fijado y registrado en docs;
      receta §4.4 del research doc) — verificación: dos corridas locales con la misma seed
      imprimen el mismo orden de ficheros (captura de ambas salidas) y cambiando el seed sale
      otra permutación; el comando no se añade a ningún script de pre-push.
- [x] 4.2 [CI] Crear `.github/workflows/order-dependence-audit.yml` (fichero NUEVO, semanal,
      advisory): matrix de ambos workspaces, `--sequence.shuffle --sequence.seed=4242` con el
      seed en `env`, sin `continue-on-error`, sin `needs` en el agregador ni en required checks;
      fallar = order-dependence detectada, visible pero nunca gating — verificación: `actionlint
.github/workflows/order-dependence-audit.yml` pasa, `grep -n "sequence.shuffle"
.github/workflows/nightly-full-suite.yml` sigue vacío (el nocturno no se toca: corre en
      orden natural con el `TIA_SEQUENCER=stable` de la task 5.1 de `tia-hardening`) y
      `grep -c "continue-on-error" .github/workflows/ci.yml` es idéntico a `main`.
- [x] 4.3 [LOCAL] Dejar escrito el protocolo de triage: un test que falla solo en ciertas
      permutaciones es order-dependente ⇒ arreglarlo, no ordenarlo (y nunca convertir el shuffle
      en comportamiento por defecto del nocturno ni del tier PR) — verificación: el protocolo
      aparece en los docs de orden actualizados en el grupo 6 y `npm run docs:lint` pasa.

## 5. [LOCAL] Paridad de orden local y ventana N (prereq tia-hardening 5.1)

- [x] 5.1 Verificar la paridad local sin tocar el hook: con historial local en
      `node_modules/.cache/tia/tia-history.json` (task 10.3 de `tia-hardening`), un run scoped
      local (`npm run test:tia --workspace=apps/server`) ejecuta el fichero histórico rojo
      primero — mismo contrato que CI, heredado vía `vitest.shared.js` — y el tier pre-push queda
      intacto — verificación: salida del run local con el fichero rojo en cabeza +
      `git diff main -- .husky/pre-push` vacío (la selección del hook no cambia: solo el orden).
- [x] 5.2 Documentar la ventana N de orden (hoy **N=3**, valor producido por `tia-hardening`;
      design D6) y su criterio de tuning: ajustarla solo con evidencia del historial hit-rate de
      la task 2.1 (frescura vs memoria de fallos raros) — verificación: `npm run docs:lint` pasa
      y los docs de orden citan N=3, el hit-rate como métrica de tuning y que sin historial el
      orden degrada a determinista (nunca a aleatorio).

## 6. [LOCAL/docs] Docs desactualizadas (gap 8 — P3, PRs separados — design D7)

- [x] 6.1 Actualizar `docs/ci-cd-pipeline-empresarial.md`: la celda "Smart Test Ordering — NO"
      de la tabla de optimizaciones (~línea 3412) pasa al estado implementado y la regla 21
      (§23.3, ~línea 859) deja de figurar como pendiente, apuntando a
      `docs/learning/smart-test-ordering.md` y a este change — verificación: `npm run
docs:lint` pasa y `grep -n "Smart Test Ordering" docs/ci-cd-pipeline-empresarial.md`
      muestra el estado actualizado.
- [x] 6.2 Actualizar el gap 6 de `docs/learning/test-impact-analysis.md` §5 a "cubierto" con
      puntero a este change — **PR separado y DESPUÉS del PR de la task 11.2 de
      `tia-hardening`** (ambos edits tocan la misma tabla §5; anotar la coordinación) —
      verificación: `npm run docs:lint` pasa, la fila del gap 6 apunta a este change y la nota
      de coordinación con `tia-hardening` queda escrita junto a la fila.
- [x] 6.3 Actualizar `docs/learning/unit-tests-enterprise.md` §2.5 con el estado implementado
      (sequencer con historial, métrica TTFF, auditoría shuffle con seed, degradación flaky) —
      verificación: `npm run docs:lint` pasa y la sección ya no describe el smart ordering como
      futuro.

## 7. Verificación final del change

- [x] 7.1 `openspec validate smart-test-ordering --strict` en verde y `openspec status --change
smart-test-ordering --json` con los 4 artefactos `done` — verificación: salida literal de
      ambos comandos.
- [x] 7.2 Confirmar que ningún safety net cambió:
      `git diff main -- .husky/pre-push` vacío; `grep -c "continue-on-error"
.github/workflows/ci.yml` idéntico a `main`; el nocturno sigue con suite completa sin
      `--changed`, con `TIA_SEQUENCER=stable` (task 5.1 de `tia-hardening`) y sin shuffle;
      `git diff main -- scripts/ci/quarantine-exclude.mjs .github/flaky-quarantine.yml
.github/actions/setup-monorepo/action.yml` vacío; guard D7 de 0 tests intacto —
      verificación: las cinco salidas capturadas tal cual.
- [x] 7.3 Dejar por escrito la secuencia de PRs (design D1/D7): nota en este change citando ambos
      change names — PRs de este change **después** de los de `tia-hardening` (edicionan
      `ci.yml`, `vitest.sequencer.js` y `docs/learning/test-impact-analysis.md` §5) y docs en PR
      aparte — verificación: la nota existe en `design.md` o en este fichero con los nombres
      `tia-hardening`, `ci-testing-gate-promotion`, `client-snapshot-testing` y
      `pre-push-scoped-testing`.

## Estado de implementación (2026-10-13)

Implementado y verificado localmente (no en CI, que este entorno no ejecuta).

**Artefactos entregados:**

- `vitest.sequencer.js` — sequencer fail-first (historial N=3) + degradación flaky/cuarentena +
  shuffle determinista con seed + opt-out `TIA_SEQUENCER=stable`. Cableado en `vitest.shared.js`
  (tasks 3.1/5.1). **Nota de ownership:** esto materializa también el prerrequisito `tia-hardening`
  task 5.1, que su auditoría marcó como **FALSE-DONE** (el fichero no existía). Coordinar el merge
  con `tia-hardening`.
- `scripts/ci/ttff-metric.mjs` (+ `scripts/ci/ttff-metric.test.mjs`) — métrica TTFF / % de suite /
  fallos en el primer X% / hit-rate (task 2.1).
- `scripts/ci/vitest-sequencer.test.mjs` — 25 tests del sequencer.
- `.github/workflows/order-dependence-audit.yml` — auditoría semanal advisory con `SHUFFLE_SEED`
  (task 4.2).- `ci.yml` — step `Resolve first-failure metric` en ambos jobs unit (task 2.2) + step nuevo
  `Restore ordering history (fail-first)` **antes del step de tests** que descarga el artefacto
  `tia-history-<workspace>` a `node_modules/.cache/tia/tia-history.json` (task 1.1).
  **Desviación consciente:** el step `Inject previously-failing tests` de `tia-hardening` corre
  _después_ del run de tests en el fichero actual, así que una copia ahí no podría alimentar el
  orden de la misma corrida; por eso el restore vive en un step propio, aditivo, y el step de
  `tia-hardening` queda **intacto**. Se añade `actions: read` al bloque `permissions` de ambos jobs
  unit (y `GH_TOKEN` al step): sin ese scope el `gh run download` de OTRO run falla y el restore
  sería un no-op silencioso.
- `eslint.config.js` — bloque (3c) con `globals.node` para los configs de Vitest de la raíz.
- Docs: `ci-cd-pipeline-empresarial.md` (celda + regla 21), `test-impact-analysis.md` §5 (gap 6),
  `unit-tests-enterprise.md` §2.5, `smart-test-ordering.md` (§4.1 + §4.6 + status), `design.md` D2.

**Verificación local (comandos y resultado):**

- `npm run test:scripts` → 77 tests verdes (incl. 25 del sequencer y 12 de la métrica).
- Fail-first real: con historial sembrado, `apps/client` ejecuta el fichero históricamente rojo
  primero bajo `CI=true` (`maxWorkers: 1`); sin ese `maxWorkers` el reporter no refleja el orden
  de ejecución (los ficheros corren en paralelo).
- Degradación: con conteos de fallo iguales y un fichero flaky, el determinista sale primero.
- Shuffle: `--sequence.shuffle --sequence.seed=4242` produce la misma permutación en 3 corridas
  seguidas; `--sequence.seed=99` produce otra.
- Opt-out: `TIA_SEQUENCER=stable` no reordena por historial.
- `actionlint` verde en `ci.yml` y en el workflow nuevo; `npm run docs:lint` verde; `npm run lint`
  (ambos workspaces) verde; `openspec validate smart-test-ordering --strict` → _"Change
  'smart-test-ordering' is valid"_; los 4 artefactos `done`.
- Safety nets: `git diff HEAD -- .husky/pre-push scripts/ci/quarantine-exclude.mjs
.github/flaky-quarantine.yml .github/actions/setup-monorepo/action.yml
.github/workflows/nightly-full-suite.yml` vacío; `continue-on-error` en `ci.yml` = 33 = `HEAD`;
  nocturno sin `--changed` y sin `sequence.shuffle`.

**Pendiente-CI (no ejecutable en local):**

- 1.1 — confirmación de que un PR con el artefacto `tia-history-*` descargado deja el historial en
  `node_modules/.cache/tia/tia-history.json` antes del step de tests (el step nuevo lo verifica con
  `test -f` en un PR real; aquí solo se verificó el consumidor con historial sembrado localmente).
- 2.3 — PR de prueba con un fallo sembrado: capturas del step summary en los tres casos (rojo
  temprano, corrida verde, script roto a propósito) + job verde con el script roto.
- 3.2 — PR de prueba cuyo diff incluya un fichero en cuarentena: el log de exclusión aparece y el
  ranking no lo resucita (la exclusión por argv ya está intacta y verificada por diff).

**Secuencia de PRs (design D1/D7 — task 7.3):** los PRs de este change van **después** de los de
`tia-hardening` (comparten `ci.yml`, `vitest.sequencer.js` y `docs/learning/test-impact-analysis.md`
§5). Los diffs aquí son aditivos (steps nuevos, extensión del sequencer). Coordinar además con
`ci-testing-gate-promotion` (`continue-on-error` y jobs de test), `client-snapshot-testing`
(`apps/client/vitest.config.js` y `package.json`) y `pre-push-scoped-testing` (`.husky/pre-push`) —
ninguno se modifica aquí.

**Follow-up detectado (fuera de alcance):** `nightly-server` no hereda `TIA_SEQUENCER=stable`
(solo `nightly-client` lo tiene). Con el sequencer cableado, el nocturno del server corre en orden
**determinista por ruta sin historial** (sin orden histórico impuesto ni shuffle ⇒ cumple el
requirement), pero conviene que `tia-hardening` alinee el env en ese job. `nightly-full-suite.yml`
no se toca aquí (ownership de `tia-hardening`).
