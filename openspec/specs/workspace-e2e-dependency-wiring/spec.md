# workspace-e2e-dependency-wiring Specification

## Purpose
TBD - created by archiving change fix-workspaces-gaps. Update Purpose after archive.
## Requirements
### Requirement: Investigar imports de e2e hacia client/server
Antes de anadir dependencias `file:`, se SHALL investigar si el workspace `e2e` importa modulos de `client` o `server` directamente en su codigo fuente.

#### Scenario: Auditoria de imports en e2e
- **WHEN** se inspecciona el codigo fuente en `e2e/`
- **THEN** se MUST buscar cualquier `import` o `require` que referencia a `client-react` o `server-express`
- **AND** se MUST documentar los hallazgos en `docs/workspaces.md`

### Requirement: Anadir dependencia file: a client (condicional)
SI `e2e` importa directamente de `client-react`, se SHALL anadir la entrada `"client-react": "file:../client"` al `package.json` de `e2e` usando el protocolo `file:` (NO `workspace:*` — npm no soporta este ultimo).

#### Scenario: e2e importa de client
- **WHEN** la auditoria revela imports hacia `client-react` en el codigo fuente de `e2e`
- **THEN** se MUST anadir `"client-react": "file:../client"` a `apps/e2e/package.json` en `dependencies`
- **AND** se MUST ejecutar `npm install` desde la raiz para que npm linkee el workspace local

#### Scenario: e2e NO importa de client
- **WHEN** la auditoria no revela imports hacia `client-react`
- **THEN** se MUST omitir la dependencia `file:` y documentar la decision en `docs/workspaces.md` seccion 9

### Requirement: Anadir dependencia file: a server (condicional)
SI `e2e` importa directamente de `server-express`, se SHALL anadir la entrada correspondiente usando `file:` protocol.

#### Scenario: e2e importa de server
- **WHEN** la auditoria revela imports hacia `server-express` en el codigo fuente de `e2e`
- **THEN** se MUST anadir `"server-express": "file:../server"` a `apps/e2e/package.json` en `dependencies`
- **AND** se MUST ejecutar `npm install` desde la raiz

#### Scenario: e2e NO importa de server
- **WHEN** la auditoria no revela imports hacia `server-express`
- **THEN** se MUST omitir la dependencia `file:` y documentar la decision

### Requirement: Protocolo file: exclusivamente
Se SHALL usar el protocolo `file:` para dependencias entre workspaces. EL protocolo `workspace:*` esta PROHIBIDO porque npm no lo soporta (es exclusivo de pnpm y Yarn).

#### Scenario: Verificacion de ausencia de workspace:*
- **WHEN** se revisan los `package.json` despues de aplicar el change
- **THEN** no se MUST encontrar ninguna ocurrencia de `"workspace:*"` en ningun `package.json`

