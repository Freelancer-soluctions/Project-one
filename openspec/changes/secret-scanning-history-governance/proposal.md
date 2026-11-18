## Why

El PRD `PRD—Detección-de-secretos-repo-completo+historial-(Gitleaks TruffleHog)` define una estrategia por capas para detectar secretos en el repo completo y su historial, con línea base, allowlist justificada, escaneo programado y respuesta ante hallazgos. La implementación actual cubre Gitleaks en PR, full-history semanal y hook pre-commit, pero deja huecos de gobernanza: no hay CODEOWNERS para la línea base/allowlist, el agregador trata `skipped` como éxito, no hay guard de checkout completo, el issue del escaneo programado no detalla hallazgos, no hay escaneo completo pre-release, la capa nativa de GitHub (secret scanning + push protection) está deshabilitada y no existe runbook de respuesta/rotación.

Este change cierra esos huecos sin duplicar trabajo ya en curso: TruffleHog (capacidad `secret-verification` en `ci-shifting-left` Task A6), el binding del job `Secret Detection` al ruleset (`secret-scanning` tasks 6.x) y el fail-closed del escaneo programado (`ci-security-hardening`).

## What Changes

- Añadir `.github/CODEOWNERS` cubriendo `.gitleaksignore`, `.gitleaks.toml` y `.github/workflows/**`, de modo que cambios en la línea base/allowlist exijan revisión humana con motivo y fecha (RH-4, G6, A7).
- Completar la justificación por entrada en `.gitleaksignore` (motivo + fecha de revisión) para los bloques que solo tienen comentario genérico (RH-4).
- Añadir un step guard en `gitleaks-full-scan` que verifique checkout completo (`fetch-depth: 0` efectivo) y falle con mensaje propio antes de escanear (A5, RH-7).
- Enriquecer `notify-failure` del escaneo programado leyendo `gitleaks-report.json` y pegando el resumen (regla, archivo, commit) en el issue (A8, RH-6).
- Hacer que `prebuild-security-complete` falle cuando el job `secrets` queda `skipped` en PR, y extender el job `secrets` a `merge_group` para no romper la merge queue (G8, A6).
- Añadir un escaneo completo de secretos (Gitleaks `git --log-opts="--all"`, y TruffleHog cuando exista) al pipeline de release (RH-5).
- Habilitar la capa nativa de GitHub (secret scanning + push protection) en el repo público (G4, sin cambios de código; documentar pasos y estado).
- Crear un runbook de respuesta ante un secreto hallado (RR-1..RR-6, G9): revocar/rotar primero, auditar uso, decidir sobre historial con `git filter-repo`, plazo de rotación D3 (24h para equipo de una persona), registro de incidentes.
- Actualizar la nota obsoleta de `openspec/specs/ci-secret-scanning/spec.md` (workflows `disabled_manually` → `active` verificado hoy por API).

## Capabilities

### Modified Capabilities

- `ci-secret-scanning`: gobernanza de línea base/allowlist (CODEOWNERS + justificación con fecha), guard de checkout completo, detalle de hallazgos en el issue, anti-skip en el agregador, escaneo pre-release, capa nativa de GitHub y runbook de respuesta/rotación.

## Impact

- **Workflows:** `.github/workflows/scheduled-security.yml` (guard A5, issue detallado), `.github/workflows/ci.yml` (anti-skip en `prebuild-security-complete`, `merge_group` en `secrets`), `.github/workflows/release.yml` (escaneo completo pre-release).
- **Repo config:** `.github/CODEOWNERS` (nuevo), `.gitleaksignore` (justificación por entrada).
- **Docs:** nuevo runbook (p. ej. `docs/security/secret-incident-response.md`) y actualización de `docs/CONTEXT-CICD.md` y `openspec/specs/ci-secret-scanning/spec.md`.
- **Sin cambios en código de aplicación** (backend/frontend/e2e). Sin cambios de schema ni API.
- **Coordinación:** NO duplica TruffleHog (`ci-shifting-left` A6), el fail-closed del escaneo programado (`ci-security-hardening`) ni el binding del ruleset (`secret-scanning` 6.x). Antes de editar `scheduled-security.yml`, verificar ownership con el cambio activo `ci-scheduled-trivy` (tasks.md:20 lo reclama).
