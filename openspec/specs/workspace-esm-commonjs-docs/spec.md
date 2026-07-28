# workspace-esm-commonjs-docs Specification

## Purpose
TBD - created by archiving change fix-workspaces-gaps. Update Purpose after archive.
## Requirements
### Requirement: Documentar decision ESM vs CommonJS
Se SHALL documentar la decision de usar `"type": "module"` en raiz, client y server (server confirmado en `apps/server/package.json:6`), y CommonJS solo en e2e.

#### Scenario: Seccion documentada en docs/workspaces.md
- **WHEN** se inspecciona `docs/workspaces.md`
- **THEN** MUST existir una seccion que explique:
  - Raiz: ESM (scripts de build/test usan `import`)
  - Client: ESM (Vite/React requieren ESM)
  - Server: ESM (`"type": "module"` declarado en `apps/server/package.json:6`)
  - E2E: CommonJS (Playwright config usa `require`)

#### Scenario: Estrategia de interop documentada
- **WHEN** se lee la documentacion de ESM/CJS
- **THEN** MUST incluir la estrategia de interoperabilidad entre ESM y CommonJS
- **AND** MUST mencionar que e2e puede importar modulos ESM via `import()` dinamico

