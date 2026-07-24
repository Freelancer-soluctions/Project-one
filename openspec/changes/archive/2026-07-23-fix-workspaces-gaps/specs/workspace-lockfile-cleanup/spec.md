## ADDED Requirements

### Requirement: Detectar y eliminar lockfiles anidados
El sistema SHALL detectar cualquier `package-lock.json` que exista dentro de subdirectorios de workspaces (`apps/*/package-lock.json`, `e2e/package-lock.json`) y eliminarlos para restaurar el modelo single-lockfile.

#### Scenario: Deteccion de lockfile anidado en e2e
- **WHEN** se ejecuta la auditoria de lockfiles
- **THEN** el sistema MUST detectar `e2e/package-lock.json` como lockfile anidado

#### Scenario: Eliminacion de lockfile anidado
- **WHEN** se identifica un `package-lock.json` anidado en `e2e/`
- **THEN** el sistema MUST eliminarlo

#### Scenario: Reinstalacion desde la raiz
- **WHEN** se han eliminado todos los lockfiles anidados
- **THEN** se MUST ejecutar `npm install` desde la raiz para regenerar el lockfile unico

#### Scenario: Verificacion de lockfile unico
- **WHEN** se completa la instalacion desde la raiz
- **THEN** MUST existir solo un `package-lock.json` en la raiz del monorepo
- **AND** NO MUST haber `package-lock.json` en `apps/*/` ni en `e2e/`
