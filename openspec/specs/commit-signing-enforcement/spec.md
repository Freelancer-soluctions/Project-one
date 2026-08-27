# commit-signing-enforcement Specification

## Purpose

Define el ruleset de GitHub en `main` que exige commits firmados y rechaza pushes sin firma con un mensaje de error claro, con bypass de Admin para emergencias.

## Requirements

### Requirement: Ruleset en main exige commits firmados

GitHub SHALL tener un ruleset `Require signed commits` que apunte SOLO a la rama `main` (las ramas `feature/*` NO tienen protección remota de firma). El ruleset SHALL aceptar únicamente pushes cuyos commits estén firmados y verificados. El ruleset SHALL incluir un bypass de rol Admin para emergencias.

#### Scenario: Push firmado a main

- **WHEN** se hace push de commits firmados y verificados a `main`
- **THEN** el push es aceptado por el ruleset

#### Scenario: Push sin firma a main

- **WHEN** se hace push de un commit sin firma a `main`
- **THEN** el ruleset rechaza el push

#### Scenario: Bypass de Admin en emergencia

- **WHEN** un usuario con rol Admin invoca el bypass del ruleset en una emergencia
- **THEN** el push se permite excepcionalmente sin firma

### Requirement: Error claro en push rechazado

Cuando el ruleset rechaza un push por falta de firma, GitHub SHALL devolver un mensaje de error claro al cliente git indicando que se requiere firma.

#### Scenario: Mensaje de rechazo por falta de firma

- **WHEN** el ruleset rechaza un push sin firma a `main`
- **THEN** el cliente git recibe un error claro (ej. `! [remote rejected] main -> main (push declined)`) que indica que se requiere firma de commit
