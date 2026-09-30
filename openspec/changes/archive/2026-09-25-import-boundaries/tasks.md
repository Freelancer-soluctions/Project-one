# Tareas: Import Boundaries con Dependency-Cruiser

## Progreso: 29/29 tareas

## 1. Crear `.dependency-cruiser.cjs` raíz (1.1-1.3)

- [x] 1.1 Crear `.dependency-cruiser.cjs` raíz con `$schema`, `extends: ['recommended']`, `exclude`/`doNotFollow` global, cache, enhanceResolve.
  - **Nota de implementación:** `extends: ['dependency-cruiser/configs/recommended']` (base oficial v18). `exclude` global (node_modules, dist, build, storybook-static, coverage, prisma/generated, prisma-dinamic-service, \*.log, package-lock.json), `doNotFollow: node_modules`, `tsPreCompilationDeps: true`, `enhancedResolveOptions` (exportsFields/conditionNames/mainFields). La opción `cache` se dejó fuera del config (experimental en v18): se activa por invocación si se desea (`--cache`). El alias `@` del client se resuelve vía `options.webpackConfig` → `apps/client/webpack.depcruise.config.cjs` (el mecanismo `--ts-config` no funciona con CWD=raíz: TypeScript resuelve los globs del jsconfig contra el CWD y matchea 0 archivos — error TS18003; verificado empíricamente). `enhancedResolveOptions.alias` no existe en el schema v18.
- [x] 1.2 Definir reglas `forbidden` por capa (client→server prohibido, server→client prohibido, `no-circular` warn/client error/server, `no-orphan` con exclusions, `not-to-dev-dep` error).
  - Implementado: `no-client-to-server` (error), `no-server-to-client` (error), `no-e2e-to-apps` (error), `no-circular` (warn client, override por nombre del de recommended) + `no-circular-server` (error), `no-cross-module-client` (warn, con placeholders `$1` — la variante histórica `\1` era una dead-rule: referencia octal inválida en JS), `no-redux-in-components` (warn), `no-controller-to-controller` (warn, regex `(js|ts)`), `no-dao-in-routes` (warn, regex `(js|ts)`), `not-to-dev-dep` (error, exento test/spec/stories), `no-orphans` (warn, override con exclusiones tests/stories/configs).
- [x] 1.3 Verificar con `npx depcruise apps/client/src --config .dependency-cruiser.cjs --output-type err` que no hay false positives iniciales.
  - Verificado: client 378 módulos → 0 errores, 50 warns (24 ciclos axios→store, cross-module reales 1+, orphans knip-documentados); server 210 módulos → 0 errores, 8 warns (orphans de código muerto knip-ignorado, `prisma-dinamic-service` excluido del grafo por coherencia knip↔depcruise); e2e 6 módulos → limpio. Las reglas de frontera no producen falsos positivos: los 738 errores del primer run client eran solo `@` sin resolver (resuelto vía webpackConfig).

## 2. Refactor configs workspace (2.1-2.3)

- [x] 2.1 Refactorizar `apps/client/.dependency-cruiser.cjs` → `extends: '../../.dependency-cruiser.cjs'` + override `tsConfig` si necesario.
  - Quedó en `extends` puro (sin overrides): el alias `@` va en el config raíz vía `webpackConfig` para que el grafo combinado resuelva igual.
- [x] 2.2 Refactorizar `apps/server/.dependency-cruiser.cjs` → `extends`.
- [x] 2.3 Verificar que `cross-workspace` rules (path `^apps/*`) funcionan desde root (fix dead-rule).
  - Verificado con prueba de bloqueo real: archivo temporal en client importando `apps/server/src/config/db.js` → `error no-client-to-server`, exit 1 incluso con `--ignore-known`.
- [x] 2.4 (Opcional) Crear `e2e/.dependency-cruiser.cjs` con `extends` raíz y reglas restrictivas si aplica.
  - No necesario: `no-e2e-to-apps` vive en el config raíz y el grafo combinado incluye `e2e/tests` (6 módulos, limpio). Un config propio de e2e no añadiría nada.

## 3. Scripts npm (`package.json`) (3.1-3.5)

- [x] 3.1 Añadir script `depcruise` (root, sin output-type, diagnostic).
  - `depcruise apps/client/src apps/server/src e2e/tests --config .dependency-cruiser.cjs` (grafo combinado; e2e incluido porque el req 1 del delta cubre los tres workspaces).
- [x] 3.2 Añadir script `depcruise:client` (`--ts-config apps/client/jsconfig.json`).
  - Implementado SIN `--ts-config` (inoperante con CWD=raíz — ver 1.1); el alias `@` se resuelve vía `options.webpackConfig` del config raíz. Delta spec actualizada en consecuencia.
- [x] 3.3 Añadir script `depcruise:server` (root, sin tsConfig).
- [x] 3.4 Añadir script `depcruise:ci` (`--output-type err`).
  - `npm run depcruise -- --output-type err --ignore-known` (baseline fase 1).
