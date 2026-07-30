import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedConfig from '../../vitest.shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(mergeConfig(sharedConfig, {
  test: {
    root: __dirname,
    environment: 'node',
    pool: 'forks',
    ...(process.env.CI === 'true' ? { maxWorkers: 1, isolate: false } : {}),
    reporters: ['default', 'hanging-process'],
    coverage: {
      reportsDirectory: './tests/coverage',
    },
    setupFiles: './tests/setupTest.js',
    include: [
      'src/**/*.unit.test.js',
      'tests/integration/**/*.integration.test.js',
    ],
    testTimeout: 30000,
    hookTimeout: 15000,
    teardownTimeout: 5000,
  },
}));
