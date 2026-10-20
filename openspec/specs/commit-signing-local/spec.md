# commit-signing-local Specification

## Purpose

Establece que todo commit realizado por un desarrollador en el monorepo se firme automáticamente con una clave SSH ed25519 dedicada, y que el entorno local pueda verificar la firma vía allowed_signers.

## Requirements

### Requirement: Commits locales firmados automáticamente con SSH

El entorno local del desarrollador SHALL estar configurado para firmar commits automáticamente con una clave SSH ed25519 dedicada (`gpg.format = ssh`, `commit.gpgsign = true`, `user.signingkey` apuntando a la clave de firma — para SSH apunta a la clave PÚBLICA, ej. `~/.ssh/id_ed25519_projectERP.pub`, NO a la privada). Un commit firmado SHALL producir una firma válida verificable por Git y por GitHub (firma **SSH**, no GPG — con `gpg.ssh.allowedSignersFile` resoluble, `git verify-commit` devuelve `exit 0`; sin trust store resoluble devuelve **error duro `exit 1`**, no un estado "unverified": `Unable to open allowed keys file "..."` / `No principal matched`, medido 2026-10-18 con git 2.52.0.windows.1 + `ssh-keygen -Y` disponible en MSYS2).

#### Scenario: Commit firmado automáticamente con clave SSH configurada

- **WHEN** un desarrollador ejecuta `git commit` con `commit.gpgsign = true`, `gpg.format = ssh` y `user.signingkey` apuntando a la clave pública ed25519 dedicada
- **THEN** el commit se firma automáticamente con la clave SSH ed25519 indicada
- **AND** `git log --show-signature` reporta "Good git signature" para ese commit

#### Scenario: Commit sin firma configurada

- **WHEN** un desarrollador ejecuta `git commit` sin la configuración de firma (sin `commit.gpgsign` o sin `user.signingkey`)
- **THEN** el commit queda sin firmar — la **creación** del commit sigue sin hook obligatorio de firma (el gate de este change es **de push**, no de creación)
- **AND** el commit no se marca como Verified en GitHub
- **AND** si ese commit tiene `author.date` posterior o igual al cutoff `SIGNING_ROLLOUT_DATE` (`2026-08-01`), el gate local de `pre-push` **bloquea el push** con `%G? = N` (existe enforcement local de push; ver capability `local-commit-signature-gate`)
- **AND** si es anterior al cutoff, queda grandfathered (exento) y el push no se bloquea por él

### Requirement: Git debe poder verificar firmas SSH localmente vía allowed_signers

Git SHALL poder verificar firmas SSH localmente porque `gpg.ssh.allowedSignersFile` resuelve al fichero
**`allowed_signers` versionado en la raíz del repo** — dejando de depender de `~/.ssh/allowed_signers` por máquina
(configuración no versionada distinta en cada workstation). La ruta relativa SHALL resolverse contra el
**top-level del worktree** y no contra el directorio de trabajo corriente (verificado empíricamente 2026-10-18 con
git 2.52.0.windows.1: `gpg.ssh.allowedSignersFile=allowed_signers` resuelve y verifica correctamente también desde
un subdirectorio como `apps/server`), o el hook la SHALL pasar como absoluta derivada de
`git rev-parse --show-toplevel`. El fichero versionado SHALL usar el formato OpenSSH
`principals [options] keytype key` con `namespaces="git"` (el namespace con el que Git firma) y contener solo
claves públicas. Sin un trust store resoluble, `git verify-commit` SHALL fallar con **error duro `exit 1`** (no un
estado "unverified"): `Unable to open allowed keys file "..."` / `No principal matched` — de ahí que el gate
`local-commit-signature-gate` mande un **preflight no bloqueante**.

#### Scenario: Verificación local de firma SSH

- **WHEN** un dev ejecuta `git log --show-signature` en un commit firmado con su propia clave listada en el `allowed_signers` versionado en la raíz del repo
- **THEN** la salida contiene "Good git signature" (no "error: could not verify signature")
- **AND** `gpg.ssh.allowedSignersFile` apunta a ese fichero (ruta relativa `allowed_signers` resuelta contra el top-level del worktree, o absoluta derivada de `rev-parse --show-toplevel`)

#### Scenario: allowedSignersFile no configurado

- **WHEN** un dev intenta verificar una firma SSH sin `gpg.ssh.allowedSignersFile` configurado
- **THEN** `git log --show-signature` reporta error de verificación (`error: gpg.ssh.allowedSignersFile needs to be configured and exist for ssh signature verification`) y `git verify-commit` devuelve `exit 1`
- **AND** la verificación local falla hasta que resuelva el trust store versionado (el preflight del gate advierte y no bloquea en este estado)

#### Scenario: Trust store versionado funciona en un clon fresco

- **WHEN** un desarrollador clona el repo en una máquina nueva sin ninguna config global de firma
- **THEN** `allowed_signers` ya está presente en la raíz del worktree por estar versionado
- **AND** la verificación local y el gate de `pre-push` clasifican `%G?` sin requerir `~/.ssh/allowed_signers` de la máquina
