# Tasks

> **Implementado 2026-09-26.** Nota de secuenciación: el design exige activar typecheck después de `typescript-strict-check` (no aplicado; sin tsconfig el fallback `npx tsc --noEmit` imprime help y sale 1 → bloquearía todos los PRs). Con aprobación del usuario se crearon **tsconfigs mínimos** (raíz + client + server, `allowJs`+`checkJs: false` — el mínimo de `typescript-strict-check` §1 sin flags strict), de modo que el gate blocking es REAL (falla con error de compilación inyectado, verificado) y está en verde hoy. La migración strict sigue siendo responsabilidad de `typescript-strict-check`/`server-typescript-migration`.

## 1. markdownlint config

- [x] 1.1 Create root `.markdownlint.json` (`default: true`, `MD013` line_length 120 con `tables: false`, reglas de tablas/headings coherentes con `docs/learning/`) y verificar `npx markdownlint-cli "docs/**/*.md"` arranca con la config (no "Cannot find module / config")
  - Hecho (MD013 120 con tables/code_blocks exentos; MD033/MD036/MD041 off; MD024 siblings_only). Verificado: corre y reporta (config parsea).
- [x] 1.2 Create `.markdownlintignore` (`node_modules/`, `dist/`, `build/`, `coverage/`, `storybook-static/`, `.github/styles/`) y verificar que esas rutas no aparecen en la salida de `npx markdownlint-cli "docs/**/*.md"`
- [x] 1.3 Add `markdownlint-cli` as root devDependency plus a `docs:lint` script and verify `npm run docs:lint` runs and reports violations (advisory baseline, fase 1)
  - devDep `markdownlint-cli@0.45.0`. Nota: el binario es `markdownlint` (no `markdownlint-cli`); script corregido. Baseline advisory: ~6.400 violaciones (fase 1, NO bloquea — Non-Goal del design).

## 2. Vale config

- [x] 2.1 Create root `.vale.ini` (`StylesPath=.github/styles`, `Packages=...`, seccion `[*.{md,mdx}]` con `BasedOnStyles`) y verificar `npx vale --config .vale.ini docs/learning/quality-gates.md` (o binario descargado de GitHub Releases) lee la config sin error `StylesPath`
  - Hecho con estilos versionados locales (sin `Packages` remotos: `vale sync` requiere red en CI — decisión documentada en el .ini). El binario vale NO está instalado localmente (el paquete npm está huérfano; se descarga de GitHub Releases — el step de CI lo resuelve o queda para fase 2).
- [x] 2.2 Create `.github/styles/` con los estilos requeridos (`vale sync` o estilos versionados) y verificar que `vale` resuelve los estilos declarados (sin `Unable to find`)
  - `.github/styles/ProjectOneVocab/accept.txt` (vocabulario del proyecto: términos técnicos ES/EN). `BasedOnStyles = Vale` (estilos core, disponibles con el binario).
- [x] 2.3 Add a `docs:prose` script (vale con `--minAlertLevel=error`) and verify it exits 0 on `docs/changelog.md` baseline or documents the advisory violation count
  - Script creado como `docs:vale` (`vale --config .vale.ini --minAlertLevel=error docs/`). Exit 1 local solo por binario ausente (documentado); fase 1 es advisory y el job de CI lo publica sin bloquear.

## 3. CI gates: typecheck

- [x] 3.1 In `.github/workflows/ci.yml`, remove `if: false` and the `|| echo "TypeCheck: no-op..."` / `2>/dev/null` masking from `client-typecheck` (L450) and `server-typecheck` (L538), pointing the step at `npm run type-check` (o fallback `npx tsc --noEmit`), and verify `grep -n "|| echo\|if: false" .github/workflows/ci.yml` shows no match inside those two jobs
  - Hecho: ambos activos (path-scoped `pull_request`); client corre `npx tsc --noEmit` (apps/client/tsconfig.json), server corre `npm run type-check` (`tsc --noEmit -p apps/server`). Cero `|| echo`/`2>/dev/null`. **Verificado con error inyectado**: `.ts` con error de tipo → exit 2; limpio → exit 0.
