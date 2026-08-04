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

## Line Endings

The repo enforces LF as the canonical line ending at three layers:

| Layer     | File             | Setting                                                                                                           |
| --------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| Git       | `.gitattributes` | `* text=auto eol=lf` (explicit `text eol=lf` for `.js/.jsx/.ts/.tsx/.cjs/.mjs/.json/.md/.css/.yml/.yaml/.prisma`) |
| Editor    | `.editorconfig`  | `[*] end_of_line = lf` (root = true)                                                                              |
| Formatter | `.prettierrc`    | `"endOfLine": "lf"`                                                                                               |

These three layers are complementary: `.gitattributes` makes LF the repo-level contract that overrides any developer's local `core.autocrlf`, `.editorconfig` aligns editors so files are authored as LF from the start, and Prettier re-formats to LF on save / on lint-staged.

### Windows Shell Script Exception

`.bat`, `.cmd`, and `.ps1` files use **CRLF** line endings — Windows `cmd.exe` and PowerShell require CRLF for reliable parsing. The exception is declared in:

- `.gitattributes`: `*.bat text eol=crlf`, `*.cmd text eol=crlf`, `*.ps1 text eol=crlf`
- `.editorconfig`: `[*.{bat,cmd,ps1}] end_of_line = crlf`

Do NOT run Prettier on `.bat`/`.cmd`/`.ps1` files (they are not in the Prettier glob). Do NOT edit Windows shell scripts with editors that strip CRLF.
