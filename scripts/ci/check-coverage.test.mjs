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

describe('coverage policy: objective and per-type thresholds', () => {
  function makePolicy(ws, policy) {
    const policyPath = path.join(ws, 'policy.json');
    fs.writeFileSync(policyPath, JSON.stringify(policy));
    return policyPath;
  }

  const HIGH_FLAT = `export default { test: { coverage: { thresholds: {
  statements: 90, branches: 90, functions: 90, lines: 90
} } } };\n`;

  it('falls back to flat thresholds for unit and names the type', () => {
    const { ws, covDir } = makeWs(summaryWith(50), HIGH_FLAT);
    const policy = makePolicy(ws, {
      version: 1,
      objectives: {},
      thresholds: {},
    });
    const result = run(ws, covDir, ['--policy', policy]);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Test type: unit (flat, flat fallback)');
    expect(result.stdout).toContain('(unit)');
  });

  it('evaluates the declared unit threshold set instead of flat thresholds', () => {
    const { ws, covDir } = makeWs(summaryWith(50), HIGH_FLAT);
    const policy = makePolicy(ws, {
      version: 1,
      objectives: {},
      thresholds: {
        [path.basename(ws)]: {
          unit: { statements: 40, branches: 40, functions: 40, lines: 40 },
        },
      },
    });
    const result = run(ws, covDir, ['--policy', policy, '--type', 'unit']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Test type: unit (policy:unit)');
  });

  it('refuses to evaluate integration without a declared integration set', () => {
    const { ws, covDir } = makeWs(summaryWith(50), HIGH_FLAT);
    const policy = makePolicy(ws, {
      version: 1,
      objectives: {},
      thresholds: {
        [path.basename(ws)]: {
          unit: { statements: 40, branches: 40, functions: 40, lines: 40 },
        },
      },
    });
    const result = run(ws, covDir, [
      '--policy',
      policy,
      '--type',
      'integration',
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('no integration threshold set declared');
  });

  it('evaluates integration against its own floors, never the unit set', () => {
    const { ws, covDir } = makeWs(summaryWith(50), HIGH_FLAT);
    const policy = makePolicy(ws, {
      version: 1,
      objectives: {},
      thresholds: {
        [path.basename(ws)]: {
          unit: { statements: 90, branches: 90, functions: 90, lines: 90 },
          integration: {
            statements: 60,
            branches: 60,
            functions: 60,
            lines: 60,
          },
        },
      },
    });
    const result = run(ws, covDir, [
      '--policy',
      policy,
      '--type',
      'integration',
    ]);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('(integration)');
    expect(result.stdout).toContain('threshold 60%');
    expect(result.stdout).not.toContain('threshold 90%');
  });

  it('fails closed when the objective sits below the enforced floor', () => {
    const { ws, covDir } = makeWs(summaryWith(50), HIGH_FLAT);
    const policy = makePolicy(ws, {
      version: 1,
      objectives: {
        [path.basename(ws)]: {
          statements: 30,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
      thresholds: {},
    });
    const result = run(ws, covDir, ['--policy', policy]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'objective.statements 30 is below the enforced floor 90'
    );
  });

  it('reports the objective without enforcing it', () => {
    const lowFlat = `export default { test: { coverage: { thresholds: {
  statements: 40, branches: 40, functions: 40, lines: 40
} } } };\n`;
    const { ws, covDir } = makeWs(summaryWith(50), lowFlat);
    const policy = makePolicy(ws, {
      version: 1,
      objectives: {
        [path.basename(ws)]: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
      thresholds: {},
    });
    const result = run(ws, covDir, ['--policy', policy]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('objective 80% (30pp to go; floor 40%)');
  });

  it('rejects a declared per-type set that omits metrics', () => {
    const { ws, covDir } = makeWs(summaryWith(50), HIGH_FLAT);
    const policy = makePolicy(ws, {
      version: 1,
      objectives: {},
      thresholds: {
        [path.basename(ws)]: {
          unit: { statements: 40 },
        },
      },
    });
    const result = run(ws, covDir, ['--policy', policy, '--type', 'unit']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('.branches is required');
    expect(result.stderr).toContain('.lines is required');
  });
});
