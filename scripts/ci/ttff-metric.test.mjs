import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, afterEach } from 'vitest';
import {
  analyzeRun,
  buildMarkdown,
  buildShort,
  computeHitRate,
  firstXPct,
  redFilesOf,
} from './ttff-metric.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, 'ttff-metric.mjs');
const TMP = [];

function makeWorkspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttff-metric-'));
  fs.mkdirSync(path.join(dir, 'reports'), { recursive: true });
  TMP.push(dir);
  return dir;
}

function fileEntry(wsDir, rel, { status, start, end }) {
  return {
    name: path.join(wsDir, rel),
    status,
    startTime: start,
    endTime: end,
    assertionResults: [{ status }],
  };
}

afterEach(() => {
  while (TMP.length) fs.rmSync(TMP.pop(), { recursive: true, force: true });
});

describe('analyzeRun — early failure', () => {
  it('reports TTFF, % of suite and failures within the first X%', () => {
    const ws = makeWorkspace();
    const results = {
      startTime: 0,
      testResults: [
        fileEntry(ws, 'src/a.unit.test.js', {
          status: 'passed',
          start: 0,
          end: 100,
        }),
        fileEntry(ws, 'src/b.unit.test.js', {
          status: 'failed',
          start: 100,
          end: 200,
        }),
        fileEntry(ws, 'src/c.unit.test.js', {
          status: 'passed',
          start: 200,
          end: 2200,
        }),
      ],
    };
    const report = analyzeRun(results, ws, 20);
    expect(report.ok).toBe(true);
    expect(report.noFirstFailure).toBe(false);
    expect(report.firstFailure).toBe('src/b.unit.test.js');
    expect(report.ttffMs).toBe(100);
    expect(report.failuresInFirstX).toBe(1);
    expect(report.failuresInFirstXPct).toBe(100);
    expect(report.suitePctBeforeFirstFailure).toBeCloseTo(
      (100 / 2200) * 100,
      4
    );
  });
});

describe('analyzeRun — late failure', () => {
  it('surfaces no failures in the first X% when the red file runs last', () => {
    const ws = makeWorkspace();
    const results = {
      startTime: 0,
      testResults: [
        fileEntry(ws, 'src/a.unit.test.js', {
          status: 'passed',
          start: 0,
          end: 2000,
        }),
        fileEntry(ws, 'src/b.unit.test.js', {
          status: 'passed',
          start: 2000,
          end: 4000,
        }),
        fileEntry(ws, 'src/c.unit.test.js', {
          status: 'failed',
          start: 4000,
          end: 4200,
        }),
      ],
    };
    const report = analyzeRun(results, ws, 20);
    expect(report.firstFailure).toBe('src/c.unit.test.js');
    expect(report.ttffMs).toBe(4000);
    expect(report.failuresInFirstX).toBe(0);
    expect(report.failuresInFirstXPct).toBe(0);
    expect(report.suitePctBeforeFirstFailure).toBeCloseTo(
      (4000 / 4200) * 100,
      4
    );
  });
});

describe('analyzeRun — green run', () => {
  it('reports an explicit no-first-failure value', () => {
    const ws = makeWorkspace();
    const results = {
      startTime: 0,
      testResults: [
        fileEntry(ws, 'src/a.unit.test.js', {
          status: 'passed',
          start: 0,
          end: 100,
        }),
      ],
    };
    const report = analyzeRun(results, ws);
    expect(report.ok).toBe(true);
    expect(report.noFirstFailure).toBe(true);
    expect(buildMarkdown({ ...report, historyAvailable: true })).toContain(
      'no first failure (sin primer fallo)'
    );
    expect(buildShort(report)).toBe(
      `TTFF ${report.workspace}: no first failure (sin primer fallo)`
    );
  });

  it('invalid shape -> ok:false', () => {
    expect(analyzeRun(null, '/ws').ok).toBe(false);
  });
});

describe('computeHitRate', () => {
  it('counts red files predicted by the history window', () => {
    const history = {
      runs: [
        {
          files: [
            { testfile: 'src/b.unit.test.js', failures: 2 },
            { testfile: 'src/clean.unit.test.js', failures: 0 },
          ],
        },
      ],
    };
    const hit = computeHitRate(
      ['src/b.unit.test.js', 'src/new.unit.test.js'],
      history
    );
    expect(hit).toEqual({ hits: 1, total: 2, pct: 50 });
  });

  it('no red files -> null', () => {
    expect(computeHitRate([], { runs: [] })).toBeNull();
  });
});

describe('redFilesOf', () => {
  it('returns workspace-relative red files only', () => {
    const ws = makeWorkspace();
    const results = {
      startTime: 0,
      testResults: [
        fileEntry(ws, 'src/a.unit.test.js', {
          status: 'passed',
          start: 0,
          end: 1,
        }),
        fileEntry(ws, 'src/b.unit.test.js', {
          status: 'failed',
          start: 1,
          end: 2,
        }),
      ],
    };
    expect(redFilesOf(results, ws)).toEqual(['src/b.unit.test.js']);
  });
});

describe('firstXPct', () => {
  it('defaults to 20 and rejects out-of-range values', () => {
    expect(firstXPct(undefined)).toBe(20);
    expect(firstXPct('nope')).toBe(20);
    expect(firstXPct(0)).toBe(20);
    expect(firstXPct(150)).toBe(20);
    expect(firstXPct('50')).toBe(50);
  });
});

describe('CLI exit-0 contract', () => {
  function runCli(args) {
    return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  }

  it('prints the markdown for a seeded workspace and exits 0', () => {
    const ws = makeWorkspace();
    fs.writeFileSync(
      path.join(ws, 'reports', 'vitest-results.json'),
      JSON.stringify({
        startTime: 0,
        testResults: [
          fileEntry(ws, 'src/a.unit.test.js', {
            status: 'failed',
            start: 0,
            end: 100,
          }),
        ],
      })
    );
    fs.mkdirSync(path.join(ws, 'node_modules', '.cache', 'tia'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(ws, 'node_modules', '.cache', 'tia', 'tia-history.json'),
      JSON.stringify({
        runs: [{ files: [{ testfile: 'src/a.unit.test.js', failures: 1 }] }],
      })
    );
    const run = runCli([ws, '--format=md']);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('First-failure (TTFF) metric');
    expect(run.stdout).toContain('history hit-rate | 100.0% (1/1)');
    expect(run.stdout).toContain('ordering history | hit');
  });

  it('missing workspace -> exit 0 with metric=unavailable', () => {
    const run = runCli(['ruta-que-no-existe-xyz', '--format=md']);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('metric | unavailable');
  });

  it('corrupt results JSON -> exit 0 with metric=unavailable', () => {
    const ws = makeWorkspace();
    fs.writeFileSync(path.join(ws, 'reports', 'vitest-results.json'), '{oops');
    const run = runCli([ws, '--format=md']);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('metric | unavailable');
  });

  it('green run prints the short "no first failure" line by default', () => {
    const ws = makeWorkspace();
    fs.writeFileSync(
      path.join(ws, 'reports', 'vitest-results.json'),
      JSON.stringify({
        startTime: 0,
        testResults: [
          fileEntry(ws, 'src/a.unit.test.js', {
            status: 'passed',
            start: 0,
            end: 100,
          }),
        ],
      })
    );
    const run = runCli([ws]);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('no first failure (sin primer fallo)');
  });
});
