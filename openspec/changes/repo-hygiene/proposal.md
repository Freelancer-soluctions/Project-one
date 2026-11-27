# Proposal

## Why

El directorio raíz del monorepo acumula ~40+ archivos de configuración de herramientas (eslint, prettier, vitest, stryker, knip, gitleaks, semgrep, checkov, hadolint, scancode, vale, yamllint, markdownlint, dependency-cruiser, commitlint, etc.) junto con carpetas de agentes/IDE (`.opencode/`, `.kiro/`, `.perch/`, `.freebuff/`, `.agents/`, `.github/`, `.husky/`, `.semgrep/`, `.changeset/`, `.vscode/`) y artefactos generados versionados por accidente (`docs/opencode/prompts/contracts/node_modules/` con 1.679 archivos, `--version/`, caches, reportes, `*.tsbuildinfo`). Esto genera "config hell" (nodejs/tooling#79) y dificulta la navegación para nuevos colaboradores. No cambia comportamiento del producto: es higiene de repositorio y tooling.

## What Changes

- Eliminar del control de versiones el artefacto realmente versionado por accidente: `docs/opencode/prompts/contracts/node_modules/` (~1.679 archivos). El resto de patrones (dist/, coverage/, _.log, _.tsbuildinfo, .cache/, test-results/, .vitest-reports/, reports/\*) ya están ignorados y con 0 archivos trackeados; verificar y añadir solo los ausentes. Ampliar `.gitignore` donde falte.
- Borrar del disco carpetas de estado local ya gitignored (`.kiro/`, `.perch/`, `.freebuff/`) tras confirmar no uso; decidir destino de `.agents/`.
- Consolidar `.semgrep/` en `.config/semgrep/` y actualizar invocaciones en CI.
- Mover configs que aceptan flag explícito a `.config/<herramienta>/`: `knip.jsonc`, `stryker.config.mjs`, `gitleaks`, `checkov`, `hadolint`, `markdownlint`, `yamllint`, `vale`, `commitlint`, `dependency-cruiser`.
- Consolidar configs duplicadas de Vitest (`vitest.shared.js`, `vitest.sequencer.js`, `vitest.scripts.config.js`) en `config/vitest/`.
- Aplicar file nesting en `.vscode/settings.json` para ocultar configs sin moverlos.
- Añadir scripts `clean`/`clean:all` y documentar.
- Borrar/mover archivos sueltos: `_edit_design.mjs`, `oldReadme.md`, `pending.txt`.
- Mantener en raíz las configs requeridas por la plataforma/herramienta: `.gitignore`, `.gitattributes`, `.editorconfig`, `.npmrc`, `.nvmrc`, `.tool-versions`, `tsconfig*.json`, `.env*`, `package.json`, `package-lock.json`, `.dockerignore`, `.github/`, `.husky/`, `.vscode/`, `.changeset/`.

## Capabilities

### New Capabilities

- (ninguna — cambio de tooling/higiene, sin comportamiento de producto)

### Modified Capabilities

- (ninguna)

## Impact

- Código afectado: raíz del repo, `.gitignore`, `.vscode/settings.json`, scripts en `package.json`, workflows en `.github/workflows/` (invocaciones de semgrep/gitleaks/etc.), `.husky/*`.
- Sin cambios en APIs, base de datos, ni comportamiento de la aplicación.
- Riesgo: bajo. Cada fase es un PR independiente y reversible; CI debe permanecer verde.

## Non-goals

- No migrar el backend (Express → Nest) ni cambiar dependencias de producto.
- No reorganizar `apps/*` ni mover código de aplicación.
- No introducir Turborepo/pnpm (se mantiene npm workspaces).
- No cambiar convenciones de commit/branching.

## Riesgos

- Mover configs puede romper resolución de herramientas si se olvida actualizar flags en scripts/CI/husky.
- Borrar carpetas de agentes puede afectar a colaboradores que las usen (verificar antes).
- Eliminar artefactos versionados reduce tamaño del repo pero requiere coordinación para no reintroducirlos.

## Dependencias

- `git rm --cached` + actualización de `.gitignore`.
- Confirmación del equipo sobre `.kiro/`, `.perch/`, `.freebuff/`, `.agents/`.
- Workflows de CI que invocan semgrep/gitleaks/knip/stryker.
