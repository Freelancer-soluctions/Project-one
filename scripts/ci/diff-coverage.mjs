// Diff coverage gate: checks that files changed in the PR don't drop below a
// threshold. Reads coverage-summary.json (istanbul/v8) and `git diff --name-only origin/main`.
// Usage: node scripts/ci/diff-coverage.mjs [threshold=80] [summaryPath]
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Coverage summary keys are absolute paths (`/home/runner/work/...`), while
// `git diff --name-only` returns repo-relative ones, so both sides are
// normalized to repo-relative POSIX paths before they are compared. Without
// this, every changed file is looked up as missing and reported at 0%.
const toRepoPath = (repoRoot, filePath) =>
  path.relative(repoRoot, filePath).split(path.sep).join('/');

/**
 * @param {Object} params
 * @param {string[]} params.changed Repo-relative paths changed in the PR.
 * @param {object} params.summary Raw coverage-summary.json contents.
 * @param {string} params.repoRoot Absolute worktree root.
 * @param {number} [params.threshold]
 * @param {string} [params.workspace] Only judge files under this prefix, e.g. `apps/client/`.
 */
function computeDiffCoverage({
  changed,
  summary,
  repoRoot,
  threshold = 80,
  workspace,
}) {
  const coverage = new Map();
  for (const [key, entry] of Object.entries(summary)) {
    if (key === 'total') continue;
    coverage.set(toRepoPath(repoRoot, key), entry);
  }

  const relevant = changed.filter(
    (f) =>
      // Each gate only measures its own workspace: the server run cannot know
      // the coverage of a client file, and vice versa.
      (!workspace || f.startsWith(workspace)) &&
      /\.(js|jsx|ts|tsx)$/.test(f) &&
      existsSync(path.resolve(repoRoot, f)) &&
      // Exclude non-testable paths: tests, config, setup, scripts, docs, generated, UI presentational
      !/\/(tests?|__tests__|setup)\//.test(f) &&
      !/\.(test|spec)\.(js|jsx|ts|tsx)$/.test(f) &&
      !/\.config\.(js|mjs|ts)$/.test(f) &&
      !/^scripts\//.test(f) &&
      !/\/docs\//.test(f) &&
      // Fixtures con errores de tipo deliberados (p. ej. tsc-exit-test/bad.ts)
      // nunca se ejecutan ni pueden cubrirse, igual que los tests.
      !/^tsc-exit-test\//.test(f) &&
      // Storybook config: wiring that no test loads, same as `*.config.js`.
      !/\.storybook\//.test(f) &&
      !/\/src\/components\/ui\//.test(f) &&
      !/\/src\/components\/.*Datatable\.jsx$/.test(f) &&
      !/\/src\/components\/.*Dialog\.jsx$/.test(f) &&
      !/\/src\/components\/EventCalendar/.test(f) &&
      !/\/modules\/home\/components\/EventCalendar\.jsx$/.test(f) &&
      !/\/src\/App\.jsx$/.test(f) &&
      !/\/components\/PurchaseDialog\.jsx$/.test(f) &&
      !/\/components\/SalesDialog\.jsx$/.test(f) &&
      !/\/components\/dataTable\/dataTable\.jsx$/.test(f) &&
      !/\/src\/utils\/money\.js$/.test(f) &&
      !/\/src\/properties\//.test(f) &&
      !/\/routes\.ts$/.test(f) &&
      !/\/scripts\/generate-openapi/.test(f) &&
      !/\/src\/utils\/pagination\//.test(f)
  );

  let failed = false;
  const rows = [];
  for (const f of relevant) {
    const entry = coverage.get(f);
    if (!entry) {
      rows.push({ f, pct: 0 });
      failed = true;
      continue;
    }
    const pct = entry.lines?.pct ?? 0;
    rows.push({ f, pct });
    if (pct < threshold) failed = true;
  }

  return { rows, failed };
}

function runGate(threshold, summaryPath) {
  if (!existsSync(summaryPath)) {
    console.error(`::error::coverage summary not found: ${summaryPath}`);
    return 1;
  }

  const repoRoot = execSync('git rev-parse --show-toplevel', {
    encoding: 'utf8',
  }).trim();

  let changed = [];
  try {
    changed = execSync('git diff --name-only origin/main', {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch (e) {
    console.error('::error::git diff failed:', e.message);
    return 1;
  }

  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const { rows, failed } = computeDiffCoverage({
    changed,
    summary,
    repoRoot,
    threshold,
    workspace: summaryPath.startsWith('apps/')
      ? `${summaryPath.split('/').slice(0, 2).join('/')}/`
      : undefined,
  });

  console.log(`Diff coverage (threshold ${threshold}%):`);
  for (const r of rows) console.log(`  ${r.pct.toFixed(1)}%  ${r.f}`);

  if (failed) {
    console.error(
      `::error::one or more changed files below ${threshold}% coverage`
    );
    return 1;
  }
  console.log('::notice::diff coverage OK');
  return 0;
}

export { computeDiffCoverage };

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const threshold = Number(process.argv[2] || 80);
  const summaryPath = process.argv[3] || 'coverage/coverage-summary.json';
  process.exit(runGate(threshold, summaryPath));
}
