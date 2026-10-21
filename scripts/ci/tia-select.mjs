#!/usr/bin/env node
/**
 * Two-phase test selector - spec `ci-test-impact-analysis` (task 4.3, D4/D5).
 *
 * Phase 1 builds the candidate list as a union of:
 *   (a) `vitest list --changed --filesOnly` run with cwd = the workspace
 *       (so Vitest loads that workspace config), plus any positional file
 *       filter the caller passed (e.g. ".unit.test" on the server, which
 *       keeps the list unit-only exactly like `test:changed` does today);
 *   (b) `tia-history.mjs <ws> --inject`, one path per line on stdout
 *       (previously-failing files from the last N full-suite runs).
 *   The `--changed <base>` flag, when present in the caller argv, is
 *   forwarded to the `list` invocation (it selects the diff base) but is
 *   NEVER forwarded to the phase-2 run: Vitest 4 intersects positionals
 *   with `--changed` and would silently discard the injected files.
 *
 * Phase 2 spawns vitest FOR REAL with the explicit file list plus the
 * original argv received after `--` (reporters, `--coverage`,
 * `--coverage.changed`, `--config vitest.scoped.config.js`, quarantine
 * `--exclude` flags). When the union is empty it spawns vitest WITHOUT a
 * file list and lets the D7 zero-test guard fall back to the full suite.
 * The vitest exit code is propagated as this script exit code.
 *
 * It also writes `<ws>/reports/tia-selection.json` as
 * `{ "injected": <n>, "diff": <n> }` for the shadow metric (task 4.5;
 * `tia-metric.mjs` reads `.injected` from that exact path).
 *
 * Usage (CI and local, cwd-independent):
 *   node scripts/ci/tia-select.mjs <workspace> -- vitest run [args...]
 *   node scripts/ci/tia-select.mjs <workspace> --format=md   (audit only)
 *
 * Exit contract (D12): phase-1 failures degrade to empty candidate lists
 * and never fail the script. Once vitest is spawned its exit code is
 * propagated. A vitest binary that cannot even be launched exits 1: the
 * tests could not run, so reporting green would be a false pass.
 *
 * Portability (D11): node only, no shell, no `$(...)`, no platform
 * branches. Vitest is resolved with `require.resolve('vitest/vitest.mjs')`
 * scoped to the workspace, then spawned with `process.execPath`.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const HISTORY_SCRIPT = path.join(HERE, 'tia-history.mjs');

/** CLI flags that consume the following token as their value. */
const VALUE_FLAGS = new Set([
  '--config',
  '--coverage.changed',
  '--exclude',
  '--reporter',
  '--outputFile.junit',
  '--outputFile.json',
  '--format',
  '--project',
  '--root',
  '--dir',
  '--testTimeout',
]);

/**
 * Resolve the workspace dir: accepts a path as given (`apps/client`,
 * absolute, `./x`) or relative to the repo root. Returns null when missing.
 */
export function resolveWorkspaceDir(raw) {
  if (!raw) return null;
  const asGiven = path.resolve(raw);
  if (existsSync(asGiven)) return asGiven;
  const underRoot = path.join(ROOT, raw);
  if (existsSync(underRoot)) return underRoot;
  return null;
}

/**
 * Resolve the vitest entry point, preferring the workspace installation
 * (`require.resolve` scoped to the workspace dir) with a fallback to the
 * repo-root installation. Returns null when neither resolves.
 */
export function resolveVitestMjs(wsDir) {
  try {
    const req = createRequire(path.join(wsDir, 'package.json'));
    return req.resolve('vitest/vitest.mjs');
  } catch {
    // Fall through to the root fallback below.
  }
  const fallback = path.join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
  return existsSync(fallback) ? fallback : null;
}

