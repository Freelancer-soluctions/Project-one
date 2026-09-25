# Proposal

## Why

El repo tiene 40+ documentos Markdown en español (`docs/learning/`, `docs/*.md`) y `docs/changelog.md` (Keep-a-Changelog, 129 líneas), pero nada valida su estructura ni su prosa: no existe `.markdownlint.json`, `.vale.ini`, scripts `docs:*` en `package.json` ni job de CI de docs. `lint-staged` solo hace `prettier --write` sobre `*.md` (formato visual, no estructura/prosa) y el substage 2B de `ci.yml` no incluye ninguna validación documental — un `docs/changelog.md` con tabla rota o prosa inconsistente puede mergear sin que nadie lo detecte. La investigación ya está hecha y documentada en `docs/learning/docs-changelog-validation.md` (markdownlint-cli v0.49.1 + vale v3.22.0); falta implementarla.

## What Changes

- **CREAR** `.markdownlint.json` en la raíz: `default: true` + reglas MD001–MD062 afinadas (MD013 `line_length: 120`, `tables: false`; MD033 con `allowed_elements`; MD049/MD014/MD024/MD036/MD044/MD052 desactivados) + `overrides` específicos para `docs/changelog.md`.
- **CREAR** `.markdownlintignore` (compatible solo con `markdownlint-cli`, no `cli2`): `node_modules/`, `dist/`, `build/`, `coverage/`, `storybook-static/`, `package-lock.json`, `*.log`, `archive/`.
- **CREAR** `.vale.ini` (`StylesPath = .github/styles`, `MinAlertLevel`, secciones `[*]`, `[*.{md,mdx}]`, `[docs/learning/*.md]`, `[docs/changelog.md]`) y `.github/styles/` (vocabulario `accept.txt`/`reject.txt` + estilo `MiEstiloES` para prosa técnica en español).
- **CREAR/ACTUALIZAR** `docs/learning/docs-changelog-validation.md` (doc de referencia en español, ya existe con la investigación): marcarlo como referencia del change y actualizarlo a la config realmente implementada (paths correctos, scripts reales, estado del job CI).
- **EXTENDER** `package.json` con scripts `docs:lint`, `docs:check`, `docs:vale`, `docs:sync`, `docs:report` y devDep `markdownlint-cli` (vale se instala desde GitHub Releases, no desde npm — el paquete npm está huérfano).
- **EXTENDER** `lint-staged`: entrada `*.{md,mdx}` con `prettier --write` + `markdownlint --fix` + `vale --minAlertLevel=warning --output=line` (shift-left pre-commit).
- **EXTENDER** `.github/workflows/ci.yml` con job `docs-validation` dentro de SUBSTAGE 2B (tras `actionlint`), `needs: repo-discovery`, y añadirlo al `needs` del agregador `prebuild-quality-complete` — sin workflow suelto (lo prohíbe `zombie-workflow-guard`).
- **ACTUALIZAR** `docs/CONTEXT-CICD.md` (§13.4 tabla de jobs de calidad) y docs existentes que referencian la validación de docs.

## Capabilities

### New Capabilities

<!-- Ninguna: la validación de docs/CHANGELOG se agrega a la capacidad existente de corrección de configuración del tooling. -->

### Modified Capabilities

- `config-correctness`: se ADDED 4 requirements — (1) validación `markdownlint` de `docs/` + `docs/changelog.md` con config en un solo origen; (2) validación `vale` de prosa con `.vale.ini` y estilos en `.github/styles/`; (3) job `docs-validation` en el substage 2B de `ci.yml` agregado a `prebuild-quality-complete`; (4) doc profesional `docs/learning/docs-changelog-validation.md` en español que documenta la configuración implementada.

## Impact

- **Archivos nuevos**: `.markdownlint.json`, `.markdownlintignore`, `.vale.ini`, `.github/styles/config/vocabularies/Base/{accept,reject}.txt`, `.github/styles/MiEstiloES/*`.
- **Archivos modificados**: `package.json` (scripts `docs:*`, devDep `markdownlint-cli`, `lint-staged`), `.github/workflows/ci.yml` (job `docs-validation` + `needs` de `prebuild-quality-complete`), `docs/learning/docs-changelog-validation.md`, `docs/CONTEXT-CICD.md`.
- **Sin cambios de runtime**: apps/server, apps/client, APIs ni esquemas intactos.
- **Dependencias**: `markdownlint-cli@0.49.1` (devDep, npm); `vale` binario desde GitHub Releases v3.22.0 (no npm).
- **Riesgo de gate**: hasta que `docs/` y `docs/changelog.md` pasen limpios, el job nace como gate efectivo solo tras la limpieza previa — ver fases en design.md (D3).
