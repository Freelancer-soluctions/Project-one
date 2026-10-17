import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, afterEach } from 'vitest';
import {
  buildListArgs,
  buildRunArgs,
  parseArgs,
  parseFileList,
  resolveWorkspaceDir,
  splitVitestArgv,
  writeSelection,
} from './tia-select.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, 'tia-select.mjs');

const TMP = [];
afterEach(() => {
  while (TMP.length) {
    const dir = TMP.pop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/** Minimal workspace with a stubbed `vitest/vitest.mjs` resolved first. */
function makeWs({ list = '', exit = 0 } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tia-select-'));
  TMP.push(dir);
  fs.mkdirSync(path.join(dir, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'tia-select-fixture', type: 'module' })
  );
  const vitestDir = path.join(dir, 'node_modules', 'vitest');
  fs.mkdirSync(vitestDir, { recursive: true });
  fs.writeFileSync(
    path.join(vitestDir, 'package.json'),
    JSON.stringify({ name: 'vitest', version: '0.0.0' })
  );
  fs.writeFileSync(
    path.join(vitestDir, 'vitest.mjs'),
    [
      `import fs from 'node:fs';`,
      `const args = process.argv.slice(2);`,
      `const out = process.env.TIA_STUB_OUT;`,
      `if (out) fs.appendFileSync(out, JSON.stringify({ cmd: args[0] || null, argv: args }) + '\\n');`,
      `if (args[0] === 'list') {`,
      `  const list = process.env.TIA_STUB_LIST || '';`,
      `  if (list) process.stdout.write(list.endsWith('\\n') ? list : list + '\\n');`,
      `  process.exit(0);`,
      `}`,
      `process.exit(Number(process.env.TIA_STUB_EXIT || '0'));`,
      '',
    ].join('\n')
  );
  const stubOut = path.join(dir, 'stub-calls.jsonl');
  const env = {
    ...process.env,
    TIA_STUB_LIST: list,
    TIA_STUB_EXIT: String(exit),
    TIA_STUB_OUT: stubOut,
  };
  return { dir, env, stubOut };
}

/** History fixture with the REAL store shape (workspace + runs + files). */
function seedHistory(wsDir, files) {
  const history = {
    workspace: 'fixture',
    runs: [
      {
        runId: 'run-1',
        recordedAt: '2026-10-15T00:00:00.000Z',
        workspace: 'fixture',
        total: files.length,
        files,
      },
    ],
  };
  fs.writeFileSync(
    path.join(wsDir, 'reports', 'tia-history.json'),
    JSON.stringify(history, null, 2)
  );
}

function runSelect(args, env) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: env || process.env,
  });
}

