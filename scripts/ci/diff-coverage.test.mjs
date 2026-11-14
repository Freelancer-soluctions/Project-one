import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { computeDiffCoverage } from './diff-coverage.mjs';

const temporaryRoots = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function makeRoot(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'diff-coverage-'));
  temporaryRoots.push(root);
  for (const file of files) {
    const absolute = path.join(root, file);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, '// source\n');
  }
  return root;
}

describe('computeDiffCoverage', () => {
  it('matches absolute summary keys against repo-relative changed paths', () => {
    const repoRoot = makeRoot(['apps/client/src/hooks/useTab.js']);
    const summary = {
      total: { lines: { pct: 50 } },
      [path.join(repoRoot, 'apps/client/src/hooks/useTab.js')]: {
        lines: { pct: 100 },
      },
    };

    const { rows, failed } = computeDiffCoverage({
      changed: ['apps/client/src/hooks/useTab.js'],
      summary,
      repoRoot,
      threshold: 80,
    });

    expect(rows).toEqual([{ f: 'apps/client/src/hooks/useTab.js', pct: 100 }]);
    expect(failed).toBe(false);
  });

  it('fails when a measured file is below the threshold', () => {
    const repoRoot = makeRoot(['apps/client/src/hooks/useTab.js']);
    const summary = {
      [path.join(repoRoot, 'apps/client/src/hooks/useTab.js')]: {
        lines: { pct: 40 },
      },
    };

    const { rows, failed } = computeDiffCoverage({
      changed: ['apps/client/src/hooks/useTab.js'],
      summary,
      repoRoot,
      threshold: 80,
    });

    expect(rows[0].pct).toBe(40);
    expect(failed).toBe(true);
  });

  it('fails when a changed source file has no coverage entry', () => {
    const repoRoot = makeRoot(['apps/client/src/hooks/useTab.js']);
    const { rows, failed } = computeDiffCoverage({
      changed: ['apps/client/src/hooks/useTab.js'],
      summary: { total: {} },
      repoRoot,
    });

    expect(rows[0].pct).toBe(0);
    expect(failed).toBe(true);
  });

  it('ignores files outside the workspace being measured', () => {
    const repoRoot = makeRoot([
      'apps/server/src/app.js',
      'apps/client/src/hooks/useTab.js',
    ]);
    const { rows, failed } = computeDiffCoverage({
      changed: ['apps/server/src/app.js', 'apps/client/src/hooks/useTab.js'],
      summary: {
        [path.join(repoRoot, 'apps/server/src/app.js')]: {
          lines: { pct: 100 },
        },
      },
      repoRoot,
      workspace: 'apps/server/',
    });

    expect(rows.map((r) => r.f)).toEqual(['apps/server/src/app.js']);
    expect(failed).toBe(false);
  });

  it('skips tests, config and storybook wiring', () => {
    const repoRoot = makeRoot([
      'apps/client/src/hooks/useTab.test.jsx',
      'apps/client/vite.config.js',
      'apps/client/.storybook/main.js',
    ]);
    const { rows, failed } = computeDiffCoverage({
      changed: [
        'apps/client/src/hooks/useTab.test.jsx',
        'apps/client/vite.config.js',
        'apps/client/.storybook/main.js',
      ],
      summary: {},
      repoRoot,
    });

    expect(rows).toEqual([]);
    expect(failed).toBe(false);
  });
});
