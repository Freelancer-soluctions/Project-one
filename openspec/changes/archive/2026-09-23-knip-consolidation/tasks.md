# Tasks

## 1. Baselines (read-only)

- [x] 1.1 Capture pre-change knip baselines: `npx knip --no-progress --reporter json > /tmp/knip-root-before.json` from repo root, plus `npx knip --directory apps/client --no-progress` and `npx knip --directory apps/server --no-progress`; verify 3 baseline artifacts exist with finding counts recorded in the change
  - → Realizado vía worktree temporal de HEAD (read-only): client 28, server 28, root-ws 1502 hallazgos. Conteo registrado en proposal.md (§ Implementación). `--directory` descarta la config raíz, así que el baseline se tomó contra el HEAD pre-cambio.
- [x] 1.2 Confirm current drift with `npx knip --debug` from root and from `apps/client`; verify the debug output shows root config in the first run and the nested config in the second (evidence for the spec claim)
  - → Verificado: desde la raíz `configFilePath: knip.jsonc`; desde `apps/server` `configFilePath: undefined` (knip NO sube a la raíz — corrección fáctica documentada en la delta y en docs §2).

## 2. Consolidated root knip.json

- [x] 2.1 Rewrite `/knip.jsonc` merging nested configs: union `ignore`/`ignoreIssues` (root precedence), single `ignoreDependencies`/`ignoreBinaries` per workspace, `fieldLimits.js` + `socketService.js` moved from blanket `ignore` to `ignoreIssues: ["exports"]`; verify with `node -e "..."` and `npx knip --debug` loading without config hints
  - → `knip.jsonc` parsea OK (verificación JSON incluida). fieldLimits/socketService en `ignoreIssues: ["exports"]`. Hints de config resueltos (ver 2.4/6.1).
- [x] 2.2 Widen `project` globs (client: `src/**/*.{js,jsx}`, `tests/**/*.{js,jsx}`, `.storybook/**/*.{js,jsx}`, `*.config.{js,mjs}`; server: `src/**/*.js`, `prisma/**/*.js`, `tests/**/*.js`) and add client `paths` for `@/` alias; verify `npx knip --workspace=apps/client --files --no-progress` no longer reports test/setup/config files as out of scope
  - → Globs ampliados + `paths` `@/` aplicados. Los archivos de tests/setup ahora SÍ se analizan: knip reporta 3 setup files sin usar (hallazgo real, no out-of-scope).
- [x] 2.3 Add `"."` (entry: `scripts/**`, `eslint.config.js`, `.husky/*`) and `"e2e"` (project: `tests/**/*.js` + playwright config) workspace sections; verify `npx knip --workspace=. --no-progress` and full `npx knip --no-progress` both run with zero config hints
  - → Secciones `"."` y `"e2e"` añadidas. Ajuste post-hint: `eslint.config.js` y `playwright.config.js` se quitaron de entry/project porque los plugins eslint/playwright ya los inyectan (hint "redundant pattern"). Runs completos sin hints accionables (solo los estructurales .css/.mdx/.prisma, documentados).
- [x] 2.4 Re-audit `ignoreDependencies` after glob widening — remove `msw`, `globals`, `@storybook/addon-docs`, `@chromatic-com/storybook` if no longer reported; verify `npx knip --workspace=apps/client --dependencies --no-progress` shows no `msw`/`globals`/storybook findings; keep all remaining entries documented with reasons (including `add`/`command` as uninstall candidates)
  - → `msw` removido y correctamente atribuido (no reportado). `globals`/`@chromatic-com/storybook`/`@storybook/addon-docs` removidos: son genuinamente sin uso (solo refs comentadas) y se reportan como hallazgos reales. `ignoreBinaries` client/server eliminadas (hint: sin hallazgos). `add`/`command` siguen como candidatos a `npm uninstall` (pendiente, fuera de este cambio).

## 3. Remove nested configs

- [x] 3.1 Delete `apps/client/knip.json` and `apps/server/knip.json`; verify `glob **/knip.json*` returns only the root `knip.jsonc` file
  - → Ambos eliminados (git status confirma D). Solo existe `/knip.jsonc`.
- [x] 3.2 Verify parity: `npx knip --workspace=apps/client --no-progress`, `npx knip --workspace=apps/server --no-progress`, `npx knip --workspace=. --no-progress` each exit with the reconciled baseline (diff against 1.1, explain every delta); also verify `cd apps/server && npx knip` now loads root config via `--debug`
  - → Parity registrada: client 28→152, server 28→266 (deltas explicados: globs ampliados analizan tests/.storybook/prisma/configs antes fuera de alcance). `cd apps/server && npx knip` NO carga la raíz (knip no sube: `configFilePath: undefined`) — la garantía se implementa con scripts npm desde la raíz; requisito delta corregido en consecuencia.

