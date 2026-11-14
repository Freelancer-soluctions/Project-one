#!/usr/bin/env node
// ============================================================================
// quality-aggregator-verdict.mjs — veredicto estricto de `prebuild-quality-complete`
// (change `ci-quality-gates-blocking-hardening`, capability
// `quality-gate-aggregator-strict`)
// ============================================================================
// Cualquier resultado distinto de `success` falla (`failure`, `cancelled` o
// `skipped`), salvo los skipped legítimos:
//   - evento distinto de `pull_request` (merge queue / dispatch): los jobs
//     PR-only se saltan por diseño;
//   - en `pull_request`, un job cuyo área NO cambió según `repo-discovery`.
// Fail-closed: un job desconocido saltado cuenta como no autorizado.
//
// Vive fuera del YAML para poder testear el veredicto sin ejecutar Actions
// (`scripts/ci/quality-aggregator-verdict.test.mjs`).
//
// Entradas (env): NEEDS (JSON de `toJSON(needs)`), EVENT_NAME, CLIENT, SERVER,
// E2E, SHARED, WORKFLOWS.
// Salida: una línea `<job>: <result>` por entrada problemática; exit 1 si hay
// alguna, 0 si todo es success o un skipped autorizado.
// ============================================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIENT_JOBS = new Set([
  'client-lint',
  'client-format-check',
  'client-typecheck',
  'client-complexity',
  'client-dead-code',
  'client-import-bounds',
  'frontend-budgets',
]);

const SERVER_JOBS = new Set([
  'server-lint',
  'server-format-check',
  'server-typecheck',
  'server-complexity',
  'server-dead-code',
  'server-import-bounds',
  'db-contract',
  'api-contract',
]);

const ALWAYS_RUNNING_JOBS = new Set(['openspec-validate']);

/**
 * Ámbito (output de `repo-discovery`) que decide si un skip está autorizado:
 * `'true'` = el área cambió (el job debió correr), `'false'` = no cambió,
 * `null` = job desconocido (fail-closed).
 *
 * @param {string} job
 * @param {{client: string, server: string, e2e: string, shared: string, workflows: string}} areas
 * @returns {string|null}
 */
function areaRan(job, areas) {
  if (CLIENT_JOBS.has(job)) return areas.client;
  if (SERVER_JOBS.has(job)) return areas.server;
  if (job === 'e2e-lint' || job === 'e2e-format-check') return areas.e2e;
  if (job === 'validate-pipeline') return areas.workflows;
  if (job === 'root-manifest-guard') return areas.shared;
  if (ALWAYS_RUNNING_JOBS.has(job)) return 'true';
  return null;
}

/**
 * @param {string} job
 * @param {string} eventName
 * @param {{client: string, server: string, e2e: string, shared: string, workflows: string}} areas
 * @returns {boolean}
 */
function isSkipAuthorized(job, eventName, areas) {
  if (eventName !== 'pull_request') return true;
  return areaRan(job, areas) === 'false';
}

/**
 * Evalúa el veredicto del agregador de calidad.
 *
 * @param {object} input
 * @param {Record<string, {result: string}>} input.needs
 * @param {string} input.eventName
 * @param {{client?: string, server?: string, e2e?: string, shared?: string, workflows?: string}} [input.areas]
 * @returns {string[]} entradas problemáticas (`<job>: <result>`)
 */
export function evaluateQualityAggregator({ needs, eventName, areas = {} }) {
  const normalizedAreas = {
    client: String(areas.client ?? 'false'),
    server: String(areas.server ?? 'false'),
    e2e: String(areas.e2e ?? 'false'),
    shared: String(areas.shared ?? 'false'),
    workflows: String(areas.workflows ?? 'false'),
  };

  return Object.entries(needs ?? {}).flatMap(([job, value]) => {
    const result = value?.result;
    if (result === 'success') return [];
    if (
      result === 'skipped' &&
      isSkipAuthorized(job, eventName, normalizedAreas)
    ) {
      return [];
    }
    return [`${job}: ${result ?? 'missing'}`];
  });
}

function main() {
  const rawNeeds = process.env.NEEDS ?? '{}';
  let needs;
  try {
    needs = JSON.parse(rawNeeds);
  } catch (error) {
    console.error(`✖ NEEDS no es JSON válido: ${error.message}`);
    process.exit(1);
  }

  const problematic = evaluateQualityAggregator({
    needs,
    eventName: process.env.EVENT_NAME ?? '',
    areas: {
      client: process.env.CLIENT,
      server: process.env.SERVER,
      e2e: process.env.E2E,
      shared: process.env.SHARED,
      workflows: process.env.WORKFLOWS,
    },
  });

  if (problematic.length > 0) {
    console.error(
      '❌ Entrada no-success en el substage QUALITY (failure, cancelled o skip no autorizado):'
    );
    for (const line of problematic) console.error(`   ${line}`);
    console.error(
      '   Un skip solo se tolera si el área no cambió (repo-discovery) o si el evento no es pull_request.'
    );
    process.exit(1);
  }

  console.log(
    '✅ Quality substage succeeded: todos los jobs terminaron en success o con skip autorizado por evento/diff'
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
