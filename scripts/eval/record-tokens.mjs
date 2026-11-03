#!/usr/bin/env node

/**
 * Token recording helper — OpenSpec change `opencode-eval-baseline`.
 *
 * Appends ONE validated row to a per-day JSONL log so the Phase 0 baseline is
 * comparable across operators and days.
 *
 * Schema owner: docs/opencode/eval/token-recording-template.md
 * Keep ROW_FIELDS, AGENTS, PHASES and SOURCES in lockstep with that file.
 *
 * No dependencies beyond Node builtins: no network, no secrets, no side
 * effects other than the single append (plus creating the parent directory).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const DEFAULT_TOKENS_DIR = path.join(ROOT, 'docs/opencode/eval/tokens');

/** Row keys, in the order the schema document declares them. */
export const ROW_FIELDS = [
  'date',
  'agent',
  'phase',
  'task_id',
  'run_id',
  'input_tokens',
  'output_tokens',
  'total_tokens',
  'source',
  'notes',
];

export const AGENTS = [
  'orchestrator',
  'planner',
  'developer',
  'reviewer',
  'project-manager',
  'researcher',
];

export const PHASES = [
  'grill-me',
  'spec',
  'review',
  'implement',
  'verify',
  'commit',
  'trello',
];

export const SOURCES = ['opencode-quota', 'opencode stats'];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const USAGE = `Usage:
  node scripts/eval/record-tokens.mjs --agent <agent> --phase <phase> \\
    --in <tokens> --out <tokens> --source <source> [options]

Required:
  --agent    ${AGENTS.join(' | ')}
  --phase    ${PHASES.join(' | ')}
  --in       non-negative integer (input/prompt tokens)
  --out      non-negative integer (output/completion tokens)
  --source   opencode-quota | "opencode stats"

Optional:
  --date     YYYY-MM-DD (default: today)
  --task     TASK-01 .. TASK-10 (eval task this row belongs to)
  --run      A | B (eval run this row belongs to)
  --total    non-negative integer; must equal --in + --out
  --notes    free text (quoted)
  --file     target JSONL path (default: docs/opencode/eval/tokens/<date>.jsonl)
  --help     show this message

Examples:
  node scripts/eval/record-tokens.mjs \\
    --agent developer --phase implement --task TASK-01 --run A \\
    --in 25100 --out 3900 --source opencode-quota --notes "two retries"

Schema: docs/opencode/eval/token-recording-template.md`;

/** Flag name -> row field. `--date`/`--file`/`--help` are handled separately. */
const FIELD_FLAGS = new Map([
  ['agent', 'agent'],
  ['phase', 'phase'],
  ['task', 'task_id'],
  ['run', 'run_id'],
  ['in', 'input_tokens'],
  ['out', 'output_tokens'],
  ['total', 'total_tokens'],
  ['source', 'source'],
  ['notes', 'notes'],
]);

/** Today in local time as YYYY-MM-DD (not UTC: a workday is a local day). */
export function today(now = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Parse argv into `{ values, file, help }`. Supports `--flag value` and
 * `--flag=value`. Unknown flags are collected in `values.unknown` so the
 * validator can reject them instead of silently ignoring a typo.
 */
export function parseArgs(argv) {
  const values = {};
  const unknown = [];
  let file = null;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      unknown.push(arg);
      continue;
    }

    const equalsAt = arg.indexOf('=');
    const name = equalsAt === -1 ? arg.slice(2) : arg.slice(2, equalsAt);
    let value = equalsAt === -1 ? undefined : arg.slice(equalsAt + 1);

    if (name === 'help' || name === 'h') {
      help = true;
      continue;
    }

    if (value === undefined) {
      value = argv[index + 1];
      // A following `--flag` means the value is missing, not a value.
      if (value === undefined || value.startsWith('--')) {
        unknown.push(`--${name} (missing value)`);
        continue;
      }
      index += 1;
    }

    if (name === 'date') {
      values.date = value;
    } else if (name === 'file') {
      file = value;
    } else if (FIELD_FLAGS.has(name)) {
      values[FIELD_FLAGS.get(name)] = value;
    } else {
      unknown.push(`--${name}`);
    }
  }

  values.unknown = unknown;
  values.file = file;
  values.help = help;
  return values;
}

