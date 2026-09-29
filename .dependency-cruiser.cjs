/**
 * Config raíz de dependency-cruiser — única fuente de verdad de los import
 * boundaries del monorepo (change `import-boundaries`).
 *
 * Se ejecuta SIEMPRE desde la raíz (`npm run depcruise:*`): los paths de las
 * reglas (`^apps/...`, `^e2e/...`) son relativos a la raíz del repo, lo que
 * arregla la dead-rule histórica (los configs por workspace corrían con
 * working-directory `apps/*`, así que `^apps/client` nunca matcheaba).
 *
 * Los configs de workspace (`apps/{client,server}/.dependency-cruiser.cjs`)
 * solo hacen `extends` de este archivo + overrides mínimos (p. ej. `tsConfig`).
 *
 * Docs canónicas: docs/learning/import-boundaries.md
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  // Autocompletado/validación en editores (para archivos .cjs el autocompletado
  // real lo da el JSDoc `@type` de arriba; la URL documenta la intención).
  $schema: 'https://json.schemastore.org/dependency-cruiser.json',
  // Base recomendada oficial (no-orphans, no-circular, not-to-unresolvable,
  // not-to-deprecated, no-deprecated-core, no-duplicate-dep-types,
  // no-non-package-json). Las reglas del mismo nombre que declaremos abajo
  // hacen merge con las de la base y sus atributos ganan.
  extends: ['dependency-cruiser/configs/recommended'],
  forbidden: [
    // ─── Ciclos: deuda controlada en client (warn), prohibición en server (error) ───
    {
      // Override del `no-circular` de `recommended` (merge por nombre):
      // baja error → warn y excluye server (lo cubre `no-circular-server`).
      name: 'no-circular',
      severity: 'warn',
      comment:
        'Ciclo de dependencias (deuda conocida del client: modules/*/api -> config/axios -> redux/store -> slice/api, ~24 ciclos). Se baja a warn con baseline (--ignore-known) hasta refactorizar; en server es error (no-circular-server).',
      from: {
        pathNot: '^apps/server/',
      },
      to: {
        circular: true,
      },
    },
    {
      name: 'no-circular-server',
      severity: 'error',
      comment:
        'El server no tolera ciclos: rompe la inicialización de módulos CommonJS y oculta acoplamiento entre capas (routes -> service -> dao). Refactoriza con inyección de dependencias.',
      from: {
        path: '^apps/server/',
      },
      to: {
        circular: true,
      },
    },

    // ─── Cross-workspace: prohibiciones reales (error) ───
    {
      name: 'no-client-to-server',
      severity: 'error',
      comment:
        'El client no puede importar código del server. La comunicación es por HTTP/WebSocket contra la API; compartir tipos/lógica rompe el despliegue independiente.',
      from: {
        path: '^apps/client/',
      },
      to: {
        path: '^apps/server/',
      },
    },
    {
      name: 'no-server-to-client',
      severity: 'error',
      comment:
        'El server no puede importar código del client (React/DOM no existen en Node). Compartir constantes queda prohibido: duplicar o extraer a un paquete compartido con contrato explícito.',
      from: {
        path: '^apps/server/',
      },
      to: {
        path: '^apps/client/',
      },
    },
    {
      name: 'no-e2e-to-apps',
      severity: 'error',
      comment:
        'Los tests E2E (Playwright) no importan código de las apps: ejercitan el sistema desplegado por HTTP/UI. Fixtures locales viven en e2e/tests.',
      from: {
        path: '^e2e/',
      },
      to: {
        path: '^apps/',
      },
    },

    // ─── Capas internas del client: deuda controlada (warn) ───
    {
      name: 'no-cross-module-client',
      severity: 'warn',
      comment:
        'Módulos del client no deben importarse entre sí: comparte código vía src/components, src/hooks, src/services o src/utils. Deuda existente con baseline gradual.',
      from: {
        path: '^apps/client/src/modules/([^/]+)/',
      },
      // `$1` interpola el grupo 1 del `from.path` (nombre del módulo origen):
      // solo viola imports hacia OTRO módulo. (La variante antigua con `\1`
      // era una dead-rule: JS la parsea como referencia octal inválida.)
      to: {
        path: '^apps/client/src/modules/',
        pathNot: '^apps/client/src/modules/$1/',
      },
    },
    {
      name: 'no-redux-in-components',
      severity: 'warn',
      comment:
        'Los componentes compartidos no deben importar el store/selectors de redux directamente: usa hooks (useQueryData, useLoadingState) para desacoplar UI de estado global.',
      from: {
        path: '^apps/client/src/components/',
      },
      to: {
        path: '^apps/client/src/redux/',
      },
    },

    // ─── Capas internas del server: deuda controlada (warn) ───
    {
      name: 'no-controller-to-controller',
      severity: 'warn',
      comment:
        'Los controllers no deben importar controllers de OTRO módulo: comparte lógica vía services o utils. (Regex de controller ampliada a extensiones js/ts para coordinarse con server-typescript-migration.)',
      from: {
        path: '^apps/server/src/modules/([^/]+)/.*controller\\.(js|ts)$',
      },
      to: {
        path: '^apps/server/src/modules/.*controller\\.(js|ts)$',
        pathNot: '^apps/server/src/modules/$1/',
      },
    },
    {
      name: 'no-dao-in-routes',
      severity: 'warn',
      comment:
        'Las rutas no deben importar DAOs directamente: pasa por la capa service (routes -> service -> dao).',
      from: {
        path: '^apps/server/src/routes/',
      },
      to: {
        path: '^apps/server/src/modules/.*dao\\.(js|ts)$',
      },
    },

    // ─── Dependencias npm ───
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment:
        'El código de producción no puede depender de devDependencies (fallaría en el artefacto desplegado). Tests/stories quedan exentos: legítimamente importan vitest/msw/storybook.',
      from: {
        pathNot: '\\.(test|spec|stories)\\.(js|jsx|ts|tsx)$',
      },
      to: {
        dependencyTypes: ['npm-dev'],
      },
    },

    // ─── Orphans (override del de `recommended`): deuda controlada (warn) ───
    {
      // Merge por nombre con el `no-orphans` de recommended: al reemplazar
      // `from` hay que re-declarar TAMBIÉN sus exclusiones de archivos de
      // configuración (dotfiles, .d.ts, tsconfig, babel/webpack configs),
      // acopladas a la v18 de dependency-cruiser.
      name: 'no-orphans',
      severity: 'warn',
      comment:
        'Módulo huérfano (nadie lo importa): elimínalo o integra su código en un módulo existente. Tests/stories/configs quedan exentos (no los importa nadie por diseño).',
      from: {
        orphan: true,
        pathNot:
          '\\.(test|spec|stories)\\.(js|jsx|ts|tsx)$|(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$|\\.d\\.(c|m)?ts$|(^|/)tsconfig\\.json$|(^|/)(?:babel|webpack)\\.config\\.(?:js|cjs|mjs|ts|json)$',
      },
      to: {},
    },
  ],
  options: {
    // Exclusiones globales: salen del grafo y no generan mensajes (a diferencia
    // de `ignore` de lint-staged, que solo omite archivos en su invocación).
    exclude: {
      // prisma-dinamic-service: directorio muerto (nadie lo importa) ya
      // ignorado por knip (knip.jsonc, workspace apps/server). Contiene un
      // import roto real; mantenerlo fuera del grafo alinea ambos tools hasta
      // que knip-consolidation limpie el código muerto.
      path: 'node_modules|(^|/)dist/|(^|/)build/|(^|/)storybook-static/|(^|/)coverage/|(^|/)prisma/generated/|(^|/)prisma-dinamic-service/|\\.log$|(^|/)package-lock\\.json$',
    },
    // doNotFollow: cruza node_modules (aparece como nodo) sin seguir sus
    // dependencias — mantiene el grafo chico sin perder el borde de frontera.
    doNotFollow: {
      path: 'node_modules',
    },
    // Lee dependencias que solo existen pre-compilación (imports TS aún no
    // compilados) — requisito de coordinación con server-typescript-migration.
    tsPreCompilationDeps: true,
    // Alias `@` del client (`@/...` → `apps/client/src/...`), leído de la
    // sección `resolve` de apps/client/webpack.depcruise.config.cjs. Va en la
    // raíz para que el grafo combinado (client+server) resuelva igual; ese
    // config usa `__dirname`, así que funciona con CWD=raíz — a diferencia de
    // `--ts-config`, cuyos `paths` TypeScript solo resuelve con CWD=apps/client.
    // El build real (Vite/vite.config.js) no lee este archivo.
    webpackConfig: {
      fileName: 'apps/client/webpack.depcruise.config.cjs',
    },
    // Resolución moderna de paquetes: exports/conditionNames/mainFields.
    // La unión cubre client (browser) y server (node). El alias `@` del client
    // NO va aquí (no soportado por el schema v18): se resuelve vía
    // options.webpackConfig en apps/client/.dependency-cruiser.cjs.
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['main', 'types', 'typings', 'browser', 'module'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
      archi: {
        collapsePattern:
          '^(packages|src|lib|app|bin|test(s?)|spec(s?))/[^/]+|node_modules/(@[^/]+/[^/]+|[^/]+)',
      },
    },
  },
};
