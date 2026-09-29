/**
 * Config de workspace `apps/server` — capa fina sobre la raíz.
 *
 * `extends` resuelve rutas relativas al propio config, así que
 * `../../.dependency-cruiser.cjs` apunta al único fuente de verdad en la raíz
 * (change `import-boundaries`). El server no declara reglas propias: hereda
 * cross-workspace (error), `no-circular-server` (error) y las capas internas
 * (controller→controller, dao-in-routes: warn).
 *
 * Los paths de reglas matchean desde la RAÍZ (los scripts `depcruise:*` y el
 * CI corren desde ahí) — la dead-rule histórica de las reglas cross-workspace
 * está arreglada por diseño.
 *
 * Coordinación `server-typescript-migration`: los regex de controller/dao ya
 * cubren `(js|ts)` en la raíz; cuando exista `tsconfig.json` bastará añadir
 * `options.tsConfig.fileName` aquí (la raíz ya activa tsPreCompilationDeps).
 *
 * Docs canónicas: docs/learning/import-boundaries.md
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  extends: ['../../.dependency-cruiser.cjs'],
};
