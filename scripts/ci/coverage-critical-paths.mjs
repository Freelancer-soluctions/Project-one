#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const METRICS = ['statements', 'branches', 'functions', 'lines'];
const WORKSPACES = ['client', 'server'];

/** Return each enforced critical-path threshold violation in a report. */
export function evaluateCriticalPathCoverage({
  policy,
  workspace,
  files,
  thresholds,
}) {
  const breaches = [];
  for (const entry of policy.paths.filter(
    (path) => path.workspace === workspace && path.status === 'enforced'
  )) {
    const file = files.find((candidate) => candidate.rel === entry.path);
    if (!file) {
      breaches.push({
        path: entry.path,
        metric: 'all',
        measured: 'unreported',
        threshold: 'required',
        reason: 'no coverage report entry for enforced critical path',
      });
      continue;
    }

    const floors = thresholds[entry.path];
    for (const metric of METRICS) {
      const threshold = floors[metric];
      const counts = file.metrics[metric];
      const measured = counts.total === 0 ? 100 : counts.pct;
      const uncovered = counts.total - counts.covered;
      const ok =
        threshold < 0 ? uncovered <= -threshold : measured >= threshold;
      if (!ok) {
        breaches.push({
          path: entry.path,
          metric,
          measured: threshold < 0 ? uncovered : measured,
          threshold,
          reason:
            threshold < 0
              ? `uncovered count exceeds maximum ${-threshold}`
              : `measured coverage is below ${threshold}%`,
        });
      }
    }
  }
  return breaches;
}

/**
 * Validate the versioned critical-path inventory against the workspace floors.
 * Floors live in each Vitest config; exemptions live in the policy file.
 */
export function validateCriticalPaths(
  policy,
  {
    workspaceConfigs = {},
    workspaceRoots = {},
    checkFiles = true,
    now = new Date(),
  } = {}
) {
  const errors = [];
  if (policy?.version !== 1) errors.push('policy.version must be 1');
  if (!Array.isArray(policy?.paths)) {
    errors.push('policy.paths must be an array');
    return errors;
  }
  if (!Array.isArray(policy?.criticalRoots)) {
    errors.push('policy.criticalRoots must be an array');
    return errors;
  }

  const seen = new Set();
  const declaredPaths = new Set();
  for (const entry of policy.paths) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push('each policy path must be an object');
      continue;
    }

    const label = `${entry.workspace ?? '<workspace>'}:${entry.path ?? '<path>'}`;
    if (!WORKSPACES.includes(entry.workspace)) {
      errors.push(`${label}: workspace must be client or server`);
      continue;
    }
    if (
      typeof entry.path !== 'string' ||
      !entry.path.startsWith('src/') ||
      entry.path.includes('\\') ||
      entry.path.split('/').includes('..') ||
      entry.path.split('/').includes('.')
    ) {
      errors.push(
        `${label}: path must be a normalized workspace-relative src path`
      );
      continue;
    }

    const key = `${entry.workspace}:${entry.path}`;
    if (seen.has(key)) errors.push(`${label}: duplicate critical path`);
    seen.add(key);
    declaredPaths.add(key);

    if (!['enforced', 'exempt'].includes(entry.status)) {
      errors.push(`${label}: status must be enforced or exempt`);
      continue;
    }

    if (checkFiles && workspaceRoots[entry.workspace]) {
      const sourcePath = resolve(workspaceRoots[entry.workspace], entry.path);
      if (!existsSync(sourcePath))
        errors.push(`${label}: source file does not exist`);
    }

    if (entry.status === 'exempt') {
      if (typeof entry.reason !== 'string' || !entry.reason.trim()) {
        errors.push(`${label}: exemption reason is required`);
      }
      if (typeof entry.owner !== 'string' || !entry.owner.trim()) {
        errors.push(`${label}: exemption owner is required`);
      }
      if (
        typeof entry.expiresAt !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(entry.expiresAt) ||
        Number.isNaN(Date.parse(`${entry.expiresAt}T00:00:00.000Z`)) ||
        Date.parse(`${entry.expiresAt}T00:00:00.000Z`) <= now.getTime()
      ) {
        errors.push(
          `${label}: exemption expiresAt must be a future YYYY-MM-DD date`
        );
      }
      continue;
    }

    const thresholds =
      workspaceConfigs[entry.workspace]?.test?.coverage?.thresholds;
    const floor = thresholds?.[entry.path];
    if (!floor || typeof floor !== 'object' || Array.isArray(floor)) {
      errors.push(`${entry.path} is enforced but has no coverage floor`);
      continue;
    }
    for (const metric of METRICS) {
      if (
        typeof floor[metric] !== 'number' ||
        !Number.isFinite(floor[metric])
      ) {
        errors.push(`${label}: coverage floor is missing numeric ${metric}`);
      }
    }
  }

  for (const root of policy.criticalRoots) {
    if (!root || typeof root !== 'object' || Array.isArray(root)) {
      errors.push('each critical root must be an object');
      continue;
    }
    const label = `${root.workspace ?? '<workspace>'}:${root.path ?? '<path>'}`;
    if (
      !WORKSPACES.includes(root.workspace) ||
      typeof root.path !== 'string' ||
      !root.path.startsWith('src/') ||
      root.path.includes('\\') ||
      root.path.split('/').some((part) => part === '.' || part === '..')
    ) {
      errors.push(
        `${label}: critical root must be a normalized workspace-relative src directory`
      );
      continue;
    }
    const workspaceRoot = workspaceRoots[root.workspace];
    if (checkFiles && workspaceRoot) {
      const absoluteRoot = resolve(workspaceRoot, root.path);
      if (!existsSync(absoluteRoot)) {
        errors.push(`${label}: critical root directory does not exist`);
        continue;
      }
      for (const sourcePath of listSourceFiles(absoluteRoot)) {
        const relativePath = `${root.path}/${sourcePath}`;
        if (!declaredPaths.has(`${root.workspace}:${relativePath}`)) {
          errors.push(
            `${relativePath} is under a critical root but missing from policy`
          );
        }
      }
    }
  }

  for (const workspace of WORKSPACES) {
    const thresholds =
      workspaceConfigs[workspace]?.test?.coverage?.thresholds ?? {};
    for (const [path, floor] of Object.entries(thresholds)) {
      if (
        !path.startsWith('src/') ||
        /[*?{}]/.test(path) ||
        !floor ||
        typeof floor !== 'object' ||
        Array.isArray(floor)
      ) {
        continue;
      }
      if (!declaredPaths.has(`${workspace}:${path}`)) {
        errors.push(`${path} has a critical-path floor but no policy entry`);
      }
    }
  }

  return errors;
}

