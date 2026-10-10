#!/usr/bin/env node
/**
 * Local coverage ratchet — raises the coverage floor, never lowers it.
 *
 * Delegates the "only up" guarantee to Vitest's own
 * `--coverage.thresholds.autoUpdate`, which rewrites thresholds in the config
 * ONLY when current coverage is better than the configured value. Reimplementing
 * that here would be more code with more ways to be wrong.
 *
 * This script never edits thresholds itself: it runs the full suite with
 * autoUpdate, then reads the resulting config diff to report exactly which
 * thresholds moved and from what to what. If Vitest rewrote anything else, the
 * diff check fails loudly rather than reporting a ratchet that did not happen.
 *
 * Usage:
 *   npm run coverage:ratchet              # both workspaces
 *   npm run coverage:ratchet -- client    # one workspace
 *
 * Exit codes:
 *   0  ran successfully (thresholds may or may not have moved)
 *   1  the run failed, or the config changed in an unexpected way
 *   2  usage error
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

const WORKSPACES = ['client', 'server'].map((id) => ({
  id,
  dir: join(ROOT, 'apps', id),
  configPath: join(ROOT, 'apps', id, 'vitest.config.js'),
}));

const requested = process.argv.slice(2);
if (
  requested.length &&
  requested.some((a) => !['client', 'server'].includes(a))
) {
  console.error('Usage: npm run coverage:ratchet [-- client|server]');
  process.exit(2);
}
const targets = requested.length
  ? WORKSPACES.filter((w) => requested.includes(w.id))
  : WORKSPACES;

// How the suite runs inside the ratchet. The server workspace declares its
// reportsDirectory under tests/coverage and the unit-only CI job
// (test:coverage:unit:ci) is what produces the coverage artifact, so the
// ratchet uses that command for the server. `test:coverage` is the full
// suite (unit + integration) and needs a live PostgreSQL, which is not
// available in a plain local checkout; it is a local convenience only.
const SERVER_COVERAGE_CMD = 'test:coverage:unit:ci';
const CLIENT_COVERAGE_CMD = 'test:coverage';

// Coverage command per workspace. CI always runs unit-only (`test:coverage:unit:ci`
// for server, the client equivalent) to produce its artifact, so the ratchet
// honors the same split here.
const coverageCmdFor = (id) =>
  id === 'server' ? SERVER_COVERAGE_CMD : CLIENT_COVERAGE_CMD;

// Compare the thresholds object before/after without parsing the whole config:
// the numeric thresholds are the only thing this command is allowed to move.
function snapshot(configPath) {
  const before = readFileSync(configPath, 'utf8');
  const numbers = [
    ...before.matchAll(
      /^\s{6,}(statements|branches|functions|lines):\s*(\d+)\s*,?\s*$/gm
    ),
  ]
    .map((m) => `${m[1]}=${m[2]}`)
    .join(',');
  return { text: before, numbers };
}

let failed = false;

for (const ws of targets) {
  console.log(
    `\n${'='.repeat(64)}\n▶ ${ws.id}: ratcheting thresholds up\n${'='.repeat(64)}`
  );

  const before = snapshot(ws.configPath);

  const run = spawnSync(
    'npm',
    [
      'run',
      coverageCmdFor(ws.id),
      `--workspace=apps/${ws.id}`,
      '--',
      '--coverage.thresholds.autoUpdate=true',
    ],
    { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' }
  );

  if (run.status !== 0) {
    console.error(`\n❌ ${ws.id}: run failed — thresholds left untouched.`);
    failed = true;
    continue;
  }

  const after = snapshot(ws.configPath);

  if (before.numbers === after.numbers) {
    console.log(
      `\nℹ️  ${ws.id}: no threshold moved (coverage is not above the current floor).`
    );
    console.log(
      '   Nothing to do — that is the expected result when you have not added tests yet.'
    );
    continue;
  }

  // Guard against Vitest touching anything we did not authorise.
  const beforeLines = before.text.split('\n');
  const afterLines = after.text.split('\n');
  const changed = [];
  for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
    if (beforeLines[i] !== afterLines[i]) {
      changed.push({
        line: i + 1,
        from: (beforeLines[i] ?? '').trim(),
        to: (afterLines[i] ?? '').trim(),
      });
    }
  }

  const suspicious = changed.filter(
    (c) => !/^(statements|branches|functions|lines):/.test(c.to)
  );
  if (suspicious.length) {
    console.error(
      `\n❌ ${ws.id}: config changed outside the threshold values:`
    );
    suspicious.forEach((c) =>
      console.error(`   L${c.line}: ${c.from}  ->  ${c.to}`)
    );
    console.error('   Review it before committing.');
    failed = true;
    continue;
  }

  console.log(`\n⬆️  ${ws.id}: thresholds raised:`);
  changed.forEach((c) => console.log(`   L${c.line}: ${c.from}  ->  ${c.to}`));
  console.log(
    '   Floors only ever move up; autoUpdate never lowers a threshold.'
  );
}

console.log('');
if (failed) {
  console.error('❌ Ratchet did not complete cleanly — see above.');
  process.exit(1);
}
console.log(
  '✅ Ratchet finished. Review and commit the config change together with your tests.'
);
process.exit(0);
