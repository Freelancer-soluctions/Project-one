import { describe, expect, it } from 'vitest';
import { evaluateCoverageBaseline } from './coverage-baseline.mjs';

const makeInputs = ({
  threshold = 60,
  exceptions = [],
  exclusions = [],
} = {}) => ({
  baseline: {
    version: 1,
    thresholds: {
      client: {},
      server: { statements: 60 },
    },
    exclusions: { client: ['node_modules/'], server: ['node_modules/'] },
    exceptions,
  },
  workspaceConfigs: {
    client: {
      test: { coverage: { thresholds: {}, exclude: ['node_modules/'] } },
    },
    server: {
      test: {
        coverage: {
          thresholds: { statements: threshold },
          exclude: ['node_modules/', ...exclusions],
        },
      },
    },
  },
});

describe('coverage baseline ratchet', () => {
  it('rejects a lowered threshold without an auditable exception', () => {
    const errors = evaluateCoverageBaseline(makeInputs({ threshold: 59 }));

    expect(errors.join('\n')).toContain(
      'server:statements lowered from 60 to 59'
    );
  });

  it('accepts a lowering only when an exact reasoned exception is recorded', () => {
    const errors = evaluateCoverageBaseline(
      makeInputs({
        threshold: 59,
        exceptions: [
          {
            workspace: 'server',
            path: 'statements',
            from: 60,
            to: 59,
            reason: 'Approved measured recalibration.',
            owner: '@team',
            approvedAt: '2026-10-30',
          },
        ],
      })
    );

    expect(errors).toEqual([]);
  });

  it('rejects an exception that omits audit metadata', () => {
    const errors = evaluateCoverageBaseline(
      makeInputs({
        threshold: 59,
        exceptions: [
          { workspace: 'server', path: 'statements', from: 60, to: 59 },
        ],
      })
    );

    expect(errors.join('\n')).toContain('reason and owner');
  });

  it('rejects a stale baseline exception', () => {
    const errors = evaluateCoverageBaseline(
      makeInputs({
        exceptions: [
          {
            workspace: 'server',
            path: 'statements',
            from: 60,
            to: 59,
            reason: 'Old approved recalibration.',
            owner: '@team',
            approvedAt: '2026-10-01',
          },
        ],
      })
    );

    expect(errors.join('\n')).toContain('stale baseline exception');
  });

  it('rejects duplicate baseline exceptions for the same floor', () => {
    const exception = {
      workspace: 'server',
      path: 'statements',
      from: 60,
      to: 59,
      reason: 'Approved measured recalibration.',
      owner: '@team',
      approvedAt: '2026-10-30',
    };
    const errors = evaluateCoverageBaseline(
      makeInputs({ threshold: 59, exceptions: [exception, { ...exception }] })
    );

    expect(errors.join('\n')).toContain('duplicate baseline exception');
  });

  it('rejects a configured floor missing from the versioned baseline', () => {
    const inputs = makeInputs();
    inputs.workspaceConfigs.server.test.coverage.thresholds.branches = 50;

    const errors = evaluateCoverageBaseline(inputs);

    expect(errors.join('\n')).toContain(
      'server:branches missing from versioned baseline'
    );
  });

  it('rejects new coverage exclusions without an exception', () => {
    const errors = evaluateCoverageBaseline(
      makeInputs({ exclusions: ['src/legacy/**'] })
    );

    expect(errors.join('\n')).toContain(
      'untracked coverage exclusion src/legacy/**'
    );
  });
});