function listSourceFiles(directory) {
  const paths = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      paths.push(
        ...listSourceFiles(resolve(directory, entry.name)).map(
          (path) => `${entry.name}/${path}`
        )
      );
      continue;
    }
    if (
      /\.(?:[cm]?[jt]sx?)$/.test(entry.name) &&
      !/\.d\.ts$/.test(entry.name) &&
      !/\.test\.[cm]?[jt]sx?$/.test(entry.name)
    ) {
      paths.push(entry.name);
    }
  }
  return paths;
}

async function main() {
  const policyPath = join(ROOT, '.coverage-critical-paths.json');
  let policy;
  try {
    policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  } catch (error) {
    console.error(`❌ Cannot read ${policyPath}: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const workspaceConfigs = {};
  const workspaceRoots = {};
  for (const workspace of WORKSPACES) {
    const workspaceRoot = join(ROOT, 'apps', workspace);
    workspaceRoots[workspace] = workspaceRoot;
    const configPath = join(workspaceRoot, 'vitest.config.ts');
    const fallbackPath = join(workspaceRoot, 'vitest.config.js');
    const selectedConfig = existsSync(configPath) ? configPath : fallbackPath;
    if (!existsSync(selectedConfig)) {
      console.error(`❌ No Vitest config found for ${workspace}`);
      process.exitCode = 1;
      return;
    }
    try {
      workspaceConfigs[workspace] = (
        await import(pathToFileURL(selectedConfig).href)
      ).default;
    } catch (error) {
      console.error(`❌ Cannot load ${selectedConfig}: ${error.message}`);
      process.exitCode = 1;
      return;
    }
  }

  const errors = validateCriticalPaths(policy, {
    workspaceConfigs,
    workspaceRoots,
  });
  if (errors.length) {
    for (const error of errors) console.error(`❌ ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`✅ Valid critical-path policy (${policy.paths.length} paths).`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
