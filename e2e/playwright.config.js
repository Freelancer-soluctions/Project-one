import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  testIgnore: [
    '**/node_modules/**',
    '**/apps/**',
    '**/docs/**',
    '**/*.unit.test.js',
    '**/*.integration.test.js',
    '**/*.smoke.test.js',
    '**/*.test.jsx',
    '**/*.test.js',
  ],
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'npm run dev --workspace=client-react',
      port: 5173,
      timeout: 30000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev --workspace=server-express',
      port: 3000,
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
    },
  ],
  reporter: process.env.CI
    ? [
        ['junit', { outputFile: 'reports/junit-e2e.xml' }],
        ['list'],
      ]
    : 'list',
});
