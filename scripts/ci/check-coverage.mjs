#!/usr/bin/env node

/**
 * Enforce coverage thresholds from a workspace vitest.config.js against the
 * generated coverage-summary.json. Used by the ci-quality-dag Stage 4
 * coverage jobs (client-coverage, server-coverage) and by the local
 * `npm run coverage:check` command.
 *
 * It mirrors Vitest 4's own threshold semantics so the two can never disagree:
 *   - global thresholds are compared against `summary.total`
 *   - glob thresholds are compared against the aggregate of the matched files
 *   - `perFile` compares EVERY matched file against the same thresholds
 *   - a negative threshold means "at most N uncovered items", not a percentage
 *
 * Paths: Vitest matches glob patterns against each file's path relative to the
 * project root, but `coverage-summary.json` keys are absolute OS paths (with
 * backslashes on Windows). Keys are therefore normalized to workspace-relative
 * forward-slash form before matching, so the verdict is identical on Windows and
 * POSIX.
 *
 * Usage:
 *   node scripts/ci/check-coverage.mjs <workspace> [coverageDir] [--advisory]
 *
 *   <workspace>   path to the workspace, e.g. apps/client
 *   [coverageDir] optional override for the coverage directory
 *                 (defaults to <workspace>/coverage)
 *   --advisory    D18 diff-scoped mode: print every line tagged `[advisory]`
 *                 plus a `::notice::` annotation and ALWAYS exit 0, so a
 *                 diff-limited report never fails the job. Strict mode (the
 *                 default) is unchanged and is the only one that gates.
 *
 * Exit codes:
 *   0  coverage meets thresholds (or any outcome in --advisory mode)
 *   1  coverage below thresholds, EMPTY report, or report/config missing
 *   2  usage error (never masked by --advisory)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// `URL` is used for file-path resolution. ESLint's `no-undef` treats it as
// undeclared in ESM configs, so we declare it explicitly (Node 22 ships a
// built-in `URL`; the polyfill covers runtimes that lack it).
if (typeof globalThis.URL === 'undefined') {
  globalThis.URL = class URL {
    constructor() {
      this.href = '';
      this.origin = '';
      this.protocol = '';
      this.username = '';
      this.password = '';
      this.host = '';
      this.hostname = '';
      this.port = '';
      this.pathname = '';
      this.search = '';
      this.hash = '';
    }
    toString() {
      return this.href;
    }
    toJSON() {
      return this.href;
    }
  };
}
import { join, resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const advisory = argv.includes('--advisory');
const positional = argv.filter((a) => a !== '--advisory');
const workspace = positional[0];

// Resolve the workspace path from the repo root (where this script lives),
// not from the caller's CWD. CI always passes the absolute workspace path
// (`apps/client`, `apps/server`); a plain `client`/`server` resolves against
// the repo root so the local `npm run coverage:check -- client` and
// `npm run coverage:check -- server` commands keep working from anywhere.
const ROOT_URL = new URL('..', new URL('..', import.meta.url));
const ROOT = fileURLToPath(ROOT_URL);
const wsRoot = resolve(
  ROOT,
  workspace === 'client'
    ? 'apps/client'
    : workspace === 'server'
      ? 'apps/server'
      : workspace
);

// --advisory (D18): report the numbers but never fail. Every log line is
// tagged so it is filterable in the step summary, and ::notice:: lines are
// emitted for GitHub annotations.
if (advisory) {
  const tag =
    (orig) =>
    (...args) =>
      orig('[advisory]', ...args);
  console.log = tag(console.log.bind(console));
  console.error = tag(console.error.bind(console));
}

if (!workspace) {
  console.error(
    'Usage: node scripts/ci/check-coverage.mjs <workspace> [coverageDir] [--advisory]'
  );
  // Usage errors stay 2 even in advisory mode: nothing was evaluated.
  process.exit(2);
}

// `coverageDir` is optional and, when omitted, is discovered (see
// findCoverageDir). The workspace path `wsRoot` was already resolved above
// for the repo-root discovery step.
const coverageDir = positional[1]
  ? resolve(positional[1])
  : findCoverageDir(wsRoot);
const summaryPath = join(coverageDir, 'coverage-summary.json');

if (!existsSync(summaryPath)) {
  console.error(`❌ coverage-summary.json not found at ${summaryPath}`);
  console.error(
    '   Did the test job run with --coverage? (npm run test:coverage)'
  );
  process.exit(advisory ? 0 : 1);
}

// Locate a real coverage-summary.json when no explicit directory was given.
// CI always passes one (server: apps/server/tests/coverage, client:
// apps/client/coverage). The default matters locally for `npm run
// coverage:check -- client` (artifact at apps/client/coverage) and for a
// server vitest config that does not override reportsDirectory.
function findCoverageDir(root) {
  const candidates = [
    join(root, 'coverage'),
    join(root, 'tests', 'coverage'),
    ...readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => join(root, d.name)),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'coverage-summary.json'))) return dir;
  }
  return candidates[0];
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
  process.exit(advisory ? 0 : 1);
}

const thresholds = config?.test?.coverage?.thresholds;
if (!thresholds) {
  console.error(
    `❌ No coverage.thresholds found in ${workspace}/vitest.config.js`
  );
  process.exit(advisory ? 0 : 1);
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
if (!summary.total) {
  console.error('❌ coverage-summary.json has no "total" section');
  process.exit(advisory ? 0 : 1);
}

const METRICS = ['statements', 'branches', 'functions', 'lines'];
let failed = false;

// `100: true` is Vitest's shortcut for all four metrics at 100.
const numericThresholds = {};
if (thresholds['100'] === true) {
  for (const m of METRICS) numericThresholds[m] = 100;
} else {
  for (const m of METRICS) {
    if (typeof thresholds[m] === 'number') numericThresholds[m] = thresholds[m];
  }
}

const globThresholds = Object.entries(thresholds).filter(
  ([key]) =>
    !METRICS.includes(key) && !['100', 'perFile', 'autoUpdate'].includes(key)
);

// Files keyed by their workspace-relative, forward-slash path (D3).
const files = Object.keys(summary)
  .filter((k) => k !== 'total')
  .map((key) => ({
    rel: relative(wsRoot, key).split(sep).join('/'),
    metrics: summary[key],
  }));

// An empty report (0 files) is missing data, not 100% coverage: strict mode
// must fail on it (a vacuous green would defeat the tripwire), advisory mode
// reports it and exits 0 (D18).
if (!files.length) {
  console.error(`❌ empty coverage report (0 files) at ${summaryPath}`);
  console.error(
    '   No files to evaluate — treat as missing data, never as passing.'
  );
  if (advisory) {
    console.log(
      '::notice::empty coverage report — thresholds deferred to full-suite (D18)'
    );
  }
  process.exit(advisory ? 0 : 1);
}

// Vitest-compatible glob subset: `**`, `*` (never crosses `/`), `?`, literals.
function toRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      re += '.*';
      i++;
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

// Percentage, mirroring Vitest: a file with nothing to instrument counts as 100.
const pct = (v) => (v.total === 0 ? 100 : v.pct);

function aggregate(list, metric) {
  const total = list.reduce((a, f) => a + f.metrics[metric].total, 0);
  const covered = list.reduce((a, f) => a + f.metrics[metric].covered, 0);
  return total === 0 ? 100 : Math.floor((covered / total) * 10000) / 100;
}

function uncovered(list, metric) {
  return list.reduce(
    (a, f) => a + f.metrics[metric].total - f.metrics[metric].covered,
    0
  );
}

// A positive threshold is a minimum percentage; a negative one caps uncovered items.
function verdict(label, threshold, measured, uncoveredCount) {
  const ok =
    threshold < 0 ? uncoveredCount <= -threshold : measured >= threshold;
  const detail =
    threshold < 0
      ? `${uncoveredCount} uncovered (max ${-threshold})`
      : `${measured}% (threshold ${threshold}%)`;
  return { ok, detail, label };
}

console.log(`Coverage report: ${summaryPath}\n`);

// ---- Global floor -------------------------------------------------------
console.log('Workspace totals:');
for (const [metric, threshold] of Object.entries(numericThresholds)) {
  const r = verdict(
    metric,
    threshold,
    pct(summary.total[metric]),
    uncovered(files, metric)
  );
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.detail}`);
  if (!r.ok) failed = true;
}

// Top-level `perFile`: every file must clear the per-file minimums.
if (thresholds.perFile) {
  const perFile =
    thresholds.perFile === true ? numericThresholds : thresholds.perFile;
  const entries = Object.entries(perFile).filter(([k]) => METRICS.includes(k));
  console.log('\nPer-file thresholds:');
  if (!entries.length) {
    console.log('  (no per-file metrics configured)');
  } else {
    let breaches = 0;
    for (const f of files) {
      for (const [metric, threshold] of entries) {
        const r = verdict(
          `${f.rel} ${metric}`,
          threshold,
          pct(f.metrics[metric]),
          f.metrics[metric].total - f.metrics[metric].covered
        );
        if (!r.ok) {
          console.log(`  ❌ ${r.label}: ${r.detail}`);
          breaches++;
        }
      }
    }
    if (breaches) {
      console.log(`  ${breaches} per-file breach(es)`);
      failed = true;
    } else {
      console.log(
        `  ✅ all ${files.length} file(s) meet their per-file minimums`
      );
    }
  }
}

// ---- Granularity by glob ------------------------------------------------
for (const [glob, spec] of globThresholds) {
  const matched = files.filter((f) => toRegExp(glob).test(f.rel));
  console.log(`\nGlob \`${glob}\` (${matched.length} file(s)):`);
  if (!matched.length) {
    console.log(
      '  ⚠️  no files matched — pattern does not match anything in this workspace'
    );
    continue;
  }

  const gNumeric = {};
  if (spec['100'] === true) {
    for (const m of METRICS) gNumeric[m] = 100;
  } else {
    for (const m of METRICS) {
      if (typeof spec[m] === 'number') gNumeric[m] = spec[m];
    }
  }

  for (const [metric, threshold] of Object.entries(gNumeric)) {
    const r = verdict(
      metric,
      threshold,
      aggregate(matched, metric),
      uncovered(matched, metric)
    );
    console.log(`  ${r.ok ? '✅' : '❌'} aggregate ${metric}: ${r.detail}`);
    if (!r.ok) failed = true;
  }

  // Globs do NOT inherit the top-level perFile — they must set their own.
  if (spec.perFile) {
    const perFile = spec.perFile === true ? gNumeric : spec.perFile;
    const entries = Object.entries(perFile).filter(([k]) =>
      METRICS.includes(k)
    );
    let breaches = 0;
    for (const f of matched) {
      for (const [metric, threshold] of entries) {
        const r = verdict(
          `${f.rel} ${metric}`,
          threshold,
          pct(f.metrics[metric]),
          f.metrics[metric].total - f.metrics[metric].covered
        );
        if (!r.ok) {
          console.log(`  ❌ ${r.label}: ${r.detail}`);
          breaches++;
        }
      }
    }
    if (breaches) {
      console.log(`  ${breaches} per-file breach(es) inside this glob`);
      failed = true;
    } else if (entries.length) {
      console.log(
        `  ✅ all ${matched.length} file(s) meet the glob's per-file minimums`
      );
    }
  }
}

console.log('');
if (failed) {
  if (advisory) {
    console.log(
      '::notice::coverage below thresholds — deferred to full-suite by D18'
    );
    process.exit(0);
  }
  console.error(`❌ Coverage below thresholds for ${workspace}`);
  process.exit(1);
}
if (advisory) {
  console.log('::notice::coverage meets thresholds (advisory)');
}
console.log(`✅ Coverage meets thresholds for ${workspace}`);
