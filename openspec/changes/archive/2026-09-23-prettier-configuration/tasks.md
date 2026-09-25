# Tasks

## 1. Comentarios del config (verificado hoy contra el archivo real)

- [x] 1.1 Documentar **cada** opción de `.prettierrc.yaml` con comentario en español (descripción + nota `Decisión:`) — verificar por lectura directa del archivo (53 líneas) y `grep -n "Decisión:" .prettierrc.yaml`
  - → Verificado hoy: las 9 opciones clave están comentadas — `printWidth: 80` (legibilidad frontend React + backend), `singleQuote: true` (consistencia con string literals), `semi: true` (evitar bugs de ASI), `trailingComma: 'es5'` (compatibilidad ES5 + diffs claros), `jsxSingleQuote: false` (JSX con comillas dobles; simples solo en props/cadenas simples), `arrowParens: 'always'` (consistencia con funciones flecha), `endOfLine: 'lf'` (contrato de `.gitattributes`), `bracketSpacing: true` (espaciado estándar) y `bracketSameLine: false` (cierre de tags JSX en línea separada); más `tabWidth`, `useTabs`, `quoteProps` y `$schema` con el mismo patrón.
- [x] 1.2 Confirmar **paridad total de valores** con el `.prettierrc` JSON eliminado (mismos valores, solo cambia el formato a YAML comentado)
  - → Declarado en el propio header del archivo (l. 2); ningún valor difiere del config anterior.

## 2. Documentación de referencia

- [x] 2.1 Confirmar que `docs/learning/prettier-configuration.md` (ES, creado 2026-09-23) existe y que sus decisiones coinciden con `.prettierrc.yaml` (`grep -nE "printWidth|singleQuote|trailingComma|endOfLine|bracketSameLine" docs/learning/prettier-configuration.md`)
  - → **Cerrada en el retry (researcher findings)**: `docs/learning/prettier-configuration.md` **existe**; grep confirma `printWidth` (l. 14, 110), `bracketSameLine` (l. 23, 177) y cobertura de `format:check` (l. 64-71, 201-228) — decisiones coherentes con `.prettierrc.yaml`. La cita de proposal/design ya no está rota.
- [x] 2.2 Si la doc existe, validar coherencia con `npx prettier --check .` (cero diffs derivados de este change) y cerrar con `openspec validate prettier-configuration --strict` en verde.

## 3. Sincronizar referencias stale a `.prettierrc`

- [x] 3.1 Actualizar las citas literales al config viejo: `docs/code-style.md` (l. 59, 61, 71, 75), `docs/pre-merge-gates-governance.md` (l. 377) y `docs/CONTEXT-CICD.md` (l. 746) — `.prettierrc` → `.prettierrc.yaml` — verificar con `grep -rn "\.prettierrc\b" docs` sin resultados fuera de `.prettierrc.yaml`.
- [x] 3.2 Verificar que `package.json` no referencia el nombre del config (solo `prettier@3.7.4`, script lint-staged `prettier --write` l. 91-92 y script `format:check` l. 51) y que `npm run format` sale sin cambios.

## 4. Prácticas profesionales y `$schema` (researcher findings, retry)

- [x] 4.1 Verificar `$schema` del config: leer `.prettierrc.yaml` l. 5 y confirmar URL exacta `$schema: 'https://json.schemastore.org/prettierrc'` (autocompletado/validación en editor)
  - → Verificado en researcher findings: presente en l. 5 con la URL exacta.
- [x] 4.2 Verificar que `eslint-config-prettier` es el **último** elemento del array en `eslint.config.js` (l. 351, sección "(7) Prettier (siempre al final)"; comentario l. 341-350 explica que su "off" debe ganar)
  - → Verificado: `prettier,` en l. 351 seguido de `];` en l. 352 = posición final correcta.
- [x] 4.3 Verificar las capas de aplicación: **format-on-save** (doc §3.2), **lint-staged** pre-commit (`package.json` l. 91-92, `prettier --write` sobre `*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,md}`), **CI format-check** (jobs `client-format-check` l. 448 y `server-format-check` l. 536 en `.github/workflows/ci.yml`, `npm run format:check --workspace=...`) y script raíz `format:check` (`package.json` l. 51)
  - → Verificado por grep en el retry: las 4 capas presentes y coherentes con `docs/learning/prettier-configuration.md` §5.
- [x] 4.4 Reflejar el pipeline de 4 capas y el `$schema` en `proposal.md` (What Changes + Impact) y `design.md` (nueva D5 + filas de riesgo) — hecho en este retry; validar con `openspec validate prettier-configuration --strict`.

## 5. Hallazgos del researcher: cobertura de formato (2026-09-23)

- [x] 5.1 Crear/actualizar `.prettierignore` raíz con sintaxis gitignore y comentarios en inglés (docs/en/ignore): `node_modules`, `dist`, `build`, `storybook-static`, `coverage`, `apps/server/prisma/migrations`, `package-lock.json`, `.env`, `.env.*`, `*.log` — merge sobre el fichero preexistente (nada eliminado).
  - → Verificado: `git diff .prettierignore` solo añade entradas nuevas + comentarios; las 7 líneas originales intactas.