- [x] 3.5 Añadir script `depcruise:report` (`--output-type err-html -f reports/dependency-cruiser.html`).
  - Con `--ignore-known` y `reports/.gitkeep` + `.gitignore` (`**/reports/*` + `!**/reports/.gitkeep`) para que el directorio exista con el HTML gitignored. Extra: `depcruise:baseline` (regenera `.dependency-cruiser-known-violations.json`).

## 4. CI (`.github/workflows/ci.yml`) (4.1-4.5)

- [x] 4.1 Activar `server-import-bounds` (quitar `if: false`, l.585).
  - Activado con el mismo patrón de activación que `client-import-bounds` (`repo-discovery.outputs.server == 'true' && pull_request`). Ids de jobs sin renombrar (spec `ci-prebuild-substage-structure`: 15 jobs en `prebuild-quality-complete.needs` intactos; 41 jobs totales verificados con js-yaml).
- [x] 4.2 Asegurar gate `npm run depcruise:client -- --output-type err` en job `client-import-bounds`.
  - Gate: `npm run depcruise:client -- --output-type err --ignore-known` desde la RAÍZ (sin `working-directory`); report `npm run depcruise:report` (`if: always()`, `continue-on-error: true`) + `actions/upload-artifact@v7` (`dependency-cruiser-report-client`, retención 7 días).
- [x] 4.3 Asegurar gate `npm run depcruise:server -- --output-type err` en job `server-import-bounds`.
  - Mismo patrón con `depcruise:server` y artefacto `dependency-cruiser-report-server`.
- [x] 4.4 Añadir step report `err-html` + `upload-artifact` con `if: always()`, no-blocking.
- [x] 4.5 Añadir `.dependency-cruiser.cjs` al path-filter `shared` de `repo-discovery`.
  - Añadidos los tres configs (raíz + client + server) al filtro `shared`.
  - Nota: sin `working-directory`, los scripts corren desde la raíz del repo — exactamente lo que requiere el fix de la dead-rule (los regex `^apps/...` del config raíz no matchearían con CWD `apps/*`).

## 5. Shifting-left (pre-commit `lint-staged`) (5.1-5.3)

- [x] 5.1 Añadir entrada `lint-staged` en `.husky/pre-commit` o `package.json`: `*.{js,jsx,cjs,mjs}: depcruise --config .dependency-cruiser.cjs --output-type err-long`.
  - En `package.json` (`lint-staged`): `"*.{js,jsx,ts,tsx,cjs,mjs}": "depcruise --config .dependency-cruiser.cjs --output-type err-long --ignore-known"` (`.husky/pre-commit` ya invoca `npm exec lint-staged`; sin cambios). Glob ampliado a ts/tsx por coordinación con server-typescript-migration.
- [x] 5.2 Generar baseline inicial: `depcruise-baseline` o `npx depcruise --output-type baseline .dependency-cruiser-baseline.json`.
  - `npm run depcruise:baseline` → `.dependency-cruiser-known-violations.json` (nombre por defecto que consume `--ignore-known`; 36 KB, 58 violaciones conocidas: 24 ciclos client + cross-module/orphans client + 8 orphans server).
- [x] 5.3 Verificar pre-commit local con staged files (cross-workspace funciona si CWD=root).
  - Verificado: `npx depcruise <archivos staged> --config .dependency-cruiser.cjs --output-type err-long --ignore-known` desde la raíz → exit 0 con 27 known-violations descontadas. Husky corre desde la raíz → los paths matchean.

## 6. Documentación (`docs/learning/import-boundaries.md`) (6.1-6.4)

- [x] 6.1 Crear `docs/learning/import-boundaries.md` con estructura: §1 estado actual, §2 por qué DC, §3 configuración, §4 integración, §5 pipeline/proyecto, referencias oficiales.
  - Doc reescrito al estado final (§1-§11): implementación, por qué DC, reglas por capa, scripts, integración 4 capas, coordinación, referencias, comparativa knip/eslint, glosario, operación práctica.
- [x] 6.2 Documentar en el doc: cada regla `forbidden` con `name`, `severity`, `comment` (comentario aparece en `err-long`).
  - Tabla §3 con name/severity/from/to/comentario + notas de implementación (extends merge, placeholders `$1`, exclusiones de orphans).
- [x] 6.3 Explicar `exclude` vs `ignore` (dependency-cruiser) vs `--max-warnings` (ESLint) vs `continue-on-error` (CI).
  - §3 nota final: exclude = fuera del grafo sin mensajes; ignore (baseline `--ignore-known`) = silencia violaciones registradas; equivalente de `--max-warnings 0` = severidad + exclude + baseline; `continue-on-error` = CI no-bloqueante (report).
- [x] 6.4 Vincular con `docs/learning/knip-configuration.md` (comparación grafo vs exports), `docs/learning/eslint-configuration.md` (ownership boundaries), `docs/CONTEXT-CICD.md` (pipeline).
  - §2 (triangulación knip/depcruise/eslint + coherencia knip↔depcruise), §7 (coordinación con changes), §9 (tabla comparativa), §11 (operación).

