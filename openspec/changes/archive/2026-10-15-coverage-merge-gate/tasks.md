# Tasks

## 1. Habilitación de gaps (no-op con N=1)

- [x] 1.1 Añadir `--reporter=blob` a los scripts `*:ci` de `apps/client/package.json` (`test:coverage:ci`, `test:changed:ci`) y de `apps/server/package.json` (`test:coverage:ci`, `test:changed:ci`, `test:coverage:unit:ci`), verificando que un `npm run test:coverage:ci` local con `CI=true` escribe blobs en `.vitest-reports/` (`blob.json` o `blob-<i>-<n>.json`, según la corrida use `--shard` o no) además del coverage, y que `npm run test:coverage` (tier local, sin `CI`) NO genera `.vitest-reports/` — verificación: inspección de `apps/*/coverage/` y `apps/*/.vitest-reports/`
- [x] 1.2 Cambiar los `actions/upload-artifact` de cobertura en `test-unit-client`/`test-unit-server` de nombre plano a `coverage-<ws>-shard-1` (**literal**: `matrix.shard` aún no existe y su valor indefinido se expandiría como cadena vacía → `coverage-client-shard-`; el cambio a `coverage-<ws>-shard-${{ matrix.shard }}` ocurre en `test-sharding` task 6 al habilitar la matriz). Añadir `path` multilínea que cubra `apps/<ws>/coverage/` **y** `apps/<ws>/.vitest-reports/` (LCA = `apps/<ws>`, rutas relativas intactas en el artifact), `include-hidden-files: true` (`.vitest-reports/` es directorio oculto) y `retention-days: 3` (mitigación del doble cómputo per-shard + merged, design Risks) — verificación: `grep -n "coverage-client-shard\|coverage-server-shard\|include-hidden-files" .github/workflows/ci.yml` muestra los nombres con índice literal, el flag oculto y `retention-days: 3` en ambos uploads
- [x] 1.3 Unificar todos los `actions/download-artifact` de `ci.yml` (coverage/sonar) a `@v7`, alineando con los `upload-artifact@v7` ya dominantes — verificación: `grep -n "download-artifact" .github/workflows/ci.yml` no muestra `@v4`, y `actionlint` no reporta errores de inputs incompatibles (`pattern`, `merge-multiple`, `path`)
- [x] 1.4 Actualizar el `download-artifact` de `server-sonarqube` (hoy `if: false`) para que consuma `coverage-server-shard-*` con `pattern` + `merge-multiple: true` hacia `apps/server/`, evitando una bomba de reactivación por el rename — verificación: `grep -A3 "server-sonarqube" .github/workflows/ci.yml` refleja el patrón nuevo
- [x] 1.5 Actualizar el `download-artifact` de `client-sonarqube` (hoy `if: false`, ci.yml ≈1768-1788, descarga plana `coverage-client`) para consumir `coverage-client-shard-*` con `pattern` + `merge-multiple: true` hacia `apps/client/` — misma justificación que 1.4 (no dejar un consumidor roto por el rename) — verificación: `grep -A4 "client-sonarqube" .github/workflows/ci.yml` refleja `pattern: coverage-client-shard-*` y `merge-multiple: true`

## 2. Puente de cobertura (client)

