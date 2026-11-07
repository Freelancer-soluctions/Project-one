import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedConfig from '../../vitest.shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Unit-only Vitest project for Stryker (`stryker.config.mjs`).
 *
 * The main server config also includes `tests/integration/**`, which needs a
 * live PostgreSQL. Mutation testing runs nightly without a database service,
 * so it must evaluate only the unit suite.
 *
 * `globalSetup` is kept because it loads `.env.test` (unit tests assert on
 * required env vars). Its DB seed attempt warns without Postgres but does not
 * fail the unit suite.
 */
export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      root: __dirname,
      environment: 'node',
      globalSetup: ['./tests/setupGlobal.ts'],
      setupFiles: ['./tests/setupTest.ts'],
      include: ['src/**/*.unit.test.{js,ts}', 'tests/**/*.unit.test.{js,ts}'],
      testTimeout: 30000,
      hookTimeout: 15000,
      teardownTimeout: 5000,
      ...(process.env.CI === 'true' ? { maxWorkers: 1, retry: 2 } : {}),
    },
  })
);
