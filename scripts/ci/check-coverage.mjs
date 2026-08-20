#!/usr/bin/env node
/* globals process, console */
/**
 * Enforce coverage thresholds from a workspace vitest.config.js against the
 * generated coverage-summary.json. Used by the ci-quality-dag Stage 4
 * coverage jobs (client-coverage, server-coverage).
 *
 * Usage:
 *   node scripts/ci/check-coverage.mjs <workspace> [coverageDir]
 *
 *   <workspace>   path to the workspace, e.g. apps/client
 *   [coverageDir] optional override for the coverage directory
 *                 (defaults to <workspace>/coverage)
 *
 * Exit codes:
 *   0  coverage meets thresholds
 *   1  coverage below thresholds or report/config missing
 *   2  usage error
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const workspace = process.argv[2];
if (!workspace) {
  console.error(
    'Usage: node scripts/ci/check-coverage.mjs <workspace> [coverageDir]'
  );
  process.exit(2);
}

const wsRoot = resolve(workspace);
const coverageDir = process.argv[3]
  ? resolve(process.argv[3])
  : join(wsRoot, 'coverage');
const summaryPath = join(coverageDir, 'coverage-summary.json');

if (!existsSync(summaryPath)) {
  console.error(`❌ coverage-summary.json not found at ${summaryPath}`);
  console.error(
    '   Did the test job run with --coverage? (npm run test:coverage)'
  );
  process.exit(1);
}

// Load thresholds from the workspace vitest config (single source of truth)
const configUrl = pathToFileURL(join(wsRoot, 'vitest.config.js')).href;
let config;
try {
  ({ default: config } = await import(configUrl));
} catch (err) {
  console.error(
    `❌ Failed to load ${workspace}/vitest.config.js: ${err.message}`
  );
  process.exit(1);
}

const thresholds = config?.test?.coverage?.thresholds;
if (!thresholds) {
  console.error(
    `❌ No coverage.thresholds found in ${workspace}/vitest.config.js`
  );
  process.exit(1);
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const total = summary.total;
if (!total) {
  console.error('❌ coverage-summary.json has no "total" section');
  process.exit(1);
}

const metrics = {
  statements: total.statements?.pct,
  branches: total.branches?.pct,
  functions: total.functions?.pct,
  lines: total.lines?.pct,
};

let failed = false;
console.log(`Coverage report: ${summaryPath}`);
for (const [metric, threshold] of Object.entries(thresholds)) {
  const actual = metrics[metric];
  if (actual === undefined) {
    console.error(`❌ Metric "${metric}" missing from coverage summary`);
    failed = true;
    continue;
  }
  const ok = actual >= threshold;
  console.log(
    `${ok ? '✅' : '❌'} ${metric}: ${actual}% (threshold ${threshold}%)`
  );
  if (!ok) failed = true;
}

if (failed) {
  console.error(`\n❌ Coverage below thresholds for ${workspace}`);
  process.exit(1);
}
console.log(`\n✅ Coverage meets thresholds for ${workspace}`);
