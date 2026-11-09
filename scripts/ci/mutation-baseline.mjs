#!/usr/bin/env node

/**
 * Mutation-testing baseline gate.
 *
 * Mutation testing is expensive, so it runs on a nightly cadence (never per PR).
 * The blocking condition is a regression against the versioned
 * `stryker-baseline.json`, not an absolute score: the first run has no known
 * baseline and must only record one.
 *
 * Lifecycle of the baseline:
 *   - missing file or `status: "unrecorded"` -> record the measured score in a
 *     proposed baseline file and exit 0 (advisory first run).
 *   - unreadable/corrupt file -> fail with a distinct "baseline corrupt"
 *     verdict. This is neither a regression nor a tool failure.
 *   - report missing -> fail with a distinct "tool did not produce a report"
 *     verdict. A broken tool is not a regression (task 6.2).
 *   - score below baseline (beyond tolerance) -> fail, listing survivors by
 *     name so the regression is actionable.
 *
 * The workflow never commits the proposed baseline: it uploads it as an
 * artifact so a human opens the PR (required signatures + review).
 *
 * Usage:
 *   node scripts/ci/mutation-baseline.mjs [--report <path>] [--baseline <path>]
 *     [--update <path>] [--summary <path>] [--tolerance <pp>]
 *
 * Exit codes:
 *   0  recorded, or score did not regress
 *   1  regression, corrupt baseline, missing report, or no mutants evaluated
 *   2  usage error
 */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DETECTED = new Set(['Killed', 'Timeout']);
const UNDETECTED = new Set(['Survived', 'NoCoverage']);
const IGNORED = new Set(['Ignored', 'Pending']);

function round(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Extract score and named survivors from a Stryker JSON report.
 * Mutants in CompileError/RuntimeError are counted separately: they signal a
 * broken toolchain, not a weak assertion.
 */
export function computeMutationScore(report) {
  const mutants = [];
  const errored = [];
  for (const [file, entry] of Object.entries(report?.files ?? {})) {
    for (const mutant of entry?.mutants ?? []) {
      const status = mutant.status;
      if (IGNORED.has(status)) continue;
      const location = mutant.location?.start ?? {};
      const record = {
        id: mutant.id,
        file,
        line: location.line ?? 0,
        column: location.column ?? 0,
        mutatorName: mutant.mutatorName ?? 'unknown',
        status,
        replacement: mutant.replacement ?? null,
      };
      if (DETECTED.has(status) || UNDETECTED.has(status)) mutants.push(record);
      else errored.push(record);
    }
  }

  const detected = mutants.filter((m) => DETECTED.has(m.status)).length;
  const undetected = mutants.filter((m) => UNDETECTED.has(m.status)).length;
  const total = detected + undetected;
  return {
    score: total === 0 ? null : round((detected / total) * 100),
    detected,
    undetected,
    total,
    survivors: mutants
      .filter((m) => UNDETECTED.has(m.status))
      .sort(
        (a, b) =>
          a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column
      ),
    errored,
  };
}

/** Decide the verdict without exiting, so the lifecycle is unit-testable. */
export function evaluateMutationBaseline({ baseline, score, tolerance = 0.5 }) {
  // A missing file reaches this function as null: that is the first-run
  // lifecycle, not corruption. A malformed object is corruption.
  if (baseline === null || baseline === undefined) {
    return { verdict: 'record', reason: 'baseline file does not exist yet' };
  }
  if (typeof baseline !== 'object' || Array.isArray(baseline)) {
    return { verdict: 'corrupt', reason: 'baseline is not a JSON object' };
  }
  if (baseline.version !== 1) {
    return { verdict: 'corrupt', reason: 'baseline.version must be 1' };
  }
  const unrecorded =
    baseline.status === 'unrecorded' ||
    baseline.score === null ||
    baseline.score === undefined;
  if (!unrecorded) {
    if (baseline.status !== 'recorded') {
      return {
        verdict: 'corrupt',
        reason: `baseline.status must be recorded or unrecorded (got ${baseline.status})`,
      };
    }
    if (
      typeof baseline.score !== 'number' ||
      !Number.isFinite(baseline.score)
    ) {
      return {
        verdict: 'corrupt',
        reason: 'baseline.score must be a finite number when recorded',
      };
    }
  }
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return { verdict: 'no-mutants', reason: 'the report contained no mutants' };
  }
  if (unrecorded)
    return { verdict: 'record', reason: 'baseline not recorded yet' };
  if (score + tolerance < baseline.score) {
    return {
      verdict: 'regress',
      reason: `score ${score}% is below baseline ${baseline.score}% (tolerance ${tolerance}pp)`,
    };
  }
  if (score > baseline.score) {
    return {
      verdict: 'pass-raise',
      reason: `score ${score}% improved over baseline ${baseline.score}%`,
    };
  }
  return { verdict: 'pass', reason: `score ${score}% matches baseline` };
}

function proposedBaseline({ score, result, thresholds }) {
  return {
    version: 1,
    status: 'recorded',
    score,
    detected: result.detected,
    undetected: result.undetected,
    mutantCount: result.total,
    recordedAt: new Date().toISOString().slice(0, 10),
    thresholds: thresholds ?? null,
  };
}

