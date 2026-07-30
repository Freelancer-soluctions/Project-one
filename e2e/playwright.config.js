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
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: [
    {
      command: 'npm run dev --workspace=client-react',
      port: 3000,
    },
    {
      command: 'npm run dev --workspace=server-express',
      port: 4000,
    },
  ],
});
