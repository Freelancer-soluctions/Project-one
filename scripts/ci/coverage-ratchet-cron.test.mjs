import { describe, expect, it } from 'vitest';
import {
  advanceBaseline,
  applyThresholdEdits,
  computeGlobalProposals,
  measuredGlobalMetrics,
} from './coverage-ratchet-cron.mjs';

const CONFIG = `export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      coverage: {
        thresholds: {
          statements: 60.8,
          branches: 64.48,
          functions: 64.81,
          lines: 61.49,

          'src/lib/**': {
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100,
            perFile: true,
          },
        },
      },
    },
  })
);
`;

function metric(pct) {
  return { total: 100, covered: pct, skipped: 0, pct };
}

describe('measuredGlobalMetrics', () => {
  it('rounds measured percentages down to two decimals', () => {
    expect(
      measuredGlobalMetrics({
        total: {
          statements: metric(64.449),
          branches: metric(70),
          functions: metric(65.111),
          lines: metric(0),
        },
      })
    ).toEqual({
      statements: 64.44,
      branches: 70,
      functions: 65.11,
      lines: 0,
    });
  });
});

describe('computeGlobalProposals', () => {
  it('proposes only metrics measured above their floor', () => {
    expect(
      computeGlobalProposals({
        measured: {
          statements: 70,
          branches: 60,
          functions: 64.81,
          lines: 62,
        },
        thresholds: {
          statements: 60.8,
          branches: 64.48,
          functions: 64.81,
          lines: 61.49,
        },
      })
    ).toEqual([
      { metric: 'statements', from: 60.8, to: 70 },
      { metric: 'lines', from: 61.49, to: 62 },
    ]);
  });

  it('never proposes a negative (uncovered-count) floor', () => {
    expect(
      computeGlobalProposals({
        measured: { statements: 100 },
        thresholds: { statements: -2 },
      })
    ).toEqual([]);
  });

  it('is a no-op when nothing can be raised', () => {
    expect(
      computeGlobalProposals({
        measured: { statements: 50 },
        thresholds: { statements: 60 },
      })
    ).toEqual([]);
  });
});

describe('applyThresholdEdits', () => {
  it('rewrites the global floor and leaves glob floors untouched', () => {
    const { text, changed } = applyThresholdEdits(CONFIG, [
      { metric: 'statements', from: 60.8, to: 70 },
      { metric: 'lines', from: 61.49, to: 62 },
    ]);

    expect(changed).toBe(2);
    expect(text).toContain('          statements: 70,');
    expect(text).toContain('          lines: 62,');
    expect(text).toContain(
      "          'src/lib/**': {\n            statements: 100,"
    );
    expect(text).not.toContain('statements: 60.8');
  });

  it('does not touch the config when there are no proposals', () => {
    expect(applyThresholdEdits(CONFIG, [])).toEqual({
      text: CONFIG,
      changed: 0,
    });
  });
});

describe('advanceBaseline', () => {
  it('moves the recorded baseline with the raised floor', () => {
    const baseline = {
      version: 1,
      thresholds: { server: { statements: 60.8 } },
      exclusions: {},
      exceptions: [],
    };

    advanceBaseline(baseline, 'server', [
      { metric: 'statements', from: 60.8, to: 70 },
    ]);

    expect(baseline.thresholds.server.statements).toBe(70);
  });
});
