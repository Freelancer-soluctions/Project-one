# iac-scanning

## Purpose

Evolución de la capa de escaneo IaC (Policy as Code con Checkov): la implementación base (jobs `checkov-iac`/`checkov-iac-weekly`, política `.checkov.yml`, pre-commit advisory, ajuste dependabot) está especificada y verificada en la capability `sca-lockfile-compliance` (archivada 2026-09-27, requirement "Capa IaC (Checkov)"). Esta capability posee el **camino de madurez**: baseline `fail-on-new`, transición advisory → blocking (FASE 2) con rollback seguro, y la política de tooling IaC (tfsec deprecated, KICS condicional).

## ADDED Requirements

### Requirement: Baseline `fail-on-new`

El repo SHALL mantener un baseline de hallazgos conocidos (`.checkov.baseline`, creado con `checkov --create-baseline` tras el primer run advisory estable en `main`) de modo que la fase bloqueante solo falle por hallazgos nuevos, sin re-abrir la deuda histórica.

#### Scenario: Creación del baseline

- **WHEN** el primer run real de `checkov-iac` en `main` queda estable y el ruido está clasificado en `skip-check` de `.checkov.yml`
- **THEN** se genera `.checkov.baseline` con `checkov --create-baseline` y se versiona en la raíz
- **AND** el archivo documenta la fecha y el número de hallazgos absorbidos

#### Scenario: Hallazgo nuevo en PR con baseline activo

- **WHEN** un PR introduce una misconfiguración no presente en el baseline
- **THEN** el gate (FASE 2) la reporta como fallo nuevo y bloquea
- **AND** los hallazgos ya registrados en el baseline no bloquean el PR

### Requirement: Transición FASE 1 advisory → FASE 2 bloqueante

La capa IaC SHALL evolucionar de advisory a blocking solo tras un período de observación, activando `checkov-iac` en el `needs` del agregador `prebuild-security-complete` de `ci.yml` y el modo `fail-on-new`; el rollback SHALL ser posible re-añadiendo `soft_fail: true` y quitando la línea del `needs` (un solo revert).

#### Scenario: Precondiciones de activación

- **WHEN** han pasado 2-4 semanas de runs sin falsos positivos, `.checkov.baseline` está versionado en `main` y el ruido está en `skip-check`
- **THEN** se retira `soft_fail: true` del job `checkov-iac`, se añade al `needs` del agregador `prebuild-security-complete` (anclado por nombre de job) y se activa `--baseline .checkov.baseline`
- **AND** `checkov-iac-weekly` permanece advisory (auditoría 90d sin ruta blocking)

#### Scenario: Rollback en un revert

- **WHEN** la FASE 2 produce falsos positivos que fatigan al equipo
- **THEN** un solo commit re-añade `soft_fail: true` y quita la línea del `needs` del agregador
- **AND** ningún estado intermedio rompe el agregador (ya interpreta `needs.*.result` con `always()`)

### Requirement: Política de tooling IaC — tfsec deprecated y KICS condicional

El repo SHALL cubrir Terraform con Checkov (y `trivy config` como alternativa) y NO SHALL añadir `tfsec` (repo archivado, absorbido por Trivy); KICS SHALL evaluarse solo como capa secundaria si el repo incorpora despliegues propios de Kubernetes o Pulumi.

#### Scenario: tfsec fuera de alcance

- **WHEN** se revisa la tooling IaC del repo
- **THEN** no existe job, action ni script `tfsec` en ningún workflow
- **AND** la documentación indica que, si se necesita análisis HCL alternativo, se usa `trivy config` o Checkov, nunca `tfsec`

#### Scenario: KICS condicional

- **WHEN** el repo incorpora despliegues propios de Kubernetes o Pulumi
- **THEN** se evalúa añadir `kics` como capa secundaria (SARIF nativo) sin duplicar las reglas ya cubiertas por Checkov `framework: kubernetes`
- **AND** mientras tanto no hay job `kics` en el pipeline