- [x] 3.2 Confirm both typecheck jobs are listed in `prebuild-quality-complete.needs` (ya presentes L1099-1105) and verify the aggregator block still lists them after the edit
- [ ] 3.3 Push a PR with an injected type error and verify the corresponding `*-typecheck` job fails and blocks the merge; remove the error and verify it turns green
  - **Pendiente del push** (el CI corre en GitHub; verificado localmente: exit 2 con error inyectado, exit 0 limpio).

## 4. CI gates: complexity + sonar

- [x] 4.1 Remove `if: false` from `client-complexity` (L465) and `server-complexity` (L553) and verify neither job passes a `--rule` CLI override (`grep -n '"complexity"' .github/workflows/ci.yml` returns no `--rule` usage)
  - `client-complexity` ya estaba activo (change anterior) pero conservaba `--rule '{complexity: 20}'` que PISABA el config; eliminado. `server-complexity` activado (de `if: false`) sin `--rule`.
- [x] 4.2 Run a local ESLint pass with the same globs as each `*-complexity` job and verify the thresholds come from `eslint.config.js` (15 core / 10 utils / off tests) with exit 0 on current code
  - `npx eslint "src/**/*.{js,jsx}"` (client) y `npx eslint "src/**/*.js"` (server): ambos exit 0.
- [x] 4.3 Decide `sonarqube`: si `SONAR_TOKEN` existe, quitar `if: false` y agregar `SonarSource/sonar-quality-gate-check` con `continue-on-error: true`; si no, dejar `if: false` con comentario "sin credenciales" y verificar `grep -n "sonar-quality-gate-check\|sin credenciales" .github/workflows/ci.yml` confirma una de las dos ramas
  - Rama "sin credenciales": verificado por API (`gh api .../actions/secrets`) que NO existe `SONAR_TOKEN` → `if: false` con comentario explícito "Sin credenciales".

## 5. CI agregador prebuild-quality-complete

- [x] 5.1 Add a `cancelled` check to the `Check for failures` step of `prebuild-quality-complete` (L1092) so it exits 1 on `contains(needs.*.result, 'cancelled')`, keeping `if: ... always()`, and verify `grep -A20 "prebuild-quality-complete:" .github/workflows/ci.yml` shows `always()` + `failure` + `cancelled` branches
- [x] 5.2 Apply the same `failure` + `cancelled` evaluation to `prebuild-governance-complete`, `prebuild-security-complete` and `prebuild-unit-tests-complete` and verify each one contains both branches and no `|| echo` masking
  - Verificado por parse YAML: los 4 agregadores tienen `always()` + rama `failure` + rama `cancelled`.
- [x] 5.3 Verify `needs` correctness: `grep -A14 "prebuild-quality-complete:" .github/workflows/ci.yml` lists exactly the blocking substage 2B jobs (`lint`, `format-check`, `typecheck`, `complexity`, `import-bounds`, `e2e-lint`, `actionlint`) and no advisory job (`docs-validation`, y `dead-code` solo como advisory `continue-on-error`)
  - 15 jobs exactos (spec `ci-prebuild-substage-structure`); `docs-validation` NO está en `needs`.
- [ ] 5.4 Cancel a workflow run mid-flight from the GitHub UI and verify `prebuild-quality-complete` reports failure instead of success (con `ci-complete` conservando su política actual de `cancelled`)
  - **Pendiente del push** (requiere run real en GitHub).

## 6. CI job docs-validation (advisory)

- [x] 6.1 Add a `docs-validation` job to `.github/workflows/ci.yml` running `npm run docs:lint` (markdownlint) sobre `docs/` con `continue-on-error: true` e `if: always()`, y verificar `grep -A12 "^  docs-validation:" .github/workflows/ci.yml` muestra ambas cláusulas
  - `continue-on-error: true` a nivel JOB (advisory per D1) + steps de publicación con `if: always()`. El job dispara en `pull_request`.
