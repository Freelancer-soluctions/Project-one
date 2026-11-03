#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const WORKSPACES = ['client', 'server'];
const METRICS = new Set(['statements', 'branches', 'functions', 'lines']);

function thresholdEntries(value, prefix = '', result = new Map()) {
  for (const [key, item] of Object.entries(value ?? {})) {
    if (METRICS.has(key) && typeof item === 'number') {
      result.set(prefix ? `${prefix}:${key}` : key, item);
    } else if (item && typeof item === 'object' && !Array.isArray(item)) {
      thresholdEntries(item, prefix ? `${prefix}/${key}` : key, result);
    }
  }
  return result;
}

function thresholdWasLowered(current, baseline) {
  if (current < 0 && baseline < 0) return current > baseline;
  if (current >= 0 && baseline >= 0) return current < baseline;
  // Percentage floors and uncovered-item caps use different units. A change
  // between them needs an explicit exception because they are incomparable.
  return true;
}

function exceptionIsAuditable(exception) {
  return (
    typeof exception.reason === 'string' &&
    exception.reason.trim() !== '' &&
    typeof exception.owner === 'string' &&
    exception.owner.trim() !== '' &&
    typeof exception.approvedAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(exception.approvedAt) &&
    !Number.isNaN(Date.parse(`${exception.approvedAt}T00:00:00.000Z`))
  );
}

/** Return baseline/config drift errors without exiting, for unit tests and CLI. */
export function evaluateCoverageBaseline({ baseline, workspaceConfigs }) {
  const errors = [];
  if (baseline?.version !== 1) errors.push('baseline.version must be 1');
  if (!baseline?.thresholds || !baseline?.exclusions) {
    errors.push('baseline.thresholds and baseline.exclusions are required');
    return errors;
  }
  if (!Array.isArray(baseline.exceptions)) {
    errors.push('baseline.exceptions must be an array');
    return errors;
  }

  const usedExceptions = new Set();
  const thresholdExceptions = new Map();
  const exclusionExceptions = new Map();
  const exceptionKeys = new Set();
  baseline.exceptions.forEach((exception, index) => {
    const label = `baseline.exceptions[${index}]`;
    if (
      !exception ||
      typeof exception !== 'object' ||
      Array.isArray(exception)
    ) {
      errors.push(`${label} must be an object`);
      return;
    }
    if (!WORKSPACES.includes(exception.workspace)) {
      errors.push(`${label}.workspace must be client or server`);
      return;
    }
    if (!exceptionIsAuditable(exception)) {
      errors.push(`${label} requires a valid approvedAt, reason and owner`);
      return;
    }
    const exceptionKey = `${exception.workspace}:${exception.kind === 'exclusion' ? 'exclusion' : 'threshold'}:${exception.path}`;
    if (exceptionKeys.has(exceptionKey)) {
      errors.push(`${label} is a duplicate baseline exception`);
      return;
    }
    exceptionKeys.add(exceptionKey);
    if (exception.kind === 'exclusion') {
      exclusionExceptions.set(
        `${exception.workspace}:${exception.path}`,
        exception
      );
    } else if (
      typeof exception.path === 'string' &&
      METRICS.has(exception.path.split(':').at(-1)) &&
      typeof exception.from === 'number' &&
      typeof exception.to === 'number'
    ) {
      thresholdExceptions.set(
        `${exception.workspace}:${exception.path}`,
        exception
      );
    } else {
      errors.push(`${label} must identify an exclusion or numeric threshold`);
    }
  });

  for (const workspace of WORKSPACES) {
    const baselineThresholds = thresholdEntries(
      baseline.thresholds[workspace] ?? {}
    );
    const currentCoverage = workspaceConfigs[workspace]?.test?.coverage;
    if (!currentCoverage?.thresholds) {
      errors.push(
        `${workspace}: coverage.thresholds missing from Vitest config`
      );
      continue;
    }
    const currentThresholds = thresholdEntries(currentCoverage.thresholds);
    for (const [key, baselineValue] of baselineThresholds) {
      if (!currentThresholds.has(key)) {
        errors.push(`${workspace}:${key} missing from current thresholds`);
        continue;
      }
      const currentValue = currentThresholds.get(key);
      if (thresholdWasLowered(currentValue, baselineValue)) {
        const exceptionKey = `${workspace}:${key}`;
        const exception = thresholdExceptions.get(exceptionKey);
        if (
          !exception ||
          exception.from !== baselineValue ||
          exception.to !== currentValue
        ) {
          errors.push(
            `${workspace}:${key} lowered from ${baselineValue} to ${currentValue} without an exact auditable exception`
          );
        } else {
          usedExceptions.add(exception);
        }
      }
    }
    for (const [key, currentValue] of currentThresholds) {
      if (!baselineThresholds.has(key)) {
        errors.push(`${workspace}:${key} missing from versioned baseline`);
      } else if (
        !thresholdWasLowered(currentValue, baselineThresholds.get(key)) &&
        currentValue !== baselineThresholds.get(key)
      ) {
        // Ratchet increases are valid, but the recorded baseline advances with
        // the floor in the same change so subsequent comparisons stay exact.
        errors.push(
          `${workspace}:${key} raised to ${currentValue}; update the versioned baseline`
        );
      }
    }

    const baselineExclusions = new Set(baseline.exclusions[workspace] ?? []);
    const currentExclusions = new Set(currentCoverage.exclude ?? []);
    for (const exclusion of currentExclusions) {
      if (baselineExclusions.has(exclusion)) continue;
      const exception = exclusionExceptions.get(`${workspace}:${exclusion}`);
      if (!exception) {
        errors.push(`${workspace}: untracked coverage exclusion ${exclusion}`);
      } else {
        usedExceptions.add(exception);
      }
    }
  }

  for (const exception of baseline.exceptions) {
    if (exception && !usedExceptions.has(exception)) {
      errors.push(
        `stale baseline exception for ${exception.workspace}:${exception.path}`
      );
    }
  }
  return errors;
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
  const baselinePath = join(ROOT, '.coverage-baseline.json');
  let baseline;
  try {
    baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  } catch (error) {
    console.error(`❌ Cannot read ${baselinePath}: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  try {
    const workspaceConfigs = Object.fromEntries(
      await Promise.all(
        WORKSPACES.map(async (workspace) => [
          workspace,
          await loadWorkspaceConfig(workspace),
        ])
      )
    );
    const errors = evaluateCoverageBaseline({ baseline, workspaceConfigs });
    if (errors.length) {
      for (const error of errors) console.error(`❌ ${error}`);
      process.exitCode = 1;
      return;
    }
    console.log(
      '✅ Coverage thresholds and exclusions match the versioned baseline.'
    );
  } catch (error) {
    console.error(`❌ Cannot load workspace coverage config: ${error.message}`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
