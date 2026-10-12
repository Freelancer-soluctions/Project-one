import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  HISTORY_N_DEFAULT,
  consolidateHistory,
  defaultStorePath,
  extractFileStats,
  historyLimit,
  loadHistoryFile,
  selectFailingFiles,
  shellEscape,
} from './tia-history.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, 'tia-history.mjs');

function runNode(args, options = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    ...options,
  });
}

function makeWs() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tia-history-'));
  fs.mkdirSync(path.join(dir, 'reports'), { recursive: true });
  return dir;
}

const RESULTS_FIXTURE = {
  numTotalTests: 3,
  testResults: [
    {
      name: '/ws/src/a.unit.test.js',
      status: 'passed',
      assertionResults: [
        { title: 'one', status: 'passed' },
        { title: 'two', status: 'passed' },
      ],
    },
    {
      name: '/ws/src/b.unit.test.js',
      status: 'failed',
      assertionResults: [
        { title: 'one', status: 'passed' },
        { title: 'two', status: 'failed' },
        { title: 'three', status: 'failed' },
      ],
    },
    { name: '/ws/src/c.unit.test.js', status: 'passed' },
  ],
};

describe('extractFileStats', () => {
  it('extracts {testfile, failures} per file', () => {
    expect(extractFileStats(RESULTS_FIXTURE)).toEqual([
      { testfile: '/ws/src/a.unit.test.js', failures: 0 },
      { testfile: '/ws/src/b.unit.test.js', failures: 2 },
      { testfile: '/ws/src/c.unit.test.js', failures: 0 },
    ]);
  });

  it('relativizes absolute names under baseDir', () => {
    const base = path.parse(process.cwd()).root === '/' ? '/ws' : 'C:\\ws';
    const json = {
      testResults: [
        {
          name: path.join(base, 'src', 'a.unit.test.js'),
          assertionResults: [{ status: 'failed' }],
        },
      ],
    };
    const [entry] = extractFileStats(json, base);
    expect(entry.testfile).toBe('src/a.unit.test.js');
    expect(entry.failures).toBe(1);
  });

  it('returns [] for unexpected shapes (never throws)', () => {
    expect(extractFileStats(null)).toEqual([]);
    expect(extractFileStats({})).toEqual([]);
    expect(extractFileStats({ testResults: 'nope' })).toEqual([]);
  });
});

describe('history window N=3', () => {
  it('default limit is 3', () => {
    expect(HISTORY_N_DEFAULT).toBe(3);
    const saved = process.env.TIA_HISTORY_N;
    delete process.env.TIA_HISTORY_N;
    expect(historyLimit()).toBe(3);
    process.env.TIA_HISTORY_N = 'not-a-number';
    expect(historyLimit()).toBe(3);
    process.env.TIA_HISTORY_N = '5';
    expect(historyLimit()).toBe(5);
    if (saved === undefined) delete process.env.TIA_HISTORY_N;
    else process.env.TIA_HISTORY_N = saved;
  });

  it('consolidateHistory keeps only the last N runs', () => {
    let history = { runs: [] };
    for (let i = 1; i <= 5; i += 1) {
      history = consolidateHistory(history, [], {
        runId: `run-${i}`,
        total: i,
        workspace: 'apps/client',
        limit: 3,
      });
    }
    expect(history.runs).toHaveLength(3);
    expect(history.runs.map((r) => r.runId)).toEqual([
      'run-3',
      'run-4',
      'run-5',
    ]);
  });
});

describe('selectFailingFiles', () => {
  it('dedupes and sorts files with failures > 0', () => {
    const history = {
      runs: [
        {
          files: [
            { testfile: 'b.test.js', failures: 1 },
            { testfile: 'a.test.js', failures: 2 },
            { testfile: 'clean.test.js', failures: 0 },
          ],
        },
        { files: [{ testfile: 'b.test.js', failures: 3 }] },
      ],
    };
    expect(selectFailingFiles(history)).toEqual(['a.test.js', 'b.test.js']);
  });

  it('empty history -> []', () => {
    expect(selectFailingFiles({ runs: [] })).toEqual([]);
    expect(selectFailingFiles(null)).toEqual([]);
  });
});

describe('shellEscape', () => {
  it('single-quotes paths and escapes inner quotes', () => {
    expect(shellEscape('a/b.test.js')).toBe("'a/b.test.js'");
    expect(shellEscape("a'b.test.js")).toBe("'a'\\''b.test.js'");
  });
});

describe('loadHistoryFile', () => {
  it('missing file -> empty history, not corrupt', () => {
    const res = loadHistoryFile(path.join(os.tmpdir(), 'tia-missing-xyz.json'));
    expect(res.history).toEqual({ runs: [] });
    expect(res.corrupt).toBe(false);
  });

  it('unreadable JSON -> corrupt flag, empty history', () => {
    const file = path.join(os.tmpdir(), `tia-bad-${Date.now()}.json`);
    fs.writeFileSync(file, '{oops');
    const res = loadHistoryFile(file);
    expect(res.corrupt).toBe(true);
    expect(res.history).toEqual({ runs: [] });
  });
});

describe('defaultStorePath', () => {
  it('lives under node_modules/.cache/tia/', () => {
    const p = defaultStorePath('/ws');
    expect(p).toBe(
      path.join('/ws', 'node_modules', '.cache', 'tia', 'tia-history.json')
    );
  });
});

describe('exit-0 contract', () => {
  it('--inject on missing workspace -> exit 0, empty stdout', () => {
    const run = runNode(['ruta-que-no-existe-xyz', '--inject']);
    expect(run.status).toBe(0);
    expect(run.stdout).toBe('');
  });

  it('--record without vitest-results.json -> exit 0 with warning', () => {
    const ws = makeWs();
    const run = runNode([ws, '--record']);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('::warning::');
  });

  it('--record with corrupt history store -> exit 0, starts fresh', () => {
    const ws = makeWs();
    fs.writeFileSync(
      path.join(ws, 'reports', 'vitest-results.json'),
      JSON.stringify(RESULTS_FIXTURE)
    );
    const out = path.join(ws, 'history.json');
    fs.writeFileSync(out, '{corrupt');
    const run = runNode([ws, '--record', '--out', out]);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('::warning::');
    const data = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(data.runs).toHaveLength(1);
  });

  it('record -> inject roundtrip prints only failing files', () => {
    const ws = makeWs();
    fs.writeFileSync(
      path.join(ws, 'reports', 'vitest-results.json'),
      JSON.stringify(RESULTS_FIXTURE)
    );
    const out = path.join(ws, 'history.json');
    const env = { ...process.env, GITHUB_RUN_ID: 'test-run-1' };
    const recorded = runNode([ws, '--record', '--out', out], { env });
    expect(recorded.status).toBe(0);
    const injected = runNode([ws, '--inject', '--in', out]);
    expect(injected.status).toBe(0);
    expect(injected.stdout.trim().split('\n')).toEqual([
      '/ws/src/b.unit.test.js',
    ]);
  });

  it('--format=argv shell-escapes injected paths', () => {
    const ws = makeWs();
    fs.writeFileSync(
      path.join(ws, 'reports', 'vitest-results.json'),
      JSON.stringify(RESULTS_FIXTURE)
    );
    const out = path.join(ws, 'history.json');
    runNode([ws, '--record', '--out', out]);
    const injected = runNode([ws, '--inject', '--in', out, '--format=argv']);
    expect(injected.status).toBe(0);
    expect(injected.stdout.trim()).toBe("'/ws/src/b.unit.test.js'");
  });
});
