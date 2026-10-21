# Design

## Context

Estado verificado del repo (auditoría 2026-10-06, confirmada 2026-10-13):

- `.github/workflows/ci.yml` tiene **0 matrix / 0 `--shard`**: todos los jobs de test son single-runner. `test-unit-client` ≈ 2m20s y `test-unit-server` ≈ 4s en CI — por debajo del umbral 5-8 min de sharding, así que la matriz N=2 queda **dormida** (ver `test-sharding` §5.1: G2 = N/A).
- `client-coverage`/`server-coverage` ya son **mini-gates** post-artifact: descargan un artifact de nombre plano (`coverage-client`/`coverage-server`), exigen `coverage-summary.json` (error `coverage artifact missing`), leen `tia-scope.txt` y aplican D18 (`full` → `check-coverage.mjs` bloqueante; `changed` → `--advisory` + `exit 0`). Ambos con `continue-on-error: true` (**FASE 1 advisory**, change `coverage-tripwire-stage-2d`).
- Stack de tests: Vitest `^4.1.11`, provider `v8`, reporters `['text','json-summary','html']` en `vitest.shared.js`. **No hay `blob` reporter** configurado → `--shard` sería inoperante hoy.
- Verificado con Vitest `4.1.11` instalado: el reporter `blob` escribe blobs en `<root>/.vitest-reports/blob-<index>-<count>.json` y el default de `--merge-reports` es `.vitest-reports` relativo al cwd (`readBlobs` lanza con el directorio vacío). La ruta `.vitest/blob/*.blob` del doc fuente es de la era Vitest 3 y está desactualizada — todo el plumbing de este change usa `.vitest-reports/` + `*.json`.
- Gate ejecutable único: `scripts/ci/check-coverage.mjs` (lee thresholds del `vitest.config.js` como single source of truth), invocado por CI y por `npm run coverage:check`.
- Majors mezclados: `upload-artifact@v7` (jobs de test) vs `download-artifact@v4` (coverage/sonar).
- Sin Codecov/Coveralls/SonarQube activos (`client-sonarqube`/`server-sonarqube` en `if: false`).
- Contrato del agregador: `prebuild-unit-tests-complete.needs` = exactamente 6 job ids (`test-unit-client`, `test-unit-server`, `test-integration`, `test-smoke`, `client-coverage`, `server-coverage`). Este número **no cambia** en este change.

Restricciones de coordinación (no duplicar ownership):

- `ci-test-sharding` req. 2 y §5 tarea 1: el merge gate es **prerequisito declarado** antes de habilitar matriz. Este change lo satisface.
- `coverage-tripwire-floor-ratchet` §6.4 y D18: el ratchet (`coverage:ratchet`) sólo puede medir **post-merge**; sin merge mide un parcial y **bajaría el piso**.
- `tia-hardening` es dueño de `sequence.sequencer` y de la selección D7: **intacto**.
- `quality-gates` es dueño de FASE 1 → FASE 2 (retirar `continue-on-error`): **intacto**.

## Goals / Non-Goals

**Goals:**

- Convertir `client-coverage`/`server-coverage` en **puentes de nombre fijo** operativos con N=1 (hoy) y N>1 (futuro), sin cambiar el contrato de 6 `needs` ni los nombres de job/required check.
- Hacer que el orden canónico `shard → merge → check-coverage` sea estructural: validación de presencia antes de medir, merge con `--merge-reports --coverage`, y sólo entonces `check-coverage.mjs`.
- Cerrar los gaps a/b/c del doc (blob condicional a CI, índice de shard en el nombre de artifact, unificación de majors) que son los habilitadores mecánicos de la matriz futura.
- Guard N=0 explícito: distinguir "shard ausente" (error) de "matriz desactivada" (skip/fallo explícito), nunca verde con cobertura 0%.

**Non-Goals:**

- Habilitar la matriz N=2 (task 6 de `test-sharding`, requiere además el umbral de duración ya medido como N/A).
- Retirar `continue-on-error` de los 4 jobs (FASE 1 → FASE 2, propiedad de `quality-gates`).
- Diff-coverage / Codecov / Coveralls / SonarQube (P3, sin SaaS activo).
- Tocar `sequence.sequencer`, la selección TIA D7 o la lógica de cuarentena (propiedad de `tia-hardening`).
- Modificar `scripts/ci/check-coverage.mjs` (se invoca igual, sin cambio de API).

## Decisions

### D1 — Reusar `client-coverage`/`server-coverage` como el puente, no crear jobs nuevos

