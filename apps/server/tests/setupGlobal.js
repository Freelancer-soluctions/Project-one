/**
 * Vitest globalSetup — seeds the test database before the test suite runs.
 *
 * WHY:
 * After `prisma migrate deploy` the DB is empty. Integration tests like
 * `events-soft-delete.integration.test.js` do `prisma.events.upsert({
 *   create: { createdBy: 1, eventTypeId: 1 }
 * })` in their `beforeAll`. Without users(id=1) and eventTypes(id=1)
 * in the DB this throws a foreign-key constraint violation:
 *   Key (createdBy)=(1) is not present in table "users"
 *
 * CI ALREADY runs `npx prisma db seed` as a dedicated step, but:
 *   - Those CI jobs are currently disabled (`if: false`).
 *   - Local developers running `npm run test:integration` have no
 *     automatic seeding, so they hit the FK violation.
 *
 * This globalSetup covers local runs. In CI it is idempotent (seed uses
 * upsert + createMany(skipDuplicates) + `if (count() === 0)` guard),
 * so the double-seed is harmless.
 *
 * NOTE: globalSetup runs BEFORE setupFiles (setupTest.js), so it must
 * load .env.test itself to provide AES_GCM_KEY / DATABASE_URL /
 * NODE_ENV to the child seed process.
 */
import { config } from 'dotenv';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
  // Load .env.test so env vars are available for the seed child process.
  // __dirname is apps/server/tests/, .env.test lives one level up in apps/server/
  config({ path: path.join(__dirname, '..', '.env.test') });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn(
      '⚠️ [globalSetup] DATABASE_URL is not set — skipping DB seed. ' +
        'Tests that require a database will fail.'
    );
    return;
  }

  console.log('🌱 [globalSetup] Seeding test database...');

  const result = spawnSync('node', ['prisma/seed.js'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'test' },
  });

  if (result.status !== 0) {
    console.warn(
      `⚠️ [globalSetup] Seed script exited with code ${result.status}. ` +
        'Tests may fail if they depend on seeded data.'
    );
  } else {
    console.log('✅ [globalSetup] Database seeded successfully');
  }
}
