## Purpose

Establece que todo commit realizado por un desarrollador en el monorepo se firme criptográficamente con una clave SSH ed25519 dedicada, y que el entorno local verifique y advierta cuando la firma no esté configurada.

## ADDED Requirements

### Requirement: Commits locales firmados con SSH

El entorno local del desarrollador SHALL estar configurado para firmar commits con una clave SSH ed25519 dedicada (`gpg.format = ssh`, `commit.gpgsign = true`, `user.signingkey` apuntando a la clave de firma — para SSH apunta a la clave PÚBLICA, ej. `~/.ssh/signing_key.pub`, NO a la privada). Un commit firmado SHALL producir una firma válida verificable por Git y por GitHub.

#### Scenario: Commit firmado con clave SSH configurada

- **WHEN** un desarrollador ejecuta `git commit` con `commit.gpgsign = true` y `gpg.format = ssh` configurados
- **THEN** el commit se firma con la clave SSH ed25519 indicada en `user.signingkey`
- **AND** `git log --show-signature` reporta "Good signature" para ese commit

#### Scenario: Commit sin firma configurada

- **WHEN** un desarrollador ejecuta `git commit` sin firma configurada (sin `commit.gpgsign` o sin clave en `user.signingkey`)
- **THEN** el hook `pre-commit` emite una advertencia no bloqueante indicando que el commit quedará sin firmar
- **AND** la advertencia apunta a `docs/commit-signing-setup.md` con los pasos de corrección

### Requirement: git debe poder verificar firmas SSH localmente

El entorno local SHALL configurar `gpg.ssh.allowedSignersFile` para que Git pueda verificar firmas SSH localmente (sin él, `git log --show-signature` no puede verificar y reporta "error: could not verify signature").

#### Scenario: Verificación local de firma SSH

- **WHEN** un dev ejecuta `git log --show-signature` en un commit firmado con su propia clave
- **THEN** la salida contiene "Good signature" (no "error: could not verify signature")
- **AND** el archivo `~/.gitconfig` contiene `gpg.ssh.allowedSignersFile = ~/.ssh/allowed_signers`

#### Scenario: allowedSignersFile no configurado

- **WHEN** un dev intenta verificar una firma SSH sin `gpg.ssh.allowedSignersFile` configurado
- **THEN** el script `verify-signing-setup.sh` detecta la ausencia y reporta "FAIL: gpg.ssh.allowedSignersFile not configured"

### Requirement: Verificación del estado de firma del entorno

El proyecto SHALL proveer un script `scripts/setup/verify-signing-setup.sh` que verifique el estado de la configuración de firma local (clave presente, `gpg.format = ssh`, `commit.gpgsign = true`, clave cargada en GitHub) y reporte cada chequeo de forma legible.

#### Scenario: Entorno correctamente configurado

- **WHEN** un desarrollador ejecuta `scripts/setup/verify-signing-setup.sh` con el entorno de firma configurado correctamente
- **THEN** el script reporta todos los chequeos en verde y termina con exit code 0

#### Scenario: Entorno con firma ausente o incompleta

- **WHEN** un desarrollador ejecuta `scripts/setup/verify-signing-setup.sh` y falta la clave, la configuración de git, o la clave no está en GitHub
- **THEN** el script reporta cada chequeo fallido en rojo con instrucción de corrección
- **AND** termina con exit code distinto de 0

### Requirement: Advertencia de firma en pre-commit

El hook `.husky/pre-commit` SHALL incluir en v1 una verificación de firma que advierta (sin bloquear) cuando el commit en curso no esté configurado para firmarse.

#### Scenario: Commit sin firma en v1 (advisory)

- **WHEN** el hook `pre-commit` detecta que la firma no está configurada en el entorno
- **THEN** el hook muestra un warning con el enlace a la guía de setup
- **AND** el commit continúa (no se bloquea) en la fase v1

#### Scenario: Commit con firma en v1

- **WHEN** el hook `pre-commit` detecta firma configurada correctamente
- **THEN** el hook no emite warning y el flujo normal de pre-commit continúa sin cambios
