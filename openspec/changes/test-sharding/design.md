# Design

## Context

Ver `proposal.md` (Why). Solo el contexto que moldea la decisión:

- `.github/workflows/ci.yml`: `test-unit-client`/`test-unit-server` son single-runner
  (`maxWorkers: 1`, `timeout-minutes: 10`, FASE 1 `continue-on-error: true`); resuelven el scope
  TIA (D7) y las exclusiones de cuarentena (D9) dentro del job; suben `coverage-client` y
  `flaky-evidence-client`; `client-coverage` descarga `coverage-client` exacto y ejecuta
  `scripts/ci/check-coverage.mjs` (D18: thresholds solo en full suite).
- `prebuild-unit-tests-complete` exige **exactamente 6 `needs`**; `ci-complete` es el agregador
  final. Los 4 checks ligados al ruleset son solo governance (`CONTEXT-CICD.md` §3.2):
  `CI Complete` ni los jobs de test están ligados hoy.
- `docs/learning/test-sharding.md` §4/§5 fija los prerequisitos: Coverage Merge Gate (§23.6)
  **antes** de sharding, umbral de duración >5-8 min, y `sequence.sequencer` intocable.
- Evidencia medida hasta hoy (`ci-testing-gate-promotion`): suites de 5-14 s, job ~2m20s ⇒ bajo
  el umbral. El resultado esperado de G2 es **N/A**, no PROCEED.

## Goals / Non-Goals

**Goals:**

- Dejar el capability `ci-test-sharding` implementable con rollout **acotado**: medición y
  decisión antes de cualquier matriz, merge de coverage antes del tripwire, contrato de 6 `needs`
  intacto.
- Que la maquinaria de medición, el registro de decisión y la auditoría de ownership queden hechos
  **incluso si la decisión es N/A** (la evidencia es el entregable de G1/G2).

**Non-Goals:**

- No promover FASE 1 → FASE 2 (quitar `continue-on-error` es de `ci-testing-gate-promotion`).
- No tocar `sequence.sequencer`, la selección D7 ni `scripts/ci/tia-*` (`tia-hardening`).
- No publicar TTFF ni auditar orden (`smart-test-ordering`); no editar
  `apps/client/vitest.config.js` ni `apps/client/package.json` (`client-snapshot-testing`); no
  shardar e2e (`ci-shifting-left`, capa `e2e-sharding`); no shardar el nightly en este cambio.
- No cambiar `.github/flaky-quarantine.yml` ni los thresholds de coverage (D18).

## Decisions

### D1 — Rollout gateado G1 → G2 → (G3…G6 solo si PROCEED)

Los tasks se agrupan de modo que **no existe tarea de matriz** hasta que existan (a) evidencia de
duración de ≥3 corridas, (b) verificación del Coverage Merge Gate y (c) registro PROCEED/N/A. La
salida **N/A es un cierre legítimo**: se documenta la evidencia, G3-G5 quedan marcados N/A y solo
corre G6 (docs + validación). Alternativa descartada: "implementar por si acaso" — introduce
matriz sin umbral, exactamente lo que §4.2 prohíbe.

### D2 — Matriz condicionada al modo suite completa (`fromJSON` sobre `shared`)

El `strategy.matrix` de `test-unit-client` se deriva de `needs.repo-discovery.outputs.shared`:
`shared == 'true'` ⇒ N=2 (modo full: la resolución in-job de D7 dará `scope=full`, coherente);
en caso contrario ⇒ N=1 (sin `--shard`, el job corre exactamente como hoy). Rationale:

- **Unión exacta en todos los modos**: con `scope=changed`, la selección puede ser minúscula y
  una shard quedar vacía; el guard D7 (`RAN == 0` ⇒ fallback a suite completa) disparado dentro de
  una sola leg rompería `unión = lo que correría single-runner` (specs requirement 3). Con N=1 en
  modo diff-scoped ese camino ni se abre.
