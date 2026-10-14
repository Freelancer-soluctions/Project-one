# Proposal

## Why

Este repo tiene **0 matrix / 0 `--shard`**: los jobs de test corren single-runner con
`maxWorkers: 1`, así que el wall-time del tier PR es `T` puro. `docs/learning/test-sharding.md`
(§1-§5) demostró que sharding es la única capa que reparte la suite **entre máquinas** (fast
feedback `[FB]`), pero también dejó escrito que implementarlo a ciegas sería coste puro: (a) el
**Coverage Merge Gate** de `unit-tests-enterprise` §23.6 no existe aún para shards (sin merge, el
tripwire D18 miente con cobertura parcial) y (b) la evidencia medida hasta hoy (suites de 5-14 s,
jobs de ~2m20s) está por debajo del umbral de activación de 5-8 min — confirmado después por la
medición de G1.2 sobre 4 corridas reales (suite de client **145-166 s**, job **259-282 s**, server
**4-5 s**), que mantiene la decisión **N/A** con solo 18 s de margen en la lectura más
conservadora. Este change codifica
el rollout como secuencia **acotada** — medir → decidir → matriz — para que ningún `strategy.matrix`
toque `ci.yml` antes de que ambos prerequisitos estén verificados y registrados, y cruza a los
changes en vuelo en lugar de duplicar su ownership.

## What Changes

**G1 — Prerequisitos y medición (siempre, sin matriz):**

- Instrumentación de duración por job de test (step summary con wall-time del job) y registro de
  **≥3 corridas** de evidencia en los artefactos del change.
- Verificación explícita del prerequisito **Coverage Merge Gate** (§23.6): contrato de
  `scripts/ci/check-coverage.mjs`, plumbing de artifacts de cobertura y diseño de merge — dejada
  por escrito como gate que debe existir ANTES de habilitar sharding.
- Auditoría de ownership: comprobación por grep de que este change no toca
  `sequence.sequencer`/selección (tia-hardening), métrica TTFF (smart-test-ordering), ni
  `continue-on-error` (ci-testing-gate-promotion).

**G2 — Decisión (gate duro):**

- Registro explícito **PROCEED / N/A** con la evidencia medida: >8 min en 3 corridas ⇒ PROCEED;
  <5 min ⇒ N/A; la banda 5-8 min se decide con análisis de coste (`N*(s+T/w)`). Con la evidencia
  actual el resultado esperado es **N/A**: se cierra el rollout con la matriz ausente y la
  capacidad dormida (mismo cierre que `ci-testing-gate-promotion` registró para sharding).

**G3 — Matrix N=2 advisory + puente (solo si G2 = PROCEED):**

- `test-unit-client` pasa a `strategy.matrix.shard: [1, 2]` con `fail-fast: false`,
  `max-parallel` explícito, artifacts con nombre **por shard**, TIA (D7) y exclusiones de
  cuarentena aplicadas **antes** del sharding, y `continue-on-error: true` de FASE 1 intacto.
- **Un solo job puente** de nombre fijo `test-unit-client-merge` (`if: always()`) absorbe la
  matriz: fusiona informes, propaga el fallo de cualquier shard y deja el agregador
  `prebuild-unit-tests-complete` con exactamente sus **6 `needs`** — jamás N shards en `needs`.

**G4 — Coverage merge + D18:**

- El puente ejecuta `vitest --merge-reports --coverage` **antes** de cualquier evaluación del
  tripwire; `client-coverage` consume el resumen fusionado, D18 sigue solo-en-full, y un artifact
  de shard ausente termina en exit 1 (nunca un verde con cobertura parcial).
- Evidencia flaky y junit se coleccionan por shard y se fusionan en el puente;
  `.github/flaky-quarantine.yml` sigue excluyendo dentro de cada shard.

**G5 — Required check y balanceo:**

- El check requerido sigue siendo el de nombre fijo (agregador/puente): cero checks por shard y
  cero renombrados que rompan branch protection.
- Métricas advisory de balanceo y coste (wall-time, ratio máx/mín objetivo ≤1.15, straggler share,
  minutos facturados) en step summary; desbalanceo >15% ⇒ re-balanceo delegado (no se edita
  `sequence.sequencer` aquí). `test-unit-server` solo se sharda con evidencia propia.

**G6 — Docs y verificación final:** lockstep documental y `openspec validate test-sharding --strict`.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `ci-test-sharding`: (1) el contrato de agregador gana el **job puente único de nombre fijo**
  (matriz → puente → coverage; nunca shards directas en `needs`); (2) requisito nuevo de
  **gating de prerequisitos con registro de decisión** (medición + Coverage Merge Gate antes de
  cualquier matriz); (3) requisito nuevo de **rollout advisory con boundaries de ownership**
  (N=2 advisory, FASE 1 `continue-on-error` intacto, sin tocar lo que poseen tia-hardening,
  smart-test-ordering, client-snapshot-testing, ci-testing-gate-promotion ni ci-shifting-left);
  (4) requisito nuevo de **observabilidad de balanceo y coste**.

## Impact

- `.github/workflows/ci.yml`: step summary de duración (G1, siempre); solo si G2 = PROCEED:
  matriz en `test-unit-client`, job puente `test-unit-client-merge` y `needs` de `client-coverage`
  reencadenados al puente. El agregador y sus 6 `needs`, los `if:` de propagación y el
  `continue-on-error` de FASE 1 **no cambian**.
- `docs/learning/test-sharding.md` (estado → implementado/dormido con evidencia) y
  `docs/learning/unit-tests-enterprise.md` §2.4/§2.6 (estado del merge de shards).
- **No se toca:** `sequence.sequencer` ni la lógica de selección D7, `.github/flaky-quarantine.yml`,
  thresholds de coverage (D18), `apps/client/vitest.config.js` ni `package.json` (snapshots/scripts
  — `client-snapshot-testing`), la promoción FASE 1 → FASE 2 (`ci-testing-gate-promotion`), ni el
  sharding de e2e (`ci-shifting-left`, capa `e2e-sharding`).
- **Specs relacionadas (citadas, no modificadas):** `ci-test-impact-analysis`,
  `ci-test-jobs-activation`, `ci-flaky-quarantine`, `ci-test-reporting`,
  `ci-prebuild-substage-structure`, `ci-flaky-retry`.
- **Changes en vuelo referenciados:** `tia-hardening`, `smart-test-ordering`,
  `ci-testing-gate-promotion`, `client-snapshot-testing`, `ci-shifting-left`.
