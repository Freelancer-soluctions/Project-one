import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectIgnoreMarkers,
  evaluateExclusionBudget,
} from './coverage-exclusion-budget.mjs';

const BASELINE = {
  version: 1,
  workspaces: {
    client: { exclusions: ['node_modules/', 'tests/'], ignoreMarkers: 0 },
    server: { exclusions: [], ignoreMarkers: 0 },
  },
  exceptions: [],
};

function current(overrides = {}) {
  return {
    client: { exclusions: ['node_modules/', 'tests/'], ignoreMarkers: 0 },
    server: { exclusions: [], ignoreMarkers: 0 },
    ...overrides,
  };
}

function exception(overrides = {}) {
  return {
    workspace: 'client',
    kind: 'exclusion',
    path: 'src/generated/**',
    reason: 'Generated client cannot be instrumented',
    owner: '@Freelancer-soluctions/frontend-team',
    date: '2026-11-04',
    ...overrides,
  };
}

describe('exclusion budget evaluation', () => {
  it('passes when the exclusion surface is unchanged', () => {
    const { errors, growth } = evaluateExclusionBudget({
      baseline: BASELINE,
      current: current(),
    });

    expect(errors).toEqual([]);
    expect(growth.client.addedExclusions).toEqual([]);
    expect(growth.client.markerDelta).toBe(0);
  });

  it('fails when a coverage exclusion is added without an exception', () => {
    const { errors } = evaluateExclusionBudget({
      baseline: BASELINE,
      current: current({
        client: {
          exclusions: ['node_modules/', 'tests/', 'src/generated/**'],
          ignoreMarkers: 0,
        },
      }),
    });

    expect(errors).toEqual([
      expect.stringContaining(
        'coverage exclusion src/generated/** is not tracked'
      ),
    ]);
  });

  it('accepts an added exclusion covered by an auditable exception', () => {
    const { errors } = evaluateExclusionBudget({
      baseline: { ...BASELINE, exceptions: [exception()] },
      current: current({
        client: {
          exclusions: ['node_modules/', 'tests/', 'src/generated/**'],
          ignoreMarkers: 0,
        },
      }),
    });

    expect(errors).toEqual([]);
  });

  it('rejects an exception missing reason or owner', () => {
    const { errors } = evaluateExclusionBudget({
      baseline: {
        ...BASELINE,
        exceptions: [exception({ owner: '' })],
      },
      current: current(),
    });

    expect(errors).toEqual([
      expect.stringContaining('requires a valid date, reason and owner'),
    ]);
  });

  it('fails when ignore markers grow beyond the baseline', () => {
    const { errors } = evaluateExclusionBudget({
      baseline: BASELINE,
      current: current({
        server: { exclusions: [], ignoreMarkers: 2 },
      }),
    });

    expect(errors).toEqual([
      expect.stringContaining('ignore markers grew from 0 to 2'),
    ]);
  });

  it('accepts marker growth covered by an exception with a sufficient count', () => {
    const { errors } = evaluateExclusionBudget({
      baseline: {
        ...BASELINE,
        exceptions: [
          exception({
            workspace: 'server',
            kind: 'markers',
            path: undefined,
            count: 3,
          }),
        ],
      },
      current: current({
        server: { exclusions: [], ignoreMarkers: 2 },
      }),
    });

    expect(errors).toEqual([]);
  });

  it('fails when the markers exception does not cover the new count', () => {
    const { errors } = evaluateExclusionBudget({
      baseline: {
        ...BASELINE,
        exceptions: [
          exception({
            workspace: 'server',
            kind: 'markers',
            path: undefined,
            count: 1,
          }),
        ],
      },
      current: current({
        server: { exclusions: [], ignoreMarkers: 2 },
      }),
    });

    expect(errors).toEqual([expect.stringContaining('ignore markers grew')]);
  });
});

describe('ignore marker scanning', () => {
  it('counts istanbul/c8/v8 markers in source files and skips node_modules', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'exclusion-budget-'));
    fs.mkdirSync(path.join(root, 'src', 'nested'), { recursive: true });
    fs.mkdirSync(path.join(root, 'node_modules', 'pkg'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'src', 'a.js'),
      '/* istanbul ignore next */\nfunction a() {}\n/* c8 ignore start */\n'
    );
    fs.writeFileSync(
      path.join(root, 'src', 'nested', 'b.ts'),
      '/* v8 ignore next */\nexport const b = 1;\n'
    );
    fs.writeFileSync(
      path.join(root, 'node_modules', 'pkg', 'index.js'),
      '/* istanbul ignore next */\n'
    );

    const markers = collectIgnoreMarkers(path.join(root, 'src'), root);

    expect(markers).toHaveLength(3);
    expect(markers.map((m) => `${m.file}:${m.line}`)).toEqual([
      'src/a.js:1',
      'src/a.js:3',
      'src/nested/b.ts:1',
    ]);
  });
});