## 7. Actualizar docs referenciados (7.1-7.3)

- [x] 7.1 Actualizar `docs/learning/eslint-configuration.md` §2 Bloque 6 (líneas `211-225` → `311-338` o nuevas referencias).
  - Eliminado del ejemplo del Bloque 6 la exención Fase-1 de client (ya removida de `eslint.config.js` por `eslint-mlpf-client-phase2`, archivado 2026-09-24) y actualizada la nota de `max-lines-per-function` (sin `ignorePattern`, exenciones vía files/ignores o eslint-disable). Tabla de plugins: ownership de boundaries ahora apunta al config raíz de dependency-cruiser + este doc.
- [x] 7.2 Actualizar `docs/CONTEXT-CICD.md` §13.4 tabla configs + estado jobs `*-import-bounds`.
  - §3.1: `*-import-bounds` salió del inventario `if: false` (activados 2026-09-25). Tabla de jobs: filas propias para ambos jobs con gate+report. §13.4: config raíz como única fuente de verdad, capas finas por workspace, webpack.depcruise.config.cjs.
- [x] 7.3 Actualizar `docs/pre-merge-gates-governance.md` referencias jobs & ownership.
  - Sección knip ampliada con párrafo "Import boundaries": ownership exclusivo de dependency-cruiser, jobs activos y bloqueantes vía `prebuild-quality-complete`, fase 1 (baseline) vs fase 2 (quitar `--ignore-known`).

## 8. Verificación y cierre (8.1-8.2)

- [x] 8.1 Ejecutar `npx openspec validate import-boundaries --strict` → salida limpia.
  - `Change 'import-boundaries' is valid`. Regresión completa: `openspec validate --specs --strict` 98/98; `npm run lint --workspaces --if-present` exit 0; client vitest 30/30; prettier limpio en todos los archivos tocados; js-yaml parsea ci.yml (41 jobs); `depcruise:ci`/`depcruise:report` exit 0 (58 known-violations ignoradas); prueba de bloqueo cross-workspace exit 1.
- [x] 8.2 Coordinar con `server-typescript-migration` (regexes `.ts`, tsconfig server) → evitar interferencia.
  - Regex de controller/dao ya cubren `(js|ts)` y la raíz activa `tsPreCompilationDeps: true` (ampliación raíz hecha ANTES de que ese change toque los configs por workspace, que hoy son `extends` puro — sin duplicación que sincronizar). Cuando exista `apps/server/tsconfig.json`, bastará añadir `options.tsConfig.fileName` en `apps/server/.dependency-cruiser.cjs`. Documentado en `docs/learning/import-boundaries.md` §7 y en el header del config de server. El glob de lint-staged cubre ts/tsx. El validador estricto de eslint sobre los `.cjs` nuevos: limpio (bloque `**/*.cjs` añadido a `eslint.config.js` con globals.node).

## Notas

- **Hallazgos researcher**: dead-rule cross-workspace (`from.path: 'apps/client'` vs `workdir: apps/client`), `max-lines-per-function` NO tiene `ignorePattern` (exclusión vía `options.exclude`/`files`), `knip.jsonc` workspaces como referencia, docs `eslint-configuration.md` con líneas desactualizadas.
- **Critico**: `eslint-plugins-import` desinstalado → depcruise dueño único de boundaries.
- **Risk**: `e2e` sin script lint → verificar si `no-e2e-to-apps` necesario o mantener `if: false` + `continue-on-error`.
  - Resuelto: `no-e2e-to-apps` vive en el config raíz y el grafo combinado incluye `e2e/tests` (limpio, 6 módulos) — sin config propio ni job nuevo para e2e.
- **Hallazgos implementación (2026-09-25)**:
  - Los placeholders cross-side son `$1` (no `\1` — referencia octal inválida en JS regex; la antigua `no-utils-in-modules` era una dead-rule silenciosa).
  - `to.path` matchea contra el path RESUELTO; para "mismo módulo" usar `to.path` amplio + `to.pathNot: '...$1/'` (el lookahead `(?!$1/)` no funciona: `$1` se sustituye antes de compilar).
  - `--ts-config` con CWD=raíz es inoperante para jsconfig con globs `include` (TypeScript matchea 0 archivos, TS18003); el alias `@` se resuelve con `options.webpackConfig` (resolve-only, `__dirname`, independiente del CWD).
  - El nombre del baseline es `.dependency-cruiser-known-violations.json` (default de `--ignore-known`/`depcruise-baseline`), no `.dependency-cruiser-baseline.json`.
  - `enhancedResolveOptions.alias` no existe en el schema v18 (validador estricto lo rechaza).
  - Los `.cjs` raíz no tenían globals en eslint (no-undef en `__dirname`) → bloque `**/*.cjs` con globals.node añadido a `eslint.config.js`.