El doc §5.1 muestra un job `coverage-merge-gate` genérico; aquí el puente **es** el coverage job existente ya re-emitido con nombre fijo. Rationale: el contrato de 6 `needs` de `prebuild-unit-tests-complete` incluye `client-coverage`/`server-coverage`, y `ci-test-sharding` req. 4 prohíbe cambiar ese conjunto al habilitar matriz. Crear un job puente _adicional_ obligaría a o bien cambiar el agregador (rompiendo el contrato de 6) o bien dejar un job huérfano fuera de `needs`. Alternativa descartada: job `test-unit-client-merge` separado — más fiel a la receta genérica pero introduce un 7º eslabón que nadie en `needs` consume y que duplicaría el `--merge-reports` que el coverage job ya necesita para medir. Con N=1 el comportamiento es idéntico al actual (descarga un artifact), así que la migración es no-op observable hoy y sólo "se activa" al aparecer la matriz.

### D2 — `if: ${{ !cancelled() }}` en el puente, no `always()`

`always()` también corre tras una cancelación de workflow y dejaría un runner gastando minutos en un run que el usuario descartó; `!cancelled()` cubre el caso real (shard en `failure` → el `success()` default se saltaría el gate justo cuando el informe importa) sin el costo de `always()`. La receta del doc §5.1 usa `!cancelled()` explícitamente; la de `test-sharding` §4.3 usa `always()` para el puente de junit. Elegimos `!cancelled()` para el puente de coverage porque el junit-merge (sharding) es un concern distinto que no gestionamos aquí.

### D3 — Descarga por patrón + `merge-multiple: true`, con N=1 como caso degenerado

