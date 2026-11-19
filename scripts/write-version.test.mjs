import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_OUT,
  buildVersion,
  parseArgs,
  resolveCreated,
  resolveRevision,
  serializeVersion,
  writeVersionFile,
} from './write-version.mjs';

const SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const COMMIT_EPOCH = '1700000000'; // 2023-11-14T22:13:20.000Z

const fakeGit = (answers) => (args) => {
  const command = args.join(' ');
  if (!(command in answers)) {
    throw new Error(`git inesperado: ${command}`);
  }
  return answers[command];
};

const tempDirs = [];

afterEach(() => {
  vi.useRealTimers();
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop(), { recursive: true, force: true });
  }
});

const makeTempDir = () => {
  const dir = mkdtempSync(join(tmpdir(), 'write-version-'));
  tempDirs.push(dir);
  return dir;
};

describe('resolveRevision', () => {
  it('usa GITHUB_SHA y no invoca git', () => {
    const git = vi.fn();
    expect(
      resolveRevision({ env: { GITHUB_SHA: SHA.toUpperCase() }, git })
    ).toBe(SHA);
    expect(git).not.toHaveBeenCalled();
  });

  it('cae a git rev-parse HEAD cuando no hay GITHUB_SHA', () => {
    const git = fakeGit({ 'rev-parse HEAD': SHA });
    expect(resolveRevision({ env: {}, git })).toBe(SHA);
  });

  it('aborta si GITHUB_SHA no es un SHA', () => {
    expect(() =>
      resolveRevision({ env: { GITHUB_SHA: 'refs/heads/main' }, git: vi.fn() })
    ).toThrow(/GITHUB_SHA/);
  });

  it('aborta si git devuelve algo que no es un SHA', () => {
    const git = fakeGit({ 'rev-parse HEAD': 'fatal: not a git repository' });
    expect(() => resolveRevision({ env: {}, git })).toThrow(/SHA válido/);
  });
});

describe('resolveCreated', () => {
  it('convierte SOURCE_DATE_EPOCH (segundos Unix) a ISO 8601', () => {
    expect(resolveCreated({ env: { SOURCE_DATE_EPOCH: COMMIT_EPOCH } })).toBe(
      '2023-11-14T22:13:20.000Z'
    );
  });

  it('cae a la fecha del commit cuando no hay SOURCE_DATE_EPOCH', () => {
    const git = fakeGit({ 'log -1 --format=%ct': COMMIT_EPOCH });
    expect(resolveCreated({ env: {}, git })).toBe('2023-11-14T22:13:20.000Z');
  });

  it('rechaza un SOURCE_DATE_EPOCH no numérico', () => {
    expect(() =>
      resolveCreated({ env: { SOURCE_DATE_EPOCH: 'ayer' }, git: vi.fn() })
    ).toThrow(/SOURCE_DATE_EPOCH/);
  });

  it('NO usa Date.now() por defecto', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));
    const git = fakeGit({ 'log -1 --format=%ct': COMMIT_EPOCH });

    expect(resolveCreated({ env: {}, git })).toBe('2023-11-14T22:13:20.000Z');
  });

  it('solo usa la hora actual con now: true', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));

    expect(resolveCreated({ env: {}, git: vi.fn(), now: true })).toBe(
      '2030-01-01T00:00:00.000Z'
    );
  });
});

describe('buildVersion + serializeVersion', () => {
  it('mismo commit → mismo contenido (determinista)', () => {
    const git = fakeGit({
      'rev-parse HEAD': SHA,
      'log -1 --format=%ct': COMMIT_EPOCH,
    });
    const first = serializeVersion(buildVersion({ env: {}, git }));
    const second = serializeVersion(buildVersion({ env: {}, git }));

    expect(first).toBe(second);
    expect(JSON.parse(first)).toEqual({
      revision: SHA,
      created: '2023-11-14T22:13:20.000Z',
    });
    expect(first.endsWith('\n')).toBe(true);
  });

  it('GITHUB_SHA y SOURCE_DATE_EPOCH dan el mismo resultado que git', () => {
    const viaEnv = buildVersion({
      env: { GITHUB_SHA: SHA, SOURCE_DATE_EPOCH: COMMIT_EPOCH },
    });
    const viaGit = buildVersion({
      env: {},
      git: fakeGit({
        'rev-parse HEAD': SHA,
        'log -1 --format=%ct': COMMIT_EPOCH,
      }),
    });

    expect(viaEnv).toEqual(viaGit);
  });
});

describe('writeVersionFile', () => {
  it('crea directorios y escribe bytes idénticos en dos builds', () => {
    const dir = makeTempDir();
    const out = join(dir, 'nested', 'dist', 'version.json');
    const git = fakeGit({
      'rev-parse HEAD': SHA,
      'log -1 --format=%ct': COMMIT_EPOCH,
    });

    writeVersionFile({ out, env: {}, git });
    const first = readFileSync(out, 'utf8');
    writeVersionFile({ out, env: {}, git });
    const second = readFileSync(out, 'utf8');

    expect(first).toBe(second);
    expect(JSON.parse(first)).toEqual({
      revision: SHA,
      created: '2023-11-14T22:13:20.000Z',
    });
  });
});

describe('parseArgs', () => {
  it('usa dist/version.json por defecto', () => {
    expect(parseArgs([])).toEqual({
      out: DEFAULT_OUT,
      now: false,
      help: false,
    });
  });

  it('acepta --out con valor separado y con =', () => {
    expect(parseArgs(['--out', 'a/version.json']).out).toBe('a/version.json');
    expect(parseArgs(['--out=b/version.json']).out).toBe('b/version.json');
  });

  it('acepta --now y --help', () => {
    expect(parseArgs(['--now']).now).toBe(true);
    expect(parseArgs(['--help']).help).toBe(true);
  });

  it('rechaza argumentos desconocidos y --out sin valor', () => {
    expect(() => parseArgs(['--bogus'])).toThrow(/desconocido/);
    expect(() => parseArgs(['--out'])).toThrow(/requiere una ruta/);
  });
});
