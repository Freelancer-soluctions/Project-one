import { mergeConfig, defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

// Runs scoped (`--changed` + `--coverage.changed`) con thresholds nativos
// anulados (task 2.1, design D3/F1): `vitest run --coverage` evalúa
// `coverage.thresholds` contra el informe QUE SEA — con el informe limitado
// al diff, un fichero poco cubierto haría salir 1 al propio job de tests.
// Por eso este fichero importa el config DEL WORKSPACE (preserva root,
// environment, globalSetup, reportsDirectory, include, setupFiles…) y
// reemplaza `test.coverage.thresholds` por los cuatro globales a 0.
//
// Reemplazo EXPLÍCITO tras el merge: `mergeConfig` hace deep-merge y
// conservaría los thresholds-por-glob del base (probado), así que se pisan
// después de fusionar. Sin globs ni `perFile` a propósito.
//
// El config principal queda intacto: `coverage:ratchet` sigue operando
// sobre `vitest.config.js` (este fichero nuevo no lo toca).
const merged = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        thresholds: {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0,
        },
      },
    },
  })
);

// Anulación total: ni globales altos, ni globs, ni `perFile`.
merged.test.coverage.thresholds = {
  statements: 0,
  branches: 0,
  functions: 0,
  lines: 0,
};

export default merged;
