/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'This dependency is part of a circular relationship. You might want to refactor these (src/helpers, src/utils, src/lib) into a separate module.',
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
        pathNot: '\\.(test|spec|stories)\\.(js|jsx)$',
      },
      to: {},
    },
    {
      name: 'no-cross-workspace-imports',
      severity: 'error',
      comment:
        'Client code must not import from other workspaces (apps/server, e2e). Keep the client self-contained.',
      from: {
        path: '^apps/client',
      },
      to: {
        path: '^(apps/server|e2e)',
      },
    },
    {
      name: 'no-redux-in-components',
      severity: 'warn',
      comment:
        'Components should not import redux store/selectors directly - use custom hooks (useQueryData, useLoadingState) instead.',
      from: {
        path: '^apps/client/src/components',
      },
      to: {
        path: '^apps/client/src/redux',
      },
    },
    {
      name: 'no-utils-in-modules',
      severity: 'warn',
      comment:
        'Modules should not import from other modules directly - share code via src/utils, src/hooks, or src/services.',
      from: {
        path: '^apps/client/src/modules/([^/]+)/',
      },
      to: {
        path: '^apps/client/src/modules/(?!\1)',
        pathNot: '^apps/client/src/modules/([^/]+)/',
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
