# Proposal

## Why

El secret scanning del monorepo está **implementado pero apagado y con deuda de configuración**: `.gitleaks.toml` tiene 7 hallazgos documentados (`docs/learning/secret-scanning.md` §4.2 — colisión `generic-api-key` con la regla default, 5 reglas sin `keywords`, sin `entropy`/`secretGroup`, allowlist `'''tests'''` por substring que oculta secrets reales en fixtures, exclusiones incompletas, FPs de `database-url`, allowlist socket/PM2 correcta), los scripts `security:secrets`/`security:secrets:full` usan comandos **deprecados desde gitleaks `v8.19.0`** (`detect`/`protect` → `git`/`dir`/`stdin`), `security.yml` y `scheduled-security.yml` están `disabled_manually` en GitHub (R1/R2 de `ci-secret-scanning` NO operativos → 0 gate PR-time de secretos en CI), y `notify-failure` en `scheduled-security.yml` es un **dead path**: sus scan steps usan `continue-on-error: true`, así que el job nunca queda en `failure()` y la condición `if: failure()` jamás dispara. Hoy la protección real depende del hook local + Semgrep `p/secrets` en `ci.yml`.

Referencias: `docs/learning/secret-scanning.md` (fuente primaria, verificado 2026-09-25) y `docs/CONTEXT-CICD.md` §13.4 (artefactos CI, allowlist de `ecosystem.config.js`), §5.6 (secret `GIT_LEAKS`), §5.7 (GHAS / `secret_scanning` + push protection DISABLED).

## What Changes

- **Taxonomía de gate** para secret scanning: PR-time (`secrets` / `Secret Detection` en `ci.yml` substage 2C, **wireado al agregador `prebuild-security-complete.needs`**) = **blocking**; full-history semanal (`gitleaks-full-scan` en `scheduled-security.yml`) = **advisory/audit**. `continue-on-error` jamás en el gate PR (consistente con `docs/learning/quality-gates.md`).
- **CI fixes**: migrar scripts a `gitleaks git --pre-commit --staged` / `gitleaks git` (comandos actuales desde `v8.19.0`); arreglar `.gitleaks.toml` (7 hallazgos: `disabledRules` + renombrar `generic-api-key` → `custom-api-key`, `keywords`/`entropy`, allowlist tests anclada, `.vscode/`); reparar `notify-failure` con `steps.<id>.outcome` en vez de `failure()` del job.
- **Enablement**: `gh workflow enable` de `security.yml` y `scheduled-security.yml` (estado `active` verificado por API) + añadir el check `secret-scanning` (`Secret Detection`, job `secrets`) a `required_status_checks` del ruleset de `main`.
- Bump de pin Docker `zricethezav/gitleaks:v8.22.1` → última release (v8.30.1) en ambos workflows (deuda conocida, 8 releases de retraso).
- Actualizar `docs/learning/secret-scanning.md` y `docs/CONTEXT-CICD.md` (§13.4/§5.6/§5.7) al estado resultante.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `config-correctness`: se extiende más allá de ESLint/Prettier/TypeScript para cubrir la corrección de la configuración de secret scanning: taxonomía `blocking`/`advisory` del gate `secrets`, sintaxis y reglas de `.gitleaks.toml` (colisión de ids, `keywords`/`entropy`, allowlists ancladas), comandos gitleaks no-deprecados en los scripts, enablement de `security.yml`/`scheduled-security.yml` + `secret-scanning` en `required_status_checks`, y el `notify-failure` de `scheduled-security.yml` basado en `steps.*.outcome`.

## Impact

- `.gitleaks.toml` (renombre de regla, `disabledRules`, `keywords`/`entropy`, allowlists).
- `package.json` raíz: scripts `security:secrets` (L56-57) y `security:secrets:full`.
- `.github/workflows/ci.yml`: job `secrets` (`Secret Detection`, substage 2C), pin Docker gitleaks, wireado a `prebuild-security-complete.needs`.
- `.github/workflows/security.yml`: pin Docker gitleaks + jobs restantes (dependency-scan, SAST, SBOM) — sin job `secrets` (mudó a ci.yml).
- `.github/workflows/scheduled-security.yml`: job `gitleaks-full-scan` (pin + `continue-on-error` mantenida) y job `notify-failure` (reescritura de la condición).
- GitHub (fuera del repo): estado de workflows (`gh workflow enable`), ruleset `main` → `required_status_checks`, opcionalmente `secret_scanning` + push protection (§5.7).
- `docs/learning/secret-scanning.md`, `docs/CONTEXT-CICD.md` (§13.4/§5.6/§5.7), `docs/learning/quality-gates.md` (fila de taxonomía).
- Desarrolladores: commit bloqueado por hallazgo nuevo (L1) y merge bloqueado por `Secret Detection` (L3).
