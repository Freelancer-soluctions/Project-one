## Why

El plan CI/CD (`docs/cicd-plan-implementacion.md` §4 mermaid Scheduled block L238, §5 Stage 8 L914-952, Sprint 4 task 4.5 L1273) declara que el cron semanal ejecuta "Trivy full + npm audit" sobre el estado mergeado de `main`. La realidad no coincide: `.github/workflows/scheduled-security.yml` (cron `0 3 * * 1`, lunes 03:00 UTC) ejecuta SOLO el Gitleaks full-history scan (JSON + SARIF upload), y `security-digest.yml` (change `ci-scheduled-security-review`) cubre únicamente OSV (osv-scanner sobre `package-lock.json`) + SBOM + digest. No existe ningún Trivy full scan ni `npm audit` en contexto programado — una vulnerabilidad de filesystem/entorno o de dependencias publicada entre PRs puede pasar semanas sin detección periódica.

## What Changes

- **EXTENDER** `.github/workflows/scheduled-security.yml` (workflow existente, cron `0 3 * * 1` + `workflow_dispatch`) con un job `trivy-full-scan` que ejecuta `aquasecurity/trivy-action@0.33.1` con `scan-type: fs`, `scan-ref: .`, `severity: HIGH,CRITICAL` y salida SARIF, subida al Security tab (code scanning) vía `github/codeql-action/upload-sarif@v4` con `category: trivy` — reutilizando el permiso `security-events: write` ya presente en el workflow.
- **EXTENDER** el mismo workflow con un job `npm-audit` que ejecuta `npm audit --audit-level=high` sobre el lockfile raíz (cubre los 3 workspaces por hoisting npm) en modo auditoría (no falla el run por hallazgos; los reporta).
- **NO duplicar** el Trivy de CI-push: `security.yml` (job `dependency-scan`) ya corre Trivy fs en PR/push — este change añade la cadencia programada, no un segundo escaneo en eventos.
- **NO duplicar** el `npm audit` de CI-push: `ci-enterprise.yml` (job `dependency-audit`) ya lo corre en push — este change añade la cadencia programada.
- Documentación en `docs/security/SECURITY.md`: sección "Scheduled Trivy full scan + npm audit" describiendo la cadencia semanal y cómo leer los hallazgos.

## Capabilities

### New Capabilities

- `ci-scheduled-trivy-full-scan`: Escaneo programado (cron semanal `0 3 * * 1` + `workflow_dispatch`) de Trivy filesystem full (severity HIGH/CRITICAL, salida SARIF al Security tab) y `npm audit --audit-level=high` sobre el estado mergeado de `main`, extendiendo `scheduled-security.yml` sin duplicar los escaneos de CI-push (`security.yml` Trivy, `ci-enterprise.yml` npm audit).

### Modified Capabilities

<!-- Ninguna: no hay specs existentes para el cron de Trivy/npm audit en openspec/specs/. `ci-scheduled-security-review` (OSV/SBOM/digest) y `ci-secret-scanning` (Gitleaks) no cambian sus requirements. -->

## Impact

- `.github/workflows/scheduled-security.yml` — MODIFICADO: se añaden los jobs `trivy-full-scan` y `npm-audit` al workflow existente (el job `gitleaks-full-scan` se mantiene intacto; el workflow sigue siendo el único dueño del Gitleaks full-history scan).
- `docs/security/SECURITY.md` — sección nueva sobre el scan semanal Trivy full + npm audit.
- **Sin cambios de código de runtime** (apps/server, apps/client), APIs ni esquemas. Solo tooling de CI/seguridad.
- **Sin dependencias npm nuevas**: `aquasecurity/trivy-action@0.33.1`, `github/codeql-action/upload-sarif@v4`, `actions/upload-artifact@v4` y `npm audit` (built-in) corren solo en workflow jobs.
- **Cross-change**: este change EXTENDE el workflow del change archivado `ci-secret-scanning` (2026-08-07) — el archivo ya no está "owned" por un change activo, por lo que extenderlo es legítimo. NO toca `security.yml` (sibling `ci-security-enhance`) ni `security-digest.yml` (sibling `ci-scheduled-security-review`).
- **Parent spec annotation (sync-time)**: al sincronizar deltas, se actualiza la anotación de `openspec/specs/ci-scheduled-security-review/spec.md` (línea 28) — `scheduled-security.yml` pasa a estar owned por `ci-scheduled-trivy` (los siblings `ci-secret-scanning` y `ci-security-enhance` están archivados 2026-08-07 / 2026-08-06); `security.yml` sigue owned por `ci-security-enhance` (archivado). Ver task 3.6.
- **Permisos**: `contents: read` + `security-events: write` (ya presentes en el workflow) — el upload SARIF al Security tab requiere `security-events: write`; `npm audit` no requiere permisos extra. Sin secrets nuevos.
