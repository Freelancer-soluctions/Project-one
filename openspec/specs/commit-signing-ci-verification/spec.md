# commit-signing-ci-verification Specification

## Purpose

Define el job CI `verify-signatures` que verifica mediante la GitHub REST API que SOLO los commits introducidos por un PR (rango base..head obtenido vía compare endpoint `base.sha...head.sha`) tienen firma verificada, con allow-list de bots. La historia previa al PR queda EXPLÍCITAMENTE excluida: el ruleset server-side `Require signed commits` ya cubre la enforcement de lo nuevo; el job es defense-in-depth sobre los commits nuevos del PR.

## Requirements

### Requirement: Job verify-signatures falla ante commits no verificados

El job `verify-signatures` SHALL ejecutarse en `pull_request` y SHALL verificar EXCLUSIVAMENTE los commits introducidos por el PR, obtenidos vía el compare endpoint `GET /repos/{owner}/{repo}/compare/{base.sha}...{head.sha}` (rango base..head). El job NUNCA SHALL verificar la historia previa al PR (commits que ya existían en `base` antes de la apertura del PR). El job SHALL consultar `verification.verified` de cada commit nuevo. El job SHALL declarar `permissions: contents: read` y SHALL consultar exactamente los endpoints `GET /repos/{owner}/{repo}/pulls/{n}/commits` y `GET /repos/{owner}/{repo}/commits/{ref}` (campo `verification.verified`). Si algún commit NUEVO del PR tiene `verification.verified = false`, el job SHALL fallar (exit 1). El job NUNCA SHALL usar `git log %G?` en el runner sin `allowedSignersFile` (produciría falsos negativos para firmas SSH).

NOTA (scoping post-staging 2026-08-22): en staging (run 32559337513, PR #93) el job verificó ~176 commits del PR, de los cuales ~175 eran históricos de julio SIN firmar (previos al registro de la signing key 2026-08-21T19:49). El scoping correcto vía compare `base.sha...head.sha` excluye esa historia previa; el job evalúa SOLO los commits nuevos del PR.

#### Scenario: PR con commit nuevo no verificado

- **WHEN** se abre o actualiza un PR y algún commit NUEVO del rango base..head (obtenido vía compare `base.sha...head.sha`) tiene `verification.verified = false`
- **THEN** el job `verify-signatures` falla (exit 1)
- **AND** el PR queda bloqueado por el required status check

#### Scenario: PR con todos los commits nuevos verificados

- **WHEN** todos los commits NUEVOS del PR (rango base..head) tienen `verification.verified = true`
- **THEN** el job `verify-signatures` pasa

#### Scenario: PR sin commits nuevos (0 commits humanos)

- **WHEN** un PR no introduce commits nuevos en el rango base..head (0 commits humanos a verificar)
- **THEN** el job `verify-signatures` pasa (skip) con una salida informativa indicando que no hay commits que verificar (m5)

#### Scenario: Anti-stale — confirmación individual antes de fallar

- **WHEN** el endpoint bulk `GET /repos/{owner}/{repo}/pulls/{n}/commits` reporta `verification.verified = false` (o `verification`/`reason` nulo) para un commit recién pusheado
- **AND** una consulta individual `GET /repos/{owner}/{repo}/commits/{sha}` ya reporta `verification.verified = true` con `reason: "valid"`
- **THEN** el job SHALL reintentar la consulta individual hasta un límite razonable (p.ej. 5 reintentos por run) antes de clasificar el commit como fallido
- **AND** si tras los reintentos la consulta individual confirma `verified = true`, el commit se acepta (no se marca como failed por stale del bulk)

### Requirement: Allow-list de bots verificados

El job SHALL aceptar commits de bots (ej. `dependabot[bot]`, `github-actions[bot]`) únicamente cuando su `verification.verified = true`. La allow-list NO SHALL auto-aceptar firmas no verificadas de bots. El job SHALL tolerar que commits sin firma retornen `verification: null` / `reason: null` (no siempre el string `"unsigned"`); los filtros SHALL tratar `null` como "no verificado" sin romper el parseo.

#### Scenario: Commit de bot con verified=true

- **WHEN** un commit de `dependabot[bot]` o `github-actions[bot]` tiene `verification.verified = true`
- **THEN** el job lo acepta y no falla por ese commit

#### Scenario: Commit de bot con verified=false

- **WHEN** un commit de bot tiene `verification.verified = false`
- **THEN** el job falla (no se auto-allow-lista firmas no verificadas)

#### Scenario: Commit sin firma retorna verification null

- **WHEN** un commit (humano o bot) no tiene firma y la API retorna `verification: null` / `reason: null`
- **THEN** el job lo trata como no verificado (filtro tolerante a nulls) y falla si es un commit nuevo del PR

### Requirement: Verificación en merge_group (condicional a merge queue)

El job `verify-signatures` SHALL también incluir el trigger `merge_group` en su definición (future-proof). La verificación SHALL aplicarse con la misma lógica que en `pull_request` **ÚNICAMENTE WHEN la merge queue esté habilitada en el repositorio**; sin merge queue configurada el evento `merge_group` no se dispara y el trigger queda inerte (M4). El scoping base..head y la tolerancia a nulls/anti-stale descritos arriba aplican también a `merge_group` cuando esté habilitado.

NOTA (R7 / endpoints): WHEN la merge queue esté habilitada, el job SHALL obtener los commits del merge group mediante el contexto del evento `merge_group` (`queue_path`/`merge_commit_sha` + comparación con la base) o el endpoint aplicable disponible entonces; los endpoints de PR listados (`GET /repos/{owner}/{repo}/pulls/{n}/commits` y `GET /repos/{owner}/{repo}/commits/{ref}`) aplican SOLO a eventos `pull_request`. Además, `verify-signatures` SHALL marcarse como required status check TAMBIÉN para `merge_group` al habilitar la queue.

#### Scenario: merge_group con commit no verificado (merge queue habilitada)

- **WHEN** la merge queue está habilitada, se dispara `merge_group` y algún commit tiene `verification.verified = false`
- **THEN** el job falla y el merge group es rechazado

#### Scenario: merge_group sin merge queue (trigger inerte)

- **WHEN** el repositorio NO tiene merge queue configurada
- **THEN** el evento `merge_group` no se dispara y el job no corre por esa vía (solo `pull_request` dispara hoy)
