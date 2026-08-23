## Purpose

Agrega un job de CI que verifica, en cada pull request, que todos los commits del PR estén firmados y verificados por GitHub, cerrando el gap de ramas de feature no protegidas y PRs desde forks.

## ADDED Requirements

### Requirement: Verificación de firmas en todos los commits del PR

El pipeline CI SHALL ejecutar un job `commit-signature-verify` en cada `pull_request` hacia `main` que verifique, para cada commit en el rango `base...head`, que el campo de verificación de GitHub API (`commit.verification.verified`) sea `true`.

#### Scenario: PR con todos los commits firmados

- **WHEN** se abre o sincroniza un PR hacia `main` y todos sus commits tienen `verification.verified == true`
- **THEN** el job `commit-signature-verify` pasa
- **AND** el PR no es bloqueado por verificación de firmas

#### Scenario: PR con un commit sin firmar o no verificado

- **WHEN** se abre o sincroniza un PR hacia `main` con al menos un commit sin firma o con firma no verificada
- **THEN** el job `commit-signature-verify` falla
- **AND** en fase v3 (required check) el PR queda bloqueado para merge
- **AND** el job reporta el/los SHA(s) infractores con el motivo (`reason`) de GitHub

#### Scenario: PR con commits de bots

- **WHEN** el rango `base...head` incluye commits de Dependabot o `github-actions[bot]`
- **THEN** el job los acepta si GitHub los reporta como verificados
- **AND** no distingue entre firma SSH humana y firma automática de GitHub

#### Scenario: merge commit sin firma

- **WHEN** un dev hace merge local de main en su feature branch con firma SSH mal configurada
- **AND** abre un PR
- **THEN** el job CI detecta el merge commit como unverified
- **AND** el PR es bloqueado con "merge commit must be signed"

### Requirement: Rollout fail-open a fail-closed del job CI

El job `commit-signature-verify` SHALL soportar una fase v1 fail-open (no bloquea el PR, reporta hallazgos como aviso) y una fase v3 fail-closed (bloquea el PR), controlada por una variable de workflow o configuración de branch protection (required check).

#### Scenario: Fase v1 — job informativo

- **WHEN** el job corre en fase v1 con fail-open habilitado y encuentra commits sin verificar
- **THEN** el job reporta los hallazgos sin fallar la ejecución
- **AND** el PR no es bloqueado por este job

#### Scenario: Fase v3 — job requerido

- **WHEN** el job corre en fase v3 con fail-closed y encuentra commits sin verificar
- **THEN** el job falla
- **AND** el check se configura como required check en la branch protection de `main`
