# Proposal: Import Boundaries con Dependency-Cruiser (Profesional/Enterprise)

## Por qué

El proyecto `project-one` (monorepo React/Express) tiene `dependency-cruiser` 18.2.0 con 2 configs por workspace (`client`/`server`), pero las reglas `no-cross-workspace-imports` son **muertas** (paths `^apps/*` vs `workdir` relativo → nunca matchean). `e2e` no tiene config; `server-import-bounds` está `if: false`; no hay scripts `depcruise`; no hay `.prettierignore`/`.vscode` para este flujo. Se requiere una implementación profesional: config raíz (`.dependency-cruiser.cjs`) con `extends`, reglas por capa, CI gate (`err`) + report (`err-html`), `lint-staged` (`err-long`), baseline gradual (`warn` → `error`), y doc `docs/learning/import-boundaries.md` (ES) explicando la implementación.

## Qué cambia

- **Config raíz**: `.dependency-cruiser.cjs` con `$schema`, `extends` recommended, `exclude` global, `options` (cache, maxDepth, enhanceResolve), reglas `forbidden`/`allowed`/`required` por capa.
- **Re-escritura workspace**: `client`/`server` pasan a `extends: '../../.dependency-cruiser.cjs'` + overrides mínimos (tsConfig, regex `.ts`).
- **Reglas por capa**: cross-workspace (`error`), circular (`warn`/`error` con `viaNot`), orphan (`warn` con exclusions tests/mocks/stories), `not-to-dev-dep` (`error`), `not-to-unresolvable` (`error`).
- **Scripts npm**: `depcruise`, `:client` (`--ts-config apps/client/jsconfig.json`), `:server`, `:ci` (`--output-type err`), `:report` (`err-html -f reports/dependency-cruiser.html`).
- **CI (`ci.yml`)**: activar `server-import-bounds` (quitar `if: false`), gate (`--output-type err`) + report no-blocking (`--output-type err-html` + `upload-artifact`), añadir `.dependency-cruiser.cjs` a `path-filter shared` (`repo-discovery`), `--cache` en scripts.
- **Shifting-left**: `lint-staged` (`pre-commit`) con `--output-type err-long` sobre staged files (`.dependency-cruiser.cjs` debe correr desde root). Baseline inicial + `--ignore-known` para fase 1 no-blocking.
- **Documentación profesional**: `docs/learning/import-boundaries.md` (ES) con referencias oficiales (`dependency-cruiser` docs), prácticas por capa, comparación con `knip.jsonc` y `eslint.config.js`, integración CI y rollback (`git revert`).
- **Referencias**: actualizar `docs/learning/eslint-configuration.md` (l.529 ownership), `docs/CONTEXT-CICD.md` (§13.4), `docs/pre-merge-gates-governance.md`.
- **Coordinación `server-typescript-migration`**: change activo amplía regexes `\.ts` (server `\.js$` → `\.(js|ts)$`) y crea `tsconfig.json`; `import-boundaries` amplía regexes raíz y `server` pasa `extends` raíz (`design.md` D6).

## Capacidades

- `forbidden` (reglas con `severity`: `error`/`warn`/`info`/`ignore`)
- `allowed` (`allowedSeverity`)
- `required` (`module`+`to` obligatorios)
- `exclude` (exclusión archivos/grupos sin mensaje — vs `ignore` de `lint-staged`)
- `doNotFollow` (crucea sin seguir dependencias — para `node_modules`)
- `maxDepth` (límite profundidad grafo)
- `focus` (+ `depth`, `matchesFocus`)
- `reaches` (`matchesReaches`)
- `license`/`licenseNot`
- `circular` + `via`/`viaNot` (`circular`: ciclos; `viaNot`: excluir módulos intermedios)
- `extends` (merge por nombre — `recommended`/`recommended-strict`)
- `cache`/`--cache-strategy` (experimental, aceptable en CI con node_modules cacheado)
- `tsPreCompilationDeps` (leer `tsconfig.json`/`jsconfig.json` para `paths`/`baseUrl`)
- `enhancedResolveOptions` (`exportsFields`/`conditionNames`/`mainFields`/`alias`)
- `reporterOptions` (`dot`/`archi`/`mermaid`/`markdown`)
- `combinedDependencies` (monorepo npm workspaces — opcional)
- `options.exclude` = `node_modules`/`dist`/`build`/`storybook-static`/`coverage`/`prisma/generated`
- `options.collapsePattern` (para `archi`/`dot`)

## Impacto esperado

- **Seguridad arquitectónica**: cross-workspace `error` bloquea PR con imports no autorizados (`client→server` sin contrato explícito), evitando fugas de capas.
- **Baseline gradual**: fase 1 (`warn` + `continue-on-error`) permite adoptar sin romper builds; fase 2 (`error` + quitar `continue-on-error`) tras limpiar deuda (ciclos 24 documentados en `client` con `viaNot`).
- **Profesional**: `err-long` en pre-commit (`--output-type err-long`) da mensaje legible (`comment` de regla); `--max-warnings 0` y `--no-warn-ignored` de `lint-staged` NO se replican (equivalente: severidad + `exclude`); `docs/learning/import-boundaries.md` referencia oficial y patrones de uso.
- **No renombrar jobs CI**: `client-import-bounds`/`server-import-bounds` mantienen ids (spec fija 13 jobs en `openspec/specs/ci-prebuild-substage-structure/spec.md`).