- **Cero edición de D7/TIA**: el step `Resolve TIA scope`, el fallback y el argv de cuarentena
  quedan byte-idénticos (ownership `tia-hardening`).
- Es la receta que ya recomienda el doc §4.3 ("condicionar `matrix.shard` a `scope=full`").
- Alternativas descartadas: matriz estática N=2 siempre (rompe unión/parity en PRs pequeños — el
  caso común); job emisor de matriz (job extra + duplica la lógica de scope, deriva futura);
  mover `Resolve TIA scope` a un job emisor (mueve lógica D7, colisión de ownership).

Especificación del valor: `matrix: ${{ fromJSON(...) }}` emite
`{"include":[{"shard":1,"total":2},{"shard":2,"total":2}]}` o `{"include":[{"shard":1,"total":1}]}`;
la leg pasa `--shard=k/total` solo cuando `total > 1` (expresión en el step). `fail-fast: false`
y `max-parallel: 2` explícitos siempre que exista matriz.

### D3 — Un único job puente `test-unit-client-merge`

`test-unit-client` (matriz) → `test-unit-client-merge` (nombre fijo, `if: ${{ always() &&
needs.test-unit-client.result != 'skipped' }}`, FASE 1 `continue-on-error: true`) →
`client-coverage` (pasa a `needs: [test-unit-client-merge]`). El agregador **no cambia**: sigue
con sus 6 `needs`; los N shards jamás aparecen en ningún `needs` (solo el job id de la matriz y
el puente). El puente:

1. descarga `coverage-client-shard-*` y los reports por shard,
2. ejecuta `npx vitest --merge-reports --coverage --reporter=junit` (requiere
   `setup-monorepo`/`npm ci`, §4.3),
3. propaga el fallo de cualquier shard (`contains(needs.test-unit-client.result, 'failure')`),
4. sube el resumen fusionado bajo el nombre canónico y publica el único `dorny/test-reporter`.

`if:` del puente: `always()` para que corra cuando una shard falle (si no, se salta justo cuando
el informe importa), con el guard de `!= 'skipped'` para no romper la propagación de skip cuando
el job de test no corre (patrón D17/ci-runtime-config-hygiene: consumir `needs.*.result`
sí-counts como consumo de outputs).

Alternativas descartadas: N shards en `needs` del agregador (rompe el contrato de 6 y ensucia el
check); plegar el merge dentro de `client-coverage` (mezcla fusionado de informes con evaluación
del tripwire y pierde el punto fijo de publicación de reports; el contrato del change exige 1
puente); renombrar el agregador (rompería el binding de checks).

### D4 — Nombres de artifact: por shard arriba, canónicos abajo

`upload-artifact` es inmutable: dos shards subiendo `coverage-client` a la vez ⇒ solo gana uno.
Por eso las legs suben `coverage-client-shard-${{ matrix.shard }}` y
`flaky-evidence-client-shard-${{ matrix.shard }}`, y **el puente re-publica `coverage-client`
fusionado** con el mismo nombre. Con eso, los consumidores siguen intactos: `client-coverage`
(descarga nombre exacto), `client-sonarqube` (`if: false`, nombre exacto) y `flaky-weekly.yml`
(matchea `startswith("flaky-evidence-")` — verificado — así que acepta también los nombres por
shard directamente). Los reports de blob viven en rutas ocultas ⇒ `include-hidden-files: true`.

### D5 — Orden de coverage: merge antes del tripwire, artifact ausente = exit 1

Flujo del puente: download (todos los shards) → `--merge-reports --coverage` → subir resumen
merged → recién entonces `client-coverage` ejecuta `check-coverage.mjs`. Si falta el artifact de
alguna shard o el fusionado, se sale con código 1 **antes** de evaluar thresholds (nunca un verde
con cobertura parcial). D18 no se toca: los thresholds absolutos siguen evaluándose solo en full
suite; `coverage.thresholds.autoUpdate` sigue prohibido en CI.

