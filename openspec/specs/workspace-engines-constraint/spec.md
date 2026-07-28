# workspace-engines-constraint Specification

## Purpose
TBD - created by archiving change fix-workspaces-gaps. Update Purpose after archive.
## Requirements
### Requirement: Engines en package.json raiz
El `package.json` raiz SHALL declarar `engines.node` y `engines.npm` para acotar las versiones requeridas.

#### Scenario: Engines definidos en raiz
- **WHEN** se inspecciona `package.json` de la raiz
- **THEN** MUST existir el campo `engines` con `node >=20.0.0` y `npm >=10.0.0`

### Requirement: Engines en workspace client-react
El `package.json` de `apps/client/` SHALL declarar `engines.node` y `engines.npm`.

#### Scenario: Engines definidos en client
- **WHEN** se inspecciona `apps/client/package.json`
- **THEN** MUST existir el campo `engines` con `node >=20.0.0` y `npm >=10.0.0`

### Requirement: Engines en workspace server-express
El `package.json` de `apps/server/` SHALL declarar `engines.node` y `engines.npm`.

#### Scenario: Engines definidos en server
- **WHEN** se inspecciona `apps/server/package.json`
- **THEN** MUST existir el campo `engines` con `node >=20.0.0` y `npm >=10.0.0`

### Requirement: Engines en workspace e2e
El `package.json` de `e2e/` SHALL declarar `engines.node` y `engines.npm`.

#### Scenario: Engines definidos en e2e
- **WHEN** se inspecciona `e2e/package.json`
- **THEN** MUST existir el campo `engines` con `node >=20.0.0` y `npm >=10.0.0`

### Requirement: Engine-strict valida engines
Con `engine-strict=true` en `.npmrc`, npm SHALL validar los engines en cada instalacion.

#### Scenario: Instalacion rechazada con Node <20
- **WHEN** se ejecuta `npm install` con Node <20.0.0
- **THEN** npm MUST fallar con error `EBADENGINE` indicando que node no cumple el rango requerido

