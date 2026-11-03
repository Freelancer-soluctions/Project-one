#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const WORKSPACES = {
  'apps/client': 'client-react',
  'apps/server': 'server-express',
};

function runCommand(args, { cwd }) {
  return spawnSync('npm', args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

function runChangedTests(
  workspace,
  { root = ROOT, runCommand: run = runCommand } = {}
) {
  const packageName = WORKSPACES[workspace];
  if (!packageName) {
    console.error(`Unknown test workspace: ${workspace}`);
    return 2;
  }

  const reportsDir = path.join(root, workspace, 'reports');
  const reportPath = path.join(reportsDir, 'pre-push-vitest-results.json');
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.rmSync(reportPath, { force: true });

  console.log(`Running changed tests for ${workspace}...`);
  const scoped = run(
    [
      'run',
      'test:changed',
      `--workspace=${packageName}`,
      '--',
      '--reporter=default',
      '--reporter=json',
      `--outputFile.json=${reportPath}`,
    ],
    { cwd: root }
  );
  if (scoped.status !== 0) return scoped.status ?? 1;

  let testCount = null;
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    if (Number.isInteger(report.numTotalTests) && report.numTotalTests >= 0) {
      testCount = report.numTotalTests;
    }
  } catch {
    // A missing or invalid report is not evidence that the changed run executed tests.
  }

  if (testCount === null || testCount === 0) {
    const reason =
      testCount === 0
        ? 'the changed selection executed zero tests'
        : 'the JSON test report is unavailable';
    console.warn(
      `⚠️ ${workspace}: ${reason}; falling back to the full unit suite.`
    );
    const full = run(['run', 'test:unit', `--workspace=${packageName}`], {
      cwd: root,
    });
    return full.status ?? 1;
  }

  console.log(
    `✅ ${workspace}: changed selection executed ${testCount} test(s).`
  );
  return 0;
}

export { runChangedTests };

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const status = runChangedTests(process.argv[2]);
  process.exit(status);
}