### D6 — `client-coverage` sigue corriendo cuando el puente falla

`client-coverage` pasa de `if: github.event_name == 'pull_request'` (success() implícito) a
`if: ${{ always() && github.event_name == 'pull_request' && needs.test-unit-client-merge.result != 'skipped' }}`,
consumiendo explícitamente `needs.*.result`. Así el gate evalúa y reporta el fallo de merge
(exit 1) en vez de saltarse, y la propagación de skip del modo "client no tocado" se conserva.
`continue-on-error` de este job **no** se modifica (FASE 1 intacta; su promoción es de
`ci-testing-gate-promotion`).

### D7 — Reporters: blob en las legs, junit fusionado en el puente

Las legs añaden `--reporter=blob` por CLI encima del script existente (**sin** tocar
`package.json`, propiedad de `client-snapshot-testing`). `dorny/test-reporter` "Client Unit
Tests" se mueve al puente sobre el `junit.xml` fusionado: un solo check, cero checks por shard.
Los scripts conservan `--reporter=junit`/`json`, así que cada leg sigue produciendo
`vitest-results.json`/`flaky-retries.json` para la evidencia por shard (D4).

### D8 — Métricas de balanceo y coste (advisory)

Cada leg mide su duración y la escribe en un artifact de métricas; el puente calcula ratio
máx/mín, straggler share y minutos facturados (`N*(s+T/w)` vs baseline) y los publica en el step
summary. Todo advisory (nunca `exit 1` por ratio). Ratio >1.15 ⇒ follow-up de re-balanceo
**registrado** en los artefactos del change; el re-balanceo por duración (custom sequencer,
`vitest#9184`) queda delegado a `tia-hardening` — aquí no se edita `sequence.sequencer`.
`test-unit-server` no se sharda en este change: solo con evidencia propia que supere G1/G2.

### D9 — Coordinación de ownership y rebase

Los tres changes en vuelo añaden steps a los **mismos jobs**: `tia-hardening` (métrica shadow tras
el step de tests), `smart-test-ordering` (step TTFF con `if: always()`), y este change
(medición de duración + matriz + puente). Estrategia: ediciones **append-only** de steps, G1
(medición) primero para que los conflictos de rebase ocurran antes de que exista matriz, y greps
de verificación al final: `sequence.sequencer` sin cambios, `grep -c "continue-on-error"` de los
6 jobs idéntico a `main`, bloque TIA/D7 byte-idéntico, `.github/flaky-quarantine.yml` intacto.

## Risks / Trade-offs

- **[El check de la matriz cambia de nombre]** `Tests: Unit - Client` pasa a emitir
  `Tests: Unit - Client (1, 2)`/`(2, 2)` (GH añade los valores de matrix) → mitigación: los 4
  checks ligados al ruleset son governance (§3.2) y `CI Complete` no está ligado; G5.1 lo verifica
  contra la API del ruleset antes de cerrar.
- **[Rebase conflicts con los 3 changes en vuelo]** → mitigación D9: G1 primero, append-only,
  actionlint + greps tras cada grupo.
- **[Sharding solo en modo full reduce el alcance]** las PRs diff-scoped corren single-runner →
  aceptado a propósito: son las corridas pequeñas; con TIA no hay wall-time que repartir, y es
  exactamente el criterio de umbral de G2.
- **[Coste: setup pagado N veces]** solo en corridas `shared` (pocas), `max-parallel: 2` tope,
  grupo `concurrency` del workflow ya cancela runs obsoletos; métricas de minutos facturados en
  G5 para decidir con datos.
- **[`--merge-reports` necesita Vitest instalado]** → `setup-monorepo` en el puente (npm ci).
- **[Blob en rutas ocultas]** `include-hidden-files: true` obligatorio; si falta, el puente no
  ve reports y falla ruidosamente (mejor que un merge vacío).

## Migration Plan

1. **G1** (comportamiento idéntico, solo instrumentación de duración + verificación del Coverage
   Merge Gate + auditoría de ownership) — mergeable solo.
