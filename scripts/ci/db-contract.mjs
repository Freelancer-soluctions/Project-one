#!/usr/bin/env node
/**
 * Contrato schema Prisma ↔ migraciones — change `ci-shifting-left`,
 * capability `db-contract-testing`.
 *
 * Compara el estado resultante de replayar `prisma/migrations` con el schema
 * declarado en `prisma/schema.prisma`:
 *
 *   prisma migrate diff --from-migrations ./prisma/migrations \
 *     --to-schema-datamodel ./prisma/schema.prisma \
 *     --shadow-database-url <SHADOW_DATABASE_URL> --exit-code
 *
 * El flag `--shadow-database-url` es OBLIGATORIO en Prisma cuando `--from-migrations`
 * apunta a un directorio: Prisma necesita recrear las migraciones en una base de
 * datos desechable para calcular el diff. Sin él, el comando aborta con
 * "You must pass the --shadow-database-url", por eso el script lo exige y falla
 * con un mensaje accionable en lugar de devolver un verde falso.
 *
 * Exit codes (los de `prisma migrate diff --exit-code`):
 *   0 -> contrato en sync (no hay drift).
 *   2 -> DRIFT: el schema difiere de las migraciones (falla el job `db-contract`).
 *   1 -> error de ejecución (schema inválido, credenciales, red...).
 *
 * En CI la shadow DB la provee el service `postgres` del job `db-contract`.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const serverDir = join(repoRoot, 'apps', 'server');
const prismaBin = join(repoRoot, 'node_modules', 'prisma', 'build', 'index.js');

const shadowUrl = process.env.SHADOW_DATABASE_URL;

if (!shadowUrl) {
  console.error('❌ Falta SHADOW_DATABASE_URL.');
  console.error(
    '   `prisma migrate diff --from-migrations` exige una base de datos desechable para replayar las migraciones.'
  );
  console.error(
    '   Local: apunta a un Postgres vacío, p. ej. SHADOW_DATABASE_URL=postgresql://user:pass@localhost:5432/shadow_db'
  );
  console.error(
    '   CI: el job `db-contract` levanta el service `postgres` y exporta esa variable.'
  );
  process.exit(1);
}

if (!existsSync(prismaBin)) {
  console.error(`❌ no se encontró el binario de Prisma en ${prismaBin}`);
  console.error('   Ejecuta `npm ci` en la raíz del monorepo.');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    prismaBin,
    'migrate',
    'diff',
    '--from-migrations',
    './prisma/migrations',
    '--to-schema-datamodel',
    './prisma/schema.prisma',
    '--shadow-database-url',
    shadowUrl,
    '--exit-code',
  ],
  { cwd: serverDir, stdio: 'inherit' }
);

if (result.error) {
  console.error(
    `❌ prisma migrate diff no pudo ejecutarse: ${result.error.message}`
  );
  process.exit(1);
}

const status = result.status ?? 1;

if (status === 2) {
  console.error(
    '❌ DRIFT de contrato: el diff de arriba son los cambios del schema que NO están en las migraciones.'
  );
  console.error(
    '   Remediación: crea la migración (`npm run prisma-migration`) y commitéala.'
  );
}

process.exit(status);
