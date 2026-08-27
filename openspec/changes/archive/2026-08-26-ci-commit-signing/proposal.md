## Why

El repositorio no exige firmas en los commits, lo que permite suplantación de identidad en el historial y debilita la cadena de suministro de software (SLSA source provenance: https://slsa.dev/spec/v1.0/requirements#source-provenance). El CI/CD de Project One ya está endurecido (SAST, SCA, SBOM, secret scanning), pero el Stage 1 — Source carece del control de integridad más barato: firmar y verificar commits. Esta versión refina el change `commit-signing` previo con decisiones cerradas en grill-me (D1–D8) y una estrategia de branching por feature branches con enforcement futuro vía ruleset en `main` + verificación CI por GitHub REST API.

## What Changes

- **Firma SSH ed25519 dedicada** (`id_ed25519_projectERP`, passphrase, separada de la clave de auth) para commits humanos; GitHub los marca "Verified" (soporte nativo desde 2022: https://github.blog/2022-08-23-ssh-commit-verification-now-supported/).
- **Firma automática local** vía `commit.gpgsign=true` global (sin hook Husky obligatorio de firma — D8).
- **Configuración GitHub**: clave `.pub` subida como tipo `Signing Key` + vigilant mode ON (legacy marca Unverified).
- **Verificación CI** por GitHub REST API `verification.verified` (NUNCA `git log %G?` sin `allowedSignersFile` en runner → falsos N para SSH) en job `verify-signatures` (Stage 2 PRE-Build, triggers `pull_request` + `merge_group`), con allow-list de bots si `verified=true`; añadido a `ci-complete.needs` y marcado required status check.
- **Migración `release.yml`** (único workflow que rompe enforcement) vía GitHub App con SSH signing key propia + `actions/create-github-app-token`; (fallback si App indisponible: (a) pausar releases hasta restaurar App — preferido; o (b) firmar en runner con SSH signing key dedicada de emergencia importada vía secret — requiere su .pub registrada como Signing Key previamente). Los otros 6 workflows son SAFE (release.yml es el único que commitea). (inventario verificado en disco por orchestrator 2026-08-21: 7 archivos)
- **Enforcement en `main`**: ruleset `Require signed commits` apuntando SOLO a `main` (feature/\* sin protección remota); firma efectiva exigida a nivel PR vía el job + `merge_group`. Push sin firma a `main` rechazado con error claro. Bypass Admin para emergencias.
- **Sin reescritura de 374 commits legacy** (enforcement solo futuro).
- **Documentación**: `docs/commit-signing.md` (onboarding reproducible Windows/MSYS2) + sección en `AGENTS.md`.

## Capabilities

### New Capabilities

- `commit-signing-local`: firma SSH local automática de commits + verificación local vía `allowed_signers` (R1, R2).
- `commit-signing-github-config`: registro de clave pública como Signing Key en GitHub + vigilant mode (R3, R4).
- `commit-signing-ci-verification`: job CI `verify-signatures` que falla si algún commit del PR/`merge_group` tiene `verification.verified=false`, con allow-list de bots (R5, R6, R7).
- `commit-signing-release-migration`: migración de `release.yml` para que el version commit + Release PR queden Verified vía GitHub App SSH (R8).
- `commit-signing-enforcement`: ruleset en `main` que acepta solo commits firmados y rechaza push sin firma con error claro (R9, R10).
- `commit-signing-documentation`: `docs/commit-signing.md` con onboarding reproducible y troubleshooting (R11, R12).
- `commit-signing-key-lifecycle`: runbook de rotacion/revocacion de claves del dev y de la GitHub App (R13).

### Modified Capabilities

- (ninguna — no cambia requirements de specs existentes; `ci-supply-chain-security` y `release-workflow` no se modifican a nivel de spec)

## Impact

- **Git config (por dev, documentado, no commiteado)**: `gpg.format=ssh`, `commit.gpgsign=true`, `user.signingkey=<ruta .pub>`, `gpg.ssh.allowedSignersFile=~/.ssh/allowed_signers`.
- **CI**: nuevo job `verify-signatures` en `.github/workflows/ci.yml` (Stage 2 PRE-Build), añadido a `ci-complete.needs` y marcado required status check; trigger `pull_request` + `merge_group`.
- **Repo settings (GitHub, manual)**: subir SSH signing key, activar vigilant mode, crear GitHub App + SSH key de App, crear ruleset `Require signed commits` en `main` con bypass Admin.
- **Archivos nuevos/modificados**: `docs/commit-signing.md`, secrets `APP_ID`/`APP_PRIVATE_KEY` (repo/environment), modificación de `.github/workflows/release.yml` y `.github/workflows/ci.yml`.
- **Documentos afectados**: `AGENTS.md` (sección firma de commits).
- **Sin impacto**: código de aplicación, dependencias npm, los otros 6 workflows, historial legacy (no reescrito).
