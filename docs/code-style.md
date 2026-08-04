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

### Por qué este setup existe

El repositorio presentaba **~391 phantom diffs LF↔CRLF en Windows** causados por la ausencia de `.gitattributes` y `.editorconfig`. El problema operativo: Prettier está configurado con `"endOfLine": "lf"` y siempre escribe LF, pero el index de Git retenía CRLF porque el `core.autocrlf=true` efectivo provenía únicamente del system gitconfig global (`C:\Program Files\Git\etc\gitconfig`). Sin contrato repo-level, cada checkout producía working tree LF mientras el index tenía CRLF → diffs falsos de archivo completo en cada commit. Este change estableció LF como contrato repo-level para que `git status`/`git diff` muestren solo cambios reales.

### Contrato en 3 capas

| Layer     | File             | Setting                                                                                                           |
| --------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| Git       | `.gitattributes` | `* text=auto eol=lf` (explicit `text eol=lf` for `.js/.jsx/.ts/.tsx/.cjs/.mjs/.json/.md/.css/.yml/.yaml/.prisma`) |
| Editor    | `.editorconfig`  | `[*] end_of_line = lf` (root = true)                                                                              |
| Formatter | `.prettierrc`    | `"endOfLine": "lf"`                                                                                               |

**Decisión deliberada (`.prettierrc`)**: `endOfLine` es `"lf"`, no `"auto"`. `auto` reintroduce CRLF en Windows porque Prettier detecta el default de la plataforma. `lf` es el gate correcto e independiente de la plataforma.

### Cómo funciona operativamente

Las 3 capas intervienen en momentos distintos del pipeline de edición:

| Momento                      | Capa que actúa                | Qué hace                                                                                                                                                                                                    |
| ---------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Checkout**                 | Git (`.gitattributes`)        | Aplica `eol=lf` al desmaterializar blobs del index al working tree. Ignora `core.autocrlf` local. Override CRLF para `*.bat`/`*.cmd`/`*.ps1`.                                                               |
| **Edición/save**             | Editor (`.editorconfig`)      | El editor lee `.editorconfig` (root=true) y respeta `end_of_line=lf` al escribir. Override CRLF para `*.bat`/`*.cmd`/`*.ps1`.                                                                               |
| **Save/format**              | Prettier (`.prettierrc`)      | Al ejecutar `prettier --write` (manual o vía lint-staged), reescribe el archivo con `endOfLine: "lf"`. Última línea de defensa.                                                                             |
| **Commit (pre-commit hook)** | lint-staged + Prettier/ESLint | Pasa sólo los archivos staged a `prettier --write` (glob `*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,md}`) y `eslint --fix --max-warnings 0` (glob `*.{js,jsx,cjs,mjs}`). Re-normaliza cualquier CRLF introducido. |
| **Status/diff**              | Git (`.gitattributes`)        | Compara working tree vs index aplicando el filter clean → al ser ambos LF, no hay phantom diffs.                                                                                                            |

**Orden de precedencia**: `.gitattributes` es el contrato repo-level y **siempre gana** sobre el `core.autocrlf` local. `.editorconfig` y `.prettierrc` son complementarios (alinean editores y formatter al mismo LF). Ninguna capa depende de la otra para funcionar — son defense-in-depth.

### Windows Shell Script Exception

`.bat`, `.cmd`, y `.ps1` usan **CRLF** porque `cmd.exe` y PowerShell requieren CRLF para parsing fiable. La excepción se declara en:

- `.gitattributes`: `*.bat text eol=crlf`, `*.cmd text eol=crlf`, `*.ps1 text eol=crlf`
- `.editorconfig`: `[*.{bat,cmd,ps1}] end_of_line = crlf`

**No ejecutar Prettier sobre `.bat`/`.cmd`/`.ps1`** (no están en el glob Prettier de lint-staged). **No editar estos archivos con editores que strip CRLF** (VS Code respeta `.editorconfig` por defecto).

### lint-staged: scoped a archivos staged

El change `line-ending-normalization` retargeteó lint-staged de whole-workspace a staged-only. Antes: lint-staged corría `npm run format` y `npm run lint` (que disparaban Prettier/ESLint sobre todo el workspace en cada commit → churn amplifier que arrastraba archivos no modificados). Ahora: lint-staged pasa la lista de archivos staged directamente a los comandos:

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,md}": "prettier --write",
  "*.{js,jsx,cjs,mjs}": "eslint --fix --max-warnings 0"
}
```

**Decisiones deliberadas del glob**:

- `jsonc` restaurado al glob Prettier (antes estaba split out)
- `ts/tsx` excluidos del glob ESLint (no existe TS parser en este repo — cero archivos `.ts`/`.tsx`)
- `d.cts`/`d.mts` NO añadidos al glob Prettier (no hay TypeScript en el repo → sería configuración muerta; revisar si se introduce TS)
- Formato (Prettier) corre sobre más extensiones que lint (ESLint) — Prettier formatea JSON/YAML/MD/Prisma; ESLint sólo JS/JSX/CJS/MJS

### Troubleshooting

- **Vuelven phantom diffs en Windows** → verificar que `.gitattributes` existe en HEAD (`git ls-files .gitattributes` retorna el path) y se respeta (`git check-attr text -- <file>` y `git check-attr eol -- <file>`).
- **Prettier reescribe CRLF en mis `.bat`/`.ps1`** → no deberías estar corriendo Prettier sobre esos archivos; no están en el glob `*.md|*.json|...` de lint-staged. Si Prettier los toca, revisa si alguien extendió el glob.
- **Editor inserta CRLF en `.js`/`.ts`** → verificar que el editor lee `.editorconfig` (VS Code: extensión EditorConfig habilitada por defecto; JetBrains: plugin nativo).
- **`git status` muestra archivos modificados que no tocaste** → puede ser que `core.autocrlf=true` local esté mascarando. `.gitattributes` debería ganar. Verificar con `git config --get core.autocrlf` y `git check-attr eol -- <file>`. Si el problema persiste, correr `git add --renormalize .` (nodestructivo: no reescribe blobs de commits previos).
