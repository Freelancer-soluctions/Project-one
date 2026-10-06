import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedConfig from '../../vitest.shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(__dirname, './src');

// ORDEN IMPORTANTE: `mergeConfig(shared, defineConfig({...}))`, NO
// `defineConfig(mergeConfig(...))`. El `autoUpdate` de thresholds de Vitest reescribe
// el config con magicast y solo reconoce tres formas: `export default {test:{}}`,
// `defineConfig({...})` y `mergeConfig(..., defineConfig({...}))`. Con la forma
// invertidalanza "Failed to update coverage thresholds. Configuration file is too
// complex.", que es lo que rompía `npm run coverage:ratchet`.
export default mergeConfig(
  sharedConfig,
  defineConfig({
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
          // PISO GLOBAL — describe el conjunto del workspace (29 ficheros). Lo fija
          // `npm run coverage:ratchet` a la cobertura medida; solo sube, nunca baja.
          // El margen deliberadamente no se reintroduce a mano: si una PR nueva baja
          // el total, elgate avisa (hoy FASE 1 advisory) y la respuesta es anadir
          // tests y volver a ratchetear, NO bajar el suelo.
          statements: 87.02,
          branches: 62.16,
          functions: 69.14,
          lines: 87.7,

          // GRANULARIDAD ALTA — el piso global queda donde esté y las áreas ya sólidas se
          // blindan por separado, para que el total siga siendo comparable entre
          // corridas (floor bajo + granularidad alta).
          //
          // `perFile: true` en un glob significa que CADA fichero casado debe
          // alcanzar ese umbral (no el agregado). Los globs NO heredan el `perFile`
          // de nivel superior: hay que declararlo en cada uno.
          //
          // Estos valores los sube `npm run coverage:ratchet` a la cobertura medida
          // de cada área. NO subirlos a mano sin añadir antes los tests que los
          // sostienen; `src/components/ui/**` va solo por agregado porque es
          // heterogénea (table.jsx functions 62.5, button.jsx branches 66.66).
          'src/lib/**': {
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100,
            perFile: true,
          },
          'src/config/**': {
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100,
            perFile: true,
          },
          'src/hooks/**': {
            statements: 100,
            branches: 92.68,
            functions: 100,
            lines: 100,
            perFile: true,
          },
          // Área heterogénea (table.jsx functions 62.5, button.jsx branches 66.66):
          // se exige el AGREGADO del área, no cada fichero. Sin `perFile` a propósito.
          'src/components/ui/**': {
            statements: 96.7,
            branches: 83.33,
            functions: 85,
            lines: 96.7,
          },
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