- [x] 2.1 Cambiar el `if` de `client-coverage` de `github.event_name == 'pull_request'` a `${{ !cancelled() && needs.test-unit-client.result != 'skipped' }}`: el puente corre también cuando `test-unit-client` falle, y se salta sólo cuando el upstream se saltó. Mecánica de propagación de skip: cuando el job en `needs` termina con `result: 'skipped'`, GHA evalúa el `if` del job dependiente y la cláusula `needs.test-unit-client.result != 'skipped'` propaga el skip sin ejecutar el puente — sin esa cláusula, un `if` sólo con `!cancelled()` correría con upstream SKIPPED, la validación de presencia encontraría artifacts legítimamente ausentes y emitiría un falso `::error::` — verificación: `actionlint` pasa y el bloque `if:` contiene ambas cláusulas (`!cancelled()` y `!= 'skipped'`)
- [x] 2.2 Reemplazar la descarga `name: coverage-client` por `pattern: coverage-client-shard-*` + `merge-multiple: true` hacia `apps/client/` (LCA que restaura `.vitest-reports/` y `coverage/` con sus rutas relativas intactas) — verificación: el step usa `pattern`/`merge-multiple` con `path: apps/client/` y `grep -n "name: coverage-client$" ci.yml` ya no existe
- [x] 2.3 Añadir un step de **validación de presencia + guard N=0** antes del merge, con DOS comprobaciones y mensajes `::error::` distintos: (1) **entrada del merge**: `apps/client/.vitest-reports/` existe y no está vacío → `::error::` "vitest blob reports missing — merge cannot proceed"; (2) **entrada del gate**: `apps/client/coverage/coverage-summary.json` existe → `::error::` "coverage artifact missing". La rama de upstream-skip NO llega a este step: se resuelve en el `if` del job (task 2.1, `result != 'skipped'`), de modo que aquí sólo puede llegar la situación "upstream corrió pero artifacts/blobs ausentes" (= `exit 1`). Nunca se llega a mergear ni a evaluar cobertura vacía — verificación: el step ejecuta `test -d apps/client/.vitest-reports/ && [ -n "$(ls -A apps/client/.vitest-reports)" ] || { echo "::error::..."; exit 1; }` seguido de `test -f apps/client/coverage/coverage-summary.json || { echo "::error::..."; exit 1; }`, ambos precediendo al merge, con mensajes distintos
- [x] 2.4 Insertar el step de **merge** `npx vitest --merge-reports --coverage` (SIN `--reporter=blob`: el merge no ejecuta tests y el flag escribiría un blob espurio que puede pisar los blobs merged — ver design, "Nota de plumbing") con `working-directory: apps/client` (la root de config, el dir de blobs `.vitest-reports` — default relativo al cwd — y el `reportsDirectory` de coverage resuelven sin flags extra), tras `setup-monorepo` (que ya da `npm ci`) y entre la validación y `check-coverage.mjs`, regenerando el informe completo — verificación: el orden de steps en `client-coverage` es descarga → validación → merge → `check-coverage.mjs`; el merge declara `working-directory: apps/client`, no contiene `--reporter=blob`, y no corre si la validación falló
- [x] 2.5 Añadir el step **Propagate shard failure** que evalúa `contains(needs.test-unit-client.result, 'failure')` y hace `exit 1` — verificación: el step existe con esa expresión; documentar en un comentario que hoy es no-op por el COE de FASE 1 (`actions/toolkit#581`) y se activará al retirarlo

## 3. Puente de cobertura (server) — espejo del client

- [x] 3.1 Aplicar a `server-coverage` los cambios 2.1-2.5 con los detalles específicos del server: `if` = `${{ !cancelled() && needs.test-unit-server.result != 'skipped' }}`, patrón `coverage-server-shard-*` con descarga hacia `apps/server/`, validación de `apps/server/.vitest-reports/` no vacío (entrada del merge) + `apps/server/tests/coverage/coverage-summary.json` (entrada del gate) con mensajes `::error::` distintos, merge `npx vitest --merge-reports --coverage` con `working-directory: apps/server` (el dir de blobs `.vitest-reports` resuelve bajo la root del server), `check-coverage.mjs apps/server apps/server/tests/coverage` tras el merge, y `needs: [test-unit-server]` — verificación: `server-coverage` replica la secuencia descarga por patrón → validación presencia (blobs + summary) → merge post-`setup-monorepo` → `check-coverage.mjs` → propagación, y `actionlint` pasa
- [x] 3.2 Verificar que ambos puentes conservan la lógica D18 (`tia-scope.txt` → `full` bloqueante, `changed` → `--advisory` + `exit 0`) y el reporte de `TIA scope` en el step summary — verificación: el bloque `Enforce coverage thresholds` en ambos jobs mantiene el if/else de scope con `--advisory` en el carril diff-scoped

## 4. Validación y verificación transversal