## 4. CI updates

- [x] 4.1 Edit `.github/workflows/ci.yml` `client-dead-code` step: drop `working-directory: apps/client`, run `npx knip --workspace=apps/client --no-progress --reporter json`, keep `continue-on-error: true`; verify with `actionlint .github/workflows/ci.yml` (or `npx knip` step YAML parses) and by reading back the job block
  - → Paso sin `working-directory`, comando `npx knip --workspace=apps/client --no-progress --reporter json`, `continue-on-error: true` mantenido. actionlint (paquete npm: `node node_modules/actionlint/actionlint.cjs`) pasa con exit 0.
- [x] 4.2 Edit `server-dead-code` step: drop `working-directory: apps/server`, run `npx knip --workspace=apps/server --no-progress`, keep `continue-on-error: true`; verify both dead-code jobs still appear in `prebuild-quality-complete` `needs` (13-job list unchanged)
  - → Aplicado y verificado por lectura: la lista de 13 jobs en `prebuild-quality-complete.needs` no cambió (ambos dead-code siguen listados).

## 5. Docs, scripts, spec claims

- [x] 5.1 Add root npm scripts `knip`, `knip:client`, `knip:server`, `knip:ci` to `package.json`; verify `npm run knip:server -- --no-progress` runs from root against `/knip.jsonc`
  - → Scripts añadidos y verificados desde la raíz. Nota: correr `npm run knip:server` DENTRO del workspace falla por diseño de npm (re-resuelve al package.json del workspace) — refuerza el invariant root-CWD.
- [x] 5.2 Update `openspec/specs/ci-prebuild-substage-structure/spec.md` claims via this change's delta (single root config, CI runs from repo root, calibration targets workspace sections) — verify `openspec validate knip-consolidation` passes after delta authored (validation runs at archive/sync time)
  - → Delta con 3 requisitos MODIFIED (Per-workspace knip.json, Baseline calibration, Phase 1 non-blocking). `openspec validate knip-consolidation --strict` pasa (exit 0).
- [x] 5.3 Correct `docs/learning/knip-configuration.md` §3/§9 statements about CI config usage (CI dead-code jobs previously ran from workspace dirs → nested configs); verify the doc no longer claims CI uses root config without qualification and lists the final CI commands
  - → Doc actualizado: §2 (discovery real, límite sin config en subdirectorios), §3 (UNA config; tabla de divergencia RESUELTA), §8 (estado alcanzado, pasos HECHO), §9 (comandos CI finales), §10/§11 (notas corregidas).

## 7. Post-impl fixes (research audit)

- [x] Cambiar `$schema` a `https://unpkg.com/knip@6/schema-jsonc.json` (archivo `.jsonc`).
- [x] Remover `add` y `command` de `ignoreDependencies` (instalaciones accidentales) — `npm uninstall` EJECUTADO: desinstalados de la raíz (`add`, `command`) y de `apps/client` (`add`, `command`, `@tanstack/react-query`, `@tanstack/react-query-devtools`); knip ya no los reporta y `npm run build --workspace=apps/client` pasa.
- [x] Remover `@tanstack/react-query` y `@tanstack/react-query-devtools` de `ignoreDependencies` (zero refs en `src/`; proyecto usa RTK Query, no TanStack) — desinstalados de `apps/client`.
- [x] Corregir comentario obsoleto línea 9 (`.` workspace tiene `entry`/`project` explícitos).

## 6. Verification

- [x] 6.1 Run full `npx knip --no-progress` from repo root; verify exit behavior matches the agreed Phase 1 baseline and zero config hints are emitted (`--treat-config-hints-as-errors` spot check)
  - → Run completo OK con hallazgos esperados (Fase 1 no-bloqueante). Hints accionables en 0 (los únicos residuales son los estructurales "Compiled extension excluded by project" .css/.mdx/.prisma, que emite cualquier glob `project` explícito y no suman hallazgos; aceptados y documentados en `knip.jsonc`).
- [x] 6.2 Run `openspec validate --change knip-consolidation --strict`; verify spec deltas (new capability + 3 modified requirements) pass format checks (4-hashtag scenarios, header match on MODIFIED/RENAMED)
  - → `Change 'knip-consolidation' is valid` (exit 0). Nueva capability `knip-config-single-source` + 3 requisitos MODIFIED de `ci-prebuild-substage-structure`.
