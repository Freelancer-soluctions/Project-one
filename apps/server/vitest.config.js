import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedConfig from '../../vitest.shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(mergeConfig(sharedConfig, {
  test: {
    root: __dirname,
    environment: 'node',
    coverage: {
      reportsDirectory: './tests/coverage',
    },
    setupFiles: './tests/setupTest.js',
    // Hybrid test organization (see docs/testing-architecture.md section 8):
    //   - Colocated unit tests: src/<module>/*.unit.test.js (primary location)
    //   - Integration tests grouped by module: tests/integration/<module>/*.integration.test.js
    //   - Orphan tests: tests/orphans/ (describe.skip or describe.todo exceptions)
    include: [
      'src/**/*.unit.test.js',
      'tests/integration/**/*.integration.test.js',
    ],
  },
}));
