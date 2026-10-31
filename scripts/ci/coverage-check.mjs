#!/usr/bin/env node
/**
 * Local mirror of the blocking CI full-suite gate (`coverage-full-gate`).
 *
 * Runs the same complete test scope as the CI full-suite gate and then applies
 * the exact same guard (`check-coverage.mjs`), so local and CI use the same
 * report inputs, thresholds, and blocking verdict.
 *
 * Client runs its full suite; server runs unit tests only, matching the server
 * coverage job's unit-only artifact. Neither run is diff-scoped: a partial TIA
 * report is not comparable to global thresholds (decision D18).
 *
 * Usage:
 *   npm run coverage:check              # both workspaces
 *   npm run coverage:check -- client    # one workspace
 *
 * Exit codes:
 *   0  both workspaces meet their thresholds
 *   1  at least one workspace is below its thresholds (or its tests failed)
 *   2  usage error
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

// Mirror of ci-test-jobs-activation: each workspace declares its own
// reportsDirectory, and the guard must read the summary from exactly there.
const WORKSPACES = [
  {
    id: 'client',
    dir: join(ROOT, 'apps', 'client'),
    // apps/client/vitest.config.js has no reportsDirectory -> Vitest default.
    coverageDir: join(ROOT, 'apps', 'client', 'coverage'),
    coverageScript: 'test:coverage',
  },
  {
    id: 'server',
    dir: join(ROOT, 'apps', 'server'),
    // apps/server/vitest.config.js sets reportsDirectory: './tests/coverage'.
    // CI's coverage job consumes unit-only coverage artifacts.
    coverageDir: join(ROOT, 'apps', 'server', 'tests', 'coverage'),
    coverageScript: 'test:coverage:unit',
  },
];

const requested = process.argv.slice(2);
if (
  requested.length &&
  requested.some((a) => !['client', 'server'].includes(a))
) {
  console.error('Usage: npm run coverage:check [-- client|server]');
  process.exit(2);
}

const targets = requested.length
  ? WORKSPACES.filter((w) => requested.includes(w.id))
  : WORKSPACES;

const results = [];

for (const ws of targets) {
  console.log(
    `\n${'='.repeat(64)}\n▶ ${ws.id}: ${ws.coverageScript} with coverage\n${'='.repeat(64)}`
  );

  const started = Date.now();
  const run = spawnSync(
    'npm',
    ['run', ws.coverageScript, `--workspace=apps/${ws.id}`],
    { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' }
  );
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  if (run.status !== 0) {
    // Vitest already reported why. Do not run the guard: without a fresh summary
    // its verdict would describe a stale report.
    console.error(
      `\n❌ ${ws.id}: the test run failed after ${seconds}s — coverage not evaluated.`
    );
    results.push({ id: ws.id, ok: false, reason: 'tests failed', seconds });
    continue;
  }

  const summary = join(ws.coverageDir, 'coverage-summary.json');
  if (!existsSync(summary)) {
    console.error(`\n❌ ${ws.id}: no coverage-summary.json at ${summary}`);
    results.push({ id: ws.id, ok: false, reason: 'missing summary', seconds });
    continue;
  }

  const guard = spawnSync(
    process.execPath,
    [
      join(ROOT, 'scripts', 'ci', 'check-coverage.mjs'),
      `apps/${ws.id}`,
      ws.coverageDir,
    ],
    { cwd: ROOT, stdio: 'inherit' }
  );

  results.push({
    id: ws.id,
    ok: guard.status === 0,
    reason: guard.status === 0 ? 'meets thresholds' : 'below thresholds',
    seconds,
  });
}

console.log(`\n${'='.repeat(64)}\nCoverage summary\n${'='.repeat(64)}`);
for (const r of results) {
  console.log(
    `  ${r.ok ? '✅' : '❌'} ${r.id.padEnd(7)} ${r.reason.padEnd(18)} (${r.seconds}s)`
  );
}

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error(
    `\n❌ ${failed.length}/${results.length} workspace(s) below thresholds: ${failed
      .map((r) => r.id)
      .join(', ')}`
  );
  console.error(
    '   Raise the floor with `npm run coverage:ratchet` once new tests land.'
  );
  process.exit(1);
}

console.log('\n✅ Both workspaces meet their coverage thresholds.');
console.log(
  '   This is the same verdict the CI full-suite coverage gate produces.'
);
process.exit(0);
