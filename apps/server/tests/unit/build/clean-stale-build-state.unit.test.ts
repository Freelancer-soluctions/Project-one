import { describe, it, expect, afterEach } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanStaleBuildState } from '../../../scripts/clean-stale-build-state.js';

/**
 * Regresión del guard de `npm run build` (`scripts/clean-stale-build-state.ts`):
 * `tsc -b` confía en `.tsbuildinfo` y, si `dist/` se borró, salía con exit 0 sin
 * emitir nada (falso verde). Los tests ejercitan la función sobre un
 * `apps/server` de mentira en un directorio temporal, así que nunca tocan el
 * `dist/` real.
 */

const DEFAULT_BUILD_INFO = '.cache/tsc/tsconfig.tsbuildinfo';

const silent = { log: (): void => {} };
const tempRoots: string[] = [];

interface ScaffoldOptions {
  outDir?: string;
  tsBuildInfoFile?: string;
  main?: string;
  buildInfo?: boolean;
  entry?: boolean;
}

interface Scaffold {
  serverRoot: string;
  buildInfoPath: string;
  entryPath: string;
}

/** `apps/server` mínimo: `tsconfig.json`, `package.json` y estado/salida a medida. */
function scaffold({
  outDir = './dist',
  tsBuildInfoFile = `./${DEFAULT_BUILD_INFO}`,
  main = 'src/bin/index.ts',
  buildInfo = true,
  entry = true,
}: ScaffoldOptions = {}): Scaffold {
  const serverRoot = mkdtempSync(join(tmpdir(), 'build-guard-'));
  tempRoots.push(serverRoot);

  writeFileSync(
    join(serverRoot, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { outDir, tsBuildInfoFile } })
  );
  writeFileSync(
    join(serverRoot, 'package.json'),
    JSON.stringify({ name: 'fake-server', main })
  );

  const buildInfoPath = resolve(serverRoot, tsBuildInfoFile);
  // Entrada esperada derivada del `main`, igual que en el guard.
  const entryPath = resolve(
    serverRoot,
    outDir,
    main.replace(/^src\//, '').replace(/\.(?:ts|mts|cts)$/, '.js')
  );

  if (buildInfo) {
    mkdirSync(dirname(buildInfoPath), { recursive: true });
    writeFileSync(buildInfoPath, '{}');
  }
  if (entry) {
    mkdirSync(dirname(entryPath), { recursive: true });
    writeFileSync(entryPath, '// emitido');
  }

  return { serverRoot, buildInfoPath, entryPath };
}

afterEach(() => {
  while (tempRoots.length > 0) {
    rmSync(tempRoots.pop() as string, { recursive: true, force: true });
  }
});

describe('cleanStaleBuildState', () => {
  it('borra el estado incremental cuando la entrada emitida no existe (dist borrado)', () => {
    const { serverRoot, buildInfoPath, entryPath } = scaffold({ entry: false });

    expect(cleanStaleBuildState(serverRoot, silent)).toBe(true);
    expect(existsSync(buildInfoPath)).toBe(false);
    // No crea salida: el rebuild real es responsabilidad de `tsc -b`.
    expect(existsSync(entryPath)).toBe(false);
  });

  it('no toca nada cuando el build está al día', () => {
    const { serverRoot, buildInfoPath, entryPath } = scaffold();
    const before = readFileSync(buildInfoPath, 'utf8');

    expect(cleanStaleBuildState(serverRoot, silent)).toBe(false);
    expect(readFileSync(buildInfoPath, 'utf8')).toBe(before);
    expect(existsSync(entryPath)).toBe(true);
  });

  it('no falla ni inventa limpieza cuando no hay estado incremental', () => {
    const { serverRoot, buildInfoPath } = scaffold({
      buildInfo: false,
      entry: false,
    });

    expect(() => cleanStaleBuildState(serverRoot, silent)).not.toThrow();
    expect(cleanStaleBuildState(serverRoot, silent)).toBe(false);
    expect(existsSync(buildInfoPath)).toBe(false);
  });

  it('detecta salida parcial: dist existe pero falta bin/index.js', () => {
    const { serverRoot, buildInfoPath } = scaffold({ entry: false });

    expect(cleanStaleBuildState(serverRoot, silent)).toBe(true);
    expect(existsSync(buildInfoPath)).toBe(false);
  });

  it('respeta outDir y tsBuildInfoFile personalizados del tsconfig', () => {
    const { serverRoot, buildInfoPath } = scaffold({
      outDir: './build-output',
      tsBuildInfoFile: './tmp-state/project.tsbuildinfo',
      entry: false,
    });
    expect(buildInfoPath.endsWith('project.tsbuildinfo')).toBe(true);

    expect(cleanStaleBuildState(serverRoot, silent)).toBe(true);
    expect(existsSync(buildInfoPath)).toBe(false);
  });

  it('avisa por consola solo cuando limpia', () => {
    const messages: string[] = [];

    const stale = scaffold({ entry: false });
    cleanStaleBuildState(stale.serverRoot, { log: (m) => messages.push(m) });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('rebuild real');

    const healthy = scaffold();
    cleanStaleBuildState(healthy.serverRoot, { log: (m) => messages.push(m) });
    expect(messages).toHaveLength(1);
  });

  it('sigue enganchado al script `build` del package.json del server', () => {
    const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
    const { scripts } = JSON.parse(
      readFileSync(join(serverRoot, 'package.json'), 'utf8')
    ) as { scripts: Record<string, string> };

    // Si alguien revierte `build` a `tsc -b`, el guard deja de correr aunque
    // todos los tests de arriba sigan verdes: este es el test que lo impide.
    expect(scripts.build).toContain('scripts/clean-stale-build-state.ts');
    expect(scripts.build).toContain('tsc -b');
  });
});