/** Parse `vitest list --filesOnly` output: one path per line. */
export function parseFileList(stdout) {
  return String(stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Split the CLI argv into `{ workspaceArg, vitestArgv, auditMd }`.
 * Everything after the first `--` is the vitest invocation to reproduce;
 * the workspace is the last non-flag token before `--` (or the first
 * token when there is no `--`). `--format=md` without `--` means
 * audit-only mode (print the selection, run nothing).
 */
export function parseArgs(argv) {
  const args = [...argv];
  const auditMd = args.includes('--format=md');
  const sep = args.indexOf('--');
  if (sep === -1) {
    const workspaceArg = args.find((a) => !a.startsWith('--')) || 'apps/client';
    return { workspaceArg, vitestArgv: [], auditMd };
  }
  const before = args.slice(0, sep).filter((a) => a !== '--format=md');
  const nonFlag = before.filter((a) => !a.startsWith('--'));
  const workspaceArg =
    nonFlag.length > 0 ? nonFlag[nonFlag.length - 1] : 'apps/client';
  return { workspaceArg, vitestArgv: args.slice(sep + 1), auditMd };
}

/**
 * Split a vitest argv (without the leading `vitest` token) into the
 * `--changed` tokens (to forward to `list` only), the positional file
 * filters (to forward to BOTH `list` and the run) and the remaining run
 * flags. Bare `--changed` (no value) is preserved as-is.
 */
export function splitVitestArgv(argv) {
  const changedTokens = [];
  const positionals = [];
  const runFlags = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--changed') {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        changedTokens.push('--changed', next);
        i += 1;
      } else {
        changedTokens.push('--changed');
      }
    } else if (token.startsWith('--changed=')) {
      changedTokens.push(token);
    } else if (token.startsWith('-')) {
      runFlags.push(token);
      const eq = token.indexOf('=');
      if (
        eq === -1 &&
        VALUE_FLAGS.has(token) &&
        argv[i + 1] !== undefined &&
        !argv[i + 1].startsWith('-')
      ) {
        runFlags.push(argv[i + 1]);
        i += 1;
      }
    } else {
      positionals.push(token);
    }
  }
  return { changedTokens, positionals, runFlags };
}

/**
 * Build the argv for `vitest list`: positional filters first, then the
 * `--changed` selection (when the caller passed one), then `--filesOnly`.
 */
export function buildListArgs(positionals, changedTokens) {
  return [...positionals, ...changedTokens, '--filesOnly'];
}

/**
 * Build the argv for the phase-2 run: `run <explicit files...> <positionals>
 * <run flags>`. The `--changed` selection is intentionally absent: the
 * explicit list already encodes the diff, and Vitest 4 would intersect
 * positionals with `--changed` and discard the injected files.
 */
export function buildRunArgs(positionals, runFlags, files) {
  return ['run', ...files, ...positionals, ...runFlags];
}

/**
 * Run `vitest list` with cwd = the workspace. Returns the file array, or
 * [] when the listing fails or times out (the caller degrades to D7).
 */
export function listChangedFiles(vitestMjs, wsDir, listArgs, timeoutMs) {
  try {
    const run = spawnSync(process.execPath, [vitestMjs, 'list', ...listArgs], {
      cwd: wsDir,
      timeout: timeoutMs,
      encoding: 'utf8',
    });
    if (run.error || run.status !== 0) return [];
    return parseFileList(run.stdout);
  } catch {
    return [];
  }
}

/**
 * Run `tia-history.mjs <ws> --inject` and return its one-path-per-line
 * stdout as an array. Missing/corrupt history yields [] (never throws).
 */
export function readInjectedFiles(wsDir) {
  try {
    const run = spawnSync(
      process.execPath,
      [HISTORY_SCRIPT, wsDir, '--inject'],
      // stdout piped (parsed below); stderr inherited so the
      // corrupt-history advisory (task 10.4) is visible to the caller.
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
    );
    if (run.error || run.status !== 0) return [];
    return parseFileList(run.stdout);
  } catch {
    return [];
  }
}

/**
 * Write `<ws>/reports/tia-selection.json` as `{ injected, diff }`.
 * Returns the file path, or null when it cannot be written (non-fatal).
 */
