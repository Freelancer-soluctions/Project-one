#!/usr/bin/env node

/**
 * Exclusion budget — tracks the two escape hatches that can lower coverage
 * without anybody noticing:
 *
 *   - entries in `test.coverage.exclude` of each workspace Vitest config
 *   - `/* istanbul | c8 | v8 ignore *\/` markers in workspace source/tests
 *
 * Both are compared against a versioned baseline (`.coverage-exclusion-baseline.json`).
 * Growth without an auditable exception fails in blocking mode; `--advisory`
 * reports the same growth and exits 0 (the calibration phase the capability
 * requires before the budget can gate).
 *
 * Usage:
 *   node scripts/ci/coverage-exclusion-budget.mjs [--advisory]
 *   node scripts/ci/coverage-exclusion-budget.mjs --init   # (re)record baseline
 *   node scripts/ci/coverage-exclusion-budget.mjs --baseline <path>
 *
 * Exit codes:
 *   0  within budget, advisory mode, or baseline recorded with --init
 *   1  growth without an auditable exception, or a missing/corrupt baseline
 *   2  usage error
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const WORKSPACES = ['client', 'server'];
const DEFAULT_BASELINE = join(ROOT, '.coverage-exclusion-baseline.json');
const SOURCE_DIRS = ['src', 'tests'];
const SKIP_DIRS = new Set([
  'node_modules',
  'coverage',
  'dist',
  'build',
  '.git',
  '.stryker-tmp',
  '.vitest-reports',
  '__snapshots__',
]);
const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/;
const IGNORE_MARKER =
  /\/\*\s*(?:istanbul|c8|v8)\s+ignore(?:\s+[\w-]+)?\s*\*\//g;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Recursively collect ignore markers with their workspace-relative location. */
export function collectIgnoreMarkers(directory, root = directory, found = []) {
  if (!existsSync(directory)) return found;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectIgnoreMarkers(absolute, root, found);
      continue;
    }
    if (!SOURCE_FILE.test(entry.name) || entry.name.endsWith('.d.ts')) continue;
    const text = readFileSync(absolute, 'utf8');
    const matches = text.matchAll(IGNORE_MARKER);
    for (const match of matches) {
      const line = text.slice(0, match.index).split('\n').length;
      found.push({
        file: relative(root, absolute).split(sep).join('/'),
        line,
        marker: match[0],
      });
    }
  }
  return found;
}

/** Current exclusion surface for one workspace. */
export function collectWorkspaceBudget({ workspaceRoot, config, markerRoot }) {
  const markers = SOURCE_DIRS.flatMap((dir) =>
    collectIgnoreMarkers(join(workspaceRoot, dir), markerRoot ?? workspaceRoot)
  );
  return {
    exclusions: [...(config?.test?.coverage?.exclude ?? [])].sort(),
    ignoreMarkers: markers.length,
    markers,
  };
}

function exceptionIsAuditable(exception) {
  return (
    isPlainObject(exception) &&
    typeof exception.reason === 'string' &&
    exception.reason.trim() !== '' &&
    typeof exception.owner === 'string' &&
    exception.owner.trim() !== '' &&
    typeof exception.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(exception.date) &&
    !Number.isNaN(Date.parse(`${exception.date}T00:00:00.000Z`))
  );
}

function exceptionKey(exception) {
  return `${exception.workspace}:${exception.kind === 'markers' ? 'markers' : `exclusion:${exception.path}`}`;
}

/**
 * Compare current counts with the versioned baseline.
 *
 * Returns the growth report (always) and the errors that block in strict mode.
 */
export function evaluateExclusionBudget({ baseline, current }) {
  const errors = [];
  const growth = {};
  if (baseline?.version !== 1) errors.push('baseline.version must be 1');
  if (!isPlainObject(baseline?.workspaces)) {
    errors.push('baseline.workspaces must be an object');
    return { errors, growth };
  }

  const exceptions = Array.isArray(baseline.exceptions)
    ? baseline.exceptions
    : [];
  if (!Array.isArray(baseline.exceptions)) {
    errors.push('baseline.exceptions must be an array');
  }
  const auditable = new Map();
  exceptions.forEach((exception, index) => {
    const label = `baseline.exceptions[${index}]`;
    if (!WORKSPACES.includes(exception?.workspace)) {
      errors.push(`${label}.workspace must be client or server`);
      return;
    }
    if (!['exclusion', 'markers'].includes(exception.kind)) {
      errors.push(`${label}.kind must be exclusion or markers`);
      return;
    }
    if (!exceptionIsAuditable(exception)) {
      errors.push(`${label} requires a valid date, reason and owner`);
      return;
    }
    if (exception.kind === 'exclusion' && typeof exception.path !== 'string') {
      errors.push(`${label}.path is required for an exclusion exception`);
      return;
    }
    if (
      exception.kind === 'markers' &&
      (typeof exception.count !== 'number' || !Number.isFinite(exception.count))
    ) {
      errors.push(`${label}.count is required for a markers exception`);
      return;
    }
    auditable.set(exceptionKey(exception), exception);
  });

  for (const workspace of WORKSPACES) {
    const base = baseline.workspaces[workspace];
    const now = current[workspace];
    if (!isPlainObject(base) || !isPlainObject(now)) {
      errors.push(`${workspace}: baseline and current budget are required`);
      continue;
    }
    const baseExclusions = new Set(base.exclusions ?? []);
    const nowExclusions = new Set(now.exclusions ?? []);
    const added = [...nowExclusions]
      .filter((entry) => !baseExclusions.has(entry))
      .sort();
    const removed = [...baseExclusions]
      .filter((entry) => !nowExclusions.has(entry))
      .sort();
    const markerDelta = (now.ignoreMarkers ?? 0) - (base.ignoreMarkers ?? 0);

    for (const path of added) {
      if (
        !auditable.has(exceptionKey({ workspace, kind: 'exclusion', path }))
      ) {
        errors.push(
          `${workspace}: coverage exclusion ${path} is not tracked in the baseline and has no auditable exception`
        );
      }
    }
    if (markerDelta > 0) {
      const exception = auditable.get(
        exceptionKey({ workspace, kind: 'markers' })
      );
      if (!exception || exception.count < (now.ignoreMarkers ?? 0)) {
        errors.push(
          `${workspace}: ignore markers grew from ${base.ignoreMarkers ?? 0} to ${now.ignoreMarkers} without an auditable exception covering the new count`
        );
      }
    }

    growth[workspace] = {
      addedExclusions: added,
      removedExclusions: removed,
      markerDelta,
    };
  }

  return { errors, growth };
}

