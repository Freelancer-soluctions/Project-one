import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import HistorySequencer, {
  degradedFiles,
  failureCounts,
  flakyFilesFromEvidence,
  historyCandidates,
  matchesGlob,
  orderSpecs,
  seededShuffle,
  shouldShuffleFiles,
} from '../../vitest.sequencer.js';

const TMP = [];

function makeWorkspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vitest-sequencer-'));
  TMP.push(dir);
  return dir;
}

function spec(root, rel) {
  return {
    moduleId: path.join(root, rel),
    project: {
      name: 'unit',
      config: { sequence: { groupOrder: 0 }, isolate: true },
    },
  };
}

function fakeCtx(root, sequence = {}) {
  return {
    config: { root, sequence },
    cache: {
      getFileTestResults: () => null,
      getFileStats: () => null,
      setFileTestResult: () => {},
    },
  };
}

const rels = (lists) => lists.map((specs) => specs.map((s) => s.moduleId));

afterEach(() => {
  while (TMP.length) {
    const dir = TMP.pop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('failureCounts', () => {
  it('sums failures across runs and ignores clean files', () => {
    const counts = failureCounts({
      runs: [
        {
          files: [
            { testfile: 'src/a.test.js', failures: 1 },
            { testfile: 'src/clean.test.js', failures: 0 },
          ],
        },
        { files: [{ testfile: 'src/a.test.js', failures: 2 }] },
      ],
    });
    expect(counts.get('src/a.test.js')).toBe(3);
    expect(counts.has('src/clean.test.js')).toBe(false);
  });

  it('unexpected shapes -> empty map (never throws)', () => {
    expect(failureCounts(null).size).toBe(0);
    expect(failureCounts({ runs: 'nope' }).size).toBe(0);
    expect(failureCounts({ runs: [{ files: [{ failures: 3 }] }] }).size).toBe(
      0
    );
  });
});

describe('matchesGlob', () => {
  it('exact match for plain paths', () => {
    expect(
      matchesGlob('apps/server/src/a.test.js', 'apps/server/src/a.test.js')
    ).toBe(true);
    expect(
      matchesGlob('apps/server/src/a.test.js', 'apps/server/src/b.test.js')
    ).toBe(false);
  });

  it('supports **, * and ? wildcards', () => {
    expect(
      matchesGlob(
        '**/*.integration.test.js',
        'apps/server/tests/x.integration.test.js'
      )
    ).toBe(true);
    expect(
      matchesGlob('apps/*/src/a.test.js', 'apps/client/src/a.test.js')
    ).toBe(true);
    expect(
      matchesGlob('apps/server/src/a?.test.js', 'apps/server/src/ab.test.js')
    ).toBe(true);
    expect(
      matchesGlob('apps/*/src/a.test.js', 'apps/client/other/a.test.js')
    ).toBe(false);
  });
});

describe('flakyFilesFromEvidence', () => {
  it('flags files with retryCount > 0 or flaky: true', () => {
    const set = flakyFilesFromEvidence({
      tests: [
        { file: 'src/a.test.js', retryCount: 0, flaky: false },
        { file: 'src/b.test.js', retryCount: 1, flaky: true },
        { file: 'src/c.test.js', retryCount: 2, flaky: false },
      ],
    });
    expect([...set].sort()).toEqual(['src/b.test.js', 'src/c.test.js']);
  });

  it('missing/invalid evidence -> empty set', () => {
    expect(flakyFilesFromEvidence(null).size).toBe(0);
    expect(flakyFilesFromEvidence({ tests: 'nope' }).size).toBe(0);
  });
});

describe('orderSpecs', () => {
  const root = path.join(path.sep, 'ws');
  const files = () => [
    spec(root, 'src/z.unit.test.js'),
    spec(root, 'src/a.unit.test.js'),
    spec(root, 'src/m.unit.test.js'),
  ];

  it('no history and no degradation -> deterministic path ascending', () => {
    const ordered = orderSpecs(files(), {
      workspaceRoot: root,
      counts: new Map(),
      degraded: new Set(),
    });
    expect(rels([ordered])[0].map((m) => path.basename(m))).toEqual([
      'a.unit.test.js',
      'm.unit.test.js',
      'z.unit.test.js',
    ]);
  });

  it('more recent failures run first', () => {
    const counts = new Map([
      ['src/z.unit.test.js', 3],
      ['src/a.unit.test.js', 1],
    ]);
    const ordered = orderSpecs(files(), {
      workspaceRoot: root,
      counts,
      degraded: new Set(),
    });
    expect(ordered.map((s) => path.basename(s.moduleId))).toEqual([
      'z.unit.test.js',
      'a.unit.test.js',
      'm.unit.test.js',
    ]);
  });

  it('equal failure count: degraded (flaky) file ranks below the deterministic one', () => {
    const counts = new Map([
      ['src/a.unit.test.js', 2],
      ['src/z.unit.test.js', 2],
    ]);
    const ordered = orderSpecs(files(), {
      workspaceRoot: root,
      counts,
      degraded: new Set(['src/a.unit.test.js']),
    });
    // La degradación es una partición: los degradados van SIEMPRE detrás de
    // los no degradados (nunca ascienden), y dentro de cada grupo se ordena por
    // conteo de fallos y luego por ruta.
    expect(ordered.map((s) => path.basename(s.moduleId))).toEqual([
      'z.unit.test.js',
      'm.unit.test.js',
      'a.unit.test.js',
    ]);
  });

  it('flaky never ascends above a deterministic failing file', () => {
    const counts = new Map([
      ['src/a.unit.test.js', 9],
      ['src/z.unit.test.js', 1],
    ]);
    const ordered = orderSpecs(files(), {
      workspaceRoot: root,
      counts,
      degraded: new Set(['src/a.unit.test.js']),
    });
    expect(ordered[0].moduleId).toBe(path.join(root, 'src/z.unit.test.js'));
  });

  it('no degradation set -> plain failure-count order', () => {
    const counts = new Map([['src/a.unit.test.js', 2]]);
    const ordered = orderSpecs(files(), {
      workspaceRoot: root,
      counts,
      degraded: new Set(),
    });
    expect(ordered[0].moduleId).toBe(path.join(root, 'src/a.unit.test.js'));
  });
});

describe('degradedFiles', () => {
  const repoRoot = path.join(path.sep, 'repo');
  const root = path.join(repoRoot, 'apps', 'server');

  it('degrades files matching the quarantine list (incl. globs)', () => {
    const files = [
      spec(root, 'src/a.unit.test.js'),
      spec(root, 'tests/x.integration.test.js'),
    ];
    const degraded = degradedFiles(files, {
      workspaceRoot: root,
      repoRoot,
      quarantine: ['apps/server/**/*.integration.test.js'],
      flaky: new Set(),
    });
    expect([...degraded]).toEqual(['tests/x.integration.test.js']);
  });

  it('degrades files with local flaky evidence', () => {
    const ws = makeWorkspace();
    fs.mkdirSync(path.join(ws, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(ws, 'reports', 'flaky-retries.json'),
      JSON.stringify({
        tests: [{ file: 'src/a.unit.test.js', retryCount: 1, flaky: true }],
      })
    );
    const files = [
      spec(ws, 'src/a.unit.test.js'),
      spec(ws, 'src/b.unit.test.js'),
    ];
    const degraded = degradedFiles(files, {
      workspaceRoot: ws,
      repoRoot: ws,
      quarantine: [],
      candidates: [path.join(ws, 'reports', 'flaky-retries.json')],
    });
    expect([...degraded]).toEqual(['src/a.unit.test.js']);
  });

  it('corrupt flaky evidence -> no degradation (never throws)', () => {
    const ws = makeWorkspace();
    fs.mkdirSync(path.join(ws, 'reports'), { recursive: true });
    fs.writeFileSync(path.join(ws, 'reports', 'flaky-retries.json'), '{oops');
    const files = [spec(ws, 'src/a.unit.test.js')];
    const degraded = degradedFiles(files, {
      workspaceRoot: ws,
      repoRoot: ws,
      quarantine: [],
      candidates: [path.join(ws, 'reports', 'flaky-retries.json')],
    });
    expect(degraded.size).toBe(0);
  });
});

describe('seededShuffle', () => {
  it('same seed reproduces the same permutation', () => {
    const items = Array.from({ length: 20 }, (_, i) => `f${i}`);
    expect(seededShuffle(items, 4242)).toEqual(seededShuffle(items, 4242));
  });

  it('a different seed produces a different permutation', () => {
    const items = Array.from({ length: 20 }, (_, i) => `f${i}`);
    expect(seededShuffle(items, 4242)).not.toEqual(seededShuffle(items, 7));
  });

  it('keeps every element', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect([...seededShuffle(items, 1)].sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('shouldShuffleFiles', () => {
  it('true for boolean shuffle and {files:true}', () => {
    expect(shouldShuffleFiles({ shuffle: true })).toBe(true);
    expect(shouldShuffleFiles({ shuffle: { files: true } })).toBe(true);
  });

  it('false otherwise', () => {
    expect(shouldShuffleFiles({})).toBe(false);
    expect(shouldShuffleFiles({ shuffle: { tests: true } })).toBe(false);
  });
});

describe('HistorySequencer.sort', () => {
  it('orders historically failing files first via node_modules/.cache/tia', async () => {
    const ws = makeWorkspace();
    const cache = path.join(ws, 'node_modules', '.cache', 'tia');
    fs.mkdirSync(cache, { recursive: true });
    fs.writeFileSync(
      path.join(cache, 'tia-history.json'),
      JSON.stringify({
        runs: [{ files: [{ testfile: 'src/z.unit.test.js', failures: 2 }] }],
      })
    );
    const sequencer = new HistorySequencer(fakeCtx(ws));
    const ordered = await sequencer.sort([
      spec(ws, 'src/a.unit.test.js'),
      spec(ws, 'src/z.unit.test.js'),
    ]);
    expect(ordered[0].moduleId).toBe(path.join(ws, 'src/z.unit.test.js'));
  });

  it('TIA_SEQUENCER=stable delegates to BaseSequencer (no history ordering)', async () => {
    const ws = makeWorkspace();
    const cache = path.join(ws, 'node_modules', '.cache', 'tia');
    fs.mkdirSync(cache, { recursive: true });
    fs.writeFileSync(
      path.join(cache, 'tia-history.json'),
      JSON.stringify({
        runs: [{ files: [{ testfile: 'src/z.unit.test.js', failures: 9 }] }],
      })
    );
    const previous = process.env.TIA_SEQUENCER;
    process.env.TIA_SEQUENCER = 'stable';
    try {
      const sequencer = new HistorySequencer(fakeCtx(ws));
      const input = [
        spec(ws, 'src/a.unit.test.js'),
        spec(ws, 'src/z.unit.test.js'),
      ];
      const ordered = await sequencer.sort(input);
      // BaseSequencer sin caché preserva el orden de entrada.
      expect(ordered.map((s) => s.moduleId)).toEqual(
        input.map((s) => s.moduleId)
      );
    } finally {
      if (previous === undefined) delete process.env.TIA_SEQUENCER;
      else process.env.TIA_SEQUENCER = previous;
    }
  });

  it('corrupt history -> deterministic path order, no throw', async () => {
    const ws = makeWorkspace();
    const cache = path.join(ws, 'node_modules', '.cache', 'tia');
    fs.mkdirSync(cache, { recursive: true });
    fs.writeFileSync(path.join(cache, 'tia-history.json'), '{corrupt');
    const sequencer = new HistorySequencer(fakeCtx(ws));
    const ordered = await sequencer.sort([
      spec(ws, 'src/z.unit.test.js'),
      spec(ws, 'src/a.unit.test.js'),
    ]);
    expect(ordered.map((s) => path.basename(s.moduleId))).toEqual([
      'a.unit.test.js',
      'z.unit.test.js',
    ]);
  });

  it('honours --sequence.shuffle with the recorded seed', async () => {
    const ws = makeWorkspace();
    const sequencer = new HistorySequencer(
      fakeCtx(ws, { shuffle: true, seed: 4242 })
    );
    const input = Array.from({ length: 8 }, (_, i) =>
      spec(ws, `src/f${i}.unit.test.js`)
    );
    const first = await sequencer.sort(input);
    const second = await sequencer.sort(input);
    const expected = seededShuffle(input, 4242);
    expect(first.map((s) => s.moduleId)).toEqual(
      expected.map((s) => s.moduleId)
    );
    expect(second.map((s) => s.moduleId)).toEqual(first.map((s) => s.moduleId));
  });

  it('shuffle is reproducible regardless of Vitest input order', async () => {
    const ws = makeWorkspace();
    const paths = Array.from(
      { length: 10 },
      (_, i) => `src/f${i}.unit.test.js`
    );
    const canonical = paths.map((p) => spec(ws, p));
    const reversed = [...canonical].reverse();
    const a = new HistorySequencer(fakeCtx(ws, { shuffle: true, seed: 4242 }));
    const b = new HistorySequencer(fakeCtx(ws, { shuffle: true, seed: 4242 }));
    const first = await a.sort(canonical);
    const second = await b.sort(reversed);
    expect(first.map((s) => s.moduleId)).toEqual(second.map((s) => s.moduleId));
  });

  it('exposes the history candidate path documented by the spec', () => {
    expect(historyCandidates('/ws')[0]).toBe(
      path.join('/ws', 'node_modules', '.cache', 'tia', 'tia-history.json')
    );
  });
});
