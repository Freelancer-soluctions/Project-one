## Context

Ver proposal.md (motivación) y specs (requisitos). Estado actual relevante del codebase:

- **Equipo**: 3 emails únicos en `git log` (lpfalcon99@gmail.com, jamaringarciabusiness@gmail.com, 37907421+lpfalcon@users.noreply.github.com) — equipo pequeño (1-2 humanos + identidad noreply de GitHub). Implica rollout de bajo riesgo y sin coordinación masiva.
- **Rama por defecto**: `main` (TBD + Changesets según `docs/cicd-plan-implementacion.md`). No existen `develop` ni `release/*` → la protección nativa de GitHub se concentra en `main`.
- **Hooks**: Husky 9 con `pre-commit` (lint-staged + Semgrep + Gitleaks en paralelo), `commit-msg` (commitlint), `pre-push` (vitest --changed). Patrón de scripts en `scripts/security/*.ps1`.
- **CI**: `ci.yml` con 9 jobs en PR hacia `main`; `security.yml` con Trivy/CodeQL/Gitleaks/SBOM/Dependency Review. `docs/ci-cd-pipeline-empresarial.md` §3.3 práctica 5 ya cita firma de commits como práctica recomendada — este change la implementa.
- **Git config local actual**: sin `commit.gpgsign`, `gpg.format`, ni `user.signingkey` (verificado en este repo) → hay que configurar por dev.
- **Restricción de plataforma**: GitHub.com (cloud) NO soporta pre-receive hooks custom (feature de GitHub Enterprise Server; ver https://docs.github.com/en/enterprise-server@3.14/admin/policies/enforcing-policies/using-pre-receive-hooks). El enforcement en la nube se hace con branch protection rules + checks de CI. Fuente: GitHub Docs sobre pre-receive hooks (GitHub Enterprise) — "práctica comúnmente recomendada, fuente: GitHub Enterprise Docs; no disponible en GitHub.com".

## Goals / Non-Goals

**Goals:**

- Cero fricción para devs: firma SSH reutilizando claves/infra ya presentes (ed25519), sin gestión de claves GPG (expiración, revocación, key servers).
- Enforcement real en `main` (branch protection) + cobertura de ramas de feature vía CI job en PRs.
- Cero reescritura de historial; baseline documental/auditable documentado.
- Bots funcionando sin cambios (Dependabot/Actions ya firman vía GitHub).
- Rollback documentado y ejecutable en <10 min si bloquea producción.

**Non-Goals:**

- Firma de artifacts/imágenes (SBOM/cosign — Stage 6, fuera de alcance; ver `docs/cicd-plan-implementacion.md` B6 "no planificado").
- YubiKey/hardware tokens en v1 (opcional para maintainers, ver Decisión 5).
- Enforcement estricto inmediato en todas las ramas vía pre-receive hook (no disponible en GitHub.com).
- Reescritura de commits históricos (rechazada explícitamente).
- Migración a GPG/X.509.

## Decisions

### D1. Tecnología: SSH signing (no GPG, no X.509/S/MIME)

- **Elección**: SSH con clave ed25519 dedicada, `gpg.format = ssh`.
- **Por qué**: GitHub soporta verificación de commits SSH desde 2022 (https://github.blog/2022-08-23-ssh-commit-verification-now-supported/). SSH elimina la sobrecarga operativa de GPG (generación de claves con passphrase, upload a keyservers, expiración, revocación) y de X.509 (requiere PKI empresarial inexistente aquí). El equipo ya usa SSH para git remote → menor fricción de onboarding. Git soporta `gpg.format = ssh` nativamente (https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work).
- **Alternativas**: GPG (descartado: overhead de gestión de claves sin beneficio regulatorio; el repo no tiene requisitos de compliance que lo exijan). X.509/S/MIME (descartado: requiere PKI interna). Sigstore para commits (no es el mecanismo de firma de commits de GitHub; Sigstore queda para artifacts, ver docs/ci-cd-pipeline-empresarial.md Stage 6).

### D2. Estrategia de enforcement: gradual (main hoy → PRs y resto por CI job)

- **Elección**: fases v1 (advisory local + job CI informativo) → v2 (`require signed commits` en `main` vía branch protection API) → v3 (job CI como required check, cubre todas las ramas en PR).
- **Por qué**: el equipo es pequeño y no hay ramas long-lived; el riesgo de bloqueo de producción justifica rollout gradual. GitHub.com no permite pre-receive hooks, así que la superficie de enforcement nativa es branch protection + checks — la opción "estricta" con pre-receive hook **no es factible en la nube** (solo GitHub Enterprise). El job CI en PRs cierra el gap de ramas de feature y PRs desde forks, que branch protection solo no cubre.
- **Alternativas**: estricto inmediato (rechazado: riesgo de bloquear pushes legítimos sin guía previa). Solo `main` sin job CI (rechazado: commits sin firmar fluyen libremente por ramas de feature y PRs desde forks). La opción "estática" (main + develop + release/\*) no aplica: esas ramas no existen en el repo.

### D3. Commits históricos: no reescribir + baseline tag firmado

- **Elección**: baseline tag firmado en el commit actual de `main` (propuesto: `v1.0.0-commit-signing-baseline`); commits anteriores NO reescritos y sin exigencia retroactiva de firma — el baseline es SOLO documental/auditable (branch protection no conoce el baseline: un push con commits pre-baseline sin firmar es rechazado igualmente); exigencia de firma solo para commits nuevos.
- **Por qué**: `git filter-repo --signature-verbatim` reescribe SHAs → invalida PRs abiertos, requiere force-push coordinado y rompe correspondencia con issues/comentarios; el riesgo/beneficio es malo para un equipo pequeño sin evidencia de compromiso histórico. SLSA v1.0 source provenance (https://slsa.dev/spec/v1.0/requirements#source-provenance) exige integridad de la fuente hacia adelante en el proceso de release, no reescritura retroactiva.
- **Alternativas**: (a) no hacer nada con históricos y solo exigir firma desde ahora — el baseline tag añade un marcador auditable y documentado de dónde empieza la política (mejor para auditoría). (b) reescritura total — rechazada por los motivos anteriores.

### D4. Bots/CI: firma automática de GitHub (Dependabot + github-actions[bot])

- **Elección**: los commits de Dependabot y del `github-actions[bot]` (con `GITHUB_TOKEN` por defecto) son firmados por la infraestructura de GitHub con claves controladas por GitHub y aparecen como "Verified" → cumplen `require signed commits` sin configuración. Se documenta el anti-patrón de firmar con PAT de servicio (requiere guardar la clave SSH del servicio en la cuenta del bot y expone secretos de larga duración) y se recomienda `GITHUB_TOKEN`/OIDC. No se usa bypass por username en CODEOWNERS: la firma de GitHub ya resuelve el problema sin debilitar la política.
- **Por qué**: cero infraestructura nueva, cero secretos adicionales; los bots ya firman hoy (Dependabot + `release.yml` Changesets). Documentación de referencia: GitHub Docs sobre verificación de firmas y hardening de Actions (https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions).
- **Nota de verificación**: el job CI usa el campo `commit.verification.verified` de la API de commits de GitHub, que es `true` tanto para firmas SSH humanas como para commits firmados por GitHub — evita distinguir artificialmente entre humanos y bots.

### D5. Pipeline integration (Q6): job CI + branch protection (ambos)

- **Elección**: doble gate — (1) branch protection `require signed commits` en `main` (nativo, se aplica en el push); (2) job `commit-signature-verify` en PRs (cubre ramas de feature y forks, da visibilidad en el UI del PR). No se usan Conftest/OPA (policy-as-code para artifacts/k8s, no para firmas de commits — la fuente de verificación es la API nativa de GitHub).
- **Por qué**: branch protection solo valida pushes directos a `main`; el job CI extiende la política a todo el flujo de PR con SHA(s) infractores legibles.
- **Alternativas**: solo branch protection (rechazado: gap en ramas feature/forks). OPA gate (rechazado: sobre-ingeniería; la fuente de verdad de verificación ya es GitHub).

### D6. YubiKey/hardware (Q5): fuera de scope v1

- **Elección**: documentado como hardening opcional para maintainers (fuera del scope v1 del change).
- **Por qué**: agrega fricción de onboarding (PIV, claves `sk-` residentes) sin necesidad inmediata; el equipo es pequeño y no hay requisito regulatorio. GitHub soporta claves SSH en dispositivos (FIDO2 `sk-ed25519`), pero se documenta como mejora futura.

## Risks / Trade-offs

- [Devs configuran mal `user.signingkey` y commits quedan "Unverified"] → Script `verify-signing-setup.sh` + troubleshooting en guía; warning no bloqueante en v1; badge "Verified/Unverified" visible en GitHub para feedback inmediato.
- [Bots no contemplados rompen el enforcement (commits sin firmar en main)] → Política explícita de bots (D4); en la práctica Dependabot/`github-actions[bot]` firman vía GitHub; si un tercer bot no firmara, la guía documenta registrar su clave SSH en la cuenta del bot.
- [Enforcement bloquea producción/hotfix urgente] → Rollback documentado (spec `commit-signing-branch-protection`): desactivar `require signed commits` o desmarcar required check; política "safety over security" explícita.
- [Fricción de onboarding en Windows (este repo se desarrolla en win32)] → La guía documenta pasos para Windows (clave ed25519 en `~/.ssh/`, `ssh-agent` y config OpenSSH); el hook usa scripts sh compatibles con Git Bash (patrón ya usado en `.husky/*`).
- [Falsos negativos en `verification.verified` por commits de merge del UI web] → Los merges vía web/API de GitHub se firman automáticamente por GitHub (verified); si un squash/rebase merge local se pushea sin firmar, el branch protection lo rechaza (comportamiento esperado).
- [Costo CI adicional por el job `commit-signature-verify` (~1-2 min/PR)] → Job en workflow dedicado `commit-signature.yml` sin path filtering; el costo es aceptable frente al gate de seguridad que aporta.

## Migration Plan

1. **Fase 1 — Foundation (no disruptiva)**: escribir `docs/commit-signing-setup.md` (incluye sección "Recuperación por pérdida de clave": generar nueva clave, registrar nueva signing key, remover la vieja; los commits antiguos firmados con la clave vieja siguen verificándose con la clave pública anterior) + `scripts/setup/verify-signing-setup.sh`; warning en `.husky/pre-commit` (no bloqueante); crear baseline tag firmado; documentar política de bots y rollback. Job CI `commit-signature-verify` en modo fail-open (informativo).
2. **Fase 2 — Enforcement en main**: ejecutar vía `gh api` la actualización de branch protection de `main` preservando reglas existentes y habilitar firmas obligatorias vía el sub-endpoint dedicado `required_signatures` (POST — NO es un campo del body de PUT; ver task 3.3) (pre-requisito: `CODEOWNERS` creado). Devs que aún no firmaron quedan bloqueados al pushear a `main` → la guía + warning previo minimizan el impacto.
3. **Fase 3 — Endurecimiento (30-60 días)**: convertir `commit-signature-verify` en required check de `main`; verificar rechazos; evaluar expandir a otras ramas si aparecen (`develop`, `release/*`).
4. **Rollback**: revertir en orden inverso: quitar required check → deshabilitar firmas en `main` vía sub-endpoint dedicado → quitar warning del hook si molesta. Sin migración de datos (no hay reescritura).
   ```bash
   # Rollback: deshabilitar firmas en main
   gh api repos/Freelancer-soluctions/Project-one/branches/main/protection/required_signatures \
     --method DELETE
   ```
   Y si se necesita también deshabilitar el required check:
   ```bash
   # Remover job commit-signature-verify como required check (si aplica)
   gh api repos/Freelancer-soluctions/Project-one/branches/main/protection/required_status_checks \
     --method PATCH \
     --field strict=false \
     --field contexts='[]'
   ```

## Open Questions

- ¿Nombre exacto del baseline tag (`v1.0.0-commit-signing-baseline` vs `commit-signing-baseline`)? No cambia specs ni tareas — decisión cosmética a tomar en implementación.
- ¿Exigir firma también en tags de release? Tags de Changesets se crean por el bot (firmados por GitHub); decisión diferible sin impacto en este change.
