# release-workflow-compatibility Specification

## Purpose

Mantiene el workflow `release.yml` operativo: la versión de `changesets/action` SHALL ser compatible con el major de `@changesets/cli` instalado, el token SHALL cablearse según el contrato del action, y el modo de commit SHALL ser API (auto-firma web-flow) para que los releases no se bloqueen y los commits queden "Verified".

## ADDED Requirements

### Requirement: changesets/action compatible con @changesets/cli y cableado según su contrato

El workflow `release.yml` SHALL usar una versión de `changesets/action` cuyo major soporte el major de `@changesets/cli` instalado en el monorepo (action v1.x ↔ CLI v2; action v2.x ↔ CLI v3), pinneada con tag exacto (p. ej. `changesets/action@v1.9.0`) — no un major flotante, que ya causó una rotura silenciosa cuando el tag `@v2` movió a una línea incompatible con el CLI v2 instalado. El token de autenticación SHALL pasarse vía el input `github-token` del action (contrato común a v1.9.0+ y v2.x) y NUNCA únicamente vía la variable de entorno `GITHUB_TOKEN` (v2 la rechaza si difiere del input). El modo de commit SHALL ser API (`commitMode: github-api` en v1.x; `push-with-git-cli: false`, su default, en v2.x) para que GitHub auto-firme el version commit y el Release PR con su GPG key de web-flow.

#### Scenario: Pairing action-major ↔ CLI-major

- **WHEN** se actualiza `@changesets/cli` o `changesets/action` en el monorepo
- **THEN** el pin de `changesets/action` en `release.yml` se ajusta al major compatible con el CLI instalado (v1.x ↔ CLI v2; v2.x ↔ CLI v3)
- **AND** el comentario en `release.yml` documenta la regla de emparejamiento y el checklist de renombres de inputs para la próxima actualización

#### Scenario: Token por input github-token

- **WHEN** `release.yml` usa un App token (`APP_ID` + `APP_PRIVATE_KEY` vía `actions/create-github-app-token`)
- **THEN** el token se pasa vía `with: github-token:` y el step no define `env: GITHUB_TOKEN`
- **AND** el wiring es válido tanto para action v1.x (input soportado, env como fallback legacy) como para v2.x (input requerido, env rechazado si difiere)

#### Scenario: Modo API con auto-firma web-flow

- **WHEN** `release.yml` ejecuta `changesets/action` en modo API
- **THEN** el version commit y el Release PR quedan "Verified" (GPG web-flow) y pasan `required_signatures`
- **AND** no se re-añade configuración de firma SSH en el runner (ver `commit-signing-release-migration`)

#### Scenario: Release run en verde

- **WHEN** se hace push a `main` con changesets pendientes y el workflow habilitado
- **THEN** el job `release` completa sin el error `Changesets CLI v2 is not supported` y sin el mismatch de `GITHUB_TOKEN`