- [x] 4.1 Ejecutar `npx actionlint .github/workflows/ci.yml` y confirmar 0 errores (expresiones `if:`, inputs de `download-artifact@v7`, `needs` de los puentes declarados correctamente) — verificación: salida de actionlint sin errores nuevos
- [x] 4.2 Confirmar que `prebuild-unit-tests-complete.needs` sigue siendo exactamente los 6 job ids y que ningún nombre de job ni required check cambió — verificación: `grep -n "prebuild-unit-tests-complete" -A8 .github/workflows/ci.yml` muestra el mismo set de 6 ids; el job id `client-coverage`/`server-coverage` y sus `name:` display no cambiaron
- [x] 4.3 Verificar paridad local ↔ CI del gate: `npm run coverage:check` en la raíz usa el mismo `check-coverage.mjs` y los mismos thresholds del `vitest.config.js` que el puente post-merge — verificación: ejecución local de `coverage:check` y lectura del step del workflow coinciden en script y argumentos
- [ ] 4.4 Abrir un PR de validación y confirmar en el run real que `client-coverage`/`server-coverage` terminan verdes con N=1 (la descarga por patrón captura el único artifact `coverage-<ws>-shard-1`, `.vitest-reports/` viaja en el artifact y el merge regenera `coverage-summary.json`), y que ningún `::error::` de artifacts/blobs ausentes se emite — verificación: inspección del log del PR + estado de los checks

## 5. Coordinación y documentación

- [x] 5.1 Actualizar `docs/learning/coverage-merge-gate.md` §7 (estado/gaps) para marcar los gaps a/b/c/d como cerrados y reflejar la decisión D1 (puente = coverage job existente, no job nuevo), manteniendo la trazabilidad con `quality-gates` (gap e, FASE 2) y `test-sharding` (matriz N=2, task 6) como follow-ups — verificación: el doc ya no lista a/b/c/d como gaps abiertos y anota su cierre con fecha
- [x] 5.2 Verificar/actualizar la fila de `coverage` en `docs/learning/quality-gates.md` para que describa el gate como post-merge (patrón de shard) conservando el estado FASE 1 advisory — verificación: la fila del job `coverage` menciona el merge post-shard y sigue marcando `continue-on-error: true`
- [x] 5.3 Confirmar en `docs/learning/test-sharding.md` §5 que la tarea 1 (Coverage Merge Gate) queda satisfecha por este change, dejando las tareas 3-5 (matriz N=2) como dependientes — verificación: la tabla de tareas refleja 1 = completada/satisfecha y el prerrequisito duro antes de la matriz

---

## Registro de verificación (2026-10-13)

Todo lo siguiente se ejecutó en este entorno. Lo que exige un run real de GitHub Actions queda
marcado como pendiente-CI, nunca como verde.

**1.1 — Blob reporter solo en CI (ejecutado localmente en AMBOS workspaces).**

- Server: `CI=true npm run test:coverage:ci --workspace=apps/server` escribe
  `apps/server/.vitest-reports/blob.json` **y** `apps/server/tests/coverage/coverage-summary.json`.
- Client: ídem — `apps/client/.vitest-reports/blob.json` y `apps/client/coverage/coverage-summary.json`,
  con la suite completa en verde (113 ficheros / 196 tests, `exit 0`) y `npm run test:coverage`
  (sin `CI`) **sin** crear `.vitest-reports/`. El server local sí sale `exit 1`, pero por el gap de
  cobertura pre-existente documentado abajo, no por este flag (aislado con el argv baseline exacto).
- Con `--shard=k/N` el nombre esperado del blob es `blob-<index>-<count>.json` (Vitest 4.1.11).

**1.2-1.5 — Greps de nombres, ocultos, retención y majors.**
`grep` muestra `coverage-client-shard-1` (L954) y `coverage-server-shard-1` (L1186) ambos con
`include-hidden-files: true` y `retention-days: 3`; los **7** `download-artifact` están en `@v7`
(0 restos de `@v4`); `server-sonarqube` y `client-sonarqube` consumen `pattern:
coverage-<ws>-shard-*` + `merge-multiple: true` hacia `apps/<ws>/`. Compatibilidad de inputs
verificada en el `action.yml` del tag `v7` de `actions/download-artifact`: `name`, `path`,
`pattern`, `merge-multiple`, `github-token`. `@v4` además emitía ya el warning de deprecación de
Node 20 en los runs reales (reason del gap c).

