# commit-signing-release-migration Specification

## Purpose

Migra el workflow `release.yml` para que los commits de versión y el Release PR que genera changesets/action queden firmados y verificados en GitHub, sin romper el enforcement de commits firmados.

## Requirements

### Requirement: release.yml produce commits Verified sin firma en el runner (API mode)

El workflow `release.yml` SHALL producir el version commit y el Release PR de changesets como "Verified" en GitHub **sin configuración de firma en el runner**. `changesets/action@v2` opera por defecto en modo API (`push-with-git-cli: false`): crea el version commit y el Release PR vía REST API, y GitHub los auto-firma con su GPG key de web-flow (id `4AEE18F83AFDEB23`), que el ruleset `Pre-Merge Governance Gate` (`required_signatures`) acepta como `verification.verified=true`. El workflow SHALL autenticarse con un token con `contents: write` + `pull-requests: write` (el `GITHUB_TOKEN` por defecto, o un App token pasado explícitamente vía el input `github-token` — NUNCA únicamente vía la variable de entorno `GITHUB_TOKEN`, que el action v2 ya no soporta y rechaza si difiere del input). El workflow SHALL NOT volver a incluir configuración de firma SSH (`gpg.format`, `user.signingkey`, `commit.gpgsign`): es dead code en modo API y non-functional en git-cli mode (la clave privada de la App no se provisiona en `ssh-agent`).

**Historia:** reemplaza el requirement original (R8), que exigía una GitHub App con SSH signing key. R8 se marcó condicional a GATE 4.0; el spike probó `git push` con `GITHUB_TOKEN` (mecanismo que changesets no usa) y la corrección de mecanismo (2026-08-26, D4/D9 del change `ci-commit-signing`; 2026-09-21, D7 de `ci-release-workflow-signing`) determinó que el requisito de la App es innecesario. La App con su token vía `github-token` input queda como preferencia opcional (atribución de PRs), no como requisito.

#### Scenario: Version commit auto-firmado en modo API

- **WHEN** `changesets/action@v2` (`push-with-git-cli: false`, default) crea el version commit y el Release PR vía REST API con un token con `contents: write` + `pull-requests: write`
- **THEN** ambos quedan marcados como "Verified" en GitHub, firmados con la GPG key de web-flow
- **AND** pasan la regla `required_signatures` del ruleset sin ninguna configuración de firma en el runner

#### Scenario: Token personalizado bien cableado (opcional)

- **WHEN** se usa un App token (`APP_ID` + `APP_PRIVATE_KEY` vía `actions/create-github-app-token`) en lugar del `GITHUB_TOKEN` por defecto
- **THEN** el token SHALL pasarse al input `github-token` de `changesets/action`
- **AND** SHALL NOT configurarse únicamente como `env: GITHUB_TOKEN` (el action v2 lo rechaza cuando difiere del input)

#### Scenario: Guardarraíl contra firma SSH en release.yml

- **WHEN** un desarrollador añade configuración de firma SSH (`gpg.format`, `user.signingkey`, `commit.gpgsign`) a `release.yml`
- **THEN** la revisión de code review / governance la rechaza como dead code (no se ejecuta en modo API y es non-functional en git-cli mode)
- **AND** la referencia autoritativa es `openspec/changes/archive/2026-09-21-ci-release-workflow-signing/design.md` (D5–D7)
