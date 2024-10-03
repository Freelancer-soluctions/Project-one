import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Basic
    environment: 'node',
    globals: true,
    // exclude: ['./tests/bin/index.test.js'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './tests/coverage',
      reporter: ['text', 'html'] // Puedes generar reportes en varios formatos

    },
    setupFiles: './tests/setupTest.js'

  }
})
