# release-workflow-compatibility Specification

## MODIFIED Requirements

### Requirement: changesets/action compatible con @changesets/cli y cableado según su contrato

El workflow `release.yml` SHALL usar una versión de `changesets/action` cuyo major soporte el major de `@changesets/cli` instalado en el monorepo (action v1.x ↔ CLI v2; action v2.x ↔ CLI v3), pinneada con tag exacto — no un major flotante, que ya causó una rotura silenciosa cuando el tag `@v2` movió a una línea incompatible con el CLI v2 instalado. El token de autenticación SHALL pasarse vía el input `github-token` del action (contrato común a v1.9.0+ y v2.x) y NUNCA únicamente vía la variable de entorno `GITHUB_TOKEN` (v2 la rechaza si difiere del input). El modo de commit SHALL ser API (`commitMode: github-api` en v1.x; `push-with-git-cli: false`, su default, en v2.x) para que GitHub auto-firme el version commit y el Release PR con su GPG key de web-flow. La configuración de changesets SHALL preservar el versionado de los workspaces privados del monorepo tras la migración a CLI v3 (`privatePackages: true`, porque CLI v3 dejó de versionar privados por default — #2186), y los scripts SHALL usar los nombres de comando vigentes en la major instalada (`changeset git-tag` desde CLI v3 — #2128).

#### Scenario: Pairing action-major ↔ CLI-major

- **WHEN** se actualiza `@changesets/cli` o `changesets/action` en el monorepo
- **THEN** el pin de `changesets/action` en `release.yml` se ajusta al major compatible con el CLI instalado (v1.x ↔ CLI v2; v2.x ↔ CLI v3)
- **AND** el comentario en `release.yml` documenta la regla de emparejamiento y el checklist de renombres de inputs para la próxima actualización
- **AND** la migración entre líneas se hace en un solo PR (CLI major + action pin + renombres juntos), nunca en pasos separados

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

#### Scenario: Versionado de workspaces privados preservado en CLI v3

- **WHEN** `changeset version` (CLI v3) procesa changesets pendientes
- **THEN** los workspaces privados del monorepo (`client-react`, `server-express`, `e2e`) se versionan igual que en CLI v2, porque `.changeset/config.json` declara `privatePackages: true`
- **AND** el script `release` usa el comando renombrado `changeset git-tag` (CLI v3 renombró `changeset tag`)

#### Scenario: Run no-op con exit 1 aceptado

- **WHEN** el Release workflow corre en un push a `main` que no tiene changesets pendientes (p. ej. el push del propio version commit) y `changeset version` (CLI v3) sale con código 1 por no-op (#1860)
- **THEN** el run se marca fallido de forma visible (fail-loud) y NO se enmascara con `|| true`
- **AND** esto es benigno por diseño: el run no tenía trabajo que hacer y el concurrency group serializa los releases

#### Scenario: Versiones de runtime soportadas por el CLI

- **WHEN** se actualiza `.nvmrc` o `engines.node` del root package.json
- **THEN** la versión de Node elegida satisface el engines de `@changesets/cli` instalado (CLI v3: `^22.11 || ^24 || >=26`, npm `>=10.9.0`)
- **AND** el root `engines.node` no declara un rango más laxo que el del CLI instalado