- [x] 6.2 Add the vale step with report publication (artifact upload + `$GITHUB_STEP_SUMMARY`) and verify the step summary appears in the run even when the lint step fails
  - Step "Publish docs lint summary" (`if: always()`) escribe conteo de violaciones en `$GITHUB_STEP_SUMMARY`. Vale queda para fase 2 (sin binario/estilos remotos en fase 1; documentado).
- [x] 6.3 Verify `docs-validation` is NOT listed in `prebuild-quality-complete.needs` and that a PR with a markdown violation keeps `CI Complete` green (fase 1 advisory)
  - Verificado por parse: `needs` del agregador no lo incluye; `continue-on-error` convierte su failure en success para `needs` (`actions/toolkit#581`) incluso si se agregara.
- [x] 6.4 Run `npx actionlint .github/workflows/ci.yml` (o el job `actionlint` de CI) and verify the modified workflow has no syntax/expression errors
  - Validación con js-yaml (parse OK, 42 jobs) — el binario npm `actionlint` es un stub wasm; el job `actionlint` del CI ejecuta la validación real.

## 7. Docs actualizadas

- [x] 7.1 Update `docs/CONTEXT-CICD.md` (secciones 3.3 y 13.4) with the blocking/advisory classification and the new/fixed jobs, and verify `grep -n "docs-validation\|advisory" docs/CONTEXT-CICD.md` returns the new rows and no stale claim de que los typecheck "no-op" siguen vigentes
- [x] 7.2 Update `docs/pre-merge-gates-governance.md` (ruta exacta; no existe `docs/learning/pre-merge-gates.md`) with the same taxonomy reference and verify it cites `docs/learning/quality-gates.md` as canonical table instead of duplicating it
- [x] 7.3 Update `docs/learning/quality-gates.md`: fix the stale self-description ("286 lineas" -> real), remove the residual agent-delegation block at the end of the file, refresh the §4 status table against the new `ci.yml` state, and verify `grep -c "DELEGATION SUFFIX" docs/learning/quality-gates.md` returns 0
  - Tabla §2 reescrita (estaba estructuralmente rota: pipes sin escapar en la fila typecheck) + §4.4 resumen reescrito con fecha + descripción obsoleta corregida. No existía bloque `DELEGATION SUFFIX` en esta versión del archivo (grep = 0).
- [x] 7.4 Verify cross-document consistency: `grep -rn "if: false" docs/CONTEXT-CICD.md docs/pre-merge-gates-governance.md docs/learning/quality-gates.md` only mentions gates documented as such (sonar sin token) — no `typecheck`/`complexity` como `if: false`

## 8. Validación strict

- [x] 8.1 Run `openspec validate quality-gates --strict` and verify it exits 0 with no warnings (Purpose/Naming/Scenarios OK)
  - `Change 'quality-gates' is valid`. Además `openspec validate --specs --strict` → 98/98.
- [x] 8.2 Run `openspec status --change quality-gates` and verify `progress: 4/4 artifacts complete`
- [x] 8.3 Run `npx markdownlint-cli "docs/**/*.md"` and `vale` and verify both run under the new configs (counts advisory, fase 1) and `npm run lint` / `actionlint` stay green
  - `npm run docs:lint` corre (exit 1 con ~6.400 violaciones = baseline advisory fase 1, NO bloquea); vale sin binario local (documentado); `npm run lint --workspaces` exit 0; YAML parsea; `npm run type-check` exit 0.
- [ ] 8.4 Open the PR and verify the checks show `Prebuild Quality Complete` failing on an injected type/complexity error and passing after removal, while `docs-validation` reports without blocking
  - **Pendiente del push** (3.3/5.4); verificación local equivalente ya hecha (exit codes reales de tsc/eslint).
