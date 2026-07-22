import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedConfig from '../../vitest.shared.js';

export default defineConfig(mergeConfig(sharedConfig, {
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
  test: {
    environment: 'jsdom',

    // setupFiles run before each test file
    setupFiles: ['./tests/setup/setupTest.js'],

    // Evita errores al importar estilos
    css: true,

    coverage: {
      exclude: ['node_modules/', 'tests/', '**/*.config.js'],
    },

    // Evita que Vitest escanee todo el repo
    include: ['src/**/*.test.{js,jsx}', 'tests/**/*.test.{js,jsx}'],

    // Optimización avanzada
    deps: {
      optimizer: {
        web: {
          include: ['@testing-library/react', '@testing-library/jest-dom'],
        },
      },
    },
  },
}));
