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
          // PISO GLOBAL — describe el conjunto del workspace. EXCEPCIÓN DOCUMENTADA
          // (change `client-snapshot-testing`, 2026-10-09, aprobada por usuario): el piso
          // 87.02/62.16/69.14/87.7 se calibró sobre un universo de 262 statements
          // (`e7644d08`); el universo actual es de 2042 statements/109 ficheros y la
          // cobertura absoluta subió 5.8× (228→1316) con los tests snapshot F0-F3, por lo
          // que el porcentaje bajó aunque el código cubierto creció. Se hace re-baseline
          // a los valores medidos reales; la política 'solo sube' queda excepcionada para
          // este cambio. Follow-up: estabilizar el universo con `coverage.include`.
          statements: 64.44,
          branches: 42.11,
          functions: 52.22,
          lines: 64.82,

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
            statements: 39.1,
            branches: 44.31,
            functions: 40.35,
            lines: 36.07,
            perFile: true,
          },
          // Área heterogénea (table.jsx functions 62.5, button.jsx branches 66.66):
          // se exige el AGREGADO del área, no cada fichero. Sin `perFile` a propósito.
          'src/components/ui/**': {
            statements: 86.65,
            branches: 44.3,
            functions: 67.96,
            lines: 87.08,
          },
        },
      },
      include: [
        'src/**/*.unit.test.{js,jsx}',
        'src/**/*.ui.test.{js,jsx}',
        'src/**/*.integration.test.{js,jsx}',
      ],
      setupFiles: ['./tests/setup/setupTest.js'],
      // Presupuesto de salida por snapshot: un snapshot gigante es un snapshot
      // que nadie revisa. Verificado empíricamente (tasks.md 1.1): con 10000
      // los Datatables de ~9 columnas se colapsaban (marcador `…`), así que se
      // subió a 100000 y se re-verificó limpio antes de que entrara F2.
      snapshotFormat: { maxOutputLength: 100000 },
      update: process.env.CI ? 'none' : 'new',
      testTimeout: 30000,
      hookTimeout: 15000,
      teardownTimeout: 5000,
    },
  })
);
