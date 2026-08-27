# commit-signing-key-lifecycle Specification

## Purpose

Define el runbook de rotación y revocación de claves de firma (clave SSH ed25519 del dev y claves de la GitHub App) para mantener la cadena de suministro de commits firmados a lo largo del tiempo.

## Requirements

### Requirement: Runbook de rotación de clave del desarrollador

El repositorio SHALL documentar en `docs/commit-signing.md` un runbook de rotación/revocación de la clave SSH ed25519 del desarrollador que incluya: (1) generar una nueva clave ed25519 dedicada, (2) añadir su `.pub` como Signing Key **adicional** en GitHub (solapamiento), (3) actualizar `user.signingkey` y `allowed_signers` localmente, (4) mantener la clave vieja activa hasta que cero commits recientes queden sin verificar, y (5) revocar la clave vieja una vez completado el solapamiento.

#### Scenario: Rotación con solapamiento

- **WHEN** el dev genera una nueva clave ed25519 y la añade como Signing Key adicional sin revocar la anterior
- **THEN** los commits firmados con cualquiera de las dos claves se marcan "Verified" durante el periodo de solapamiento
- **AND** tras confirmar cero commits recientes sin verificar con la nueva clave, la clave vieja se revoca

#### Scenario: Revocación de clave comprometida

- **WHEN** una clave del dev se considera comprometida y se revoca en GitHub
- **THEN** los commits futuros firmados con esa clave ya no se marcan "Verified"
- **AND** el runbook indica regenerar clave y actualizar `user.signingkey` + `allowed_signers`

### Requirement: Rotación de claves de la GitHub App

El repositorio SHALL documentar el procedimiento de rotación para las claves de la GitHub App (`APP_PRIVATE_KEY` y `APP_SSH_KEY`/`APP_SSH_PUB`): regenerar el par de claves de la App, actualizar los secrets correspondientes y la Signing Key registrada, sin interrumpir los releases.

#### Scenario: Rotación de APP_SSH_KEY de la App

- **WHEN** se rota `APP_SSH_KEY`/`APP_SSH_PUB` de la App
- **THEN** se registra la nueva `.pub` como Signing Key de la App y se actualizan los secrets `APP_SSH_KEY`/`APP_SSH_PUB`
- **AND** los version commits de release siguen marcándose "Verified"

#### Scenario: Rotación de APP_PRIVATE_KEY de la App

- **WHEN** se rota `APP_PRIVATE_KEY` (PEM de autenticación JWT)
- **THEN** se actualiza el secret `APP_PRIVATE_KEY` y `actions/create-github-app-token` sigue generando token válido
