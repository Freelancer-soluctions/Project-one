# Code Style Guidelines

## Formatting

Prettier handles all formatting. Run `npm run format` before committing.

## Naming Conventions

| Type         | Convention                 | Example                         |
| ------------ | -------------------------- | ------------------------------- |
| Components   | PascalCase                 | `NotFound.jsx`, `DataTable.jsx` |
| Directories  | kebab-case                 | `components/alert-dialog/`      |
| Tests        | Same as file + `.test.jsx` | `NotFound.unit.test.jsx`        |
| Hooks        | camelCase, `use` prefix    | `useAuth.js`                    |
| Utilities    | camelCase                  | `jwt-decode.js`                 |
| Server files | camelCase                  | `authMiddleware.js`             |

## React Conventions

1. **No `import React from 'react'`** - React 17+ doesn't require it
2. **PropTypes** required for reusable components
3. **Named exports** for utilities and hooks
4. **Default exports** for page components

## Import Order

1. React/core
2. Routing (react-router)
3. UI components (shadcn via `@/components/ui/`)
4. Local components (via `@/components/`)
5. Hooks/utils (via `@/hooks/`, `@/utils/`)

## ESLint Configuration

- **Backend**: ESLint + Vitest plugin (`apps/server/**`)
- **Frontend**: ESLint + React + React Hooks + Vitest (`apps/client/**`)
- **Storybook**: eslint-plugin-storybook (`apps/client/**/*.stories.*`)
- **Prettier** runs last to avoid conflicts

## JSDoc Documentation Standards

- All controller, service, and dao functions must have complete JSDoc documentation
- Follow patterns from `auth/controller.js` and `products/service.js`
- Reference the full guide at `docs/jsdoc-reference-guide.md`
- Do not add JSDoc to `routes.js` files; use Swagger/OpenAPI instead

