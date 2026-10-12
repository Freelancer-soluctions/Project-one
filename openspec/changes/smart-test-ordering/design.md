# Design

## Context

`docs/learning/smart-test-ordering.md` (§4) fija el estado actual: 0 `sequence.sequencer` en el
repo, `vitest.shared.js` sin orden declarado, `maxWorkers: 1` en CI bajo `CI=true` (orden de
ficheros = orden de ejecución ⇒ el TTFF responde 1:1 al sequencer), historial de resultados solo
en artefactos `flaky-evidence-*` (30 días) y el **gap de caché**: `setup-monorepo` cachea
`node_modules/.cache` con `exclude: node_modules/.cache/vitest`, así que la `results.json` del
BaseSequencer nunca se restaura en CI. La cadena crítica (historial → sequencer → verificación)
es delta de `tia-hardening` (tasks 4.1/4.2, 4.4, 5.1, 5.2) y su requirement "Fail-first ordering
of scoped runs" ya vive en su delta de `ci-test-impact-analysis`. Este change se apoya en esa
cadena; no la reimplementa. Ver `proposal.md` — Why.

Constraints de coordinación (los cuatro in-flight):

- `tia-hardening`: dueño de `vitest.sequencer.js`, `scripts/ci/tia-history.mjs`,
  `scripts/ci/tia-metric.mjs`, `ci.yml` (steps TIA) y el único diff permitido en
  `nightly-full-suite.yml` (step `Record TIA history` + `TIA_SEQUENCER=stable`).
- `ci-testing-gate-promotion`: dueño de `continue-on-error` y de los jobs de test de `ci.yml`.
- `client-snapshot-testing`: dueño de `apps/client/vitest.config.js` y `apps/client/package.json`.
- `pre-push-scoped-testing`: dueño de `.husky/pre-push`.

## Goals / Non-Goals

**Goals:**

- Que el fail-first funcione **con datos en CI**: el historial publicado llega a la ruta que lee
  el sequencer antes del step de tests, best-effort.
- Que el ranking sea **honesto**: degradar flaky/cuarentena, nunca ascenderlos; la cuarentena
  sigue excluyendo por argv tras la selección.
- Que el beneficio sea **medible**: TTFF, % de fallos en el primer X% e historial hit-rate en el
  step summary, advisory.
- Que la **order-dependence** tenga su propia red de detección (shuffle con seed fijado), sin
  poner el shuffle ni el orden histórico en el nocturno.
- **Paridad local** del orden vía config shared, sin tocar el hook pre-push.

**Non-Goals:**

- Implementar ni verificar el sequencer base (`tia-hardening` 5.1/5.2) ni producir el historial
  (`tia-hardening` 4.1/4.2) — son prerrequisitos referenciados, no duplicados.
- Cambiar **qué** tests corren (selección TIA: `ci-test-impact-analysis`), los safety nets (guard
  D7, D18, cuarentena, nocturno completo, `TIA_SEQUENCER=stable`) o los `continue-on-error`.
- Editar `.husky/pre-push`, `quarantine-exclude.mjs`, `setup-monorepo` o los configs/workspaces de
  `apps/client` tocados por `client-snapshot-testing`.
- Sharding/balanceo por duración (`ci-test-sharding`), fail-fast en CI (`bail`) y ranking ML
  (siguiente nivel, fuera de horizon).

## Decisions

### D1 — Secuenciarse DESPUÉS de `tia-hardening` (dependencia, no paralelismo)

Este change depende de las tasks 4.1/4.2 (historial), 4.4 (descarga de artefactos con run-id),
5.1 (`vitest.sequencer.js` + `sequence.sequencer` + opt-out nocturno) y 5.2 (verificación con
fallo sembrado). _Alternativa descartada_: implementar un sequencer paralelo — duplicaría
`vitest.shared.js` y `nightly-full-suite.yml` con dos dueños, exactamente el conflicto que el §4.2
del research doc advierte. Consecuencia: los PRs de este change (que editan `ci.yml` y
`vitest.sequencer.js`) van **después** de los de `tia-hardening`; el restore y la métrica TTFF se
añaden como steps nuevos aditivos.

### D2 — Restaurar el historial por artefacto, NO ampliar la caché de `setup-monorepo`

