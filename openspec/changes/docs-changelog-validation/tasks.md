# Tasks

## 1. Config markdownlint

- [ ] 1.1 Crear `.markdownlint.json` en la raíz con `default: true`, MD013 (`line_length: 120`, `tables: false`), MD033 (`allowed_elements`), MD049/MD014/MD024/MD036/MD044/MD052 en `false` y `overrides` para `docs/changelog.md` — verificar: `npx markdownlint-cli --config .markdownlint.json "docs/**/*.md" "docs/changelog.md"` corre con esa config (sin "Configuration file not found") y `node -e "JSON.parse(require('fs').readFileSync('.markdownlint.json','utf8'))"` valida JSON.

## 2. Ignored files

- [ ] 2.1 Crear `.markdownlintignore` con `node_modules/`, `dist/`, `build/`, `coverage/`, `storybook-static/`, `package-lock.json`, `*.log`, `archive/` — verificar: `npx markdownlint-cli "node_modules/**"` / archivos de `coverage/` no aparecen en la salida (se omiten) mientras `docs/learning/*.md` sí se lintean.

## 3. Config vale + estilos

- [ ] 3.1 Crear `.vale.ini` (`StylesPath = .github/styles`, `MinAlertLevel = warning`, secciones `[*]`, `[*.{md,mdx}]`, `[docs/learning/*.md]`, `[docs/changelog.md]`, `[*.*.md]` con `BasedOnStyles = Vale, MiEstiloES`) — verificar: `vale --config .vale.ini --minAlertLevel=warning docs/learning/prettier-configuration.md` arranca y reporta sin error de config.
- [ ] 3.2 Crear `.github/styles/` con vocabulario (`config/vocabularies/Base/accept.txt` + `reject.txt` con términos técnicos del repo: workspaces, prisma, lint-staged, markdownlint…) y estilo `MiEstiloES/` — verificar: `vale ls-config` muestra `StylesPath` correcto y `vale` no marca términos de `accept.txt` como `Vale.Spelling`.

## 4. Doc de referencia (ES)

- [ ] 4.1 Actualizar `docs/learning/docs-changelog-validation.md` como referencia del change: sustituir las citas inexistentes `CHANGELOG.md` por `docs/changelog.md`, reflejar los scripts `docs:*` realmente creados, el job `docs-validation` real y las fases de adopción aplicadas — verificar: `grep -n "CHANGELOG.md" docs/learning/docs-changelog-validation.md` solo matchea menciones históricas/explicitas, y el doc cita `.markdownlint.json`, `.vale.ini`, `docs:check` y `docs-validation` coherentes con los archivos creados (`npm run docs:check` documentado == script real).

## 5. Scripts npm

- [ ] 5.1 Añadir a `package.json` los scripts `docs:lint` (`markdownlint --fix` sobre `docs/**/*.md` + `*.md` raíz), `docs:check` (igual sin `--fix`), `docs:vale` (`vale --minAlertLevel=warning --output=line --glob='*.{md,mdx}' .`), `docs:sync` y `docs:report` (HTML non-blocking `|| true`), más devDep `markdownlint-cli@0.49.1` — verificar: `npm run docs:check` y `npm run docs:vale` ejecutan sin "Missing script" y `npm ls markdownlint-cli` lo muestra instalado.

## 6. Shifting-left (lint-staged)

- [ ] 6.1 Reemplazar la entrada `*.{...,md}` de `lint-staged` manteniendo `prettier --write` y añadiendo `"*.{md,mdx}": ["prettier --write", "markdownlint --fix", "vale --minAlertLevel=warning --output=line"]` (JS sigue con `eslint --fix`) — verificar: tocar un `.md`, `git add` y `npx lint-staged` ejecuta las 3 etapas en orden y devuelve 0 con un doc limpio.

## 7. CI job docs-validation

- [ ] 7.1 Añadir job `docs-validation` en SUBSTAGE 2B de `.github/workflows/ci.yml` (`needs: repo-discovery`, `if: github.event_name == 'pull_request'`, checkout + `./.github/actions/setup-monorepo`, pasos `npm run docs:check` y `npm run docs:vale`, instalando binario de vale desde GitHub Releases si no hay npm pkg) — verificar: `actionlint .github/workflows/ci.yml` pasa y `grep -n "docs-validation" .github/workflows/ci.yml` muestra job definido.
- [ ] 7.2 Añadir `- docs-validation` al `needs` de `prebuild-quality-complete` (o `continue-on-error: true` si `npm run docs:check` aún no pasa limpio) — verificar: `grep -A 20 "prebuild-quality-complete:" .github/workflows/ci.yml` lista el job; `npx yaml -e ...`/actionlint sin errores y `ci-complete` sigue dependiendo del agregador.

## 8. Docs existentes

- [ ] 8.1 Actualizar `docs/CONTEXT-CICD.md` (§13.4 tabla de herramientas/jobs de calidad) y cualquier doc que referencie validación de docs para incluir `docs-validation`, scripts `docs:*` y los estados (pending → green) — verificar: `grep -rn "docs-validation" docs/CONTEXT-CICD.md` muestra la fila del job y `npm run docs:check` pasa sobre todo `docs/` (incluidos los docs actualizados).
