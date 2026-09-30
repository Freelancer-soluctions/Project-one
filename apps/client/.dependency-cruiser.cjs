/**
 * Config de workspace `apps/client` — capa fina sobre la raíz.
 *
 * `extends` resuelve rutas relativas al propio config, así que
 * `../../.dependency-cruiser.cjs` apunta al único fuente de verdad en la raíz
 * (change `import-boundaries`). Aquí solo van overrides específicos del
 * client: resolución del alias `@` (webpack.depcruise.config.cjs).
 *
 * Los paths de reglas matchean desde la RAÍZ (los scripts `depcruise:*` y el
 * CI corren desde ahí) — la dead-rule histórica de las reglas cross-workspace
 * está arreglada por diseño.
 *
 * Docs canónicas: docs/learning/import-boundaries.md
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  extends: ['../../.dependency-cruiser.cjs'],
};
