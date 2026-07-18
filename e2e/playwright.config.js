import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: [
    {
      command: 'npm run dev --workspace=client',
      port: 3000,
    },
    {
      command: 'npm run dev --workspace=server',
      port: 4000,
    },
  ],
});
