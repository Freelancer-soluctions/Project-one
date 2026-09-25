# Tareas: Import Boundaries con Dependency-Cruiser

## Progreso: 0/29 tareas

## 1. Crear `.dependency-cruiser.cjs` raíz (1.1-1.3)

- [ ] 1.1 Crear `.dependency-cruiser.cjs` raíz con `$schema`, `extends: ['recommended']`, `exclude`/`doNotFollow` global, cache, enhanceResolve.
- [ ] 1.2 Definir reglas `forbidden` por capa (client→server prohibido, server→client prohibido, `no-circular` warn/client error/server, `no-orphan` con exclusions, `not-to-dev-dep` error).
- [ ] 1.3 Verificar con `npx depcruise apps/client/src --config .dependency-cruiser.cjs --output-type err` que no hay false positives iniciales.

## 2. Refactor configs workspace (2.1-2.3)

- [ ] 2.1 Refactorizar `apps/client/.dependency-cruiser.cjs` → `extends: '../../.dependency-cruiser.cjs'` + override `tsConfig` si necesario.
- [ ] 2.2 Refactorizar `apps/server/.dependency-cruiser.cjs` → `extends`.
- [ ] 2.3 Verificar que `cross-workspace` rules (path `^apps/*`) funcionan desde root (fix dead-rule).
- [ ] 2.4 (Opcional) Crear `e2e/.dependency-cruiser.cjs` con `extends` raíz y reglas restrictivas si aplica.

## 3. Scripts npm (`package.json`) (3.1-3.5)

- [ ] 3.1 Añadir script `depcruise` (root, sin output-type, diagnostic).
- [ ] 3.2 Añadir script `depcruise:client` (`--ts-config apps/client/jsconfig.json`).
- [ ] 3.3 Añadir script `depcruise:server` (root, sin tsConfig).
- [ ] 3.4 Añadir script `depcruise:ci` (`--output-type err`).
- [ ] 3.5 Añadir script `depcruise:report` (`--output-type err-html -f reports/dependency-cruiser.html`).

## 4. CI (`.github/workflows/ci.yml`) (4.1-4.5)

- [ ] 4.1 Activar `server-import-bounds` (quitar `if: false`, l.585).
- [ ] 4.2 Asegurar gate `npm run depcruise:client -- --output-type err` en job `client-import-bounds`.
- [ ] 4.3 Asegurar gate `npm run depcruise:server -- --output-type err` en job `server-import-bounds`.
- [ ] 4.4 Añadir step report `err-html` + `upload-artifact` con `if: always()`, no-blocking.
- [ ] 4.5 Añadir `.dependency-cruiser.cjs` al path-filter `shared` de `repo-discovery`.

## 5. Shifting-left (pre-commit `lint-staged`) (5.1-5.3)

- [ ] 5.1 Añadir entrada `lint-staged` en `.husky/pre-commit` o `package.json`: `*.{js,jsx,cjs,mjs}: depcruise --config .dependency-cruiser.cjs --output-type err-long`.
- [ ] 5.2 Generar baseline inicial: `depcruise-baseline` o `npx depcruise --output-type baseline .dependency-cruiser-baseline.json`.
- [ ] 5.3 Verificar pre-commit local con staged files (cross-workspace funciona si CWD=root).

## 6. Documentación (`docs/learning/import-boundaries.md`) (6.1-6.4)

- [ ] 6.1 Crear `docs/learning/import-boundaries.md` con estructura: §1 estado actual, §2 por qué DC, §3 configuración, §4 integración, §5 pipeline/proyecto, referencias oficiales.
- [ ] 6.2 Documentar en el doc: cada regla `forbidden` con `name`, `severity`, `comment` (comentario aparece en `err-long`).
- [ ] 6.3 Explicar `exclude` vs `ignore` (dependency-cruiser) vs `--max-warnings` (ESLint) vs `continue-on-error` (CI).
- [ ] 6.4 Vincular con `docs/learning/knip-configuration.md` (comparación grafo vs exports), `docs/learning/eslint-configuration.md` (ownership boundaries), `docs/CONTEXT-CICD.md` (pipeline).

## 7. Actualizar docs referenciados (7.1-7.3)

- [ ] 7.1 Actualizar `docs/learning/eslint-configuration.md` §2 Bloque 6 (líneas `211-225` → `311-338` o nuevas referencias).
- [ ] 7.2 Actualizar `docs/CONTEXT-CICD.md` §13.4 tabla configs + estado jobs `*-import-bounds`.
- [ ] 7.3 Actualizar `docs/pre-merge-gates-governance.md` referencias jobs & ownership.

## 8. Verificación y cierre (8.1-8.2)

- [ ] 8.1 Ejecutar `npx openspec validate import-boundaries --strict` → salida limpia.
- [ ] 8.2 Coordinar con `server-typescript-migration` (regexes `.ts`, tsconfig server) → evitar interferencia.

## Notas

- **Hallazgos researcher**: dead-rule cross-workspace (`from.path: 'apps/client'` vs `workdir: apps/client`), `max-lines-per-function` NO tiene `ignorePattern` (exclusión vía `options.exclude`/`files`), `knip.jsonc` workspaces como referencia, docs `eslint-configuration.md` con líneas desactualizadas.
- **Critico**: `eslint-plugins-import` desinstalado → depcruise dueño único de boundaries.
- **Risk**: `e2e` sin script lint → verificar si `no-e2e-to-apps` necesario o mantener `if: false` + `continue-on-error`.
