# Specs: Import Boundaries / Config Correctness

## ADDED Requirements

### Requirement: Import boundaries config-correctness para monorepo

1. `dependency-cruiser` MUST validar import boundaries entre workspaces `apps/client`, `apps/server`, `e2e` con reglas `forbidden` por capa (`error` para prohibiciones reales, `warn` para deuda controlada `circular`/`orphan`/`controller-to-controller`).
2. La configuración MUST ser única fuente de verdad en raíz (`.dependency-cruiser.cjs`) con `extends`, `$schema`, `exclude` global, `doNotFollow`, `enhancedResolveOptions`, `tsPreCompilationDeps` y resolución del alias `@` del client vía `webpackConfig` (config dedicado `apps/client/webpack.depcruise.config.cjs` — el mecanismo `--ts-config apps/client/jsconfig.json` NO es viable desde root: TypeScript resuelve los globs del jsconfig contra el CWD y con CWD=raíz matchea 0 archivos).
3. Los paths de reglas (`^apps/client`/`^apps/server`/`^e2e`) MUST matchear al ejecutar desde root (`npm run depcruise:*`), arreglando la dead-rule actual.
4. El pipeline de enforcement MUST tener 4 capas (pre-commit `lint-staged` `--output-type err-long` + baseline; CI gate `--output-type err`; report `err-html`; docs `docs/learning/import-boundaries.md` ES).
5. Los scripts `package.json` MUST incluir `depcruise`, `depcruise:client`, `depcruise:server`, `depcruise:ci` (`--output-type err --ignore-known`), `depcruise:report` (`err-html`) y `depcruise:baseline`.
6. `docs/learning/import-boundaries.md` MUST documentar implementación profesional (reglas por capa, severidades, CI, shifting-left, comparación con `knip.jsonc`, referencias `dependency-cruiser` docs).
7. `eslint-plugin-import` MUST permanecer desinstalado (ownership = dependency-cruiser).
8. `server-typescript-migration` MUST coordinarse (regex `\.js$` → `\.(js|ts)$`, `tsconfig.json` server; `import-boundaries` amplía regex raíz; server pasa `extends` raíz).

#### Scenario: Import boundaries entre workspaces

- Dado `apps/client` con reglas `from.path: '^apps/client'` y `to.path: '^(apps/server|...)'` severity `error`, y `npm run depcruise:ci` desde root con `--output-type err`
- Cuando `apps/client` importa `apps/server/src` directamente
- Entonces `dependency-cruiser` viola (`name: no-client-to-server`, `severity: error`, `comment` legible)
- Y CI exit ≠ 0 → PR bloqueado
- Y `lint-staged` pre-commit con `--output-type err-long` muestra regla antes de push

#### Scenario: Baseline gradual (fase 1 → fase 2)

- Dado `.dependency-cruiser-known-violations.json` (generado por `npm run depcruise:baseline`) con las 58 violaciones conocidas (50 client: 24 ciclos `no-circular` + 26 `no-cross-module-client`/`no-orphans`; 8 server: orphans de código muerto knip-ignorado)
- Cuando `npm run depcruise:ci` ejecuta con `--ignore-known`
- Entonces conocidas no bloquean (fase 1 `warn` + gates verdes con exit 0)
- Y nuevas violaciones cross-workspace (`error`) sí bloquean (verificado: un import client→server temporal produce `error no-client-to-server` y exit 1 incluso con `--ignore-known`)
- Y tras limpiar deuda, `--ignore-known` se quita del script `depcruise:ci` → fase 2

#### Scenario: Documentación profesional

- Dado `docs/learning/import-boundaries.md` existente (ES) con referencias `dependency-cruiser` docs v18
- Cuando desarrollador necesita replicar/configurar boundaries
- Entonces encuentra: §1 estado actual, §2 por qué DC, §3 reglas por capa, §4 shifting-left/CI, §5 pipeline/proyecto, referencias oficiales
- Y puede replicar `npm run depcruise:report` para inspeccionar grafo

## Delta Purpose

- Mejorar configuración de import boundaries para monorepo profesional: config raíz + `extends`, reglas por capa con `forbidden`/`allowedSeverity`, CI gate (`err`) + report (`err-html`) sin renombrar jobs, `lint-staged` sobre staged files, doc `docs/learning/import-boundaries.md` (ES) canónica, coordinación con `server-typescript-migration`, eliminación de `eslint-plugin-import` (ownership único a dependency-cruiser).
