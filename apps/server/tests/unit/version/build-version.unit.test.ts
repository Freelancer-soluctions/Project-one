import { describe, it, expect, vi, beforeEach } from 'vitest';

const { readFileMock } = vi.hoisted(() => ({ readFileMock: vi.fn() }));

vi.mock('node:fs/promises', () => ({ readFile: readFileMock }));

import { readBuildVersion } from '../../../src/utils/version/build-version.js';

// `readBuildVersion` es el único punto de contacto con `dist/version.json`
// (change `ci-write-version-metadatos`): si devolviera algo inventado, el
// endpoint de soporte reportaría una revisión que no corresponde.
describe('readBuildVersion', () => {
  beforeEach(() => {
    readFileMock.mockReset();
  });

  it('lee dist/version.json y devuelve revision + created', async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({
        revision: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
        created: '2023-11-14T22:13:20.000Z',
      })
    );

    await expect(readBuildVersion()).resolves.toEqual({
      revision: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
      created: '2023-11-14T22:13:20.000Z',
    });
    expect(readFileMock).toHaveBeenCalledWith('dist/version.json', 'utf8');
  });

  it('devuelve null si el archivo no existe', async () => {
    readFileMock.mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    await expect(readBuildVersion()).resolves.toBeNull();
  });

  it('devuelve null si el JSON no parsea', async () => {
    readFileMock.mockResolvedValue('{ no es json');

    await expect(readBuildVersion()).resolves.toBeNull();
  });

  it('devuelve null si faltan campos o están vacíos', async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ revision: '' }));
    await expect(readBuildVersion()).resolves.toBeNull();

    readFileMock.mockResolvedValue(JSON.stringify({ revision: 'abc' }));
    await expect(readBuildVersion()).resolves.toBeNull();

    readFileMock.mockResolvedValue(JSON.stringify(null));
    await expect(readBuildVersion()).resolves.toBeNull();
  });

  it('descarta campos extra del archivo', async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({
        revision: 'abc1234',
        created: '2023-11-14T22:13:20.000Z',
        extra: 1,
      })
    );

    await expect(readBuildVersion()).resolves.toEqual({
      revision: 'abc1234',
      created: '2023-11-14T22:13:20.000Z',
    });
  });
});
