# Design: Import Boundaries con Dependency-Cruiser

## D1: Config raíz única (fuente de verdad)

- Archivo `.dependency-cruiser.cjs` en raíz del monorepo (CJS por compatibilidad con `npx dependency-cruiser`), exportando objeto `IConfiguration`.
- `$schema` oficial apuntando a schema JSON de dependency-cruiser v18 (autocomplete editor).
- `extends: ['dependency-cruiser/configs/recommended']` (base recomendada) + reglas custom por capa.
- `options.exclude` global: `node_modules`, `dist`, `build`, `storybook-static`, `coverage`, `prisma/generated`, `*.log`, `package-lock.json`.
- `doNotFollow: node_modules` (crucea sin seguir, no ignora).
- `cache: true` + `--cache-strategy content` (CI con node_modules cacheado).
- `tsPreCompilationDeps: true` + `enhancedResolveOptions` (exportsFields/conditionNames/mainFields).
- Runs SIEMPRE desde root: `depcruise apps/client/src --config .dependency-cruiser.cjs` → regex `^apps/*` matchean correctamente (arregla dead-rule actual).
- Alias `@` client: `enhancedResolveOptions.alias: {'@': './apps/client/src'}` (solo client, server no usa `@`).
- Client conditionNames: `['browser','import','module','default']`; server: `['node','require','default']`.

## D2: Rules por capa (forbidden)

| Regla                         | Severity                   | From                  | To                                 | Comment ES                                     |
| ----------------------------- | -------------------------- | --------------------- | ---------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| `no-client-to-server`         | error                      | `^apps/client`        | `^(apps/server                     | node_modules/.\*server)`                       | Client no importa server (contrato explícito) |
| `no-server-to-client`         | error                      | `^apps/server`        | `^apps/client`                     | Server no importa client                       |
| `no-e2e-to-apps`              | error                      | `^e2e`                | `^apps/`                           | e2e no importa apps (solo fixtures)            |
| `no-cross-module-client`      | warn                       | `^apps/client/[^/]+/` | `^apps/client/[^/]+/` (grupo `$1`) | Módulo interno client (excepción controlada)   |
| `no-controller-to-controller` | warn                       | server                | server                             | Handlers sin intermedio                        |
| `no-dao-in-routes`            | warn                       | server                | server                             | DAO no en rutas                                |
| `no-redux-in-components`      | warn                       | client                | client                             | Redux en components                            |
| `no-circular`                 | client warn / server error | any                   | any                                | `viaNot` para acotar ciclos conocidos          |
| `no-orphan`                   | warn                       | any                   | any                                | Excluir tests/mocks/stories via `from.pathNot` |
| `not-to-dev-dep`              | error                      | any                   | any                                | Runtime no usa devDependencies                 |
| `not-to-unresolvable`         | error                      | any                   | any                                | Sin imports rotos                              |

## D3: Scripts y monorepo

Scripts en raíz `package.json` (espejo `knip`): `depcruise`, `:client`, `:server`, `:ci` (`--output-type err`), `:report` (`--output-type err-html -f reports/dependency-cruiser.html`).

- `depcruise:client`: `npx depcruise --config .dependency-cruiser.cjs --output-type err apps/client/src --ts-config apps/client/jsconfig.json`
- `depcruise:server`: `npx depcruise apps/server/src --config .dependency-cruiser.cjs --output-type err`
- `depcruise:ci`: `--output-type err` (exit code = nº errores)
- `depcruise:report`: `--output-type err-html -f reports/dependency-cruiser.html` (reporte standalone)
- `lint-staged` pre-commit: `depcruise --config .dependency-cruiser.cjs --output-type err-long` sobre staged files (solo archivos afectados; cross-workspace funciona con CWD=root).
- Baseline fase 1: `depcruise-baseline` genera `.dependency-cruiser-baseline.json`; CI usa `--ignore-known` → no bloquea violaciones conocidas.
- Adopción gradual: fase 1 (`warn` + `continue-on-error`) → fase 2 (`error` + quitar `continue-on-error`).

## D4: CI (`ci.yml`)

- Mantener ids `client-import-bounds`/`server-import-bounds` (spec fija 13 jobs; renombrar rompe `needs` de builds + agregadores).
- Gate: `--output-type err` (exit real → bloquea PR si violations error).
- Report (nuevo job/step `if: always()`): `--output-type err-html` + `actions/upload-artifact` → no-blocking.
- Activar `server-import-bounds` (quitar `if: false`).
- Añadir `.dependency-cruiser.cjs` a path-filter `shared` de `repo-discovery` (cambio de config dispara ambos jobs).
- `--cache` en scripts (experimental, aceptable con node_modules cacheado).
- `shared` path-filter incluye `.dependency-cruiser.cjs` y `apps/*/.dependency-cruiser.cjs`.

## D5: Documentación (`docs/learning/import-boundaries.md`)

- §1: Implementación actual (configs actuales → problemas)
- §2: Por qué Dependency-Cruiser (grafo de imports vs archivos/exports de knip)
- §3: Configuración por capa (tabla reglas) + comentarios ES en `.dependency-cruiser.cjs`
- §4: Integración profesional (shifting-left `lint-staged` + `pre-commit`, CI gate/report, baseline gradual)
- §5: Pipeline (`editor → pre-commit → CI`) + comparación con `knip.jsonc` + `eslint.config.js`
- §6: Glosario / referencias adicionales / notas implementacion
- §7: Coordinación con cambios activos (`eslint-configuration`, `knip-consolidation`, `prettier-configuration`, `docs-changelog-validation` — referencia a doc `docs/learning/docs-changelog-validation.md` con `markdownlint-cli`/`vale` v0.49.1/v3.22.0; revisión con `markdownlint-cli` + `vale`)
- Referencias oficiales (`dependency-cruiser` docs v18)
- §7: Coordinación con cambios activos (`eslint-configuration`, `knip-consolidation`, `prettier-configuration`, `docs-changelog-validation`)

## D6: Coordinación

- Change activo `server-typescript-migration`: regexes `.ts` en config server (`\.js$` → `\.(js|ts)$`), creación `tsconfig.json` server. `import-boundaries` amplía regexes raíz igual y config server pasa a `extends` raíz (evita duplicación).
- `eslint-plugin-import` desinstalado (change archivado `2026-09-23-eslint-configuration`); depcruise dueño único de boundaries.
- e2e: sin config depcruise; regla `no-e2e-to-apps` opcional (hoy Playwright no importa apps → `error` si se decide prohibir).
