import { describe, expect, it } from 'vitest';
import {
  computeMutationScore,
  evaluateMutationBaseline,
  renderMutationSummary,
} from './mutation-baseline.mjs';

function mutant(status, overrides = {}) {
  return {
    id: overrides.id ?? 0,
    mutatorName: overrides.mutatorName ?? 'ConditionalExpression',
    status,
    location: {
      start: { line: overrides.line ?? 10, column: overrides.column ?? 4 },
      end: { line: overrides.line ?? 10, column: 20 },
    },
  };
}

describe('computeMutationScore', () => {
  it('counts killed/timeout as detected and survived/noCoverage as undetected', () => {
    const result = computeMutationScore({
      files: {
        'apps/server/src/modules/auth/service.ts': {
          mutants: [
            mutant('Killed', { id: 0, line: 10 }),
            mutant('Timeout', { id: 1, line: 12 }),
            mutant('Survived', { id: 2, line: 14 }),
            mutant('NoCoverage', { id: 3, line: 16 }),
            mutant('Ignored', { id: 4 }),
            mutant('CompileError', { id: 5, line: 20 }),
          ],
        },
      },
    });

    expect(result.score).toBe(50);
    expect(result.detected).toBe(2);
    expect(result.undetected).toBe(2);
    expect(result.survivors.map((s) => s.id)).toEqual([2, 3]);
    expect(result.errored.map((s) => s.id)).toEqual([5]);
  });

  it('names surviving mutants by file, location and operator', () => {
    const result = computeMutationScore({
      files: {
        'apps/server/src/modules/stock/service.ts': {
          mutants: [
            mutant('Survived', {
              id: 7,
              line: 42,
              column: 9,
              mutatorName: 'EqualityOperator',
            }),
          ],
        },
      },
    });

    expect(result.survivors[0]).toMatchObject({
      id: 7,
      file: 'apps/server/src/modules/stock/service.ts',
      line: 42,
      column: 9,
      mutatorName: 'EqualityOperator',
    });
    const summary = renderMutationSummary({
      verdict: 'regress',
      reason: 'below baseline',
      result,
      baseline: { score: 70 },
      proposed: null,
    });
    expect(summary).toContain(
      'apps/server/src/modules/stock/service.ts | 42:9 | EqualityOperator'
    );
  });

  it('returns a null score when no mutants were evaluated', () => {
    expect(computeMutationScore({ files: {} }).score).toBeNull();
  });
});

describe('evaluateMutationBaseline lifecycle', () => {
  it('records when the baseline file is missing', () => {
    expect(
      evaluateMutationBaseline({ baseline: null, score: 40 })
    ).toMatchObject({ verdict: 'record' });
  });

  it('records when the versioned baseline is explicitly unrecorded', () => {
    expect(
      evaluateMutationBaseline({
        baseline: { version: 1, status: 'unrecorded', score: null },
        score: 40,
      })
    ).toMatchObject({ verdict: 'record' });
  });

  it('fails distinctly when the baseline is corrupt', () => {
    expect(
      evaluateMutationBaseline({
        baseline: { version: 1, status: 'recorded', score: 'high' },
        score: 40,
      })
    ).toMatchObject({ verdict: 'corrupt' });
  });

  it('passes when the score does not regress beyond tolerance', () => {
    expect(
      evaluateMutationBaseline({
        baseline: { version: 1, status: 'recorded', score: 60 },
        score: 59.7,
        tolerance: 0.5,
      })
    ).toMatchObject({ verdict: 'pass' });
  });

  it('fails on regression against the recorded baseline', () => {
    expect(
      evaluateMutationBaseline({
        baseline: { version: 1, status: 'recorded', score: 60 },
        score: 58,
        tolerance: 0.5,
      })
    ).toMatchObject({ verdict: 'regress' });
  });

  it('proposes a raise when the score improves', () => {
    expect(
      evaluateMutationBaseline({
        baseline: { version: 1, status: 'recorded', score: 60 },
        score: 66,
      })
    ).toMatchObject({ verdict: 'pass-raise' });
  });

  it('does not treat an empty report as a regression', () => {
    expect(
      evaluateMutationBaseline({
        baseline: { version: 1, status: 'recorded', score: 60 },
        score: null,
      })
    ).toMatchObject({ verdict: 'no-mutants' });
  });
});
