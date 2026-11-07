import { readFileSync } from 'node:fs';

// Mutation scope comes from the same versioned inventory the coverage gate
// uses: every declared critical path (enforced or exempt) is mutated, so a path
// promoted to `enforced` is mutation-tested without editing this file.
const policy = JSON.parse(
  readFileSync(
    new URL('./.coverage-critical-paths.json', import.meta.url),
    'utf8'
  )
);
const mutate = policy.paths
  .filter((entry) => entry.workspace === 'server')
  .map((entry) => `apps/server/${entry.path}`)
  .sort();

/**
 * Nightly-only mutation testing (cost: one test run per mutant).
 *
 * `thresholds.break` is null on purpose: the blocking condition is a regression
 * against the versioned `stryker-baseline.json` (scripts/ci/mutation-baseline.mjs),
 * not an absolute score on the first run. `high`/`low` are reported for context.
 * `coverageAnalysis: 'off'` runs the full unit suite per mutant: the honest
 * signal, at the cost of runtime, which the nightly cadence absorbs.
 */
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  mutate,
  ignorePatterns: [
    // Test files must stay in the sandbox: they are what kills mutants.
    '**/*.d.ts',
    '**/node_modules/**',
    '**/coverage/**',
    '**/reports/**',
    // Only the server workspace runs under Stryker. Excluding the rest keeps
    // the sandbox small and avoids copying editor/skill junctions that Windows
    // cannot follow (EPERM on copyfile).
    'apps/client',
    'e2e',
    'docs',
    'openspec',
    '.github',
    '.kiro',
    '.agents',
    '.opencode',
    '**/*.md',
  ],
  // `related: true` (the runner default) finds no tests for the critical
  // modules that are currently coverage-exempt: they have no directly
  // importing unit tests yet. Run the configured unit suite for every mutant
  // instead, so the score reflects the real assertion strength (zero until
  // those modules get tests).
  // Unit-only project: the main config also includes integration tests that
  // need Postgres, which the nightly does not provision.
  vitest: {
    configFile: 'apps/server/vitest.mutation.config.ts',
    related: false,
  },
  coverageAnalysis: 'off',
  thresholds: { high: 80, low: 60, break: null },
  reporters: ['clear-text', 'progress', 'json', 'html'],
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  concurrency: 2,
  timeoutMS: 30000,
  timeoutFactor: 1.5,
};
