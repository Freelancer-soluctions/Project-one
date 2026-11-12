import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluateQualityAggregator } from './quality-aggregator-verdict.mjs';

const SCRIPT = fileURLToPath(
  new URL('./quality-aggregator-verdict.mjs', import.meta.url)
);

/** Ejecuta el CLI con un `needs` y unos ámbitos dados. */
function runCli({ needs, eventName = 'pull_request', areas = {} }) {
  return execFileSync(process.execPath, [SCRIPT], {
    env: {
      ...process.env,
      NEEDS: JSON.stringify(needs),
      EVENT_NAME: eventName,
      CLIENT: areas.client ?? 'false',
      SERVER: areas.server ?? 'false',
      E2E: areas.e2e ?? 'false',
      SHARED: areas.shared ?? 'false',
      WORKFLOWS: areas.workflows ?? 'false',
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

function runCliStatus(args) {
  return runCliResult(args).status;
}

describe('quality-aggregator-verdict', () => {
  it('accepts a path-scoped skip when repo-discovery says the area did not change', () => {
    const problematic = evaluateQualityAggregator({
      needs: {
        'repo-discovery': { result: 'success' },
        'client-lint': { result: 'skipped' },
        'server-lint': { result: 'success' },
        'openspec-validate': { result: 'success' },
      },
      eventName: 'pull_request',
      areas: { client: 'false', server: 'true' },
    });

    expect(problematic).toEqual([]);
  });

  it('fails a mandatory job skipped while its area changed', () => {
    const problematic = evaluateQualityAggregator({
      needs: { 'client-lint': { result: 'skipped' } },
      eventName: 'pull_request',
      areas: { client: 'true' },
    });

    expect(problematic).toEqual(['client-lint: skipped']);
  });

  it('fails an unknown skipped job (fail-closed)', () => {
    const problematic = evaluateQualityAggregator({
      needs: { 'new-mystery-job': { result: 'skipped' } },
      eventName: 'pull_request',
      areas: { client: 'false', server: 'false' },
    });

    expect(problematic).toEqual(['new-mystery-job: skipped']);
  });

  it('fails failure and cancelled regardless of change detection', () => {
    const problematic = evaluateQualityAggregator({
      needs: {
        'client-lint': { result: 'failure' },
        'server-typecheck': { result: 'cancelled' },
      },
      eventName: 'pull_request',
      areas: { client: 'false', server: 'false' },
    });

    expect(problematic).toEqual([
      'client-lint: failure',
      'server-typecheck: cancelled',
    ]);
  });

  it('authorizes PR-only skips outside pull_request (merge queue / dispatch)', () => {
    const problematic = evaluateQualityAggregator({
      needs: {
        'client-lint': { result: 'skipped' },
        'openspec-validate': { result: 'skipped' },
      },
      eventName: 'merge_group',
      areas: {},
    });

    expect(problematic).toEqual([]);
  });

  it('always authorizes server-format-check (if: false)', () => {
    const problematic = evaluateQualityAggregator({
      needs: { 'server-format-check': { result: 'skipped' } },
      eventName: 'pull_request',
      areas: { server: 'true' },
    });

    expect(problematic).toEqual([]);
  });

  it('does not authorize skipping openspec-validate in a PR', () => {
    const problematic = evaluateQualityAggregator({
      needs: { 'openspec-validate': { result: 'skipped' } },
      eventName: 'pull_request',
      areas: {},
    });

    expect(problematic).toEqual(['openspec-validate: skipped']);
  });

  it('maps shape-specific areas (shared for root-manifest-guard, workflows for validate-pipeline)', () => {
    const problematic = evaluateQualityAggregator({
      needs: {
        'root-manifest-guard': { result: 'skipped' },
        'validate-pipeline': { result: 'skipped' },
      },
      eventName: 'pull_request',
      areas: { shared: 'false', workflows: 'true' },
    });

    expect(problematic).toEqual(['validate-pipeline: skipped']);
  });

  it('CLI exits 0 on authorized skips and 1 on unauthorized skips', () => {
    expect(
      runCliStatus({
        needs: { 'client-lint': { result: 'skipped' } },
        areas: { client: 'false' },
      })
    ).toBe(0);

    expect(
      runCliStatus({
        needs: { 'client-lint': { result: 'skipped' } },
        areas: { client: 'true' },
      })
    ).toBe(1);
  });

  it('CLI prints one line per problematic job on stderr', () => {
    const { status, stderr } = runCliResult({
      needs: {
        'client-lint': { result: 'skipped' },
        'server-lint': { result: 'failure' },
      },
      areas: { client: 'true', server: 'false' },
    });

    expect(status).toBe(1);
    expect(stderr).toContain('client-lint: skipped');
    expect(stderr).toContain('server-lint: failure');
  });
});
