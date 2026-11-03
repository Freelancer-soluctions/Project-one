#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DOC_PATH = join(ROOT, 'docs/learning/coverage-tripwire-floor-ratchet.md');
const POLICY_PATH = join(ROOT, '.coverage-critical-paths.json');
const WORKSPACES = ['client', 'server'];
const METRICS = ['statements', 'branches', 'functions', 'lines'];
const START = '<!-- coverage-floor-ratchet:start -->';
const END = '<!-- coverage-floor-ratchet:end -->';

/** Verify the manually maintained documentation block against generated data. */
export function verifyCoverageDoc(document, expected) {
  const start = document.indexOf(START);
  const end = document.indexOf(END);
  if (
    start < 0 ||
    end < 0 ||
    end < start ||
    document.indexOf(START, start + START.length) >= 0
  ) {
    return ['managed coverage figure markers are missing or invalid'];
  }
  const actual = document.slice(start + START.length, end).trim();
  return JSON.stringify(normalizeMarkdownTable(actual)) ===
    JSON.stringify(normalizeMarkdownTable(expected))
    ? []
    : ['managed coverage figures do not match the current configuration'];
}

/** Ignore Markdown table alignment padding while preserving every cell value. */
function normalizeMarkdownTable(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .map((line) =>
      line
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim())
    )
    .filter(
      (cells) =>
        !cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')))
    );
}

function globalFloors(thresholds) {
  return METRICS.map((metric) => thresholds[metric] ?? '—').join(' / ');
}

function globFloors(thresholds) {
  return (
    Object.entries(thresholds)
      .filter(
        ([key, value]) =>
          !METRICS.includes(key) && value && typeof value === 'object'
      )
      .map(([glob, floors]) => {
        const values = METRICS.map(
          (metric) => `${metric} ${floors[metric] ?? '—'}`
        ).join(', ');
        return `\`${glob}\` (${values})`;
      })
      .join('; ') || 'none'
  );
}

/** Render the figures as a stable, reviewable block in the canonical doc. */
export function renderCoverageFigures({ workspaceConfigs, policy }) {
  const rows = WORKSPACES.map((workspace) => {
    const thresholds = workspaceConfigs[workspace].test.coverage.thresholds;
    const paths = policy.paths.filter((entry) => entry.workspace === workspace);
    const enforced = paths.filter(
      (entry) => entry.status === 'enforced'
    ).length;
    const exempt = paths.filter((entry) => entry.status === 'exempt').length;
    const excludes =
      workspaceConfigs[workspace].test.coverage.exclude?.length ?? 0;
    return `| ${workspace} | ${globalFloors(thresholds)} | ${globFloors(thresholds)} | ${enforced} enforced / ${exempt} exempt | ${excludes} |`;
  });
  return [
    '| Workspace | Global floor (statements / branches / functions / lines) | Glob floors | Critical paths | Exclusions |',
    '| --- | --- | --- | --- | ---: |',
    ...rows,
  ].join('\n');
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
  try {
    const document = readFileSync(DOC_PATH, 'utf8');
    const policy = JSON.parse(readFileSync(POLICY_PATH, 'utf8'));
    const workspaceConfigs = Object.fromEntries(
      await Promise.all(
        WORKSPACES.map(async (workspace) => [
          workspace,
          await loadWorkspaceConfig(workspace),
        ])
      )
    );
    const errors = verifyCoverageDoc(
      document,
      renderCoverageFigures({ workspaceConfigs, policy })
    );
    if (errors.length) {
      for (const error of errors) console.error(`❌ ${error}`);
      process.exitCode = 1;
      return;
    }
    console.log(
      '✅ Canonical coverage figures match workspace configs and critical-path policy.'
    );
  } catch (error) {
    console.error(`❌ Cannot verify coverage documentation: ${error.message}`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
