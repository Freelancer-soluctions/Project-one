# Proposal

## Why

`.prettierrc` (JSON, no admite comentarios) fue reemplazado por `.prettierrc.yaml`: mismos valores, pero ahora **cada opción lleva un comentario en español** que explica qué hace y por qué se eligió — el contrato de formato se explica sin salir del archivo. El razonamiento ampliado (referencias a prettier.io, ejemplos y comparaciones) vive en el documento canónico en español `docs/learning/prettier-configuration.md` (creado 2026-09-23, **verificado en el árbol en el retry**), citado por los tres artefactos de este change. El config declara además `$schema` oficial de schemastore y el formato opera con prácticas profesionales en 4 capas.

## What Changes

- **`.prettierrc.yaml` autoexplicativo**: cada opción documentada en español (descripción + nota `Decisión:`):
  - `printWidth: 80` — **legibilidad** en frontend React y backend: pantallas divididas, diffs de PR más estrechos, estándar histórico compatible con ESLint.
  - `singleQuote: true` — **consistencia con los string literals** del monorepo (menos ruido visual, tecla más rápida, coherencia con el estilo del código).
  - `semi: true` — **evitar bugs de ASI** de JavaScript (`return`, IIFE, `throw`); estilo explícito en backend y frontend.
  - `trailingComma: 'es5'` — **compatibilidad ES5** (comas solo donde ES5 las permite) + **diffs más claros** en Git al añadir elementos.
  - `jsxSingleQuote: false` — **JSX usa comillas dobles** (convención HTML/React y evita conflictos con linters jsx); las comillas simples quedan **solo en props/cadenas simples** del JS interno.
  - `arrowParens: 'always'` — **consistencia con funciones flecha** de un solo parámetro (sin churn al añadir tipos TS o parámetros extra).
  - `endOfLine: 'lf'` — **cumple el contrato de `.gitattributes`** (`* text=auto eol=lf`): normaliza saltos entre Windows/macOS/Linux y evita ruido CRLF/LF en Git y CI.
  - `bracketSpacing: true` — **espaciado estándar** `{ foo: bar }` en objetos e imports.
  - `bracketSameLine: false` — el **cierre de tags JSX va en línea separada** de las props (componentes con props largas más legibles).
  - Además, con el mismo patrón: `tabWidth: 2`, `useTabs: false` y `quoteProps: 'as-needed'`.
- **`$schema` oficial**: `$schema: 'https://json.schemastore.org/prettierrc'` (l. 5) — autocompletado y validación del config en el editor (IntelliSense de cada opción al escribir el YAML; un typo de clave falla en el editor, no silenciosamente en CI).
- **Prácticas profesionales integradas** (pipeline de formato en 4 capas, coherente con la doc canónica `docs/learning/prettier-configuration.md` §3.2/§5):
  - **Format-on-save en el editor**: primera capa; aplica `.prettierrc.yaml` al guardar (el `$schema` da feedback inmediato).
  - **lint-staged (pre-commit)**: segunda capa; hook raíz `*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,md}: prettier --write` (`package.json` l. 91-92) formatea solo ficheros staged.
  - **CI format-check**: tercera capa; jobs `client-format-check` y `server-format-check` en `.github/workflows/ci.yml` (l. 448, 536) ejecutan `npm run format:check` (`prettier --check`) y bloquean el PR si hay diffs.
  - **Prettier al final de `eslint.config.js`**: `eslint-config-prettier` va **siempre último** en el array (l. 351, sección "(7) Prettier (siempre al final)") — solo desactiva reglas de estilo de ESLint; su `off` gana a cualquier bloque anterior y no pelea con Prettier.
- **Referencia a la doc canónica**: `docs/learning/prettier-configuration.md` (ES) queda designada como fuente del razonamiento ampliado de cada decisión de formato.
- **Cero cambios de valores**: paridad total con el `.prettierrc` JSON anterior (mismos valores, solo cambia el formato a YAML comentado; su borrado ya está registrado en el árbol de trabajo).

