# Tasks

## 1. Fase 1 — Artefactos generados (riesgo mínimo)

- [ ] 1.1 Ejecutar `git rm -r --cached docs/opencode/prompts/contracts/node_modules/` y verificar que el directorio deja de estar trackeado (`git ls-files | grep contracts/node_modules` vacío)
- [ ] 1.2 Borrar del working tree (no del git) `--version/`, `.cache/`, `coverage/`, `dist/`, `*.log`, `.vitest-reports/`, `reports/*` (mantener `.gitkeep`) y verificar que el árbol compila (`npm run build`)
- [ ] 1.3 Ampliar `.gitignore` con los patrones ausentes (verificar con `git check-ignore` cuáles ya están ignorados: actualmente `node_modules/`, `dist/`, `coverage/`, `*.log`, `*.tsbuildinfo`, `.cache/`, `test-results/`, `.vitest-reports/`, `reports/*` ya están cubiertos; añadir solo los faltantes) y verificar que `git status --porcelain` queda limpio tras un build completo
- [ ] 1.4 Verificar que `docs/**/node_modules/` ya está cubierto por el patrón `node_modules/` (comprobar con `git check-ignore docs/opencode/prompts/contracts/node_modules/foo`) y confirmar que 1.1 dejó el árbol limpio

## 2. Fase 2 — Carpetas de agentes/IDE (riesgo bajo)

- [ ] 2.1 Confirmar con el equipo que `.kiro/`, `.perch/`, `.freebuff/` no se usan (issue/PR) y borrarlos del disco; verificar que no se referencian en docs/scripts
- [ ] 2.2 Decidir destino de `.agents/` (mantener versionado vs `.config/agents/`) y documentar la decisión en `docs/`
- [ ] 2.3 Consolidar `.semgrep/` en `.config/semgrep/` y actualizar invocaciones (`.github/workflows/security.yml` + `scripts/sast-diff.mjs`); verificar workflow de seguridad verde. (Decisión final tomada en proposal/design; no mantener la opción "o mantener".)

## 3. Fase 3 — Mover configs con flag (riesgo medio)

- [ ] 3.1 Mover `knip.jsonc` → `.config/knip.jsonc` y actualizar script en `package.json` (scripts/knip); verificar `npm run knip` pasa
- [ ] 3.2 Mover `stryker.config.mjs` → `.config/stryker.config.mjs` y actualizar invocación; verificar `stryker run` pasa
- [ ] 3.3 Mover `.gitleaks.toml` + `.gitleaksignore` → `.config/` y actualizar los 8 sitios de invocación (`ci.yml`, `release.yml`, `scheduled-security.yml`, `security-digest.yml`, `.husky/pre-commit`, `package.json`, `scripts/security/generate-security-digest.mjs`, `scripts/ci/yamllint-staged.mjs`); verificar gitleaks pasa en CI y hooks
- [ ] 3.4a Mover `checkov` y `hadolint` a `.config/` y actualizar workflows; verificar
- [ ] 3.4b Mover `markdownlint`, `yamllint`, `vale` a `.config/` y actualizar workflows/IDE; verificar
- [ ] 3.4c Mover `commitlint` y `dependency-cruiser` a `.config/` y actualizar `.husky/commit-msg`, lint-staged y CI; verificar hooks y CI verdes

## 4. Fase 4 — Consolidar Vitest (riesgo medio)

- [ ] 4.1 Unificar `vitest.shared.js`, `vitest.sequencer.js`, `vitest.scripts.config.js` en `config/vitest/` y actualizar todos los importers (`grep -rn "vitest.shared" apps/` → `apps/client/vitest.config.js`, `apps/server/vitest.config.ts`, `apps/server/vitest.mutation.config.ts`, `apps/server/vitest.smoke.config.ts`); verificar client + server (unit/mutation/smoke) + `test:scripts` verdes

## 5. Fase 5 — File nesting en IDE (riesgo cero)

- [ ] 5.1 Aplicar `.vscode/settings.json` con file nesting (patterns: `package.json`→lock/npmrc/nvmrc/tool-versions; `tsconfig.json`→tsconfig._.json,_.tsbuildinfo; `eslint.config.js`→prettierrc*,editorconfig,markdownlint*,yamllint.yml,vale.ini; `README.md`→AGENTS.md,CONTEXT.md,CONTRIBUTING.md,oldReadme.md,pending.txt; `.gitleaks.toml`→gitleaksignore,checkov.yml,hadolint.yaml,scancode.yml,semgrepignore; `stryker.config.mjs`→stryker-baseline.json; `knip.jsonc`→manifest-allowlist.json) y excludes (`node_modules`,`.cache`,`dist`,`coverage`,`.vitest-reports`,`reports`,`test-results`,`*.tsbuildinfo`,`*.log`,`--version`); verificar que las claves `files.exclude` y `explorer.fileNesting.patterns` existen en el JSON

## 6. Fase 6 — Archivos sueltos y scripts (riesgo bajo)

- [ ] 6.1 Borrar `_edit_design.mjs` tras grep de referencias; verificar build/tests
- [ ] 6.2 Mover `oldReadme.md` y `pending.txt` a `docs/notes/` o borrar tras grep de referencias; verificar build/tests
- [ ] 6.3 Añadir scripts `clean`/`clean:all` a `package.json` (rimraf dist coverage .cache reports) y documentarlos en README; verificar `npm run clean` y `git status --porcelain` limpio
- [ ] 6.4 (Opcional) Insertar check CI de artefactos (`git status --porcelain` limpio tras build) en un workflow; o dejar como verificación local documentada

## 7. Verificación final

- [ ] 7.1 Ejecutar `npm run build`, `npm run lint`, `npm run test`, `npx tsc -b` y confirmar verde
- [ ] 7.2 Verificar hooks de husky (`pre-commit`, `commit-msg`, `pre-push`) con un commit de prueba
- [ ] 7.3 Ejecutar `openspec validate repo-hygiene` y confirmar sin errores
- [ ] 7.4 Decidir explícitamente si se crea `docs/traceability/repo-hygiene.md` (con skip_specs no hay RN-xxx); crearlo o eliminar esta tarea
- [ ] 7.5 Validación de no-regresión del repositorio: ejecutar `npm ci` limpio, `npm run build`, `npm run lint`, `npm run test`, `npx tsc -b`, hooks de husky y un dry-run de los workflows de CI afectados (security, lint, test) para confirmar que los cambios de higiene no rompen el funcionamiento del repo; verificar que no quedan referencias rotas a configs movidos (`grep -R` de rutas antiguas en `.github/`, `scripts/`, `.husky/`, `package.json`)
