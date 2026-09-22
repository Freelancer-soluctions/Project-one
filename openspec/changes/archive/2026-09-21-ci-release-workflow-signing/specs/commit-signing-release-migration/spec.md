## REMOVED Requirements

### Requirement: release.yml produce commits Verified vía GitHub App SSH

**Motivo de la eliminación (2026-09-21):** el requirement exigía una GitHub App con SSH signing key propia para firmar el version commit y el Release PR. Quedó invalidado por la corrección de mecanismo (D4/D9 de `ci-commit-signing`; D7 de `ci-release-workflow-signing`): `changesets/action@v2` usa REST API por defecto (`push-with-git-cli: false`) y GitHub auto-firma esos commits con su GPG key de web-flow, que el ruleset `required_signatures` acepta. El spike GATE 4.0 que motivó R8 probó `git push` — un mecanismo que changesets nunca invoca. La App con SSH signing key es innecesaria; el token de la App (opcional, vía input `github-token`) solo aporta atribución de PRs. Reemplazado por el requirement "release.yml produce commits Verified sin firma en el runner (API mode)".

## ADDED Requirements

### Requirement: release.yml produce commits Verified sin firma en el runner (API mode)

El workflow `release.yml` SHALL producir el version commit y el Release PR de changesets como "Verified" en GitHub **sin configuración de firma en el runner**. `changesets/action@v2` opera por defecto en modo API (`push-with-git-cli: false`): crea el version commit y el Release PR vía REST API, y GitHub los auto-firma con su GPG key de web-flow (id `4AEE18F83AFDEB23`), que el ruleset `Pre-Merge Governance Gate` (`required_signatures`) acepta como `verification.verified=true`. El workflow SHALL autenticarse con un token con `contents: write` + `pull-requests: write` (el `GITHUB_TOKEN` por defecto, o un App token pasado explícitamente vía el input `github-token` — NUNCA únicamente vía la variable de entorno `GITHUB_TOKEN`, que el action v2 ya no soporta y rechaza si difiere del input). El workflow SHALL NOT volver a incluir configuración de firma SSH (`gpg.format`, `user.signingkey`, `commit.gpgsign`): es dead code en modo API y non-functional en git-cli mode (la clave privada de la App no se provisiona en `ssh-agent`).

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
- **AND** la referencia autoritativa es `openspec/changes/ci-release-workflow-signing/design.md` (D5–D7)
