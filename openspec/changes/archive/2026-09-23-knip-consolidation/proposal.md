# Proposal

## Why

Three knip config files exist (`/knip.jsonc`, `apps/client/knip.json`, `apps/server/knip.json`) but knip reads exactly ONE config, resolved from the CWD — so results differ between root runs, `cd`-into-workspace runs, and CI. The nested client file is already stale (2 `ignore` entries vs 23 in the root client section), the root config lacks `.` and `e2e` workspace sections, `project` globs are too narrow (phantom unused deps parked in `ignoreDependencies`), and both CI and OpenSpec claims describe config discovery incorrectly.

## What Changes

- **Merge** all workspace-specific knip configuration into a single root `knip.jsonc` as the only source of truth.
- **BREAKING** delete `apps/client/knip.json` and `apps/server/knip.json` (only affect `cd <app> && npx knip` runs; they drift silently).
- **Add missing workspace sections** to root `knip.json`: `"."` (root scripts/eslint/husky files) and `"e2e"` (playwright workspace from `package.json#workspaces`).
- **Widen `project` globs**: client `src/**/*.{js,jsx}` + `tests/**/*.{js,jsx}`, `.storybook/**/*.{js,jsx}`, `*.config.{js,mjs}`; server `src/**/*.js` + `prisma/**/*.js`, `tests/**/*.js` — so deps used only in test/config files stop being reported as unused.
- **Reconcile ignore lists**: union of root vs nested `ignore`/`ignoreIssues` (root wins as newer; nested-only `fieldLimits.js`/`socketService.js` `exports` entries reconciled against root `ignore` entries), single `ignoreDependencies` per workspace re-audited after glob widening (`msw`, `globals`, `@storybook/*` candidates for removal from ignore), `add`/`command` flagged as accidental installs (uninstall candidates, not ignores).
- **Fix `ignoreIssues`**: keep surgical per-file `exports` suppressions only for genuine barrels/schema modules; drop entries made obsolete by widened globs.
- **Update CI** (`.github/workflows/ci.yml`): `client-dead-code` / `server-dead-code` currently run knip with `working-directory: apps/*` (=> nested config). Change them to run from repo root against the root config (`npx knip --workspace=apps/client …`, `npx knip --workspace=apps/server …`); root-workspace/full runs keep using the same root config.
- **Update OpenSpec claims**: `openspec/specs/ci-prebuild-substage-structure/spec.md` requirements "Per-workspace knip.json with correct schema" and "Baseline calibration of ignores" incorrectly state that `--workspace` switches config files — restate in terms of root `knip.jsonc` `workspaces` sections.
- **Add root npm scripts** (`knip`, `knip:client`, `knip:server`, `knip:ci`) so per-app commands run from root and always hit the single config.

## Capabilities

### New Capabilities

- `knip-config-single-source`: one root `knip.jsonc` defines entry/project/ignore configuration for every workspace (`.`, `apps/client`, `apps/server`, `e2e`); no nested config files exist; any CWD yields identical analysis scope.

### Modified Capabilities

- `ci-prebuild-substage-structure`: the "Per-workspace knip.json with correct schema" and "Baseline calibration of ignores" requirements change from per-workspace config files to root `knip.json` `workspaces` sections, matching how config discovery actually works (CWD-based, `--workspace` only filters analysis).

## Impact

- **Files**: `/knip.jsonc` (rewritten), `apps/client/knip.json` + `apps/server/knip.json` (deleted), `.github/workflows/ci.yml` (2 dead-code job steps), root `package.json` (npm scripts), `openspec/specs/ci-prebuild-substage-structure/spec.md` (via delta), `docs/learning/knip-configuration.md` (§3/§9 claims corrected post-migration).
- **CI**: Phase 1 non-blocking knip gates keep `continue-on-error` semantics; only the config source changes.
- **Developers**: `cd apps/* && npx knip` now uses root config (monorepo-aware) instead of a stale standalone one.
- **Risk**: baseline finding counts shift after glob widening + ignore reconciliation → parity must be verified per workspace before/after (`npx knip --workspace=… --no-progress`).

--- Post-impl fixes (research audit, 2026-09-23) ---

- $schema corregido a `https://unpkg.com/knip@6/schema-jsonc.json`.
- `add`/`command` removidos de `ignoreDependencies`; `npm uninstall` EJECUTADO (raíz + apps/client: `add`, `command`, `@tanstack/react-query`, `@tanstack/react-query-devtools`; knip --dependencies limpio de ellos y build de client pasa).
- `@tanstack/react-query` + `@tanstack/react-query-devtools` removidos (zero refs, proyecto usa RTK Query).
- Comentario obsoleto línea 9 corregido (`.` workspace con entry/project explícitos).
- Doc `docs/learning/knip-configuration.md` traducido a español.

--- Implementación (2026-09-23) ---

- Baselines capturados (worktree de HEAD): client 28, server 28, root-ws 1502 hallazgos (scope estrecho + configs anidadas).
- Tras consolidación (globs ampliados analizan tests/.storybook/prisma/configs antes fuera de alcance): client 152, server 266 hallazgos. Fase 1 sigue no-bloqueante (`continue-on-error: true`).
- Hints de knip aplicados: removidos 18 entradas `ignore` sin hallazgos, `ignoreBinaries` (client y server) sin hallazgos, patrones redundantes cubiertos por plugins (`eslint.config.js` del entry raíz, `playwright.config.js` del project e2e), y `main: index.js` obsoleto de `package.json` raíz.
- Corrección fáctica verificada con `knip --debug` 6.32.2: knip NO sube al directorio raíz desde un workspace (`configFilePath: undefined`); el requisito delta "CWD-independent analysis" se reemplazó por "Root-CWD analysis invariant" (los scripts npm imponen ejecutar desde la raíz).
- `msw` correctamente atribuido vía globs ampliados (no reportado); `globals`, `@chromatic-com/storybook`, `@storybook/addon-docs` son genuinamente sin uso (solo refs comentadas) y se reportan como hallazgos reales.
- `actionlint` (paquete npm, vía `node node_modules/actionlint/actionlint.cjs`) y `openspec validate knip-consolidation --strict` pasan.
- Hints estructurales "Compiled extension excluded by project" (.css/.mdx/.prisma) aceptados y documentados en `knip.jsonc`: los emite cualquier glob `project` explícito, no suman hallazgos.
