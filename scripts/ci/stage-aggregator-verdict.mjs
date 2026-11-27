#!/usr/bin/env node
// ============================================================================
// stage-aggregator-verdict.mjs — veredicto estricto de los 3 agregadores de
// stage/raíz (change `ci-gaps-priority-1-2`, G2+G3)
// ============================================================================
// `postbuild-tests-complete`, `postbuild-analysis-complete` y `ci-complete`
// comparten el mismo contrato que `build-complete`: cualquier resultado
// distinto de `success` falla (`failure`, `cancelled` o `skipped`), salvo los
// skips legítimos de cada stage:
//   - postbuild-tests: `test-integration`/`test-smoke` son path-scoped a
//     `server`/`shared` (autorizados solo si el área no cambió, fail-closed si
//     falta el output de `repo-discovery`) y `e2e` vive en `if: false` por
//     diseño incremental;
//   - postbuild-analysis: los 4 jobs de análisis viven en `if: false`
//     (SonarQube sin credenciales, DepCheck incremental);
//   - ci-complete: TODOS sus `needs` corren cuando él corre, así que ningún
//     skip es autorizado.
//
// Vive fuera del YAML para poder testear el veredicto sin ejecutar Actions
// (`scripts/ci/stage-aggregator-verdict.test.mjs`, `npm run test:scripts`).
//
// Uso: node scripts/ci/stage-aggregator-verdict.mjs <mode>
//   mode ∈ postbuild-tests | postbuild-analysis | ci-complete
// Entrada (env): NEEDS (JSON de `toJSON(needs)`).
// Salida: una línea `<job>: <result>` por entrada problemática; exit 1 si hay
// alguna, 0 si todo es success o un skipped autorizado.
// ============================================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Jobs `if: false` con skip permanente autorizado, por modo. */
const DISABLED_JOBS = {
  'postbuild-tests': new Set(['e2e']),
  'postbuild-analysis': new Set([
    'client-sonarqube',
    'server-sonarqube',
    'client-depcheck',
    'server-depcheck',
  ]),
  'ci-complete': new Set(),
};

/** Jobs de testing con path-scoping server|shared (solo postbuild-tests). */
const SCOPED_TESTING_JOBS = new Set(['test-integration', 'test-smoke']);

const MODE_LABELS = {
  'postbuild-tests': 'POSTBUILD TESTS',
  'postbuild-analysis': 'POSTBUILD ANALYSIS',
  'ci-complete': 'CI COMPLETE',
};

/**
 * `true` si el área se considera en ámbito. Fail-closed: un output ausente
 * cuenta como en-ámbito, igual que en `build-complete`.
 *
 * @param {string|undefined|null} value
 * @returns {boolean}
 */
function inScope(value) {
  if (value === undefined || value === null) return true;
  return value === 'true';
}

/**
 * ¿El `skipped` de este job está autorizado en este modo?
 *
 * @param {string} mode
 * @param {string} job
 * @param {{server?: string, shared?: string}} [areas]
 * @returns {boolean}
 */
function isSkipAuthorized(mode, job, areas = {}) {
  const disabled = DISABLED_JOBS[mode];
  if (disabled?.has(job)) return true;
  if (mode === 'postbuild-tests' && SCOPED_TESTING_JOBS.has(job)) {
    return !(inScope(areas.server) || inScope(areas.shared));
  }
  return false;
}

/**
 * Evalúa el veredicto de un agregador de stage.
 *
 * @param {object} input
 * @param {'postbuild-tests'|'postbuild-analysis'|'ci-complete'} input.mode
 * @param {Record<string, {result?: string}>} input.needs
 * @returns {string[]} entradas problemáticas (`<job>: <result>`)
 */
export function evaluateStageAggregator({ mode, needs }) {
  const areas = needs?.['repo-discovery']?.outputs ?? {};

  return Object.entries(needs ?? {}).flatMap(([job, value]) => {
    const result = value?.result;
    if (result === 'success') return [];
    if (result === 'skipped' && isSkipAuthorized(mode, job, areas)) return [];
    return [`${job}: ${result ?? 'missing'}`];
  });
}

function main() {
  const mode = process.argv[2];
  if (!mode || !(mode in MODE_LABELS)) {
    console.error(
      `✖ Modo inválido: ${mode ?? '(vacío)'}. Esperado: ${Object.keys(MODE_LABELS).join(' | ')}`
    );
    process.exit(1);
  }

  const rawNeeds = process.env.NEEDS ?? '{}';
  let needs;
  try {
    needs = JSON.parse(rawNeeds);
  } catch (error) {
    console.error(`✖ NEEDS no es JSON válido: ${error.message}`);
    process.exit(1);
  }

  const problematic = evaluateStageAggregator({ mode, needs });

  if (problematic.length > 0) {
    console.error(
      `❌ Entrada no-success en el stage ${MODE_LABELS[mode]} (failure, cancelled o skip no autorizado):`
    );
    for (const line of problematic) console.error(`   ${line}`);
    console.error(
      '   Un skip solo se tolera si el job está desactivado por diseño o (en postbuild-tests) si el área no cambió.'
    );
    process.exit(1);
  }

  console.log(
    `✅ ${MODE_LABELS[mode]} succeeded: todos los jobs terminaron en success o con skip autorizado`
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