export function writeSelection(wsDir, injected, diff) {
  try {
    const dir = path.join(wsDir, 'reports');
    mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'tia-selection.json');
    fs.writeFileSync(file, `${JSON.stringify({ injected, diff }, null, 2)}\n`);
    return file;
  } catch {
    return null;
  }
}

function printAuditMarkdown(label, diffFiles, injectedFiles) {
  const lines = [
    '## TIA selection (audit, advisory)',
    '',
    `Workspace: \`${label}\``,
    '',
    `diff files: ${diffFiles.length} · injected files: ${injectedFiles.length}`,
    '',
  ];
  const all = [...new Set([...diffFiles, ...injectedFiles])].sort();
  for (const file of all) lines.push(`- ${file}`);
  if (all.length === 0)
    lines.push('(no candidates - D7 full-suite fallback applies)');
  console.log(lines.join('\n'));
}

function main() {
  const { workspaceArg, vitestArgv, auditMd } = parseArgs(
    process.argv.slice(2)
  );
  const wsDir = resolveWorkspaceDir(workspaceArg);
  if (!wsDir) {
    console.error(
      `::warning::tia-select: workspace not found: ${workspaceArg}`
    );
    process.exit(0);
  }

  const vitestMjs = resolveVitestMjs(wsDir);
  if (!vitestMjs) {
    console.error(
      `::warning::tia-select: cannot resolve vitest/vitest.mjs for ${workspaceArg}`
    );
    process.exit(0);
  }

  // Phase 1: candidates = diff list UNION injected history.
  let argv = [...vitestArgv];
  if (argv.length > 0 && argv[0] === 'vitest') argv = argv.slice(1);
  // A stray `run` stays: buildRunArgs re-adds it, splitVitestArgv would
  // otherwise treat it as a positional filter.
  if (argv.length > 0 && argv[0] === 'run') argv = argv.slice(1);
  const { changedTokens, positionals, runFlags } = splitVitestArgv(argv);
  const diffFiles = listChangedFiles(
    vitestMjs,
    wsDir,
    buildListArgs(positionals, changedTokens),
    30000
  );
  const injectedFiles = readInjectedFiles(wsDir);
  const files = [...new Set([...diffFiles, ...injectedFiles])];

  const written = writeSelection(wsDir, injectedFiles.length, diffFiles.length);
  console.log(
    `tia-select: workspace=${workspaceArg} diff=${diffFiles.length} ` +
      `injected=${injectedFiles.length} total=${files.length}` +
      (written ? ` selection=${written}` : ' selection not written')
  );

  // No vitest invocation requested: audit/list mode only, always exit 0.
  if (vitestArgv.length === 0) {
    if (auditMd) {
      printAuditMarkdown(workspaceArg, diffFiles, injectedFiles);
    } else if (files.length > 0) {
      for (const file of [...files].sort()) console.log(`candidate: ${file}`);
    } else {
      console.log('tia-select: no candidates - D7 full-suite fallback applies');
    }
    process.exit(0);
  }

  // Phase 2: spawn vitest for real. Empty union => no explicit list, so
  // the D7 zero-test guard downstream can fall back to the full suite.
  const runArgs = buildRunArgs(positionals, runFlags, files);
  if (files.length === 0) {
    console.log(
      'tia-select: empty selection - spawning vitest without a file list (D7 applies)'
    );
  } else {
    console.log(
      `tia-select: spawning vitest with ${files.length} explicit file(s)`
    );
  }
  const spawned = spawnSync(process.execPath, [vitestMjs, ...runArgs], {
    cwd: wsDir,
    stdio: 'inherit',
  });
  if (spawned.error) {
    console.error(
      `tia-select: failed to launch vitest: ${spawned.error.message}`
    );
    process.exit(1);
  }
  process.exit(spawned.status === null ? 1 : spawned.status);
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(path.basename(process.argv[1]))
) {
  main();
}
