#!/usr/bin/env node

/**
 * Monthly ratchet proposal — measures the full suite and proposes floor raises
 * via pull request.
 *
 * This script NEVER uses Vitest `autoUpdate` and never runs inside a blocking
 * job: it computes the measured values, rewrites only the numeric global floor
 * lines in the workspace configs, advances the versioned baseline to the same
 * values, and writes a before/after proposal. The workflow then pushes the
 * result to a bot branch and opens (or updates) a PR, which still passes the
 * normal ratchet/baseline gate.
 *
 * Glob floors are intentionally left to the local `npm run coverage:ratchet`:
 * per-file semantics (`perFile`) require understanding which individual file
 * the floor binds to, and a cron must not guess.
 *
 * Usage:
 *   node scripts/ci/coverage-ratchet-cron.mjs [--write] [--workspace client|server]
 *     [--proposal <path>] [--summary <path>]
 *
 * Exit codes:
 *   0  measurement completed (with or without proposals)
 *   1  a workspace test run failed or produced no coverage summary
 *   2  usage error
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  renderCoverageFigures,
  replaceCoverageFigures,
} from './coverage-docs-verify.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DOC_PATH = join(ROOT, 'docs/learning/coverage-tripwire-floor-ratchet.md');
const METRICS = ['statements', 'branches', 'functions', 'lines'];
const WORKSPACES = [
  {
    id: 'client',
    dir: join(ROOT, 'apps', 'client'),
    coverageDir: join(ROOT, 'apps', 'client', 'coverage'),
    coverageScript: 'test:coverage',
  },
  {
    id: 'server',
    dir: join(ROOT, 'apps', 'server'),
    coverageDir: join(ROOT, 'apps', 'server', 'tests', 'coverage'),
    coverageScript: 'test:coverage:unit',
  },
];

function roundDown(value) {
  return Math.floor(value * 100) / 100;
}

/** Measured global percentages from `coverage-summary.json`. */
export function measuredGlobalMetrics(summary) {
  const result = {};
  for (const metric of METRICS) {
    const entry = summary?.total?.[metric];
    if (!entry || typeof entry.pct !== 'number') continue;
    result[metric] = entry.total === 0 ? 100 : roundDown(entry.pct);
  }
  return result;
}

/** Candidate raises: measured above the current floor, rounded down. */
export function computeGlobalProposals({ measured, thresholds }) {
  const proposals = [];
  for (const metric of METRICS) {
    const current = thresholds?.[metric];
    const value = measured?.[metric];
    if (typeof current !== 'number' || typeof value !== 'number') continue;
    if (current < 0) continue; // uncovered-item caps are not percentages
    if (value > current) {
      proposals.push({ metric, from: current, to: value });
    }
  }
  return proposals;
}

/**
 * Rewrite the global metric values inside the `thresholds: { ... }` block,
 * leaving glob blocks and every other line untouched. This is deliberately
 * line-based: it must not depend on Vitest's magicast (which is what
 * `autoUpdate` uses, and which this process must not invoke).
 */
export function applyThresholdEdits(configText, proposals) {
  if (!proposals.length) return { text: configText, changed: 0 };
  const lines = configText.split('\n');
  const start = lines.findIndex((line) => /\bthresholds\s*:\s*\{/.test(line));
  if (start < 0) return { text: configText, changed: 0 };

  const updates = new Map(proposals.map((p) => [p.metric, p.to]));
  let depth = 0;
  let changed = 0;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (i > start) {
      const metricMatch = line.match(
        /^(\s*)(statements|branches|functions|lines):\s*([\d.]+)(,?)(\s*)$/
      );
      if (depth === 1 && metricMatch) {
        const metric = metricMatch[2];
        if (updates.has(metric)) {
          const next = Number(updates.get(metric));
          if (next !== Number(metricMatch[3])) {
            lines[i] =
              `${metricMatch[1]}${metric}: ${next}${metricMatch[4]}${metricMatch[5]}`;
            changed++;
          }
        }
      }
    }
    depth += (line.match(/\{/g) ?? []).length;
    depth -= (line.match(/\}/g) ?? []).length;
    if (depth <= 0 && i >= start) break;
  }
  return { text: lines.join('\n'), changed };
}

/** Advance the versioned baseline so the proposal passes the ratchet gate. */
export function advanceBaseline(baseline, workspace, proposals) {
  if (!proposals.length) return baseline;
  baseline.thresholds ??= {};
  baseline.thresholds[workspace] ??= {};
  for (const { metric, to } of proposals) {
    baseline.thresholds[workspace][metric] = to;
  }
  return baseline;
}

function configPathFor(workspace) {
  const ts = join(workspace.dir, 'vitest.config.ts');
  return existsSync(ts) ? ts : join(workspace.dir, 'vitest.config.js');
}

function loadConfig(workspace) {
  return import(pathToFileURL(configPathFor(workspace)).href).then(
    (module) => module.default
  );
}

// Cache-busted import: the config file was just rewritten on disk.
function loadFreshConfig(workspace) {
  const url = pathToFileURL(configPathFor(workspace)).href;
  return import(`${url}?v=${Date.now()}`).then((module) => module.default);
}

