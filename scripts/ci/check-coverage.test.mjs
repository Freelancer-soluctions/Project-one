import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluateCriticalPathCoverage } from './coverage-critical-paths.mjs';

// Test unitario de `check-coverage.mjs` (task 2.0): fixtures temporales de
// `coverage-summary.json` ejecutadas contra el script real via spawnSync.
// Cubre las 4 superficies de la task: bajo threshold ± `--advisory` y
// summary vacío (0 ficheros) ± `--advisory`.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, 'check-coverage.mjs');

// Piso deliberadamente alto: el fixture "bajo" (10%) siempre suspende.
const CONFIG_JS = `export default { test: { coverage: { thresholds: {
  statements: 90, branches: 90, functions: 90, lines: 90 } } } };\n`;
const GLOB_CONFIG_JS = `export default { test: { coverage: { thresholds: {
  statements: 40, branches: 40, functions: 40, lines: 40,
  'src/missing/**': { statements: 90, branches: 90, functions: 90, lines: 90 }
} } } };\n`;
const MATCHING_GLOB_CONFIG_JS = `export default { test: { coverage: { thresholds: {
  statements: 40, branches: 40, functions: 40, lines: 40,
  'src/**': { statements: 40, branches: 40, functions: 40, lines: 40 }
} } } };\n`;
const PER_FILE_CONFIG_JS = `export default { test: { coverage: { thresholds: {
  statements: 40, branches: 40, functions: 40, lines: 40,
  perFile: { statements: 80, branches: 80, functions: 80, lines: 80 }
} } } };\n`;
const NEGATIVE_CONFIG_JS = `export default { test: { coverage: { thresholds: {
  statements: -2, branches: -2, functions: -2, lines: -2
} } } };\n`;

function metric(total, covered) {
  return {
    total,
    covered,
    skipped: 0,
    pct: total === 0 ? 100 : (covered / total) * 100,
  };
}

function summaryWith(pctCovered) {
  const total = Object.fromEntries(
    ['statements', 'branches', 'functions', 'lines'].map((m) => [
      m,
      metric(100, pctCovered),
    ])
  );
  const file = { '/ws-fake/src/a.js': { ...total } };
  return { total, ...file };
}

/** Workspace temporal con `vitest.config.js` + `coverage/coverage-summary.json`. */
function makeWs(summary, config = CONFIG_JS) {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'check-coverage-'));
  fs.writeFileSync(path.join(ws, 'vitest.config.js'), config);
  const covDir = path.join(ws, 'coverage');
  fs.mkdirSync(covDir, { recursive: true });
  fs.writeFileSync(
    path.join(covDir, 'coverage-summary.json'),
    JSON.stringify(summary)
  );
  return { ws, covDir };
}

function run(ws, covDir, extra = []) {
  return spawnSync(process.execPath, [SCRIPT, ws, covDir, ...extra], {
    encoding: 'utf8',
  });
}

