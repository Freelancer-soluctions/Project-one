import { defineConfig, mergeConfig } from 'vitest/config';
import sharedConfig from '../../vitest.shared.js';

export default defineConfig(mergeConfig(sharedConfig, {
  test: {
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