/** Non-negative integer or `null` when the value is not one. */
function parseCount(value) {
  if (!/^\d+$/.test(String(value ?? ''))) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/**
 * Validate parsed flags and return `{ row }` on success or `{ errors }`.
 * Pure: no filesystem, no clock beyond the passed `now`.
 */
export function buildRow(input, { now = new Date() } = {}) {
  const errors = [];
  const date = input.date ?? today(now);

  if (!DATE_PATTERN.test(date)) {
    errors.push(`--date must be YYYY-MM-DD, received "${date}"`);
  }

  if (!AGENTS.includes(input.agent)) {
    errors.push(
      `--agent must be one of: ${AGENTS.join(', ')} (received "${input.agent ?? ''}")`
    );
  }

  if (!PHASES.includes(input.phase)) {
    errors.push(
      `--phase must be one of: ${PHASES.join(', ')} (received "${input.phase ?? ''}")`
    );
  }

  if (!SOURCES.includes(input.source)) {
    errors.push(
      `--source must be one of: ${SOURCES.join(', ')} (received "${input.source ?? ''}")`
    );
  }

  const inputTokens = parseCount(input.input_tokens);
  const outputTokens = parseCount(input.output_tokens);

  if (inputTokens === null) {
    errors.push('--in is required and must be a non-negative integer');
  }
  if (outputTokens === null) {
    errors.push('--out is required and must be a non-negative integer');
  }

  let totalTokens = null;
  if (input.total_tokens === undefined) {
    if (inputTokens !== null && outputTokens !== null) {
      totalTokens = inputTokens + outputTokens;
    }
  } else {
    totalTokens = parseCount(input.total_tokens);
    if (totalTokens === null) {
      errors.push('--total must be a non-negative integer');
    } else if (
      inputTokens !== null &&
      outputTokens !== null &&
      totalTokens !== inputTokens + outputTokens
    ) {
      errors.push(
        `--total (${totalTokens}) must equal --in + --out (${inputTokens + outputTokens})`
      );
    }
  }

  // Optional identifiers: absent and empty both mean "not attached to a run".
  const optional = (value) =>
    value === undefined || String(value).trim() === ''
      ? null
      : String(value).trim();
  const taskId = optional(input.task_id);
  const runId = optional(input.run_id);

  if (taskId && !/^TASK-(0[1-9]|10)$/.test(taskId)) {
    errors.push(`--task must be TASK-01 .. TASK-10 (received "${taskId}")`);
  }
  if (runId && !/^[AB]$/.test(runId)) {
    errors.push(`--run must be A or B (received "${runId}")`);
  }

  if (input.unknown?.length) {
    errors.push(`unknown arguments: ${input.unknown.join(' ')}`);
  }

  if (errors.length > 0) return { errors };

  return {
    row: {
      date,
      agent: input.agent,
      phase: input.phase,
      task_id: taskId,
      run_id: runId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      source: input.source,
      notes: optional(input.notes),
    },
  };
}

/** Append `row` as one JSONL line, creating the parent directory on demand. */
export function appendRow(filePath, row) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  // Explicit key order: the schema document's column order, not insertion order.
  const ordered = Object.fromEntries(
    ROW_FIELDS.map((field) => [field, row[field] ?? null])
  );
  const line = `${JSON.stringify(ordered)}\n`;
  fs.appendFileSync(filePath, line, 'utf8');
  return line.trimEnd();
}

function main(argv) {
  const parsed = parseArgs(argv);

  if (parsed.help) {
    console.log(USAGE);
    return 0;
  }
  if (argv.length === 0) {
    console.error('No arguments given.\n');
    console.error(USAGE);
    return 2;
  }

  const { row, errors } = buildRow(parsed);
  if (errors) {
    console.error('Invalid token row:');
    for (const error of errors) console.error(`  - ${error}`);
    console.error(`\n${USAGE}`);
    return 2;
  }

  const filePath = parsed.file
    ? path.resolve(parsed.file)
    : path.join(DEFAULT_TOKENS_DIR, `${row.date}.jsonl`);

  const line = appendRow(filePath, row);
  console.log(`Appended to ${path.relative(ROOT, filePath) || filePath}`);
  console.log(line);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

export default { buildRow, appendRow, parseArgs, today };