function parseArgs(argv) {
  const options = {
    advisory: false,
    init: false,
    baselinePath: DEFAULT_BASELINE,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--advisory') options.advisory = true;
    else if (arg === '--init') options.init = true;
    else if (arg === '--baseline') options.baselinePath = resolve(argv[++i]);
    else if (arg.startsWith('--baseline=')) {
      options.baselinePath = resolve(arg.slice('--baseline='.length));
    } else {
      console.error(
        'Usage: node scripts/ci/coverage-exclusion-budget.mjs [--advisory] [--init] [--baseline <path>]'
      );
      process.exit(2);
    }
  }
  return options;
}

async function loadWorkspaceConfig(workspace) {
  const workspaceRoot = join(ROOT, 'apps', workspace);
  const candidates = ['vitest.config.ts', 'vitest.config.js'].map((name) =>
    join(workspaceRoot, name)
  );
  const configPath = candidates.find((candidate) => existsSync(candidate));
  if (!configPath) throw new Error(`No Vitest config found for ${workspace}`);
  return (await import(pathToFileURL(configPath).href)).default;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const current = {};
  for (const workspace of WORKSPACES) {
    const config = await loadWorkspaceConfig(workspace);
    current[workspace] = collectWorkspaceBudget({
      workspaceRoot: join(ROOT, 'apps', workspace),
      config,
      markerRoot: join(ROOT, 'apps', workspace),
    });
  }

  if (options.init) {
    let exceptions = [];
    if (existsSync(options.baselinePath)) {
      try {
        exceptions = JSON.parse(
          readFileSync(options.baselinePath, 'utf8')
        ).exceptions;
      } catch {
        exceptions = [];
      }
    }
    const baseline = {
      version: 1,
      workspaces: Object.fromEntries(
        WORKSPACES.map((workspace) => [
          workspace,
          {
            exclusions: current[workspace].exclusions,
            ignoreMarkers: current[workspace].ignoreMarkers,
          },
        ])
      ),
      exceptions: Array.isArray(exceptions) ? exceptions : [],
    };
    writeFileSync(
      options.baselinePath,
      `${JSON.stringify(baseline, null, 2)}\n`
    );
    console.log(
      `✅ Exclusion budget baseline recorded at ${options.baselinePath}`
    );
    for (const workspace of WORKSPACES) {
      console.log(
        `   ${workspace}: ${current[workspace].exclusions.length} exclusion(s), ${current[workspace].ignoreMarkers} ignore marker(s)`
      );
    }
    return;
  }

  let baseline;
  try {
    baseline = JSON.parse(readFileSync(options.baselinePath, 'utf8'));
  } catch (error) {
    console.error(
      `❌ Cannot read exclusion baseline ${options.baselinePath}: ${error.message}`
    );
    process.exitCode = 1;
    return;
  }

  const { errors, growth } = evaluateExclusionBudget({ baseline, current });

  console.log('Exclusion budget:');
  for (const workspace of WORKSPACES) {
    const base = baseline.workspaces?.[workspace] ?? {};
    const now = current[workspace];
    const delta = growth[workspace] ?? {};
    console.log(
      `  ${workspace}: coverage.exclude ${now.exclusions.length} (baseline ${base.exclusions?.length ?? 0}), ignore markers ${now.ignoreMarkers} (baseline ${base.ignoreMarkers ?? 0})`
    );
    for (const path of delta.addedExclusions ?? []) {
      console.log(`    + exclusion ${path}`);
    }
    for (const path of delta.removedExclusions ?? []) {
      console.log(
        `    - exclusion ${path} (removed; baseline may be tightened)`
      );
    }
    if (delta.markerDelta > 0) {
      console.log(`    + ${delta.markerDelta} ignore marker(s)`);
      for (const marker of now.markers.slice(base.ignoreMarkers ?? 0)) {
        console.log(`      ${marker.file}:${marker.line} ${marker.marker}`);
      }
    }
  }

  if (!errors.length) {
    console.log('✅ Exclusion surface is within the versioned budget.');
    return;
  }

  for (const error of errors) {
    console.error(`❌ ${error}`);
  }
  if (options.advisory) {
    console.log(
      '::notice::exclusion budget exceeded — advisory mode does not fail the run'
    );
    return;
  }
  console.error(
    '   Record an auditable exception (reason, owner, date) in the baseline, or remove the exclusion.'
  );
  process.exitCode = 1;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
