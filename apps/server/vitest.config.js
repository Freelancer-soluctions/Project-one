import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedConfig from '../../vitest.shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  mergeConfig(sharedConfig, {
    test: {
      root: __dirname,
      environment: 'node',
      pool: 'forks',
      // RUTA, no import. Vitest 4 resuelve cada entrada de `globalSetup` con
      // `resolvePath()` → `pathe.normalizeWindowsPath()`, que llama `.replace()`
      // sobre el valor: pasar la función importada (antes `import seedDb from
      // './tests/setupGlobal.js'` + `globalSetup: [seedDb]`) lo hacia fallar con
      // `TypeError: input.replace is not a function` al ARRANCAR el servidor de
      // Vitest, con o sin `--coverage`. Como `test-unit-server` es FASE 1 advisory
      // (`continue-on-error: true`), ese fallo quedaba invisible en CI: el job
      // salía rojo y nadie lo leía, y la suite server no llegaba a correr.
      globalSetup: ['./tests/setupGlobal.js'],
      // CI corre serializado (`maxWorkers: 1`) y con `retry: 2`.
      //
      // `isolate: false` se elimino a proposito (2026-10-03). Con el registro de modulos
      // compartido, el `vi.mock` del PRIMER test file de un worker se queda cacheado y pisa al
      // de los siguientes: cada fichero declaraba solo el subconjunto de exports que exercise
      // (4, 7, 8, 8 y 11 frente a los 12 reales de `attendee/dao.js`), asi que el resultado
      // dependia del ORDEN de ejecucion. Sintomas: `prisma.events.findUnique is not a function`
      // y `No "findAttendeeById" export is defined on the "./dao.js" mock`, con 41-49 tests
      // rojos en el job `Tests: Unit - Server` y el gate de coverage en rojo por cascada.
      //
      // Coste medido: la suite unit pasa de ~1.2s a ~4.4s (+3.2s) sobre un job de ~2m20s (~2%).
      // A cambio los tests vuelven a ser independientes del orden, que es la propiedad que un
      // gate blocking necesita para que su rojo signifique algo.
      ...(process.env.CI === 'true' ? { maxWorkers: 1, retry: 2 } : {}),
      reporters: ['default', 'hanging-process'],
      coverage: {
        reportsDirectory: './tests/coverage',
        thresholds: {
          statements: 39,
          branches: 18,
          functions: 7,
          lines: 39,
        },
      },
      setupFiles: ['./tests/setupTest.js'],
      include: [
        'src/**/*.unit.test.js',
        'tests/**/*.unit.test.js',
        'tests/integration/**/*.integration.test.js',
      ],
      testTimeout: 30000,
      hookTimeout: 15000,
      teardownTimeout: 5000,
    },
  })
);