El hueco de caché (`exclude: node_modules/.cache/vitest`) se cierra en el **otro lado**: el
artefacto `tia-history-<workspace>` que `tia-hardening` 4.2 publica (retención 30 días) se
descarga a `node_modules/.cache/tia/tia-history.json` — la ruta que lee el sequencer de D7 — antes
del step de tests, resolviendo el run-id con el patrón ya probado (`gh api .../actions/workflows/
nightly-full-suite.yml/runs` + `gh run download`; `actions/download-artifact` solo lee el run
actual y `restore-keys` es de `actions/cache`). Best-effort: sin artefacto o JSON corrupto → el
orden degrada al determinista documentado y el job sigue verde (requirement "Ordering history
available..."). _Alternativa descartada (medir antes de descartar del todo)_: quitar el `exclude`
de `setup-monorepo` — (a) toca `ci-caching` (spec y dueño), (b) la `results.json` de Vitest es
caché por lockfile/versión con eviction de 7 días y datos por máquina, no historia de fallos
cross-run con retención nombrada, y (c) ruido de invalidación en todos los jobs que usan la
composite. Se deja constancia de la medición en la task 1.2.

### D3 — Evidencia flaky para degradar: cuarentena commiteada + `flaky-evidence-*` previo

El ranking degrada con la unión de (a) ficheros listados en `.github/flaky-quarantine.yml` (fuente
veraz, dueña `ci-flaky-quarantine`, leída sin modificarla) y (b) los `retryCount > 0` del
`flaky-retries.json` del último `flaky-evidence-*` recuperable (misma resolución de run-id de D2,
mejor esfuerzo). **No** se modifica `tia-history.mjs --record` para marcar `flaky` (sería invadir
la task 4.1) ni se consume el `flaky-retries.json` de la corrida actual (se escribe al final: no
existe cuando el sequencer ordena). Sin datos → sin degradación (orden = conteo de fallos, tie-break
estable). La exclusión del tier PR sigue ocurriendo por argv en `quarantine-exclude.mjs`; el
ranking nunca "resucita" un excluido porque la selección/argv no lo contiene.

### D4 — Métrica TTFF en script propio advisory, pegada al summary TIA

Nuevo `scripts/ci/ttff-metric.mjs` (no se extiende `tia-metric.mjs`, que es de `tia-hardening`
1.1/4.5) leyendo `reports/vitest-results.json` (reporter JSON, prerequisito de su task 1.1) y
`node_modules/.cache/tia/tia-history.json`. Calcula: TTFF wall-clock (primer test fallido −
`startTime` de la corrida), % de suite hasta el primer fallo (suma de duración de ficheros
anteriores al primero rojo / duración total — métrica robusta al ruido de cola del runner),
% de fallos en el primer X% (X=20 por defecto) e hit-rate (ficheros rojos presentes en el
top-N del historial / ficheros rojos). Sale siempre 0; en corrida verde publica "sin primer
fallo". Cableado con `if: always()` + `|| true` junto al summary TIA (mismo contrato no-gating).

### D5 — Shuffle audit: comando local documentado + workflow semanal propio

`npx vitest run --sequence.shuffle --sequence.seed=4242` (seed fijado y registrado en el workflow
y en docs) — reproducible, jamás default del nocturno ni de PR blocking. Se crea
`.github/workflows/order-dependence-audit.yml` **nuevo** (semanal, matrix de ambos workspaces):
detectar order-dependence es fallar el workflow, y como no es check requerido ni tiene
`needs` en el agregador, el rojo es visible sin `continue-on-error` (semántica reservada a
`ci-testing-gate-promotion`). _Alternativa descartada_: poner el shuffle en
`nightly-full-suite.yml` — chocaría con el único diff permitido de `tia-hardening` y enmascararía
order-dependence en el tier de seguridad (§3.5 del research doc).

### D6 — Ventana N: se documenta, se tunea solo con hit-rate

N se mantiene en 3 (valor de `tia-hardening`) hasta que la métrica hit-rate de D4 acumule
evidencia; el ajuste queda documentado en los docs de orden (no en código condicional). Ventana
corta = frescura; larga = memoria de fallos raros — la decisión es de datos, no de preferencia.

### D7 — Docs en PRs separados y secuenciales

La celda "Smart Test Ordering — NO" (`ci-cd-pipeline-empresarial.md` ~3412), el gap 6
(`test-impact-analysis.md` §5) y `unit-tests-enterprise.md` §2.5 se actualizan **en PRs aparte
y después** de los PRs de `tia-hardening` (su task 11.2 también toca `test-impact-analysis.md`
§5) — es la recomendación literal del §5.8 del research doc.

## Risks / Trade-offs

- [Conflictos de merge en `ci.yml` y `vitest.sequencer.js` con los changes en vuelo] → secuencia
  de PRs tras `tia-hardening` (D1); diffs aditivos (steps nuevos, extensión del class), cero
  ediciones a `continue-on-error` o a los jobs de test (verificación final 7.2).
- [Historial/flaky data desactualizado en CI (retención 30d, eviction)] → best-effort en las dos
  descargas; degradación a orden determinista y `hit-rate`/`map` visibles en el summary para
  detectar el modo sin datos.
- [Wall-clock TTFF ruidoso en CI (colas del runner)] → publicar también el % de suite hasta el
  primer fallo, que solo depende del orden (la señal que el sequencer controla).
- [El orden por historial infla fallos de lo que ya falló (profecía autocumplida, Google 2016)] →
  degradación flaky-aware (D3) + nocturno sin orden impuesto (requirement "Order-dependence
  audit", opt-out de `tia-hardening` 5.1).
- [Auditoría semanal consume minutos] → matrix acotada (ambos workspaces, 1 runner), semanal no
  por PR; el seed fija un solo caso por corrida (más seeds = ampliar después, no hoy).
- [Docs duplicadas entre changes] → PRs separados y secuenciales (D7).

## Migration Plan

1. **Tras merge de `tia-hardening`** (4.1/4.2/4.4/5.1/5.2): PR-A = restore del historial en CI +
   medición del hueco de caché (tasks 1.x).
2. PR-B = métrica TTFF (tasks 2.x) — independiente de PR-A, puede ir en paralelo.
3. PR-C = degradación flaky-aware en `vitest.sequencer.js` (tasks 3.x).
4. PR-D = workflow de auditoría shuffle + comando local (tasks 4.x).
5. PR-E = docs (tasks 6.x), separado.
   Rollback: cada PR se revierte por sí solo; sin restore/flaky-metric el orden vuelve al caso
   base sin perder selección, gates ni cuarentena (nada bloqueante depende de este change).

## Open Questions

- Valor de X para "% de fallos en el primer X%": 20% es el default del research doc (§3.6); se
  confirma con las primeras corridas publicadas sin cambiar el contrato del requirement.
- Si la auditoría semanal debe publicar además una tendencia semanal (fallos order-dependent /
  semana) — se decide tras el primer mes de runs; no afecta specs ni desglose de tasks.
- [Historial/flaky data desactualizado en CI (retención 30d, eviction)] → best-effort en las dos
  descargas; degradación a orden determinista y `hit-rate`/`map` visibles en el summary para
  detectar el modo sin datos.
- [Wall-clock TTFF ruidoso en CI (colas del runner)] → publicar también el % de suite hasta el
  primer fallo, que solo depende del orden (la señal que el sequencer controla).
- [El orden por historial infla fallos de lo que ya falló (profecía autocumplida, Google 2016)] →
  degradación flaky-aware (D3) + nocturno sin orden impuesto (requirement "Order-dependence
  audit", opt-out de `tia-hardening` 5.1).
- [Auditoría semanal consume minutos] → matrix acotada (ambos workspaces, 1 runner), semanal no
  por PR; el seed fija un solo caso por corrida (más seeds = ampliar después, no hoy).
- [Docs duplicadas entre changes] → PRs separados y secuenciales (D7).

## Migration Plan

1. **Tras merge de `tia-hardening`** (4.1/4.2/4.4/5.1/5.2): PR-A = restore del historial en CI +
   medición del hueco de caché (tasks 1.x).
2. PR-B = métrica TTFF (tasks 2.x) — independiente de PR-A, puede ir en paralelo.
3. PR-C = degradación flaky-aware en `vitest.sequencer.js` (tasks 3.x).
4. PR-D = workflow de auditoría shuffle + comando local (tasks 4.x).
5. PR-E = docs (tasks 6.x), separado.
   Rollback: cada PR se revierte por sí solo; sin restore/flaky-metric el orden vuelve al caso
   base sin perder selección, gates ni cuarentena (nada bloqueante depende de este change).

## Open Questions

- Valor de X para "% de fallos en el primer X%": 20% es el default del research doc (§3.6); se
  confirma con las primeras corridas publicadas sin cambiar el contrato del requirement.
- Si la auditoría semanal debe publicar además una tendencia semanal (fallos order-dependent /
  semana) — se decide tras el primer mes de runs; no afecta specs ni desglose de tasks.
