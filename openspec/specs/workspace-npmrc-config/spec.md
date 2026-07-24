# workspace-npmrc-config Specification

## Purpose
TBD - created by archiving change fix-workspaces-gaps. Update Purpose after archive.
## Requirements
### Requirement: Crear archivo .npmrc en la raiz
El sistema SHALL crear un archivo `.npmrc` en la raiz del monorepo con configuracion sensata para npm workspaces.

#### Scenario: Archivo .npmrc creado en raiz
- **WHEN** se ejecuta el cambio fix-workspaces-gaps
- **THEN** MUST existir un archivo `.npmrc` en la raiz del monorepo

#### Scenario: Opcion save-exact habilitada
- **WHEN** se ejecuta `npm install <paquete>` en cualquier workspace
- **THEN** la version MUST guardarse en `package.json` sin prefijo `^` o `~` (version exacta)

#### Scenario: Opcion engine-strict habilitada
- **WHEN** se ejecuta `npm install` en una maquina con Node <20.0.0
- **THEN** npm MUST rechazar la instalacion con un error de engine

#### Scenario: Opcion fund deshabilitada
- **WHEN** se ejecuta `npm install`
- **THEN** npm NO MUST mostrar mensajes de `npm fund`

### Requirement: Configurar preferencias de hoisting
El archivo `.npmrc` SHALL incluir opciones que hagan el hoisting predecible y determinista.

#### Scenario: workspaces-update habilitado
- **WHEN** se anade o elimina un workspace de `package.json`
- **THEN** npm MUST actualizar automaticamente la configuracion de workspaces

#### Scenario: include-workspace-root habilitado
- **WHEN** se ejecuta `npm install` desde la raiz
- **THEN** npm MUST incluir la raiz como workspace para propositos de hoisting