function parseArgs(argv) {
  const options = {
    write: false,
    workspaces: WORKSPACES,
    proposal: join(ROOT, 'reports/coverage-ratchet-proposal.json'),
    summary: join(ROOT, 'reports/coverage-ratchet-proposal.md'),
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--write') options.write = true;
    else if (arg === '--workspace') {
      const requested = argv[++i];
      const match = WORKSPACES.filter((w) => w.id === requested);
      if (!match.length) {
        console.error('Usage: --workspace must be client or server');
        process.exit(2);
      }
      options.workspaces = match;
    } else if (arg === '--proposal') options.proposal = resolve(argv[++i]);
    else if (arg === '--summary') options.summary = resolve(argv[++i]);
    else {
      console.error(
        'Usage: node scripts/ci/coverage-ratchet-cron.mjs [--write] [--workspace client|server] [--proposal <path>] [--summary <path>]'
      );
      process.exit(2);
    }
  }
  return options;
}

function renderSummary(changes, generatedAt) {
  const lines = [
    '## Coverage ratchet proposal',
    '',
    `Generated ${generatedAt} from a full-suite measurement. Floors only move up; review before merging.`,
    '',
  ];
  if (!changes.length) {
    lines.push('No floor can be raised from the current measurement.');
    return `${lines.join('\n')}\n`;
  }
  lines.push('| Workspace | Metric | Before | After |');
  lines.push('| --- | --- | ---: | ---: |');
  for (const change of changes) {
    lines.push(
      `| ${change.workspace} | ${change.metric} | ${change.from} | ${change.to} |`
    );
  }
  lines.push(
    '',
    '`coverage.exclude` and ignore markers are unchanged; glob floors remain owned by the local ratchet.'
  );
  return `${lines.join('\n')}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const changes = [];
  const baselinePath = join(ROOT, '.coverage-baseline.json');
  let baseline = null;
  if (options.write) {
    try {
      baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
    } catch (error) {
      console.error(`❌ Cannot read ${baselinePath}: ${error.message}`);
      process.exitCode = 1;
      return;
    }
  }

  for (const workspace of options.workspaces) {
    console.log(
      `\n${'='.repeat(64)}\n▶ ${workspace.id}: measuring full-suite coverage\n${'='.repeat(64)}`
    );
    const run = spawnSync(
      'npm',
      ['run', workspace.coverageScript, `--workspace=apps/${workspace.id}`],
      { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' }
    );
    if (run.status !== 0) {
      console.error(`❌ ${workspace.id}: coverage run failed — no proposal.`);
      process.exitCode = 1;
      return;
    }
    const summaryPath = join(workspace.coverageDir, 'coverage-summary.json');
    if (!existsSync(summaryPath)) {
      console.error(`❌ ${workspace.id}: missing ${summaryPath}`);
      process.exitCode = 1;
      return;
    }
    const measured = measuredGlobalMetrics(
      JSON.parse(readFileSync(summaryPath, 'utf8'))
    );
    const config = await loadConfig(workspace);
    const thresholds = config?.test?.coverage?.thresholds ?? {};
    const proposals = computeGlobalProposals({ measured, thresholds });

    if (!proposals.length) {
      console.log(`ℹ️  ${workspace.id}: no floor can be raised.`);
      continue;
    }

    console.log(`⬆️  ${workspace.id}: proposed raises`);
    for (const proposal of proposals) {
      console.log(`   ${proposal.metric}: ${proposal.from} -> ${proposal.to}`);
      changes.push({ workspace: workspace.id, ...proposal });
    }

    if (options.write) {
      const configFile = configPathFor(workspace);
      const { text, changed } = applyThresholdEdits(
        readFileSync(configFile, 'utf8'),
        proposals
      );
      if (changed) writeFileSync(configFile, text);
      advanceBaseline(baseline, workspace.id, proposals);
    }
  }
  if (options.write && changes.length) {
    writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
    // The canonical doc cites the floors and `coverage:docs:verify` is a
    // blocking gate, so the same PR must refresh the managed block.
    const workspaceConfigs = {};
    for (const workspace of WORKSPACES) {
      workspaceConfigs[workspace.id] = await loadFreshConfig(workspace);
    }
    const criticalPaths = JSON.parse(
      readFileSync(join(ROOT, '.coverage-critical-paths.json'), 'utf8')
    );
    const document = readFileSync(DOC_PATH, 'utf8');
    writeFileSync(
      DOC_PATH,
      replaceCoverageFigures(
        document,
        renderCoverageFigures({ workspaceConfigs, policy: criticalPaths })
      )
    );
    console.log(
      `\n✅ Applied ${changes.length} raise(s), advanced the baseline and refreshed the canonical figures.`
    );
  } else if (!changes.length) {
    console.log(
      '\n✅ No proposal: every measured metric is at or below its floor.'
    );
  }

  const generatedAt = new Date().toISOString();
  const payload = { generatedAt, changes };
  mkdirSync(dirname(options.proposal), { recursive: true });
  writeFileSync(options.proposal, `${JSON.stringify(payload, null, 2)}\n`);
  const summary = renderSummary(changes, generatedAt);
  writeFileSync(options.summary, summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
  console.log(summary);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
