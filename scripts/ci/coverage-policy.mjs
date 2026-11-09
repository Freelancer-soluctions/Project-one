#!/usr/bin/env node

/**
 * Coverage policy helpers shared by the guard and its tests.
 *
 * Thresholds live in `apps/<workspace>/vitest.config.*` because Vitest enforces
 * them. Two things deliberately stay OUTSIDE `coverage.thresholds`:
 *
 *   - `objective`: a display-only aspirational target. Vitest would enforce any
 *     non-metric key under `coverage.thresholds` as a glob, so keeping it there
 *     would silently turn a display value into a gate.
 *   - `thresholds.<workspace>.<type>`: per-test-type floor sets (unit vs
 *     integration). Same reason: Vitest would read `unit`/`integration` as glob
 *     patterns.
 *
 * Both live in `.coverage-policy.json`, a versioned file that is not imported
 * by Vitest. A workspace without a per-type block keeps using the flat
 * `coverage.thresholds` as its unit set (backward compatibility).
 */
import { existsSync, readFileSync } from 'node:fs';

export const METRICS = ['statements', 'branches', 'functions', 'lines'];
export const TEST_TYPES = ['unit', 'integration'];

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateMetricBlock(block, label, errors) {
  if (!isPlainObject(block)) {
    errors.push(`${label} must be an object`);
    return;
  }
  for (const metric of METRICS) {
    if (typeof block[metric] !== 'number' || !Number.isFinite(block[metric])) {
      errors.push(`${label}.${metric} must be a finite number`);
    }
  }
}

/** Read and shape-check `.coverage-policy.json` without throwing. */
export function loadCoveragePolicy(policyPath) {
  if (!existsSync(policyPath)) {
    return {
      policy: null,
      errors: [],
      warnings: [
        `coverage policy not found at ${policyPath} — objective and per-type thresholds are not declared`,
      ],
    };
  }

  let policy;
  try {
    policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  } catch (error) {
    return {
      policy: null,
      errors: [`coverage policy is not valid JSON: ${error.message}`],
      warnings: [],
    };
  }

  const errors = [];
  if (policy?.version !== 1) errors.push('coverage policy version must be 1');
  if (!isPlainObject(policy?.objectives)) {
    errors.push('coverage policy objectives must be an object');
  } else {
    for (const [workspace, objective] of Object.entries(policy.objectives)) {
      validateMetricBlock(objective, `objectives.${workspace}`, errors);
    }
  }
  if (!isPlainObject(policy?.thresholds)) {
    errors.push('coverage policy thresholds must be an object');
  } else {
    for (const [workspace, sets] of Object.entries(policy.thresholds)) {
      if (!isPlainObject(sets)) {
        errors.push(`thresholds.${workspace} must be an object`);
        continue;
      }
      for (const [type, block] of Object.entries(sets)) {
        if (!TEST_TYPES.includes(type)) {
          errors.push(
            `thresholds.${workspace}.${type} must be unit or integration`
          );
          continue;
        }
        if (!isPlainObject(block)) {
          errors.push(`thresholds.${workspace}.${type} must be an object`);
          continue;
        }
        for (const metric of METRICS) {
          if (!(metric in block)) {
            errors.push(
              `thresholds.${workspace}.${type}.${metric} is required`
            );
            continue;
          }
          if (
            typeof block[metric] !== 'number' ||
            !Number.isFinite(block[metric])
          ) {
            errors.push(
              `thresholds.${workspace}.${type}.${metric} must be a finite number`
            );
          }
        }
      }
    }
  }

  return { policy: errors.length ? null : policy, errors, warnings: [] };
}

/**
 * Pick the threshold set a verdict applies to.
 *
 * unit:        declared per-type set, else the flat config thresholds.
 * integration: must be declared explicitly; falling back would compare a unit
 *              run against integration floors (or vice versa), which the
 *              capability forbids.
 */
export function selectThresholds({ policy, workspace, type, flatThresholds }) {
  const declared = policy?.thresholds?.[workspace]?.[type];
  if (declared) {
    return { thresholds: declared, source: `policy:${type}`, fallback: false };
  }
  if (type === 'unit') {
    return { thresholds: flatThresholds, source: 'flat', fallback: true };
  }
  return {
    thresholds: null,
    source: null,
    fallback: false,
    error: `no ${type} threshold set declared for ${workspace} in the coverage policy — refusing to compare against unit floors`,
  };
}

/** Objective is display-only, but it can never sit below the enforced floor. */
export function validateObjective({ objective, thresholds }) {
  if (!objective) return [];
  const errors = [];
  for (const metric of METRICS) {
    const target = objective[metric];
    if (typeof target !== 'number' || !Number.isFinite(target)) {
      errors.push(`objective.${metric} must be a finite number`);
      continue;
    }
    const floor = thresholds?.[metric];
    if (typeof floor !== 'number' || !Number.isFinite(floor)) {
      errors.push(
        `objective.${metric} cannot be validated: floor ${metric} is not numeric`
      );
      continue;
    }
    if (floor < 0) {
      errors.push(
        `objective.${metric} cannot be compared with the negative floor ${floor} (uncovered-count cap)`
      );
      continue;
    }
    if (target < floor) {
      errors.push(
        `objective.${metric} ${target} is below the enforced floor ${floor}`
      );
    }
  }
  return errors;
}

/** Human-readable objective line for one metric; never changes the verdict. */
export function objectiveLine({ target, measured, floor }) {
  if (typeof target !== 'number' || typeof floor !== 'number') return null;
  const gap = Math.round((target - measured) * 100) / 100;
  const state = gap <= 0 ? 'met' : `${gap}pp to go`;
  return `objective ${target}% (${state}; floor ${floor}%)`;
}