function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|');
}

/** Markdown rendered to both the workflow summary and a committed-artifact. */
export function renderMutationSummary({
  verdict,
  reason,
  result,
  baseline,
  proposed,
}) {
  const lines = ['## Mutation testing (nightly, critical paths)', ''];
  lines.push(`- **Verdict:** ${verdict} — ${reason}`);
  lines.push(
    `- **Score:** ${result.score === null ? 'n/a' : `${result.score}%`} (detected ${result.detected}, undetected ${result.undetected}, errored ${result.errored.length})`
  );
  if (baseline?.score !== null && baseline?.score !== undefined) {
    lines.push(`- **Baseline:** ${baseline.score}%`);
  }
  if (proposed) {
    lines.push(
      `- **Proposed baseline:** ${proposed.score}% — open a PR that updates \`stryker-baseline.json\` (never commit it directly to main).`
    );
  }
  if (result.survivors.length) {
    lines.push('', `### Surviving mutants (${result.survivors.length})`, '');
    lines.push('| File | Location | Mutator | Status |');
    lines.push('| --- | --- | --- | --- |');
    for (const mutant of result.survivors) {
      lines.push(
        `| ${escapeCell(mutant.file)} | ${mutant.line}:${mutant.column} | ${escapeCell(mutant.mutatorName)} | ${mutant.status} |`
      );
    }
  }
  if (result.errored.length) {
    lines.push('', `### Mutants not evaluated (${result.errored.length})`, '');
    for (const mutant of result.errored.slice(0, 20)) {
      lines.push(
        `- ${mutant.file}:${mutant.line}:${mutant.column} ${mutant.mutatorName} — ${mutant.status}`
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

function parseArgs(argv) {
  const options = {
    report: resolve(ROOT, 'reports/mutation/mutation.json'),
    baseline: resolve(ROOT, 'stryker-baseline.json'),
    update: resolve(ROOT, 'reports/mutation/stryker-baseline.proposed.json'),
    summary: resolve(ROOT, 'reports/mutation/mutation-summary.md'),
    tolerance: 0.5,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const read = (name) => {
      if (arg === `--${name}`) return argv[++i];
      if (arg.startsWith(`--${name}=`)) return arg.slice(name.length + 3);
      return undefined;
    };
    const report = read('report');
    const baseline = read('baseline');
    const update = read('update');
    const summary = read('summary');
    const tolerance = read('tolerance');
    if (report) options.report = resolve(report);
    else if (baseline) options.baseline = resolve(baseline);
    else if (update) options.update = resolve(update);
    else if (summary) options.summary = resolve(summary);
    else if (tolerance) options.tolerance = Number(tolerance);
    else {
      console.error(
        'Usage: node scripts/ci/mutation-baseline.mjs [--report <path>] [--baseline <path>] [--update <path>] [--summary <path>] [--tolerance <pp>]'
      );
      process.exit(2);
    }
  }
  if (!Number.isFinite(options.tolerance) || options.tolerance < 0) {
    console.error('❌ --tolerance must be a non-negative number');
    process.exit(2);
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const write = (path, contents) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents);
  };

  if (!existsSync(options.report)) {
    const message = `mutation report missing at ${options.report} — the tool did not produce results (not a regression)`;
    const summary = `## Mutation testing (nightly, critical paths)\n\n- **Verdict:** tool-failure — ${message}\n`;
    write(options.summary, summary);
    console.error(`❌ ${message}`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
    }
    process.exitCode = 1;
    return;
  }

  let report;
  try {
    report = JSON.parse(readFileSync(options.report, 'utf8'));
  } catch (error) {
    console.error(`❌ Cannot parse mutation report: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const result = computeMutationScore(report);

  let baseline = null;
  let baselineError = null;
  if (existsSync(options.baseline)) {
    try {
      baseline = JSON.parse(readFileSync(options.baseline, 'utf8'));
    } catch (error) {
      baselineError = error.message;
    }
  }

  const evaluation = baselineError
    ? { verdict: 'corrupt', reason: `baseline is unreadable: ${baselineError}` }
    : evaluateMutationBaseline({
        baseline,
        score: result.score,
        tolerance: options.tolerance,
      });

  const shouldPropose = ['record', 'pass-raise'].includes(evaluation.verdict);
  const proposed = shouldPropose
    ? proposedBaseline({
        score: result.score,
        result,
        thresholds: report.thresholds ?? baseline?.thresholds,
      })
    : null;
  if (proposed) write(options.update, `${JSON.stringify(proposed, null, 2)}\n`);

  const summary = renderMutationSummary({
    verdict: evaluation.verdict,
    reason: evaluation.reason,
    result,
    baseline,
    proposed,
  });
  write(options.summary, summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }

  const failed = ['regress', 'corrupt', 'no-mutants'].includes(
    evaluation.verdict
  );
  const log = failed ? console.error : console.log;
  log(`Mutation verdict: ${evaluation.verdict} — ${evaluation.reason}`);
  log(summary);
  if (proposed) {
    log(
      `📝 Proposed baseline written to ${options.update} (update via PR, never a direct commit to main).`
    );
  }
  process.exitCode = failed ? 1 : 0;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
