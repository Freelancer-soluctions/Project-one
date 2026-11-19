#!/usr/bin/env node
/**
 * Escribe `dist/version.json` con `{ revision, created }` (PRD §"Versionado,
 * metadatos de build y release"). Change `ci-write-version-metadatos`.
 *
 * Objetivo: dos builds del MISMO commit producen un `version.json` byte a byte
 * idéntico. Por eso:
 *
 *   revision ← GITHUB_SHA  o  `git rev-parse HEAD`
 *   created  ← SOURCE_DATE_EPOCH  o  `git log -1 --format=%ct` (fecha del commit)
 *
 * `Date.now()` NO se usa por defecto: solo con `--now` explícito (rompe la
 * reproducibilidad a propósito, útil para builds locales de prueba).
 *
 * Uso:
 *   node scripts/write-version.mjs                     # ./dist/version.json
 *   node scripts/write-version.mjs --out apps/server/dist/version.json
 *   node scripts/write-version.mjs --now               # marca de tiempo actual
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Ruta de salida por defecto, relativa al cwd (en la imagen: apps/server). */
export const DEFAULT_OUT = 'dist/version.json';

const SHA_RE = /^[0-9a-f]{7,40}$/i;

/**
 * Ejecuta git y devuelve stdout recortado.
 * @param {string[]} args
 * @returns {string}
 */
export function gitOutput(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

/**
 * Resuelve el commit del build. Sin fallback silencioso: si no hay
 * `GITHUB_SHA` ni git, aborta en vez de hornear un `revision` que miente.
 * @param {{ env?: NodeJS.ProcessEnv, git?: (args: string[]) => string }} [options]
 * @returns {string}
 */
export function resolveRevision({ env = process.env, git = gitOutput } = {}) {
  const fromEnv = (env['GITHUB_SHA'] ?? '').trim();
  if (fromEnv) {
    if (!SHA_RE.test(fromEnv)) {
      throw new Error(`GITHUB_SHA no es un SHA válido: "${fromEnv}"`);
    }
    return fromEnv.toLowerCase();
  }

  const fromGit = git(['rev-parse', 'HEAD']);
  if (!SHA_RE.test(fromGit)) {
    throw new Error(
      `git rev-parse HEAD no devolvió un SHA válido: "${fromGit}"`
    );
  }
  return fromGit.toLowerCase();
}

/**
 * Resuelve `created` como ISO 8601 UTC (sin milisegundos variables).
 * @param {{ env?: NodeJS.ProcessEnv, git?: (args: string[]) => string, now?: boolean }} [options]
 * @returns {string}
 */
export function resolveCreated({
  env = process.env,
  git = gitOutput,
  now = false,
} = {}) {
  if (now) return new Date().toISOString();

  const fromEnv = (env['SOURCE_DATE_EPOCH'] ?? '').trim();
  const raw = fromEnv || git(['log', '-1', '--format=%ct']);
  if (!/^\d+$/.test(raw)) {
    throw new Error(
      `SOURCE_DATE_EPOCH debe ser un entero de segundos Unix, recibido: "${raw}"`
    );
  }

  const created = new Date(Number(raw) * 1000);
  if (Number.isNaN(created.getTime())) {
    throw new Error(`SOURCE_DATE_EPOCH fuera de rango: "${raw}"`);
  }
  return created.toISOString();
}

/**
 * Construye el objeto de versión.
 * @param {{ env?: NodeJS.ProcessEnv, git?: (args: string[]) => string, now?: boolean }} [options]
 * @returns {{ revision: string, created: string }}
 */
export function buildVersion(options = {}) {
  return {
    revision: resolveRevision(options),
    created: resolveCreated(options),
  };
}

/**
 * Serializa de forma estable: mismo objeto → mismos bytes.
 * @param {{ revision: string, created: string }} version
 * @returns {string}
 */
export function serializeVersion(version) {
  return `${JSON.stringify({ revision: version.revision, created: version.created }, null, 2)}\n`;
}

/**
 * Escribe el archivo de versión.
 * @param {{ out?: string, env?: NodeJS.ProcessEnv, git?: (args: string[]) => string, now?: boolean }} [options]
 * @returns {{ out: string, version: { revision: string, created: string }, contents: string }}
 */
export function writeVersionFile({
  out = DEFAULT_OUT,
  env = process.env,
  git = gitOutput,
  now = false,
} = {}) {
  const version = buildVersion({ env, git, now });
  const contents = serializeVersion(version);
  const outPath = resolve(out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, contents, 'utf8');
  return { out: outPath, version, contents };
}

/**
 * Parsea argumentos de CLI.
 * @param {string[]} argv
 * @returns {{ out: string, now: boolean, help: boolean }}
 */
export function parseArgs(argv) {
  const parsed = { out: DEFAULT_OUT, now: false, help: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--now') {
      parsed.now = true;
    } else if (arg === '--out') {
      const value = argv[i + 1];
      if (!value) throw new Error('--out requiere una ruta');
      parsed.out = value;
      i += 1;
    } else if (arg.startsWith('--out=')) {
      parsed.out = arg.slice('--out='.length);
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else {
      throw new Error(`Argumento desconocido: "${arg}"`);
    }
  }

  return parsed;
}

function main(argv) {
  try {
    const args = parseArgs(argv);
    if (args.help) {
      console.log(
        'Uso: node scripts/write-version.mjs [--out <ruta>] [--now]\n' +
          `  --out  destino de version.json (default: ${DEFAULT_OUT})\n` +
          '  --now  usa la hora actual en `created` (rompe la reproducibilidad)'
      );
      return 0;
    }

    const { out, version } = writeVersionFile({
      out: args.out,
      now: args.now,
    });
    console.log(
      `version.json → ${out} (revision=${version.revision}, created=${version.created})`
    );
    return 0;
  } catch (error) {
    console.error(
      `write-version: ${error instanceof Error ? error.message : String(error)}`
    );
    return 1;
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  process.exitCode = main(process.argv.slice(2));
}
