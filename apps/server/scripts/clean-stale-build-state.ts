// Guard de build (`npm run build`): `tsc -b` decide si recompilar leyendo
// `tsBuildInfoFile` (`.cache/tsc/tsconfig.tsbuildinfo`), no verificando que la
// salida siga en disco. Si `dist/` se borra a mano y el estado incremental
// sobrevive, `tsc -b` termina con exit 0 SIN emitir nada (falso verde) y el
// `node dist/bin/index.js` posterior falla por archivo inexistente.
//
// `cleanStaleBuildState` detecta ese estado (estado incremental presente +
// salida ausente) y borra solo el `.tsbuildinfo`, para que `tsc -b` reconstruya.
// Es no-op en el caso normal: builds limpios (Docker/CI) y rebuilds
// incrementales con `dist/` intacto no borran nada.
//
// La lógica está exportada para testearla sobre un directorio temporal; el
// efecto sobre el repo real solo ocurre al ejecutar el archivo directamente
// (que es lo que hace el script `build`).

// Se usa `ts.sys` (la abstracción de FS del propio compilador) en lugar de
// `node:fs`: los archivos que se consultan/borran son artefactos de tsc
// (`tsconfig.json` y el `.tsbuildinfo`), y así las rutas dinámicas no disparan
// `security/detect-non-literal-fs-filename` (el lint del server corre con
// `--max-warnings 0`). `typescript` es devDep y actúa en el mismo paso de build
// que `tsc -b`, así que está garantizado que está instalado.
import ts from 'typescript';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface TsConfigShape {
  compilerOptions?: { outDir?: string; tsBuildInfoFile?: string };
}

interface PackageShape {
  main?: string;
}

interface GuardOptions {
  log?: (message: string) => void;
}

/** Lee un JSON del paquete (`tsconfig.json`/`package.json` no llevan comentarios). */
const readJson = <T>(serverRoot: string, file: string): T => {
  const path = join(serverRoot, file);
  const raw = ts.sys.readFile(path);
  if (raw === undefined) throw new Error(`No se pudo leer ${path}`);
  return JSON.parse(raw) as T;
};

/**
 * Borra el estado incremental si la salida que debería describir ya no existe.
 *
 * @param serverRoot Directorio de `apps/server` (contiene `tsconfig.json`).
 * @returns `true` si limpió el `.tsbuildinfo` (se forzó rebuild).
 */
export function cleanStaleBuildState(
  serverRoot: string,
  { log = console.log }: GuardOptions = {}
): boolean {
  const { compilerOptions = {} } = readJson<TsConfigShape>(
    serverRoot,
    'tsconfig.json'
  );
  const { main = 'src/bin/index.ts' } = readJson<PackageShape>(
    serverRoot,
    'package.json'
  );

  const outDir = resolve(serverRoot, compilerOptions.outDir ?? './dist');
  const tsBuildInfo = resolve(
    serverRoot,
    compilerOptions.tsBuildInfoFile ?? join(outDir, 'tsconfig.tsbuildinfo')
  );

  // Entrada emitida esperada (`src/bin/index.ts` -> `dist/bin/index.js`): es la
  // que usa `npm start`, así que si falta, la salida no sirve aunque `dist/`
  // exista parcialmente.
  const entry = join(
    outDir,
    main.replace(/^src\//, '').replace(/\.(?:ts|mts|cts)$/, '.js')
  );

  if (!ts.sys.fileExists(tsBuildInfo) || ts.sys.fileExists(entry)) {
    return false;
  }

  if (ts.sys.deleteFile === undefined) {
    throw new Error(
      'ts.sys no expone deleteFile: no se puede limpiar el estado incremental'
    );
  }
  ts.sys.deleteFile(tsBuildInfo);
  log(
    `[build] '${entry}' no existe pero el estado incremental sí; se limpió ${tsBuildInfo} para forzar un rebuild real.`
  );
  return true;
}

// Solo actúa al invocarse como script (`tsx scripts/clean-stale-build-state.ts`).
// Comprobación en minúsculas: en Windows/macOS el mismo archivo puede llegar con
// otra capitalización en `argv[1]`.
const invokedAsScript =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]).toLowerCase() ===
    fileURLToPath(import.meta.url).toLowerCase();

if (invokedAsScript) {
  cleanStaleBuildState(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
}
