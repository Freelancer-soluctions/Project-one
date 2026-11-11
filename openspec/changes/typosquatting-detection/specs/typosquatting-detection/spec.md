# typosquatting-detection Specification (delta)

## MODIFIED Requirements

### Requirement: Job PR-time `typosquat-guarddog` advisory (L2, FASE 1)

El workflow `ci.yml` SHALL ejecutar en cada `pull_request` un job `typosquat-guarddog` que verifique `package.json` con `uvx guarddog==3.2.0 npm verify ... --output-format sarif`, con `needs: repo-discovery`, sin `continue-on-error` (blocking desde día uno), `permissions` de job `contents: read` + `security-events: write`, subida SARIF con `category: guarddog` (única) y artifact de evidencia de 14 días. El job SHALL formar parte del `needs` del agregador `prebuild-security-complete`.

El job SHALL estar condicionado a cambios en manifiestos o lockfiles: `if: github.event_name == 'pull_request' && needs.repo-discovery.outputs.manifests == 'true'`. El output `manifests` SHALL ser publicado por `repo-discovery`.

#### Scenario: Ejecución advisory en PR (R2-L2)

- **WHEN** corre `ci.yml` en un `pull_request` (FASE 1, antes del cambio)
- **THEN** el job era advisory (`continue-on-error: true`) y no bloqueaba el merge
- **NOTE:** Superseded — el control es blocking desde día uno.

#### Scenario: Sin bloqueo en FASE 1

- **WHEN** se inspeccionaba el bloque `needs` de `prebuild-security-complete` antes de este change
- **THEN** `typosquat-guarddog` no aparecía en ese `needs`
- **NOTE:** Superseded — el job está en `needs` desde día uno.

#### Scenario: Ejecución en PR con cambios en manifiestos

- **WHEN** corre `ci.yml` en un `pull_request` con cambios en manifiestos o lockfiles
- **THEN** existe el job `typosquat-guarddog` con `needs: repo-discovery`, condicionado a `needs.repo-discovery.outputs.manifests == 'true'`, en paralelo a `dependency-review`, `lockfile-audit` y `checkov-iac`
- **AND** instala `uv` con `astral-sh/setup-uv` **SHA-pinned** y ejecuta `uvx guarddog==3.2.0` (versión pinneada)
- **AND** genera `guarddog.sarif` y lo sube vía `github/codeql-action/upload-sarif@v4` con `category: guarddog`
- **AND** publica el artifact `guarddog-report-pr` con `retention-days: 14`
- **AND** el job bloquea el merge si GuardDog detecta un paquete sospechoso (`exit non-zero`, sin `continue-on-error`)

#### Scenario: Sin bloqueo cuando no hay cambios en manifiestos

- **WHEN** se inspecciona el bloque `needs` de `prebuild-security-complete`
- **THEN** `typosquat-guarddog` está en ese `needs` (blocking desde día uno)
- **AND** los jobs `dependency-review`, `secrets` y `scancode-license-pr-diff` permanecen intactos
- **AND** si no hay cambios en manifiestos, el job se salta y el skip está autorizado por path (no falla el agregador)

#### Scenario: Job id estable

- **WHEN** el job se promueve a blocking
- **THEN** el job id `typosquat-guarddog` permanece estable (solo el display `name:` cambia)
- **AND** todos los `needs` y scenarios referencian el id, no el nombre

## ADDED Requirements

### Requirement: Evaluación de Socket como alternativa

El equipo SHALL evaluar Socket (comercial) como alternativa a GuardDog si la tasa de falsos positivos de GuardDog es inaceptable. La evaluación SHALL comparar: tasa de falsos positivos, cobertura de señales (70+ en Socket vs metadata+YARA en GuardDog), costo, y compatibilidad con el flujo de CI existente. La decisión SHALL documentarse.

#### Scenario: Socket evaluado

- **WHEN** la tasa de falsos positivos de GuardDog es inaceptable en producción
- **THEN** se documenta la comparación Socket vs GuardDog
- **AND** se decide si mantener GuardDog (con exclusiones) o migrar a Socket
- **AND** la decisión se registra en `docs/learning/quality-gates.md`

#### Scenario: GuardDog mantenido sin Socket

- **WHEN** la tasa de falsos positivos de GuardDog es aceptable
- **THEN** se mantiene GuardDog como herramienta de typosquatting
- **AND** la decisión se registra en `docs/learning/quality-gates.md`
