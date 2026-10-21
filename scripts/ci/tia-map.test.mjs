import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildCoverageMap,
  coverageMapPath,
  findCoverageSummary,
  readCoverageSources,
  relativize,
  resolveBaseSha,
} from './tia-map.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, 'tia-map.mjs');

function makeWs() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tia-map-'));
  fs.mkdirSync(path.join(dir, 'reports'), { recursive: true });
  return dir;
}

describe('findCoverageSummary', () => {
  it('returns null when no summary exists', () => {
    expect(findCoverageSummary(makeWs())).toBeNull();
  });

  it('prefers reports/ over coverage/ over tests/coverage/', () => {
    const ws = makeWs();
    const testsCov = path.join(
      ws,
      'tests',
      'coverage',
      'coverage-summary.json'
    );
    const cov = path.join(ws, 'coverage', 'coverage-summary.json');
    const reports = path.join(ws, 'reports', 'coverage-summary.json');
    fs.mkdirSync(path.dirname(testsCov), { recursive: true });
    fs.writeFileSync(testsCov, '{}');
    expect(findCoverageSummary(ws)).toBe(testsCov);
    fs.mkdirSync(path.dirname(cov), { recursive: true });
    fs.writeFileSync(cov, '{}');
    expect(findCoverageSummary(ws)).toBe(cov);
    fs.writeFileSync(reports, '{}');
    expect(findCoverageSummary(ws)).toBe(reports);
  });
});

describe('readCoverageSources', () => {
  it('lists keys except total, relativized to the workspace', () => {
    const ws = makeWs();
    const summary = path.join(ws, 'coverage', 'coverage-summary.json');
    fs.mkdirSync(path.dirname(summary), { recursive: true });
    const abs = path.join(ws, 'src', 'a.js');
    fs.writeFileSync(
      summary,
      JSON.stringify({ total: {}, [abs]: {}, 'lib/b.js': {} })
    );
    expect(readCoverageSources(summary, ws)).toEqual(['src/a.js', 'lib/b.js']);
  });

  it('null or corrupt summary -> []', () => {
    expect(readCoverageSources(null, makeWs())).toEqual([]);
    const ws = makeWs();
    const bad = path.join(ws, 'coverage-summary.json');
    fs.writeFileSync(bad, '{oops');
    expect(readCoverageSources(bad, ws)).toEqual([]);
  });
});

describe('relativize', () => {
  it('relativizes absolutes under the workspace, keeps the rest', () => {
    const ws = path.join(os.tmpdir(), 'tia-rel');
    const abs = path.join(ws, 'src', 'a.js');
    expect(relativize(abs, ws)).toBe('src/a.js');
    expect(relativize('src/a.js', ws)).toBe('src/a.js');
    expect(relativize(path.join(os.tmpdir(), 'elsewhere', 'x.js'), ws)).toBe(
      path.join(os.tmpdir(), 'elsewhere', 'x.js')
    );
  });
});

describe('buildCoverageMap', () => {
  it('always carries the full shape (empty state is valid)', () => {
    const map = buildCoverageMap({
      workspace: 'apps/client',
      generatedAt: '2026-10-11T00:00:00.000Z',
      baseSha: null,
      testFiles: [],
      sources: [],
      coverageSummary: null,
    });
    expect(map).toEqual({
      generatedAt: '2026-10-11T00:00:00.000Z',
      workspace: 'apps/client',
      baseSha: null,
      testFiles: [],
      sources: [],
      coverageSummary: null,
    });
    expect(() => JSON.stringify(map)).not.toThrow();
  });

  it('defaults a missing baseSha to null (never undefined)', () => {
    const map = buildCoverageMap({
      workspace: 'apps/client',
      generatedAt: '2026-10-11T00:00:00.000Z',
      testFiles: [],
      sources: [],
      coverageSummary: null,
    });
    expect(map.baseSha).toBeNull();
  });
});

describe('resolveBaseSha', () => {
  it('returns HEAD or null, never throws', () => {
    const sha = resolveBaseSha();
    expect(sha === null || /^[0-9a-f]{40}$/i.test(sha)).toBe(true);
  });
});

describe('coverageMapPath', () => {
  it('is always <ws>/reports/coverage-map.json', () => {
    expect(coverageMapPath('/ws')).toBe(
      path.join('/ws', 'reports', 'coverage-map.json')
    );
  });
});

describe('exit-0 contract', () => {
  it('nonexistent workspace --build -> exit 0 with ::warning::', () => {
    const run = spawnSync(
      process.execPath,
      [SCRIPT, 'ruta-que-no-existe-xyz', '--build'],
      { encoding: 'utf8' }
    );
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('::warning::');
  });

  it('--build on empty workspace writes valid empty map', () => {
    const ws = makeWs();
    const run = spawnSync(process.execPath, [SCRIPT, ws, '--build'], {
      encoding: 'utf8',
      env: { ...process.env, TIA_VITEST_TIMEOUT_MS: '1000' },
    });
    expect(run.status).toBe(0);
    const out = path.join(ws, 'reports', 'coverage-map.json');
    expect(fs.existsSync(out)).toBe(true);
    const map = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(map.workspace).toBe(ws);
    expect(Array.isArray(map.testFiles)).toBe(true);
    expect(Array.isArray(map.sources)).toBe(true);
  });

  it('--build map carries baseSha = HEAD (or null when git fails)', () => {
    const ws = makeWs();
    const run = spawnSync(process.execPath, [SCRIPT, ws, '--build'], {
      encoding: 'utf8',
      env: { ...process.env, TIA_VITEST_TIMEOUT_MS: '1000' },
    });
    expect(run.status).toBe(0);
    const map = JSON.parse(
      fs.readFileSync(path.join(ws, 'reports', 'coverage-map.json'), 'utf8')
    );
    expect('baseSha' in map).toBe(true);
    const head = spawnSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
    });
    const expected =
      head.status === 0 && /^[0-9a-f]{40}$/i.test(head.stdout.trim())
        ? head.stdout.trim()
        : null;
    expect(map.baseSha).toBe(expected);
  });
});
