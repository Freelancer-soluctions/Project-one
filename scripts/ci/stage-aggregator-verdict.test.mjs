import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluateStageAggregator } from './stage-aggregator-verdict.mjs';

const SCRIPT = fileURLToPath(
  new URL('./stage-aggregator-verdict.mjs', import.meta.url)
);

/** Ejecuta el CLI con un modo y un `needs` dados. */
function runCli({ mode, needs, rawNeeds }) {
  return execFileSync(process.execPath, [SCRIPT, mode], {
    env: {
      ...process.env,
      NEEDS: rawNeeds ?? JSON.stringify(needs ?? {}),
    },
    stdio: 'pipe',
    encoding: 'utf8',
  });
}

function runCliResult(args) {
  try {
    return { status: 0, stdout: runCli(args), stderr: '' };
  } catch (error) {
    return {
      status: error.status,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
    };
  }
}

const success = { result: 'success' };
const skipped = { result: 'skipped' };

function discovery({ server = 'false', shared = 'false' } = {}) {
  return { result: 'success', outputs: { server, shared } };
}

describe('stage-aggregator-verdict (postbuild-tests)', () => {
  it('passes when every job succeeds and the disabled e2e job is skipped', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-tests',
      needs: {
        'repo-discovery': discovery(),
        'build-complete': success,
        'test-integration': success,
        'test-smoke': success,
        e2e: skipped,
      },
    });

    expect(problematic).toEqual([]);
  });

  it('accepts path-scoped skips when neither server nor shared changed', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-tests',
      needs: {
        'repo-discovery': discovery(),
        'build-complete': success,
        'test-integration': skipped,
        'test-smoke': skipped,
        e2e: skipped,
      },
    });

    expect(problematic).toEqual([]);
  });

  it('rejects a path-scoped skip when server changed', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-tests',
      needs: {
        'repo-discovery': discovery({ server: 'true' }),
        'build-complete': success,
        'test-integration': skipped,
        'test-smoke': success,
        e2e: skipped,
      },
    });

    expect(problematic).toEqual(['test-integration: skipped']);
  });

  it('rejects a path-scoped skip when shared changed', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-tests',
      needs: {
        'repo-discovery': discovery({ shared: 'true' }),
        'build-complete': success,
        'test-integration': skipped,
        'test-smoke': skipped,
        e2e: skipped,
      },
    });

    expect(problematic).toEqual([
      'test-integration: skipped',
      'test-smoke: skipped',
    ]);
  });

  it('fails closed when repo-discovery outputs are missing', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-tests',
      needs: {
        'repo-discovery': { result: 'success' },
        'build-complete': success,
        'test-integration': skipped,
        'test-smoke': skipped,
        e2e: skipped,
      },
    });

    expect(problematic).toEqual([
      'test-integration: skipped',
      'test-smoke: skipped',
    ]);
  });

  it('rejects a skipped mandatory job (build-complete)', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-tests',
      needs: {
        'repo-discovery': discovery(),
        'build-complete': skipped,
        'test-integration': skipped,
        'test-smoke': skipped,
        e2e: skipped,
      },
    });

    expect(problematic).toEqual(['build-complete: skipped']);
  });

  it('rejects failure and cancelled regardless of change detection', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-tests',
      needs: {
        'repo-discovery': discovery(),
        'build-complete': success,
        'test-integration': { result: 'failure' },
        'test-smoke': { result: 'cancelled' },
        e2e: skipped,
      },
    });

    expect(problematic).toEqual([
      'test-integration: failure',
      'test-smoke: cancelled',
    ]);
  });

  it('reports a missing result as `missing`', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-tests',
      needs: { e2e: {} },
    });

    expect(problematic).toEqual(['e2e: missing']);
  });
});