- [x] 5.2 Crear/actualizar `.vscode/settings.json` (preexistente, `{}`): `editor.defaultFormatter: "esbenp.prettier-vscode"`, `editor.formatOnSave: true`, `editor.formatOnPaste: false` — primera capa del pipeline de 4 capas operativa a nivel de workspace.
  - → Ya no depende solo de la doc (§3.2): el setting vive en el repo.
- [x] 5.3 Añadir scripts `format` y `format:check` a `e2e/package.json` (workspace `e2e` incluido en root `--workspaces`): globs `**/*.{js,json,md}` con exclusión `!test-results/**` y `!playwright-report/**` (artefactos de Playwright generados; el root `.prettierignore` no aplica al ejecutar con cwd=`e2e`).
  - → `npm run format:check` raíz en verde en los 3 workspaces (client, server, e2e).
- [x] 5.4 Formatear `e2e/playwright.config.js` (diff previo al glob) para que `format:check` de `e2e` pase.
  - → `npx prettier --check` sobre `e2e` en verde.
- [x] 5.5 Verificar sustituciones `.prettierrc` → `.prettierrc.yaml`: `docs/code-style.md` (l. 59, 61, 71, 75), `docs/pre-merge-gates-governance.md` (l. 377), `docs/CONTEXT-CICD.md` (l. 746) — grep confirma `.prettierrc.yaml` en las 6 citas; fuera de `docs/learning/prettier-configuration.md` (mención histórica intencionada al JSON) no queda `.prettierrc` literal.
- [x] 5.6 Verificar `proposal.md` (l. 5 y 16) reflejan `.prettierrc.yaml` — OK (l. 5 narra el reemplazo; l. 16 no cita el nombre del config).

## Notas de implementación

- Este change **documenta, no reformatea**: cualquier diff de formato derivado de un valor cambiado es un fallo, no un efecto esperado.
- `endOfLine: 'lf'` coherente con `.gitattributes` (`* text=auto eol=lf`, con `text eol=lf` explícito para `*.yaml`/`*.js`/`*.md`): la decisión quedó anotada en el propio `.prettierrc.yaml` (l. 51-53).
- Artefactos creados hoy (el directorio del change solo tenía `.openspec.yaml`): `proposal.md`, `design.md`, `tasks.md`.
- **Retry (researcher findings)**: añadidos `$schema` de schemastore, doc canónica confirmada en árbol y pipeline profesional de 4 capas (format-on-save → lint-staged → CI `format:check` → prettier último en `eslint.config.js`) a los tres artefactos; task 2.1 cerrada; sección 4 nueva.
- **Cierre de la revisión del planner (2026-09-23)**:
  - **Delta spec creado**: `specs/config-correctness/spec.md` con 2 requirements (single source of truth de `.prettierrc.yaml` + alineación de citas/enforcement) y sus `#### Scenario` blocks. **Desviación**: se usó `## ADDED Requirements` en vez de `## MODIFIED` — `openspec validate --strict` informaba _"Archive would refuse this delta: config-correctness MODIFIED ... not found"_ (el spec main de `config-correctness` solo tiene requirements de ESLint; no hay prettier requirements que modificar). Con `ADDED`: validación en verde y archivable.
  - **Tasks 4.1/4.2/4.3 cerradas** con verificación directa: `$schema` l. 5 URL exacta; `prettier,` l. 351 = último elemento antes de `];` l. 352; 4 capas presentes (format-on-save doc l. 61/211, lint-staged l. 91-92, CI jobs l. 437/448 + 525/536, raíz `format:check` l. 51).
  - **Task 3.1 ejecutada**: `.prettierrc` → `.prettierrc.yaml` en `docs/code-style.md` (l. 59, 61, 71, 75), `docs/pre-merge-gates-governance.md` (l. 377) y `docs/CONTEXT-CICD.md` (l. 746); `grep -rn "\.prettierrc\b" docs` limpio (solo `.prettierrc.yaml` + mención histórica intencionada al JSON en la doc canónica).
  - **Tasks 3.2/2.2/4.4 cerradas**: `package.json` sin nombre de config (grep `prettierrc` → 0); `npm run format:check` en verde en ambos workspaces con `.prettierrc.yaml`; `openspec validate prettier-configuration --strict` en verde sin warnings de archivado.
  - **Paridad de valores verificada** contra `git show HEAD:.prettierrc`: las 13 claves idénticas.
  - **Nota EOL**: 6 ficheros de test quedaron en CRLF en el working tree (checkout anterior a `.gitattributes`); normalizados con `prettier --write` (contenido byte a byte idéntico salvo EOL, `git diff` vacío tras normalizar) para que `format:check` pase en local igual que en CI.
- **Retry researcher (2026-09-23, sección 5)**: `.prettierignore` raíz ampliado, `.vscode/settings.json` con format-on-save, scripts `format`/`format:check` en `e2e/package.json` (+ exclusión de artefactos Playwright) y formateo de `e2e/playwright.config.js`. Nota: `npx prettier --check .` en raíz falla con ~673 ficheros (openspec/specs, README, etc.) — **estado preexistente fuera de alcance** de este change (documenta, no reformatea); los scripts por workspace están en verde.
