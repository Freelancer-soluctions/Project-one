## Purpose

Establece que todo commit realizado por un desarrollador en el monorepo se firme automáticamente con una clave SSH ed25519 dedicada, y que el entorno local pueda verificar la firma vía allowed_signers.

## ADDED Requirements

### Requirement: Commits locales firmados automáticamente con SSH

El entorno local del desarrollador SHALL estar configurado para firmar commits automáticamente con una clave SSH ed25519 dedicada (`gpg.format = ssh`, `commit.gpgsign = true`, `user.signingkey` apuntando a la clave de firma — para SSH apunta a la clave PÚBLICA, ej. `~/.ssh/id_ed25519_projectERP.pub`, NO a la privada). Un commit firmado SHALL producir una firma válida verificable por Git y por GitHub.

#### Scenario: Commit firmado automáticamente con clave SSH configurada

- **WHEN** un desarrollador ejecuta `git commit` con `commit.gpgsign = true`, `gpg.format = ssh` y `user.signingkey` apuntando a la clave pública ed25519 dedicada
- **THEN** el commit se firma automáticamente con la clave SSH ed25519 indicada
- **AND** `git log --show-signature` reporta "Good git signature" para ese commit

#### Scenario: Commit sin firma configurada

- **WHEN** un desarrollador ejecuta `git commit` sin la configuración de firma (sin `commit.gpgsign` o sin `user.signingkey`)
- **THEN** el commit queda sin firmar (no hay hook Husky obligatorio de firma — D8)
- **AND** el commit no se marca como Verified en GitHub

### Requirement: Git debe poder verificar firmas SSH localmente vía allowed_signers

El entorno local SHALL configurar `gpg.ssh.allowedSignersFile` para que Git pueda verificar firmas SSH localmente (sin él, `git log --show-signature` no puede verificar y reporta error).

#### Scenario: Verificación local de firma SSH

- **WHEN** un dev ejecuta `git log --show-signature` en un commit firmado con su propia clave listada en `allowed_signers`
- **THEN** la salida contiene "Good git signature" (no "error: could not verify signature")
- **AND** el archivo de configuración contiene `gpg.ssh.allowedSignersFile` apuntando al archivo allowed_signers

#### Scenario: allowedSignersFile no configurado

- **WHEN** un dev intenta verificar una firma SSH sin `gpg.ssh.allowedSignersFile` configurado
- **THEN** `git log --show-signature` reporta error de verificación
- **AND** la verificación local falla hasta corregir el archivo