describe('stage-aggregator-verdict (postbuild-analysis)', () => {
  it('accepts skips of the four disabled analysis jobs', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-analysis',
      needs: {
        'repo-discovery': discovery(),
        'build-complete': success,
        'client-sonarqube': skipped,
        'server-sonarqube': skipped,
        'client-depcheck': skipped,
        'server-depcheck': skipped,
      },
    });

    expect(problematic).toEqual([]);
  });

  it('rejects a skipped build-complete', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-analysis',
      needs: {
        'repo-discovery': discovery(),
        'build-complete': skipped,
        'client-sonarqube': skipped,
        'server-sonarqube': skipped,
        'client-depcheck': skipped,
        'server-depcheck': skipped,
      },
    });

    expect(problematic).toEqual(['build-complete: skipped']);
  });

  it('rejects an unknown skipped job (fail-closed)', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-analysis',
      needs: {
        'repo-discovery': discovery(),
        'build-complete': success,
        'new-mystery-job': skipped,
      },
    });

    expect(problematic).toEqual(['new-mystery-job: skipped']);
  });

  it('does not inherit the postbuild-tests authorization for e2e', () => {
    const problematic = evaluateStageAggregator({
      mode: 'postbuild-analysis',
      needs: {
        'repo-discovery': discovery(),
        'build-complete': success,
        e2e: skipped,
      },
    });

    expect(problematic).toEqual(['e2e: skipped']);
  });
});

describe('stage-aggregator-verdict (ci-complete)', () => {
  const upstream = {
    'repo-discovery': success,
    'prebuild-governance-complete': success,
    'prebuild-quality-complete': success,
    'prebuild-security-complete': success,
    'prebuild-tests-complete': success,
    'build-complete': success,
    'postbuild-tests-complete': success,
    'postbuild-analysis-complete': success,
    'zombie-workflow-guard': success,
  };

  it('passes when every upstream aggregator succeeds', () => {
    expect(
      evaluateStageAggregator({ mode: 'ci-complete', needs: upstream })
    ).toEqual([]);
  });

  it('rejects any skipped upstream job', () => {
    const problematic = evaluateStageAggregator({
      mode: 'ci-complete',
      needs: { ...upstream, 'prebuild-quality-complete': skipped },
    });

    expect(problematic).toEqual(['prebuild-quality-complete: skipped']);
  });

  it('rejects failure and cancelled', () => {
    const problematic = evaluateStageAggregator({
      mode: 'ci-complete',
      needs: {
        ...upstream,
        'prebuild-tests-complete': { result: 'failure' },
        'build-complete': { result: 'cancelled' },
      },
    });

    expect(problematic).toEqual([
      'prebuild-tests-complete: failure',
      'build-complete: cancelled',
    ]);
  });
});

describe('stage-aggregator-verdict (CLI)', () => {
  it('exits 0 with authorized skips and 1 with unauthorized skips', () => {
    expect(
      runCliResult({
        mode: 'postbuild-tests',
        needs: {
          'repo-discovery': discovery(),
          'build-complete': success,
          'test-integration': skipped,
          e2e: skipped,
        },
      }).status
    ).toBe(0);

    expect(
      runCliResult({
        mode: 'postbuild-tests',
        needs: {
          'repo-discovery': discovery({ server: 'true' }),
          'build-complete': success,
          'test-integration': skipped,
        },
      }).status
    ).toBe(1);
  });

  it('prints one line per problematic job on stderr', () => {
    const { status, stderr } = runCliResult({
      mode: 'ci-complete',
      needs: {
        'prebuild-quality-complete': skipped,
        'build-complete': { result: 'failure' },
      },
    });

    expect(status).toBe(1);
    expect(stderr).toContain('build-complete: failure');
    expect(stderr).toContain('prebuild-quality-complete: skipped');
  });

  it('exits 1 on an unknown mode', () => {
    const { status, stderr } = runCliResult({
      mode: 'nope',
      needs: { 'build-complete': success },
    });

    expect(status).toBe(1);
    expect(stderr).toContain('Modo inválido');
  });

  it('exits 1 when NEEDS is not valid JSON', () => {
    const { status, stderr } = runCliResult({
      mode: 'ci-complete',
      rawNeeds: '{not-json',
    });

    expect(status).toBe(1);
    expect(stderr).toContain('NEEDS no es JSON válido');
  });
});
