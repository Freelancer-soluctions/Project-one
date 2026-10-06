import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedConfig from '../../vitest.shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      root: __dirname,
      environment: 'node',
      // RUTA, no import — ver la nota equivalente en `vitest.config.js`: Vitest 4
      // resuelve cada entrada de `globalSetup` como módulo y una función importada
      // lo rompe con `TypeError: input.replace is not a function` al arrancar.
      globalSetup: ['./tests/setupGlobal.js'],
      setupFiles: ['./tests/setupTest.js'],
      include: ['tests/smoke/**/*.smoke.test.js'],
      testTimeout: 15000,
      hookTimeout: 10000,
      // pool: 'forks', // inherited from shared
      // singleFork: true, // smoke tests don't need strict isolation
    },
  })
);
