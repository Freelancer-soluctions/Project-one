#!/usr/bin/env node
/* globals process, console */
/**
 * `npm run pr:create` wrapper (L2.5 — "shifting left").
 *
 * Validates the PR title locally (via pr-title-check.js rules) and only then
 * delegates to `gh pr create`, forwarding ALL original arguments untouched.
 *
 * Why a wrapper: npm scripts cannot reliably forward quoted multi-word args
 * through shell `"$@"` (breaks under npm's cmd/sh scripting on Windows).
 * node receives process.argv directly, so quoting is preserved.
 *
 * Usage:
 *   npm run pr:create -- --title "feat: add feature" --body "Description"
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const titleCheck = join(here, 'pr-title-check.js');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ No arguments provided.');
  console.error(
    '   Usage: npm run pr:create -- --title "type: your title" --body "..."'
  );
  process.exit(1);
}

// 1) Validate the title BEFORE invoking gh (pass args through; the checker
//    extracts the --title value itself, handling multi-word quoted values).
const check = spawnSync(process.execPath, [titleCheck, ...args], {
  stdio: 'inherit',
});
if (check.status !== 0) {
  process.exit(check.status ?? 1);
}

// 2) Title is valid — forward all args unchanged to `gh pr create`.
//    On win32, `shell: true` re-joins argv through cmd, which would split
//    multi-word values ("feat: add DCO" -> 3 tokens). Re-quote any arg that
//    contains whitespace so the value survives the shell round-trip.
const ghArgs = args.map((a) =>
  /\s/.test(a) ? '"' + a.replace(/"/g, '\\"') + '"' : a
);
const gh = spawnSync('gh', ['pr', 'create', ...ghArgs], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (gh.error) {
  console.error('❌ Failed to run gh: ' + gh.error.message);
  process.exit(1);
}
process.exit(gh.status ?? 0);
