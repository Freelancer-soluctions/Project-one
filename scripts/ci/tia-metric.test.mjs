import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildMarkdown,
  buildShort,
  fmt,
  listTestFiles,
  parseFileList,
  readInjectedCount,
  readMapStatus,
  readNumTotalTests,
  readScope,
  resolveWorkspaceDir,
} from './tia-metric.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, 'tia-metric.mjs');

function makeWs(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tia-metric-'));
  fs.mkdirSync(path.join(dir, 'reports'), { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, rel), content);
  }
  return dir;
}

describe('parseFileList', () => {
  it('splits lines, trims and drops empties (LF and CRLF)', () => {
    const out = 'src/a.unit.test.js\r\n\n  src/b.unit.test.js  \n\n';
    expect(parseFileList(out)).toEqual([
      'src/a.unit.test.js',
      'src/b.unit.test.js',
    ]);
  });

  it('returns [] for empty/nullish input', () => {
    expect(parseFileList('')).toEqual([]);
    expect(parseFileList(null)).toEqual([]);
  });
});

describe('optional readers degrade to defaults', () => {
  it('readScope: missing file -> full', () => {
    expect(readScope(makeWs())).toBe('full');
  });

  it('readScope: parses scope=<value> lines', () => {
    expect(
      readScope(makeWs({ 'reports/tia-scope.txt': 'scope=changed\n' }))
    ).toBe('changed');
    expect(readScope(makeWs({ 'reports/tia-scope.txt': 'scope=full\n' }))).toBe(
      'full'
    );
  });

  it('readNumTotalTests: number or null', () => {
    const ok = makeWs({
      'reports/vitest-results.json': JSON.stringify({ numTotalTests: 41 }),
    });
    expect(readNumTotalTests(ok)).toBe(41);
    expect(readNumTotalTests(makeWs())).toBeNull();
    const bad = makeWs({ 'reports/vitest-results.json': '{no-json' });
    expect(readNumTotalTests(bad)).toBeNull();
  });

  it('readInjectedCount: number or null', () => {
    const ok = makeWs({
      'reports/tia-selection.json': JSON.stringify({ injected: 2 }),
    });
    expect(readInjectedCount(ok)).toBe(2);
    expect(readInjectedCount(makeWs())).toBeNull();
  });

  it('readMapStatus: hit only when coverage-map.json parses', () => {
    const hit = makeWs({
      'reports/coverage-map.json': JSON.stringify({ testFiles: [] }),
    });
    expect(readMapStatus(hit)).toBe('hit');
    expect(readMapStatus(makeWs())).toBe('miss');
    const corrupt = makeWs({ 'reports/coverage-map.json': '{oops' });
    expect(readMapStatus(corrupt)).toBe('miss');
  });
});

describe('markdown rendering', () => {
  const report = {
    workspace: 'apps/client',
    scope: 'changed',
    changed: 3,
    total: 26,
    numTotalTests: 41,
    injected: 1,
    map: 'miss',
  };

  it('buildMarkdown reports N and T rows', () => {
    const md = buildMarkdown(report);
    expect(md).toContain('| changed test files (N) | 3 |');
    expect(md).toContain('| total test files (T) | 26 |');
    expect(md).toContain('| scope | changed |');
  });

  it('buildMarkdown shows n/a when T is unknown', () => {
    const md = buildMarkdown({ ...report, total: null });
    expect(md).toContain('| total test files (T) | n/a |');
    expect(md).toContain('| changed test files (N) | 3 |');
  });

  it('buildShort is a single line summary', () => {
    const short = buildShort(report);
    expect(short).not.toContain('\n');
    expect(short).toContain('N=3');
    expect(short).toContain('T=26');
  });

  it('fmt maps null/undefined to n/a', () => {
    expect(fmt(null)).toBe('n/a');
    expect(fmt(undefined)).toBe('n/a');
    expect(fmt(0)).toBe('0');
  });
});

describe('listTestFiles', () => {
  it('returns null for a nonexistent cwd (never throws)', () => {
    const missing = path.join(os.tmpdir(), 'tia-no-such-dir-xyz');
    expect(listTestFiles(missing, [], 1000)).toBeNull();
  });
});

describe('resolveWorkspaceDir', () => {
  it('resolves existing dirs, null otherwise', () => {
    expect(resolveWorkspaceDir(os.tmpdir())).toBeTruthy();
    expect(resolveWorkspaceDir(null)).toBeNull();
    expect(resolveWorkspaceDir('ruta-que-no-existe-xyz')).toBeNull();
  });
});

describe('exit-0 contract', () => {
  it('nonexistent workspace -> exit 0 with ::warning::', () => {
    const run = spawnSync(
      process.execPath,
      [SCRIPT, 'ruta-que-no-existe-xyz'],
      { encoding: 'utf8' }
    );
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('::warning::');
  });

  it('nonexistent workspace with --format=md -> exit 0 with table', () => {
    const run = spawnSync(
      process.execPath,
      [SCRIPT, 'ruta-que-no-existe-xyz', '--format=md'],
      { encoding: 'utf8' }
    );
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('::warning::');
    expect(run.stdout).toContain('| total test files (T) | n/a |');
  });
});
