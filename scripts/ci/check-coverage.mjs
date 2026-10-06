#!/usr/bin/env node
/* globals process, console */
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
import { join, resolve, relative, sep } from 'node:path';
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
if (!summary.total) {
  console.error('❌ coverage-summary.json has no "total" section');
  process.exit(1);
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
  console.error(`❌ Coverage below thresholds for ${workspace}`);
  process.exit(1);
}
console.log(`✅ Coverage meets thresholds for ${workspace}`);
