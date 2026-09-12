## Why

El repositorio no exige firmas en los commits, lo que permite suplantación de identidad en el historial (cualquier persona puede crear commits atribuidos a otro autor) y debilita la cadena de suministro de software: sin verificación de autoría, un atacante con acceso a un push puede inyectar código atribuido a un desarrollador legítimo. El pipeline CI/CD de Project One ya está endurecido (SAST, SCA, SBOM, secret scanning), pero el Stage 1 — Source carece del control de integridad más barato: firmar y verificar commits (alineación con SLSA v1.0 source provenance: https://slsa.dev/spec/v1.0/requirements#source-provenance). Hoy los 3 autores únicos del historial no tienen firma configurada (sin `commit.gpgsign`, `gpg.format`, ni `user.signingkey` en git config).

## What Changes

- **Firma SSH obligatoria para commits humanos**: cada dev firma sus commits con una clave SSH ed25519 dedicada; GitHub los marca como "Verified" (soporte nativo desde 2022: https://github.blog/2022-08-23-ssh-commit-verification-now-supported/).
- **Enforcement gradual por fases** (ver Q2/Q3): v1 = documentación + warning no-bloqueante en pre-commit + job CI `commit-signature-verify`; v2 = branch protection `require signed commits` en `main`; v3 (30-60 días) = job CI como required check (cubre de facto todas las ramas en PR).
- **Sin reescritura de historial**: los commits históricos sin firma no se reescriben; el **baseline tag firmado** es documental/auditable solamente (branch protection no lo exime — un push con commits pre-baseline sin firmar es rechazado igualmente) y marca el punto a partir del cual se exige firma (decisión Q3, opción "baseline").
- **Estrategia explícita para bots**: Dependabot, `github-actions[bot]` (Changesets, CI auto-fixes) firman vía GitHub automáticamente; se documenta el anti-patrón de firmar con PAT de servicio (decisión Q4, opción "GitHub bot signing").
- **Job CI `commit-signature-verify`** en PRs: verifica vía GitHub API que todos los commits del rango `base...head` tengan `verification.verified == true` (decisión Q6: gate en CI + branch protection, no solo branch protection).
- **Nuevo hook/script**: warning en `.husky/pre-commit` + script reutilizable `scripts/setup/verify-signing-setup.sh`.
- **Documentación**: `docs/commit-signing-setup.md` (setup + onboarding + troubleshooting) y mark "Implemented" en `docs/ci-cd-pipeline-empresarial.md` §3.
- **Hardening opcional (YubiKey)**: fuera de scope v1; documentado como opcional para maintainers (decisión Q5).

## Capabilities

### New Capabilities

- `commit-signing-local`: firma SSH local de commits por parte de devs + warning del hook pre-commit + script de verificación de entorno
- `commit-signing-branch-protection`: branch protection en `main` que exige commits firmados (`require signed commits`)
- `commit-signing-bots`: manejo de commits automatizados (Dependabot, GitHub Actions bot, CI auto-fixes) dentro de la política de firmas
- `commit-signing-ci-verification`: job CI en PRs que verifica que todos los commits del PR están firmados y verificados
- `commit-signing-onboarding`: documentación de setup y onboarding para nuevos desarrolladores (guía reproducible)

### Modified Capabilities

- (ninguna — no cambia requirements de specs existentes; `ci-supply-chain-security` cubre SBOM/dependency-review y no se modifica)

## Impact

- **Hooks**: `.husky/pre-commit` (warning de firma no bloqueante, v1) — `commit-msg` y `pre-push` sin cambios.
- **CI**: nuevo job `commit-signature-verify` en `.github/workflows/ci.yml` (o workflow dedicado `commit-signature.yml`) — fail-open en v1, required check en v3.
- **Repo settings (GitHub)**: branch protection en `main` preservando reglas existentes y habilitando firmas obligatorias vía el sub-endpoint dedicado `required_signatures` (POST — NO es un campo del body de PUT) + `gh` CLI; `CODEOWNERS` nuevo (requisito de "Require review from Code Owners", no de "require signed commits"); baseline tag firmado.
- **Archivos nuevos**: `docs/commit-signing-setup.md`, `scripts/setup/verify-signing-setup.sh`, `.github/CODEOWNERS`, `.git-blame-ignore-revs` (opcional).
- **Documentos afectados**: `docs/ci-cd-pipeline-empresarial.md` (marcar §3.3 práctica 5 como Implemented), `docs/cicd-estado-actual.md` (nuevo gate en Stage 1).
- **Git config (por dev, documentado, no commiteado)**: `gpg.format=ssh`, `commit.gpgsign=true`, `user.signingkey=<ruta clave>`.
- **Sin impacto**: código de aplicación, dependencias npm, workflows existentes (deploy/preview/release/security).
- **Bots**: Dependabot y Actions ya firman vía GitHub — sin cambios de infraestructura, solo documentación.
