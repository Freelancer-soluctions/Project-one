import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedConfig from '../../vitest.shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(__dirname, './src');

const baseProject = {
  plugins: [react()],
  resolve: {
    alias: {
      '@': srcPath,
    },
  },
};

export default defineConfig(mergeConfig(sharedConfig, {
  test: {
    root: __dirname,
    css: true,
    coverage: {
      exclude: ['node_modules/', 'tests/', '**/*.config.js'],
    },
    deps: {
      optimizer: {
        web: {
          include: ['@testing-library/react', '@testing-library/jest-dom'],
        },
      },
    },
    projects: [
      // Unit project — NO MSW, pure component/utility tests
      {
        ...baseProject,
        test: {
          name: 'unit',
          root: __dirname,
          globals: true,
          include: [
            'src/**/*.unit.test.{js,jsx}',
            'src/**/*.ui.test.{js,jsx}',
          ],
          environment: 'jsdom',
          css: true,
          setupFiles: ['./tests/setup/setupTest.unit.js'],
          deps: {
            optimizer: {
              web: {
                include: ['@testing-library/react', '@testing-library/jest-dom'],
              },
            },
          },
        },
      },
      // Integration project — WITH MSW, i18n, longer timeout
      {
        ...baseProject,
        test: {
          name: 'integration',
          root: __dirname,
          globals: true,
          include: [
            'src/**/*.integration.test.{js,jsx}',
            'tests/**/*.integration.test.{js,jsx}',
          ],
          environment: 'jsdom',
          css: true,
          setupFiles: ['./tests/setup/setupTest.js'],
          testTimeout: 15000,
          deps: {
            optimizer: {
              web: {
                include: ['@testing-library/react', '@testing-library/jest-dom'],
              },
            },
          },
        },
      },
    ],
  },
}));