2. **G2** registro PROCEED/N/A en los artefactos del change. N/A ⇒ salto a G6 y G3-G5 se marcan
   N/A con su evidencia.
3. **G3** matriz N=2 + puente (advisory, FASE 1 intacta) ⇒ **G4** merge de coverage + D18 ⇒
   **G5** required check y balanceo.
4. **G6** docs + `openspec validate --strict`.

Rollback: los cambios viven en dos bloques de `ci.yml` (bloque `test-unit-client` y puente +
`needs` de `client-coverage`); revert de esos bloques restaura el single-runner sin tocar el
agregador, por eso el contrato de 6 `needs` se mantiene desde el primer commit.

## Open Questions

Ninguna abierta: el umbral, el alcance de la matriz, el puente, el orden de coverage y los
límites de ownership están decididos arriba; lo único empírico (¿PROCEED o N/A?) lo responde G2
con evidencia medida, que es el diseño mismo.

### D8 — Métricas de balanceo y coste (advisory)

Cada leg mide su duración (segundos de `SECONDS` alrededor del step de tests) y la escribe en un
artifact `shard-metrics-client-<k>`; el puente las agrega y publica en el step summary: wall-time
por shard y total, ratio máx/mín (objetivo ≤ 1.15), straggler share (`m = shard_max * N /
T_total`) y minutos facturados (`N*(s+T/w)` vs baseline single-runner). Todo **advisory**: ningún
`exit 1` por ratio, ninguna métrica de TTFF (el TTFF es de `smart-test-ordering`; sharding mueve
wall-time, no time-to-first-failure — `smart-test-ordering` §3.4). Ratio >1.15 registrado ⇒
follow-up de re-balanceo anotado en los artefactos del change; el re-balanceo por duración (custom
sequencer user-land, `vitest-dev/vitest#9184`) queda **delegado** a `tia-hardening` (dueño de
`sequence.sequencer`) — aquí no se edita. `test-unit-server` no se sharda en este change: solo
con evidencia propia que supere G1/G2 por separado.

### D9 — Coordinación de ownership y rebase

Los tres changes en vuelo añaden steps a los **mismos jobs** de `ci.yml`:
`tia-hardening` (métrica shadow `tia-metric.mjs` con `if: always()` tras el step de tests),
`smart-test-ordering` (step TTFF con `if: always()` tras el run) y este change (medición de
duración + matriz + puente). Estrategia:

1. **G1 primero**: la instrumentación de duración es un step append-only (`if: always()`) — si
   hay conflicto de rebase, ocurre antes de que exista matriz, que es cuando es barata.
2. **Ediciones append-only** dentro de los jobs existentes; no se reordenan ni se reescriben los
   steps de TIA (D7), cuarentena (D9) ni los uploads actuales salvo el renombrado por shard de D4.
3. **Greps de verificación al cierre de cada grupo** (son el contrato con los otros changes):
   - `grep -n "sequence.sequencer" apps/*/vitest.config.js vitest.shared.js` ⇒ idéntico a `main`
     (ownership `tia-hardening`);
   - `grep -c "continue-on-error: true" .github/workflows/ci.yml` ⇒ idéntico a `main` en los 6
     jobs de test (ownership `ci-testing-gate-promotion`; FASE 1 intacta);
   - bloque `Resolve TIA scope` + guard D7 byte-idéntico a `main`;
   - `.github/flaky-quarantine.yml` sin cambios; `apps/client/vitest.config.js` y
     `apps/client/package.json` sin cambios (`client-snapshot-testing`);
   - `prebuild-unit-tests-complete.needs` ⇒ exactamente 6 entradas;
   - `grep -rn "TTFF\|time-to-first-failure" .github/workflows/ci.yml` ⇒ sin cambios imputables
     a este change (`smart-test-ordering`).
