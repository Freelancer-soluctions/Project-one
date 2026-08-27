# commit-signing-github-config Specification

## Purpose

Establece el registro de la clave SSH pública del desarrollador como Signing Key en GitHub y la activación de vigilant mode para marcar commits no verificados.

## Requirements

### Requirement: Clave pública registrada como Signing Key en GitHub

El desarrollador SHALL registrar su clave SSH pública dedicada (`id_ed25519_projectERP.pub`) en GitHub como tipo `Signing Key` (vía `gh ssh-key add --type signing` o la UI de Settings → SSH and GPG keys). La clave registrada SHALL ser la misma que `user.signingkey` en git local.

#### Scenario: Registro de signing key

- **WHEN** el desarrollador sube `~/.ssh/id_ed25519_projectERP.pub` con `gh ssh-key add --type signing` (o equivalente en UI)
- **THEN** la clave aparece en GitHub como Signing Key
- **AND** los commits firmados con esa clave privada se marcan como "Verified" en GitHub

#### Scenario: Clave no registrada como signing key

- **WHEN** un commit está firmado con una clave que NO está registrada como Signing Key en GitHub
- **THEN** GitHub NO lo marca como Verified

### Requirement: Vigilant mode activado

GitHub SHALL tener activado el modo vigilante (vigilant mode) a nivel de cuenta/organización para que los commits sin firma verificable se marquen explícitamente como "Unverified" en lugar de omitir el badge.

#### Scenario: Commits legacy sin firma bajo vigilant mode

- **WHEN** vigilant mode está ON y se visualiza un commit legacy sin firma
- **THEN** GitHub lo marca como "Unverified" (no se muestra como Verified por omisión)

#### Scenario: Commits firmados bajo vigilant mode

- **WHEN** vigilant mode está ON y se visualiza un commit firmado y verificado
- **THEN** GitHub lo marca como "Verified"
