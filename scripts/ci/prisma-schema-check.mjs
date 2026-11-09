#!/usr/bin/env node
/**
 * Validación del schema Prisma en pre-commit — change `ci-shifting-left`,
 * capability `db-contract-testing`.
 *
 * Ejecuta, con cwd `apps/server` (donde Prisma carga `.env` y resuelve el
 * schema por convención):
 *   1. prisma validate        -> sintaxis y semántica del schema.
 *   2. prisma format --check  -> el schema está formateado (sin reescribirlo).
 *
 * Se usa el binario local `node_modules/prisma/build/index.js` con el propio
 * Node en lugar de `npx`: funciona igual en Windows/Linux, no depende de red y
 * los argumentos posicionales que lint-staged añade se ignoran a propósito.
 *
 * El drift entre schema y migraciones NO se comprueba aquí (necesita una shadow
 * database): eso es responsabilidad del job CI `db-contract` / `npm run db:contract`.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const serverDir = join(repoRoot, 'apps', 'server');
const prismaBin = join(repoRoot, 'node_modules', 'prisma', 'build', 'index.js');

if (!existsSync(prismaBin)) {
  console.error(`❌ no se encontró el binario de Prisma en ${prismaBin}`);
  console.error('   Ejecuta `npm ci` en la raíz del monorepo.');
  process.exit(1);
}

const run = (args) => {
  const result = spawnSync(process.execPath, [prismaBin, ...args], {
    cwd: serverDir,
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(
      `❌ prisma ${args.join(' ')} no pudo ejecutarse: ${result.error.message}`
    );
    return 1;
  }
  return result.status ?? 1;
};

const validateStatus = run(['validate']);
if (validateStatus !== 0) {
  console.error('❌ prisma validate falló — commit bloqueado.');
  process.exit(validateStatus);
}

const formatStatus = run(['format', '--check']);
if (formatStatus !== 0) {
  console.error(
    '❌ prisma format --check falló — el schema no está formateado (ejecuta `npx prisma format` en apps/server).'
  );
  process.exit(formatStatus);
}