4. **Prerrequisitos cruzados, nunca duplicados**: la promoción FASE 1 → FASE 2 (incluido quitar
   `continue-on-error` del puente cuando exista) queda anotada como checklist para
   `ci-testing-gate-promotion`, que posee esa tarea; laTTFF/shuffle y el historial de fallos son
   de `smart-test-ordering`; la extensión de sharding a e2e es de `ci-shifting-left`
   (`e2e-sharding`). Este change solo cita esas specs en sus artefactos.

## Risks / Trade-offs

- **[El check de la matriz cambia de nombre]** GH añade los valores de matrix al `name:`:
  `Tests: Unit - Client` pasa a emitir `Tests: Unit - Client (1, 2)` / `(2, 2)`. Mitigación: los
  4 checks ligados al ruleset 21227644 son solo governance (`CONTEXT-CICD.md` §3.2) y
  `CI Complete` no está ligado aún; G5.1 lo **verifica contra la API del ruleset** antes de cerrar
  y, si apareciera un binding sobre el job de test, se documenta en lugar de romperlo.
- **[Rebase conflicts con los 3 changes en vuelo]** → mitigación D9: G1 primero, ediciones
  append-only, actionlint + greps tras cada grupo.
- **[Sharding solo en modo full reduce el alcance]** las PRs diff-scoped corren single-runner.
  Aceptado a propósito (D2): son las corridas pequeñas donde TIA ya recortó el wall-time; con
  evidencia de por medio (G2), activar matriz ahí sería coste puro — y es el criterio de umbral.
- **[Coste: el setup `s` se paga N veces]** solo en corridas `shared` (pocas), `max-parallel: 2`
  como tope, y el grupo `concurrency` del workflow ya cancela runs obsoletos con sus shards; las
  métricas de minutos facturados de G5 dan la base para decidir subir N con datos.
- **[`--merge-reports` necesita Vitest instalado]** → el puente corre `setup-monorepo` (npm ci),
  como fija §4.3 del doc de referencia.
- **[Blob en rutas ocultas]** `include-hidden-files: true` obligatorio en los uploads de report;
  si falta, el puente no ve los reports y falla ruidosamente — preferible a un merge vacío que
  publicara un junit en blanco.
- **[Una leg vacía en modo full]** imposible: en `scope=full` la matriz reparte la suite completa
  (SHA-1 determinista, `calculateShardRange` reparte el remainder); en `scope=changed` no hay
  matriz (D2), así que el guard D7 nunca se dispara dentro de una shard.

## Migration Plan

1. **G1** — instrumentación de duración (comportamiento idéntico, step advisory), verificación
   del Coverage Merge Gate y auditoría de ownership. Mergeable por sí solo.
2. **G2** — registro PROCEED/N/A en los artefactos del change. **N/A ⇒ salto directo a G6** y
   G3-G5 se marcan N/A con su evidencia (la matriz no se toca).
3. **G3** — matriz N=2 condicionada a `shared` + puente `test-unit-client-merge` (advisory,
   FASE 1 intacta) ⇒ **G4** — merge de coverage antes del tripwire + D18 ⇒ **G5** — verificación
   de required checks y métricas de balanceo.
4. **G6** — lockstep documental, greps de safety net y `openspec validate test-sharding --strict`.

**Rollback:** todos los cambios de comportamiento viven en dos bloques de `ci.yml` (bloque
`test-unit-client` y puente + `needs` de `client-coverage`). El revert de esos bloques restaura
el single-runner exacto sin tocar el agregador — por eso el contrato de 6 `needs` se mantiene
desde el primer commit: rollback nunca puede romperlo.

## Open Questions

Ninguna abierta. El umbral, el alcance de la matriz (D2), el puente (D3), el orden merge →
tripwire (D5/D6) y los límites de ownership (D9) están decididos arriba; lo único empírico
(¿PROCEED o N/A?) lo responde **G2 con evidencia medida**, que es el diseño mismo — no hay
supuesto sin declarar que el task list deba heredar.
