import { readFile } from 'node:fs/promises';

// Metadatos de build para soporte (change `ci-write-version-metadatos`).
//
// `dist/version.json` lo genera `scripts/write-version.mjs` durante el build
// (etapa `build` del Dockerfile); la app solo lo lee. Ruta LITERAL a propósito:
//   - relativa al cwd, que en la imagen es /app/apps/server (WORKDIR) y en dev
//     apps/server → el mismo sitio donde tsc emite `dist/`;
//   - una ruta literal no dispara `security/detect-non-literal-fs-filename`
//     (lint corre con `--max-warnings 0`).
const VERSION_FILE = 'dist/version.json';

export interface BuildVersion {
  revision: string;
  created: string;
}

const isBuildVersion = (value: unknown): value is BuildVersion => {
  if (typeof value !== 'object' || value === null) return false;
  const { revision, created } = value as Record<string, unknown>;
  return (
    typeof revision === 'string' &&
    revision.length > 0 &&
    typeof created === 'string' &&
    created.length > 0
  );
};

/**
 * Lee `dist/version.json`.
 *
 * Sin caché y sin lanzar: si el archivo no existe (dev sin build) o no tiene
 * la forma esperada, devuelve `null` para que la ruta responda 404 explícito en
 * vez de inventar una revisión.
 */
export const readBuildVersion = async (): Promise<BuildVersion | null> => {
  try {
    const parsed: unknown = JSON.parse(await readFile(VERSION_FILE, 'utf8'));
    return isBuildVersion(parsed)
      ? { revision: parsed.revision, created: parsed.created }
      : null;
  } catch {
    return null;
  }
};