`pattern: coverage-<ws>-shard-*` + `merge-multiple: true` hacia `apps/<ws>/` colapsa los N artifacts de shard restaurando la estructura original: `apps/<ws>/.vitest-reports/` (blobs) y `apps/<ws>/coverage/` — el upload de shard usa `path` multilínea con LCA `apps/<ws>` para que esas rutas relativas se conserven en el artifact. Con N=1 el patrón captura el único artifact, de modo que **no hay rama condicional** que diverja entre single-runner y matriz — el mismo camino sirve ambos, lo que elimina la clase de bugs "probado sólo con N=1". El índice de shard en el nombre (`shard-${{ matrix.shard }}`) es obligatorio porque `upload-artifact@v4+` es inmutable: dos shards subiendo `coverage-client` simultáneamente → sólo gana una y la otra se pierde en silencio (anti-patrón #9). Nota (plumbing): los directorios `coverage/` per-shard colisionan bajo `merge-multiple: true` (todos se restauran como `apps/<ws>/coverage/`), pero es **inofensivo**: el merge regenera la coverage completa desde los blobs de `.vitest-reports/` (únicos por shard); intentar preservar la coverage per-shard sería el anti-patrón #3 (tratar un parcial como fuente de verdad).

### D4 — Validación de presencia ANTES del merge, con guard N=0 separado

Dos verificaciones distintas, en este orden:

1. **Presencia por constructo**: tras la descarga, `test -f <dir>/coverage-summary.json || exit 1` (o equivalente por shard si en el futuro el merge exige blobs individuales). Un artifact ausente = error, nunca 0%.
2. **Guard N=0**: si la matriz colapsa (TIA `changed` → N=1 efectivo, o el job de tests no corrió), el patrón no matchea nada. En vez de mergear vacío, el puente detecta 0 artifacts y falla con mensaje explícito ("no coverage shards produced — matrix collapsed or test job skipped"). Esto generaliza el mismo guard que hoy ya distingue `full` vs `changed` vía `tia-scope.txt`.

Rationale: el anti-patrón #5 del doc es exactamente "shard vacía / artifact ausente evaluado como real". Validar _antes_ de invocar Vitest evita un merge corrupto costoso y un `check-coverage` sobre datos falsos.

### D5 — Blob reporter condicionado a CI por flag en scripts, no por config duplicada

Dos formas posibles: (a) añadir `'blob'` al array `coverage.reporter` de `vitest.shared.js` condicional a `process.env.CI`, o (b) añadir `--reporter=blob` a los scripts `*:ci` de `apps/*/package.json`. Elegimos **(b)** porque:

- No toca `vitest.shared.js` (que comparten local + CI + nightly + auditorías) — el flag vive sólo en los scripts que CI ya invoca (`test:coverage:ci`, `test:changed:ci`).
- `--reporter` de CLI afecta a los **test reporters**, no a `coverage.reporter`; el array `['text','json-summary','html']` de `vitest.shared.js` queda intacto, así que los reportes de coverage (incluido `json-summary`, la entrada del gate) siguen disponibles post-merge.
- El tier local queda intacto por construcción (los scripts `*:ci` no se usan localmente).

Alternativa descartada: (a) condicional por `process.env.CI` en la config — funciona pero mezcla concerns de CI en un config compartido y es más difícil de auditar.

### Nota de plumbing — `--reporter=blob` no va en el paso de merge

El paso de merge del puente (`vitest --merge-reports --coverage`) se invoca **sin** `--reporter=blob`: el merge no ejecuta tests, así que el flag sólo instruiría a Vitest a emitir un blob adicional espurio (que puede pisar los blobs merged) sin aportar nada — `--merge-reports` ya lee `.vitest-reports/` directamente. Ajuste de plumbing, no un cambio de D1-D7.

### D6 — Unificar a `upload-artifact@v7` / `download-artifact@v7`

El workflow ya sube con `@v7` en todos los jobs de test; sólo los `download-artifact` (coverage/sonar) quedan en `@v4`. Alinear **ambos** a `@v7` (el mayor ya dominante en el repo) en vez de bajar los uploads a `@v4`: menos líneas tocadas y consistente con la dirección ya elegida por el repo. Se verifica compatibilidad `v7 download` con `pattern`/`merge-multiple` (existentes desde v3/v4) antes de aterrizar.

### D7 — Propagación de fallo de shards como step explícito

El step `Propagate shard failure` evalúa `contains(needs.test-unit-<ws>.result, 'failure')` y hace `exit 1`. Es **advisory-honesto**: hoy `test-unit-*` tiene `continue-on-error: true`, por lo que `needs.<job>.result` reporta `success` aunque falle (`actions/toolkit#581`) — la propagación será un no-op hasta la FASE 2 de `quality-gates`. Se implementa igual para que el mecanismo esté probado y se active solo cuando se retire el COE, sin retoque posterior.

## Risks / Trade-offs

- **[El gate sigue advisory por el COE de FASE 1]** → `client-coverage`/`server-coverage` conservan `continue-on-error: true` (FASE 1, propiedad de `quality-gates`). Mitigación: la propagación de fallo (D7) queda implementada y testeada; se activa sola al retirar el COE en FASE 2. Documentado explícitamente en tasks para no generar falsas expectativas de bloqueo.
- **[`--merge-reports` necesita `npm ci`]** → el puente invoca Vitest, así que requiere `setup-monorepo` igual que los jobs de test (ya lo hace hoy). Mitigación: `timeout-minutes: 5` ya presente; el merge es barato (sin ejecutar tests).
- **[Unificación de majors rompe algo no previsto]** → `download-artifact@v7` puede tener cambios de defaults respecto a `@v4`. Mitigación: verificar la matriz de inputs soportada (`pattern`, `merge-multiple`, `path`) en la changelog de `actions/download-artifact` antes de aterrizar; task dedicada con verificación por `actionlint` + un run de PR.
- **[Rutas ocultas `.vitest-reports/` no subidas]** → `upload-artifact@v4+` excluye archivos ocultos por defecto y `.vitest-reports/` es un directorio oculto. Mitigación: `include-hidden-files: true` en el upload de shard (mismo requisito que `ci-test-sharding` req. 5 para el junit). Señalado en tasks aunque la matriz aún esté dormida, para que el upload ya sea correcto.
- **[Doble cómputo de cobertura (per-shard + merged)]** → con N shards cada shard genera su propio `coverage/` parcial (casi siempre descartado). Mitigación: retención corta (`retention-days: 3`) en artifacts de shard, fijada explícitamente en task 1.2; el merged es el único artefacto de verdad. Coste aceptado (mismo argumento que `test-sharding` §4.7).
- **[Consumidores `server-sonarqube` y `client-sonarqube` rotos por el rename]** → el rename de los artifacts planos (`coverage-server`/`coverage-client` → `coverage-<ws>-shard-1`) dejaría sus `download-artifact` sin match. Mitigación: actualizar también esos patrones a `coverage-<ws>-shard-*` + `merge-multiple: true` (tarea 1.4 para server, nueva tarea 1.5 para client) aunque ambos jobs estén en `if: false`, para no dejar una bomba de reactivación.

## Migration Plan

1. Aterrizar gaps de habilitación (blob en scripts `*:ci`, índices de shard en uploads, unificación de majors) — **no-op observable** con N=1.
2. Aterrizar la lógica del puente (descarga por patrón, presencia, guard N=0, merge condicional, propagación) — **no-op observable** con N=1 (la descarga por patrón captura el único artifact).
3. Validar en un PR real de CI: `client-coverage`/`server-coverage` siguen verdes, `check-coverage.mjs` ve el mismo `coverage-summary.json` que antes, `actionlint` limpio.
4. Rollback: cada paso es un commit separado en `ci.yml`/`package.json`; revertir el commit correspondiente restaura el comportamiento previo sin dependencias cruzadas.

## Open Questions

- **Retención del artifact merged**: ¿`retention-days` del coverage completo post-merge (hoy hereda el default de `coverage-client`)? El doc sugiere 14-30d para el merged vs 3d para shards. Definir el número concreto no cambia specs ni desglose de tasks — se resuelve al aterrizar el upload, con preferencia a 30d para paridad con `flaky-evidence-*`.
- **Si la matriz futura usa matriz dinámica condicionada a `scope=full`** (shards desactivados en carril diff-scoped): el guard N=0 de D4 ya lo absorbe, pero la decisión exacta de `fromJSON` pertenece a `test-sharding` task 6, no a este change.