## Capabilities

### Modified Capabilities

- `documentation-canónica-es`: la documentación canónica en español de la configuración del proyecto pasa a cubrir también Prettier vía `docs/learning/prettier-configuration.md` (junto a `eslint-configuration.md` y `knip-configuration.md`), incluyendo el pipeline de 4 capas (format-on-save → lint-staged → CI format-check → prettier último en ESLint).
- `config-correctness`: el formato lo define `.prettierrc.yaml` (YAML comentado en español + `$schema` de schemastore, una sola fuente); `.prettierrc` JSON queda eliminado y cada opción explica su decisión inline.

## Impact

| File                                                                                                                     | Change                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.prettierrc`                                                                                                            | Eliminado (JSON sin comentarios)                                                                                                                                                     |
| `.prettierrc.yaml`                                                                                                       | Nuevo: mismos valores + comentario en español por opción (descripción + `Decisión:`) + `$schema: 'https://json.schemastore.org/prettierrc'` (l. 5)                                   |
| `docs/learning/prettier-configuration.md`                                                                                | Doc de referencia en español (creada 2026-09-23, **verificada en el árbol**: `printWidth` l. 14/110, `bracketSameLine` l. 23/177, pipeline §3.2/§5) citada por proposal/design/tasks |
| `docs/code-style.md` (l. 59, 61, 71, 75), `docs/pre-merge-gates-governance.md` (l. 377), `docs/CONTEXT-CICD.md` (l. 746) | **Actualizados** a `.prettierrc.yaml` (verificado por grep, task 3.1/5.5)                                                                                                            |
| `.prettierignore`                                                                                                        | Ampliado (researcher): `storybook-static`, `apps/server/prisma/migrations`, `package-lock.json` + comentarios; entradas previas intactas                                             |
| `.vscode/settings.json`                                                                                                  | Ampliado (researcher): `editor.defaultFormatter: esbenp.prettier-vscode`, `editor.formatOnSave: true`, `editor.formatOnPaste: false` — capa format-on-save operativa en repo         |
| `e2e/package.json`                                                                                                       | Nuevo (researcher): scripts `format` / `format:check` (globs `**/*.{js,json,md}` excl. `test-results/`, `playwright-report/`) — `e2e` pasa a cubrirse con `npm run format*` raíz     |
| `e2e/playwright.config.js`                                                                                               | Formateado (diff previo) para que `format:check` de `e2e` pase                                                                                                                       |
| `eslint.config.js` (l. 351)                                                                                              | Sin cambios: `eslint-config-prettier` ya es el **último** elemento del array (sección "(7) Prettier (siempre al final)")                                                             |
| `.github/workflows/ci.yml` (l. 448, 536)                                                                                 | Sin cambios: jobs `client-format-check` / `server-format-check` ejecutan `npm run format:check` sobre el nuevo config                                                                |
| `package.json`                                                                                                           | Sin cambios: Prettier 3.7.4 resuelve `.prettierrc.yaml` nativamente; lint-staged (`prettier --write`, l. 91-92) y script `format:check` (l. 51) no referencian el nombre del config  |

**Risks:**

- ~~La doc de referencia no fue verificable en el árbol de trabajo~~ — **resuelto en el retry**: `docs/learning/prettier-configuration.md` existe y sus decisiones coinciden con `.prettierrc.yaml` (task 2.1 cerrada con grep).
- Comentarios inline pueden quedar obsoletos si cambia un valor (misma clase de drift que cualquier doc): mitigación = tarea de sincronización config ↔ doc canónica.
- Renombrar a `.prettierrc.yaml` deja citas literales obsoletas en 3 documentos (detectadas por grep); Prettier y los hooks no se ven afectados.
- `$schema` caído o cambiado por schemastore pierde autocompletado en editor ( mitigación: task 4.1 fija la URL exacta).
- Mover `prettier` fuera del final de `eslint.config.js` reintroduce conflictos ESLint vs Prettier ( mitigación: task 4.2 verifica posición final).
