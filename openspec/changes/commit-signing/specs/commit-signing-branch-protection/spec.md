## Purpose

Establece la protección de rama `main` de GitHub para rechazar pushes cuyos commits no estén firmados y verificados, de forma gradual a partir de una fase v2 del rollout.

## ADDED Requirements

### Requirement: Pushes a main exigen commits firmados

La regla de branch protection de `main` SHALL tener habilitado `require signed commits` (equivalente REST: sub-endpoint dedicado `required_signatures` de `/branches/{branch}/protection` — NO es un campo del body de PUT; se habilita con POST al sub-endpoint). Un push a `main` con commits sin firma válida SHALL ser rechazado por GitHub en la fase v2.

#### Scenario: Push con commits firmados válidos a main

- **WHEN** un desarrollador hace push a `main` con commits firmados con SSH y verificados por GitHub
- **THEN** GitHub acepta el push
- **AND** los commits muestran el badge "Verified" en la UI

#### Scenario: Push con commit sin firmar a main (fase v2)

- **WHEN** un desarrollador hace push a `main` en la fase v2 e incluye un commit sin firma o con firma inválida
- **THEN** GitHub rechaza el push con error de firma obligatoria
- **AND** el commit no ingresa a `main`

#### Scenario: Pushes no directos preservados

- **WHEN** la regla de protección de `main` se configura
- **THEN** se preservan las reglas existentes (PR obligatorio, sin push directo, sin force-push)
- **AND** la configuración aplica a administradores según la política definida

### Requirement: Baseline de historial documental/auditable

El proyecto SHALL establecer un baseline (tag firmado) que marque el punto a partir del cual se exige firma; los commits anteriores al baseline NO quedan exentos de la verificación de GitHub — el baseline es SOLO documental/auditable (branch protection no conoce el baseline) y no se reescribe el historial.

#### Scenario: Baseline tag creado y documentado

- **WHEN** se implementa la política de firmas
- **THEN** se crea un tag firmado de baseline (ej. `v1.0.0-commit-signing-baseline`) en el commit actual de `main`
- **AND** la política de historial anterior al baseline queda documentada en `docs/commit-signing-setup.md` como documental/auditable solamente

#### Scenario: Historial previo no modificado

- **WHEN** se activa la política de firmas
- **THEN** los commits anteriores al baseline permanecen intactos (sin `git filter-repo` ni reescritura)
- **AND** no se exige firma retroactiva a commits históricos

#### Scenario: push a main con commits pre-baseline sin firmar

- **WHEN** un dev intenta push a main con commits creados antes del baseline tag (no firmados)
- **THEN** GitHub branch protection rechaza el push con "commits must be signed"
- **AND** el baseline tag NO tiene efecto en la verificación de firma (es solo documental/auditable)
- **AND** el mensaje de error indica: "Los commits pre-baseline necesitan ser re-firmados. Ver docs/commit-signing-setup.md#migración-de-historial"

### Requirement: Rollback de enforcement documentado

El proyecto SHALL documentar en la guía de setup el procedimiento para deshabilitar temporal o permanentemente el enforcement (quitar `required_signatures` de la regla de `main` y/o desmarcar el job CI como required check) si el enforcement bloquea producción.

#### Scenario: Rollback de branch protection

- **WHEN** el enforcement bloquea un deploy o un fix urgente en `main`
- **THEN** un maintainer puede deshabilitar `require signed commits` siguiendo el procedimiento documentado
- **AND** el procedimiento indica cómo re-habilitar tras resolver el bloqueo
