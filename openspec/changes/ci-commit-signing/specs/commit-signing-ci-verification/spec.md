## Purpose

Define el job CI `verify-signatures` que verifica mediante la GitHub REST API que todos los commits de un PR o merge_group tienen firma verificada, con allow-list de bots.

## ADDED Requirements

### Requirement: Job verify-signatures falla ante commits no verificados

El job `verify-signatures` SHALL ejecutarse en `pull_request` (cubre el rango base..head) y SHALL consultar la GitHub REST API `verification.verified` de cada commit. El job SHALL declarar `permissions: contents: read` y SHALL consultar exactamente los endpoints `GET /repos/{owner}/{repo}/pulls/{n}/commits` y `GET /repos/{owner}/{repo}/commits/{ref}` (campo `verification.verified`). Si algún commit del PR tiene `verification.verified = false`, el job SHALL fallar (exit 1). El job NUNCA SHALL usar `git log %G?` en el runner sin `allowedSignersFile` (produciría falsos negativos para firmas SSH).

#### Scenario: PR con commit no verificado

- **WHEN** se abre o actualiza un PR y algún commit del rango base..head tiene `verification.verified = false`
- **THEN** el job `verify-signatures` falla (exit 1)
- **AND** el PR queda bloqueado por el required status check

#### Scenario: PR con todos los commits verificados

- **WHEN** todos los commits del PR tienen `verification.verified = true`
- **THEN** el job `verify-signatures` pasa

#### Scenario: PR sin commits nuevos (0 commits humanos)

- **WHEN** un PR no introduce commits nuevos en el rango base..head (0 commits humanos a verificar)
- **THEN** el job `verify-signatures` pasa (skip) con una salida informativa indicando que no hay commits que verificar (m5)

### Requirement: Allow-list de bots verificados

El job SHALL aceptar commits de bots (ej. `dependabot[bot]`, `github-actions[bot]`) únicamente cuando su `verification.verified = true`. La allow-list NO SHALL auto-aceptar firmas no verificadas de bots.

#### Scenario: Commit de bot con verified=true

- **WHEN** un commit de `dependabot[bot]` o `github-actions[bot]` tiene `verification.verified = true`
- **THEN** el job lo acepta y no falla por ese commit

#### Scenario: Commit de bot con verified=false

- **WHEN** un commit de bot tiene `verification.verified = false`
- **THEN** el job falla (no se auto-allow-lista firmas no verificadas)

### Requirement: Verificación en merge_group (condicional a merge queue)

El job `verify-signatures` SHALL también incluir el trigger `merge_group` en su definición (future-proof). La verificación SHALL aplicarse con la misma lógica que en `pull_request` **ÚNICAMENTE WHEN la merge queue esté habilitada en el repositorio**; sin merge queue configurada el evento `merge_group` no se dispara y el trigger queda inerte (M4).

NOTA (R7 / endpoints): WHEN la merge queue esté habilitada, el job SHALL obtener los commits del merge group mediante el contexto del evento `merge_group` (`queue_path`/`merge_commit_sha` + comparación con la base) o el endpoint aplicable disponible entonces; los endpoints de PR listados (`GET /repos/{owner}/{repo}/pulls/{n}/commits` y `GET /repos/{owner}/{repo}/commits/{ref}`) aplican SOLO a eventos `pull_request`. Además, `verify-signatures` SHALL marcarse como required status check TAMBIÉN para `merge_group` al habilitar la queue.

#### Scenario: merge_group con commit no verificado (merge queue habilitada)

- **WHEN** la merge queue está habilitada, se dispara `merge_group` y algún commit tiene `verification.verified = false`
- **THEN** el job falla y el merge group es rechazado

#### Scenario: merge_group sin merge queue (trigger inerte)

- **WHEN** el repositorio NO tiene merge queue configurada
- **THEN** el evento `merge_group` no se dispara y el job no corre por esa vía (solo `pull_request` dispara hoy)
