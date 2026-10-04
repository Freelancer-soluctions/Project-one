import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedConfig from '../../vitest.shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(__dirname, './src');

export default defineConfig(
  mergeConfig(sharedConfig, {
    plugins: [react()],
    resolve: {
      alias: {
        '@': srcPath,
      },
    },
    test: {
      root: __dirname,
      environment: 'jsdom',
      css: true,
      pool: 'forks',
      // CI corre serializado (`maxWorkers: 1`). `isolate: false` se eliminó a propósito el
      // 2026-10-03 por el mismo motivo que en `apps/server/vitest.config.js`: con el registro
      // de módulos compartido el `vi.mock` del primer fichero de test se cachea y pisa al de
      // los siguientes, haciendo que el resultado dependa del ORDEN de ejecución. Ver el
      // requirement "Vitest CI runs keep module isolation" de `ci-flaky-retry`. El cliente no
      // sufría el síntoma (26/26 con y sin), pero mantener la divergencia sería dejar la
      // trampa armada para el próximo test que mockee un módulo compartido.
      ...(process?.env?.CI === 'true' ? { maxWorkers: 1 } : {}),
      reporters: ['default', 'hanging-process'],
      coverage: {
        exclude: ['node_modules/', 'tests/', '**/*.config.js'],
        thresholds: {
          statements: 84,
          branches: 49,
          functions: 63,
          lines: 85,
        },
      },
      include: [
        'src/**/*.unit.test.{js,jsx}',
        'src/**/*.ui.test.{js,jsx}',
        'src/**/*.integration.test.{js,jsx}',
      ],
      setupFiles: ['./tests/setup/setupTest.js'],
      testTimeout: 30000,
      hookTimeout: 15000,
      teardownTimeout: 5000,
    },
  })
);
