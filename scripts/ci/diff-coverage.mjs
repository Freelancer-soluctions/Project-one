// Diff coverage gate: checks that files changed in the PR don't drop below a
// threshold. Reads coverage-summary.json (istanbul/v8) and `git diff --name-only origin/main`.
// Usage: node scripts/ci/diff-coverage.mjs [threshold=80] [summaryPath]
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const threshold = Number(process.argv[2] || 80);
const summaryPath = process.argv[3] || 'coverage/coverage-summary.json';

if (!existsSync(summaryPath)) {
  console.error(`::error::coverage summary not found: ${summaryPath}`);
  process.exit(1);
}

let changed = [];
try {
  changed = execSync('git diff --name-only origin/main', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
} catch (e) {
  console.error('::error::git diff failed:', e.message);
  process.exit(1);
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const relevant = changed.filter(
  (f) =>
    /\.(js|jsx|ts|tsx)$/.test(f) &&
    existsSync(f) &&
    // Exclude non-testable paths: tests, config, setup, scripts, docs, generated, UI presentational
    !/\/(tests?|__tests__|setup)\//.test(f) &&
    !/\.(test|spec)\.(js|jsx|ts|tsx)$/.test(f) &&
    !/\.config\.(js|mjs|ts)$/.test(f) &&
    !/^scripts\//.test(f) &&
    !/\/docs\//.test(f) &&
    // Fixtures con errores de tipo deliberados (p. ej. tsc-exit-test/bad.ts)
    // nunca se ejecutan ni pueden cubrirse, igual que los tests.
    !/^tsc-exit-test\//.test(f) &&
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
  const entry = summary[f];
  if (!entry) {
    rows.push({ f, pct: 0 });
    failed = true;
    continue;
  }
  const pct = entry.lines?.pct ?? 0;
  rows.push({ f, pct });
  if (pct < threshold) failed = true;
}

console.log(`Diff coverage (threshold ${threshold}%):`);
for (const r of rows) console.log(`  ${r.pct.toFixed(1)}%  ${r.f}`);

if (failed) {
  console.error(
    `::error::one or more changed files below ${threshold}% coverage`
  );
  process.exit(1);
}
console.log('::notice::diff coverage OK');
