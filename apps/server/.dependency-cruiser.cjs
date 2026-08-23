/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'This dependency is part of a circular relationship. You might want to refactor these (src/utils, src/common) into a separate module.',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment:
        "This is an orphan module (it's referenced by nobody) - either remove it or add its code to an existing module.",
      from: {
        orphan: true,
        pathNot: '\\.(test|spec)\\.js$',
      },
      to: {},
    },
    {
      name: 'no-cross-workspace-imports',
      severity: 'error',
      comment:
        'Server code must not import from other workspaces (apps/client, e2e). Keep the server self-contained.',
      from: {
        path: '^apps/server',
      },
      to: {
        path: '^(apps/client|e2e)',
      },
    },
    {
      name: 'no-controller-to-controller',
      severity: 'warn',
      comment:
        'Controllers should not import other controllers directly - share logic via services or utils.',
      from: {
        path: '^apps/server/src/modules/([^/]+)/.*controller\\.js$',
      },
      to: {
        path: '^apps/server/src/modules/(?!\1)',
        pathNot: '^apps/server/src/modules/([^/]+)/',
      },
    },
    {
      name: 'no-dao-in-routes',
      severity: 'warn',
      comment:
        'Routes should not import DAOs directly - go through the service layer.',
      from: {
        path: '^apps/server/src/routes',
      },
      to: {
        path: '^apps/server/src/modules/.*/dao\\.js$',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
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
