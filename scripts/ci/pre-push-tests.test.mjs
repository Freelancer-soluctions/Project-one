import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runChangedTests } from './pre-push-tests.mjs';

const temporaryRoots = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function makeRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pre-push-tests-'));
  temporaryRoots.push(root);
  return root;
}

function makeRunner({
  scopedStatus = 0,
  testCount = 1,
  report = 'valid',
  fullStatus = 0,
} = {}) {
  const commands = [];
  const runCommand = (args, { cwd }) => {
    commands.push({ args, cwd });
    if (args[0] === 'run' && args[1] === 'test:changed') {
      if (report !== 'missing') {
        const output = args.find((arg) => arg.startsWith('--outputFile.json='));
        const resultPath = output.slice('--outputFile.json='.length);
        fs.writeFileSync(
          path.resolve(cwd, resultPath),
          report === 'invalid'
            ? '{invalid json'
            : JSON.stringify({ numTotalTests: testCount })
        );
      }
      return { status: scopedStatus };
    }
    return { status: fullStatus };
  };
  return { commands, runCommand };
}

describe('runChangedTests', () => {
  it('runs the complete unit suite when the changed-test report has zero tests', () => {
    const { commands, runCommand } = makeRunner({ testCount: 0 });

    const status = runChangedTests('apps/client', {
      root: makeRoot(),
      runCommand,
    });

    expect(status).toBe(0);
    expect(commands).toHaveLength(2);
    expect(commands[0].args).toContain('test:changed');
    expect(commands[1].args).toContain('test:unit');
  });

  it('falls back to the full unit suite if the JSON report is missing or malformed', () => {
    for (const report of ['missing', 'invalid']) {
      const { commands, runCommand } = makeRunner({ report });

      const status = runChangedTests('apps/client', {
        root: makeRoot(),
        runCommand,
      });

      expect(status).toBe(0);
      expect(commands).toHaveLength(2);
      expect(commands[1].args).toContain('test:unit');
    }
  });

  it('returns a full-suite failure after a zero-test changed selection', () => {
    const { commands, runCommand } = makeRunner({
      testCount: 0,
      fullStatus: 1,
    });

    const status = runChangedTests('apps/client', {
      root: makeRoot(),
      runCommand,
    });

    expect(status).toBe(1);
    expect(commands).toHaveLength(2);
    expect(commands[1].args).toContain('test:unit');
  });

  it('does not run the full suite when at least one changed test was executed', () => {
    const { commands, runCommand } = makeRunner({ testCount: 3 });

    const status = runChangedTests('apps/server', {
      root: makeRoot(),
      runCommand,
    });

    expect(status).toBe(0);
    expect(commands).toHaveLength(1);
  });

  it('rejects an unknown workspace without running tests', () => {
    const { commands, runCommand } = makeRunner();

    const status = runChangedTests('apps/unknown', {
      root: makeRoot(),
      runCommand,
    });

    expect(status).toBe(2);
    expect(commands).toHaveLength(0);
  });

  it('keeps a failed changed-test run blocking instead of hiding it with a full-suite run', () => {
    const { commands, runCommand } = makeRunner({
      scopedStatus: 1,
      testCount: 0,
    });

    const status = runChangedTests('apps/client', {
      root: makeRoot(),
      runCommand,
    });

    expect(status).toBe(1);
    expect(commands).toHaveLength(1);
  });
});
