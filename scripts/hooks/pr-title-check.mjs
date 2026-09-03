#!/usr/bin/env node
/* globals process, console */
/**
 * Local PR title validator (L2.5 — "shifting left").
 *
 * Canonical source of truth: .github/workflows/ci.yml → job `pr-title-lint`
 * (amannn/action-semantic-pull-request@v6).
 *
 * Allowed types : feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, ops
 * Subject rule  : ^(?![A-Z]).+$  (subject must NOT start with an uppercase letter)
 * Scope         : optional — `type: desc` or `type(scope): desc`
 *
 * Usage:
 *   node scripts/hooks/pr-title-check.mjs "feat: add feature"
 *   node scripts/hooks/pr-title-check.mjs --title "feat: add feature" [--body "..."]
 *   node scripts/hooks/pr-title-check.mjs --title="feat: add feature"
 *   echo "feat: add feature" | node scripts/hooks/pr-title-check.mjs
 */

const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
  'ops',
];

const SUBJECT_PATTERN = /^(?![A-Z]).+$/;

function fail(title, reason) {
  console.error('❌ Invalid PR title: "' + title + '"');
  console.error('   Reason: ' + reason);
  console.error('   Allowed types: ' + TYPES.join(', '));
  console.error('   Example: feat(server): add DCO check to pre-push hook');
  process.exit(1);
}

function validate(title) {
  const match = title.match(/^([a-z]+)(\([^)]*\))?!?:\s*(.+)$/);
  if (!match) {
    fail(
      title,
      'does not match Conventional Commits format "type(scope): description"'
    );
  }
  const [, type, , subject] = match;
  if (!TYPES.includes(type)) {
    fail(title, 'unknown type "' + type + '"');
  }
  if (!SUBJECT_PATTERN.test(subject)) {
    fail(
      title,
      'subject must not start with an uppercase letter (got "' + subject + '")'
    );
  }
}

/**
 * Extract the PR title from argv.
 * Supports:
 *   --title "value"   (flag + separate token, possibly multi-word/quoted)
 *   --title=value     (inline form)
 * Otherwise falls back to the first bare positional argument.
 * Returns null when no title source is found in argv (caller may use stdin).
 */
function extractTitleFromArgv(argv) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--title') {
      const value = argv[i + 1];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
      console.error('❌ --title flag present but no value provided.');
      process.exit(1);
    }
    if (arg.startsWith('--title=')) {
      const value = arg.slice('--title='.length);
      if (value.length > 0) {
        return value;
      }
      console.error('❌ --title= present but empty value.');
      process.exit(1);
    }
  }
  // No --title flag: first non-flag positional wins (backward compatible)
  const positional = argv.find((a) => !a.startsWith('-'));
  return positional || null;
}

function main() {
  const title = extractTitleFromArgv(process.argv.slice(2));
  if (title) {
    validate(title.trim());
    console.log('✅ PR title is valid: "' + title.trim() + '"');
    process.exit(0);
  }

  // No CLI arg — read title from stdin
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    data += chunk;
  });
  process.stdin.on('end', () => {
    const title = data.split('\n')[0].trim();
    if (!title) {
      console.error('❌ No PR title provided (pass as CLI arg or via stdin).');
      process.exit(1);
    }
    validate(title);
    console.log('✅ PR title is valid: "' + title + '"');
    process.exit(0);
  });
}

main();
