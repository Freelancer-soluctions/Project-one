import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 15000,
    teardownTimeout: 5000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