describe('check-coverage.mjs --advisory contract (task 2.0)', () => {
  it('bajo threshold + --advisory -> exit 0 con prefijo [advisory]', () => {
    const { ws, covDir } = makeWs(summaryWith(10));
    const runResult = run(ws, covDir, ['--advisory']);
    expect(runResult.status).toBe(0);
    expect(runResult.stdout + runResult.stderr).toContain('[advisory]');
  });

  it('bajo threshold sin flag -> exit 1 (modo estricto intacto)', () => {
    const { ws, covDir } = makeWs(summaryWith(10));
    const runResult = run(ws, covDir);
    expect(runResult.status).toBe(1);
  });

  it('prints contributing file paths when a global floor is breached', () => {
    const { ws, covDir } = makeWs(summaryWith(50));
    const runResult = run(ws, covDir);

    expect(runResult.status).toBe(1);
    expect(runResult.stdout + runResult.stderr).toContain(
      'Global statements floor contributors:'
    );
    expect(runResult.stdout + runResult.stderr).toContain('src/a.js');
  });

  it('summary vacio (0 ficheros) sin flag -> exit 1 (nunca verde vacuo)', () => {
    const { ws, covDir } = makeWs({
      total: Object.fromEntries(
        ['statements', 'branches', 'functions', 'lines'].map((m) => [
          m,
          metric(0, 0),
        ])
      ),
    });
    const runResult = run(ws, covDir);
    expect(runResult.status).toBe(1);
  });

  it('fails in strict mode when a declared glob matches no instrumented files', () => {
    const { ws, covDir } = makeWs(summaryWith(50), GLOB_CONFIG_JS);
    const runResult = run(ws, covDir);

    expect(runResult.status).toBe(1);
    expect(runResult.stdout + runResult.stderr).toContain('no files matched');
  });

  it('keeps unmatched glob thresholds advisory in --advisory mode', () => {
    const { ws, covDir } = makeWs(summaryWith(50), GLOB_CONFIG_JS);
    const runResult = run(ws, covDir, ['--advisory']);

    expect(runResult.status).toBe(0);
    expect(runResult.stdout + runResult.stderr).toContain('no files matched');
    expect(runResult.stdout + runResult.stderr).toContain('[advisory]');
  });

  it('passes a configured glob when its workspace-relative pattern matches', () => {
    const { ws, covDir } = makeWs(summaryWith(50), MATCHING_GLOB_CONFIG_JS);
    const summaryPath = path.join(covDir, 'coverage-summary.json');
    fs.writeFileSync(
      summaryPath,
      JSON.stringify({
        ...JSON.parse(fs.readFileSync(summaryPath, 'utf8')),
        [`${ws}/src/a.js`]: Object.fromEntries(
          ['statements', 'branches', 'functions', 'lines'].map((m) => [
            m,
            metric(100, 50),
          ])
        ),
      })
    );

    const runResult = run(ws, covDir);

    expect(runResult.status).toBe(0);
    expect(runResult.stdout).toContain('Glob `src/**` (1 file(s))');
  });

  it('fails when a file breaches its per-file threshold despite passing global totals', () => {
    const { ws, covDir } = makeWs(summaryWith(50), PER_FILE_CONFIG_JS);
    const runResult = run(ws, covDir);

    expect(runResult.status).toBe(1);
    expect(runResult.stdout).toContain('per-file breach(es)');
  });

  it('interprets negative thresholds as maximum uncovered item counts', () => {
    const { ws, covDir } = makeWs(summaryWith(97), NEGATIVE_CONFIG_JS);
    const runResult = run(ws, covDir);

    expect(runResult.status).toBe(1);
    expect(runResult.stdout).toContain('3 uncovered (max 2)');
  });

  it('normalizes absolute Windows coverage paths before matching globs', () => {
    const { ws, covDir } = makeWs(summaryWith(50), MATCHING_GLOB_CONFIG_JS);
    const summaryPath = path.join(covDir, 'coverage-summary.json');
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const fileMetrics = Object.fromEntries(
      ['statements', 'branches', 'functions', 'lines'].map((m) => [
        m,
        metric(100, 50),
      ])
    );
    fs.writeFileSync(
      summaryPath,
      JSON.stringify({
        total: summary.total,
        [path.join(ws, 'src', 'a.js')]: fileMetrics,
      })
    );

    const runResult = run(ws, covDir);

    expect(runResult.status).toBe(0);
    expect(runResult.stdout).toContain('Glob `src/**` (1 file(s))');
  });

  it('summary vacio (0 ficheros) con --advisory -> exit 0 + aviso', () => {
    const { ws, covDir } = makeWs({
      total: Object.fromEntries(
        ['statements', 'branches', 'functions', 'lines'].map((m) => [
          m,
          metric(0, 0),
        ])
      ),
    });
    const runResult = run(ws, covDir, ['--advisory']);
    expect(runResult.status).toBe(0);
    const out = runResult.stdout + runResult.stderr;
    expect(out).toContain('[advisory]');
    expect(out).toMatch(/empty coverage report|notice/i);
  });
});

describe('critical-path coverage evaluation', () => {
  it('reports a critical-path file below its floor even when other metrics pass', () => {
    const files = [
      {
        rel: 'src/modules/auth/service.ts',
        metrics: {
          statements: metric(100, 50),
          branches: metric(100, 100),
          functions: metric(100, 100),
          lines: metric(100, 100),
        },
      },
    ];
    const thresholds = {
      'src/modules/auth/service.ts': {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    };

    const breaches = evaluateCriticalPathCoverage({
      policy: {
        paths: [
          {
            workspace: 'server',
            path: 'src/modules/auth/service.ts',
            status: 'enforced',
          },
        ],
      },
      workspace: 'server',
      files,
      thresholds,
    });

    expect(breaches).toEqual([
      expect.objectContaining({
        path: 'src/modules/auth/service.ts',
        metric: 'statements',
        measured: 50,
        threshold: 80,
      }),
    ]);
  });
});
