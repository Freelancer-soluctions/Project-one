/**
 * Config de webpack SOLO para dependency-cruiser (NO es un build config).
 *
 * dependency-cruiser lee la sección `resolve` de este archivo para resolver el
 * alias `@` del client (`@/...` → `apps/client/src/...`) cuando corre desde la
 * raíz del monorepo (`npm run depcruise:*`, CI). La ruta del alias usa
 * `__dirname`, por lo que es independiente del CWD — a diferencia de
 * `--ts-config apps/client/jsconfig.json`, cuyos `paths`/`include` TypeScript
 * solo resuelve correctamente con CWD=apps/client.
 *
 * Vite (vite.config.js) es el dueño real del alias en build/dev; este archivo
 * existe únicamente para que el grafo de dependency-cruiser y el bundler
 * resuelvan los mismos imports. No eliminar sin actualizar
 * `.dependency-cruiser.cjs` (options.webpackConfig) y
 * docs/learning/import-boundaries.md.
 */
const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.json'],
  },
};