function stubCalls(stubOut) {
  if (!fs.existsSync(stubOut)) return [];
  return fs
    .readFileSync(stubOut, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

describe('parseArgs', () => {
  it('workspace before --, vitest argv after --', () => {
    expect(
      parseArgs(['apps/server', '--', 'vitest', 'run', '--coverage'])
    ).toEqual({
      workspaceArg: 'apps/server',
      vitestArgv: ['vitest', 'run', '--coverage'],
      auditMd: false,
    });
  });

  it('defaults workspace without -- to list mode', () => {
    expect(parseArgs([])).toEqual({
      workspaceArg: 'apps/client',
      vitestArgv: [],
      auditMd: false,
    });
  });

  it('detects --format=md audit mode', () => {
    const parsed = parseArgs(['apps/client', '--format=md']);
    expect(parsed.auditMd).toBe(true);
    expect(parsed.vitestArgv).toEqual([]);
  });
});

describe('splitVitestArgv', () => {
  it('extracts --changed + value and keeps positionals + flags', () => {
    const split = splitVitestArgv([
      '.unit.test',
      '--changed',
      'origin/main',
      '--coverage',
      '--config',
      'vitest.scoped.config.js',
    ]);
    expect(split.changedTokens).toEqual(['--changed', 'origin/main']);
    expect(split.positionals).toEqual(['.unit.test']);
    expect(split.runFlags).toEqual([
      '--coverage',
      '--config',
      'vitest.scoped.config.js',
    ]);
  });

  it('handles --changed=value and bare --changed', () => {
    expect(splitVitestArgv(['--changed=origin/main']).changedTokens).toEqual([
      '--changed=origin/main',
    ]);
    expect(splitVitestArgv(['--changed']).changedTokens).toEqual(['--changed']);
  });
});

describe('buildListArgs / buildRunArgs', () => {
  it('list carries filters + changed, run carries files without --changed', () => {
    expect(buildListArgs(['.unit.test'], ['--changed', 'origin/main'])).toEqual(
      ['.unit.test', '--changed', 'origin/main', '--filesOnly']
    );
    const run = buildRunArgs(
      ['.unit.test'],
      ['--coverage'],
      ['src/a.unit.test.js']
    );
    expect(run[0]).toBe('run');
    expect(run).toContain('src/a.unit.test.js');
    expect(run).not.toContain('--changed');
    expect(run).not.toContain('origin/main');
  });
});

describe('parseFileList', () => {
  it('one path per line, blanks dropped', () => {
    expect(parseFileList('a.js\n\n  b.js\r\n')).toEqual(['a.js', 'b.js']);
    expect(parseFileList('')).toEqual([]);
  });
});

describe('resolveWorkspaceDir', () => {
  it('resolves absolute dirs, null when missing', () => {
    const { dir } = makeWs();
    expect(resolveWorkspaceDir(dir)).toBe(dir);
    expect(resolveWorkspaceDir('ruta-que-no-existe-xyz')).toBeNull();
  });
});

describe('writeSelection', () => {
  it('writes {injected, diff} under <ws>/reports/', () => {
    const { dir } = makeWs();
    const file = writeSelection(dir, 3, 7);
    expect(file).toBe(path.join(dir, 'reports', 'tia-selection.json'));
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual({
      injected: 3,
      diff: 7,
    });
  });
});

describe('--inject with real history shape', () => {
  it('union of diff list + injected files spawns explicit list', () => {
    const { dir, env, stubOut } = makeWs({
      list: 'src/a.unit.test.js\nsrc/b.unit.test.js\n',
    });
    seedHistory(dir, [
      { testfile: 'src/c.unit.test.js', failures: 2 },
      { testfile: 'src/a.unit.test.js', failures: 0 },
    ]);
    const run = runSelect(
      [
        dir,
        '--',
        'vitest',
        'run',
        '--coverage',
        '--config',
        'vitest.scoped.config.js',
      ],
      env
    );
    expect(run.status).toBe(0);
    const calls = stubCalls(stubOut);
    const spawned = calls.find((c) => c.cmd === 'run');
    expect(spawned).toBeDefined();
    // Injected file rides along with the diff files, after `run`.
    expect(spawned.argv.slice(1, 4).sort()).toEqual(
      ['src/a.unit.test.js', 'src/b.unit.test.js', 'src/c.unit.test.js'].sort()
    );
    // --changed never reaches the run (Vitest 4 would intersect it away).
    expect(spawned.argv).not.toContain('--changed');
    const selection = JSON.parse(
      fs.readFileSync(path.join(dir, 'reports', 'tia-selection.json'), 'utf8')
    );
    expect(selection).toEqual({ injected: 1, diff: 2 });
  });

  it('forwards --changed to list only, never to the run', () => {
    const { dir, env, stubOut } = makeWs({ list: '' });
    const run = runSelect(
      [
        dir,
        '--',
        'vitest',
        'run',
        '.unit.test',
        '--changed',
        'origin/main',
        '--coverage',
      ],
      env
    );
    expect(run.status).toBe(0);
    const calls = stubCalls(stubOut);
    const listed = calls.find((c) => c.cmd === 'list');
    expect(listed.argv).toContain('.unit.test');
    expect(listed.argv).toContain('--changed');
    expect(listed.argv).toContain('origin/main');
    const spawned = calls.find((c) => c.cmd === 'run');
    expect(spawned.argv).not.toContain('--changed');
    expect(spawned.argv).not.toContain('origin/main');
  });
});

describe('empty union delegates to D7', () => {
  it('spawns vitest WITHOUT a file list so the zero-test guard applies', () => {
    const { dir, env, stubOut } = makeWs({ list: '' });
    const run = runSelect([dir, '--', 'vitest', 'run', '--coverage'], env);
    expect(run.status).toBe(0);
    const calls = stubCalls(stubOut);
    const spawned = calls.find((c) => c.cmd === 'run');
    // No explicit files: exactly the caller flags, D7 decides downstream.
    expect(spawned.argv).toEqual(['run', '--coverage']);
    const selection = JSON.parse(
      fs.readFileSync(path.join(dir, 'reports', 'tia-selection.json'), 'utf8')
    );
    expect(selection).toEqual({ injected: 0, diff: 0 });
  });
});

describe('exit code propagation', () => {
  it('propagates the vitest exit code as the script exit code', () => {
    const { dir, env } = makeWs({ list: 'src/a.unit.test.js\n', exit: 3 });
    const run = runSelect([dir, '--', 'vitest', 'run', '--coverage'], env);
    expect(run.status).toBe(3);
  });
});

describe('audit mode', () => {
  it('--format=md prints markdown and runs nothing', () => {
    const { dir, env, stubOut } = makeWs({
      list: 'src/a.unit.test.js\n',
    });
    seedHistory(dir, [{ testfile: 'src/z.unit.test.js', failures: 1 }]);
    const run = runSelect([dir, '--format=md'], env);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('## TIA selection');
    expect(stubCalls(stubOut).filter((c) => c.cmd === 'run')).toEqual([]);
    const selection = JSON.parse(
      fs.readFileSync(path.join(dir, 'reports', 'tia-selection.json'), 'utf8')
    );
    expect(selection).toEqual({ injected: 1, diff: 1 });
  });
});