**2.x / 3.x — Puentes.** Ambos `if:` contienen las dos cláusulas (`!cancelled()` y
`!= 'skipped'`); el orden de steps es descarga por patrón → `Validate shard artifacts (merge gate,
N=0 guard)` → `Merge shard reports (vitest --merge-reports --coverage)` →
`Enforce coverage thresholds (full suite only, D18)` → `Propagate shard failure`. Los dos
`::error::` de validación son distintos (blobs vs summary). El merge no contiene `--reporter=blob`
y declara `working-directory: apps/client` / `apps/server`. `contains(needs.test-unit-<ws>.result,
'failure')` presente en ambos.

**Ejecución real del merge (N=1, en local — la verificación más importante de este change).**

- `vitest --merge-reports --coverage` con `working-directory: apps/server` sobre los blobs de una
  corrida CI **regenera `coverage-summary.json` idéntico**: statements 42,28 → 42,28 · branches
  21,75 → 21,75 · functions 8,98 → 8,98 · lines 42,76 → 42,76 · ficheros 2544 → 2544. **N=1 es un
  no-op observable**, como exige D3.
- Borrando `apps/server/tests/coverage/` **antes** del merge, el summary se **regenera desde los
  blobs** (51988 bytes). Esto prueba que el merge reconstruye la cobertura a partir de los blobs y
  no "re-valida" el artifact descargado — es lo que garantiza que con N shards el gate evalúe la
  **unión**.
- **Sin blobs, el merge lanza `ENOENT scandir .vitest-reports`** (exit 1 con stack de Vitest).
  Confirma por qué la validación de 2.3 debe ir ANTES del merge (D4): sin ella, el puente moriría
  con un ENOENT críptico en vez del `::error::` accionable.

**4.1 / 4.2 — Verificaciones transversales.**
`actionlint .github/workflows/ci.yml` ⇒ **exit 0**. `prebuild-unit-tests-complete.needs` ⇒
exactamente **6** ids (`test-unit-client`, `test-unit-server`, `test-integration`, `test-smoke`,
`client-coverage`, `server-coverage`); ni job ids ni `name:` display cambiaron, así que ningún
required check necesita renombrado. `grep -c "name: coverage-client$"` ⇒ 0 (el nombre plano
desapareció de las descargas).

**4.3 — Paridad local ↔ CI del gate.**
`npm run coverage:check` (raíz) ejecuta `scripts/ci/coverage-check.mjs`, que (a) corre
`npm run test:coverage --workspace=apps/<ws>` — el tier local, **sin** mis cambios — y (b)
**delega en `scripts/ci/check-coverage.mjs`** (spawnSync, línea 92) con
`apps/<ws> <coverageDir>`. Es el mismo guard y los mismos thresholds que invoca el workflow
(`check-coverage.mjs apps/client` y `check-coverage.mjs apps/server apps/server/tests/coverage`;
la única diferencia es que el workflow omite el reports-dir de client, que el script resuelve por
defecto a `<workspace>/coverage`). Paridad confirmada.

**Observación pre-existente, NO causada por este change (documentada para que no se confunda con
una regresión del puente).** La suite completa de server en local da statements 42,28% / branches
21,75% / functions 8,98% / lines 42,76% contra thresholds de 60,8 / 64,48 / 64,81 / 61,49 ⇒
`vitest` sale con exit 1. Se aisló la causa ejecutando el argv **exacto** previo a este change
(mismo `vitest run --coverage ...` **sin** `--reporter=blob`): mismos números, mismo exit 1, y sin
`.vitest-reports/`. El tier local `coverage:check` también falla (mínimos por fichero de client).
En CI los puentes salieron verdes en las últimas corridas porque el scope TIA fue `changed` y D18
difiere el umbral en modo `--advisory` — no porque la cobertura sea suficiente. Si la noche o un
run `shared` evalúa el carril `full`, ese gap de cobertura **ya estaba latente** y no tiene relación
con el merge gate.

**4.4 — pendiente-CI (única tarea no ejecutada).** Requiere un run real de GitHub Actions con los
jobs de coverage, lo que exige publicar la rama. No se ejecutó por decisión del usuario (sin
commits ni pushes). El resto del contrato está verificado localmente, incluida la ejecución real
del merge.
