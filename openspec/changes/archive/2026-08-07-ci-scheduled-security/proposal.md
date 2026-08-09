## Why

Stage 8 (Scheduled) del plan CI/CD (`docs/cicd-plan-implementacion.md`) queda sin cubrir: la seguridad de dependencias solo se revisa en eventos PR/push (`security.yml` con SBOM + Dependency Review, change `ci-security-enhance`) y los secretos tienen su cron semanal (`scheduled-security.yml`, change `ci-secret-scanning`). Pero una dependencia vulnerable mergeada entre actividad de PRs puede pasar meses sin detección — no hay cadencia periódica que re-ejecute SBOM + revisión de vulnerabilidades sobre el estado de `main` ni un digest legible de seguridad.

## What Changes

- Nuevo workflow `.github/workflows/security-digest.yml` (NUEVO, NO duplica `scheduled-security.yml` ni `security.yml` de los siblings): cron semanal que REUTILIZA el patrón de trigger programado de `ci-secret-scanning` y añade una cadencia periódica de dependencias:
  - Re-ejecuta SBOM generation (CycloneDX JSON, `anchore/sbom-action@v0.17.2`) sobre `main` — detecta vulnerabilidades en dependencias ya mergeadas entre PRs
  - Ejecuta revisión de vulnerabilidades + licencias del árbol de dependencias mergeado (osv-scanner sobre `package-lock.json` vía `google/osv-scanner-action`, con salida JSON para el digest)
  - Genera un digest/reporte de seguridad humano-legible (markdown): conteo de dependencias del SBOM + paquetes vulnerables con severidad + resumen de licencias, subido como artifact y opcionalmente posteado como PR summary comment cuando es accionable
  - Cross-reference del audit mode de secret-scanning: NO recrea el cron de Gitleaks; reutiliza el trigger programado existente y opcionalmente descarga el artifact `gitleaks-report` del run semanal del sibling para incluirlo en el digest
- Nuevo script `scripts/security/generate-security-digest.mjs` (pure JS, sin deps npm) que parsea el SBOM + el reporte de osv-scanner y produce el markdown del digest
- Documentación en `docs/security/SECURITY.md`: sección "Scheduled security digest" describiendo la cadencia semanal y cómo leer el digest

## Capabilities

### New Capabilities

- `ci-scheduled-security-review`: Revisión periódica (cron semanal) de la seguridad de dependencias del estado mergeado — re-ejecuta SBOM CycloneDX + escaneo de vulnerabilidades/licencias (osv-scanner) sobre `main`, genera un digest markdown legible (conteos SBOM, paquetes vulnerables, resumen de licencias, cross-ref de secretos) subido como artifact, reutilizando el patrón de trigger programado del change hermano `ci-secret-scanning` sin duplicar sus workflows.

### Modified Capabilities

<!-- Ninguna: no hay specs existentes para scheduled workflows de seguridad en openspec/specs/. -->

## Impact

- `.github/workflows/security-digest.yml` — NUEVO: workflow con `schedule` (cron semanal, mismo patrón que `ci-secret-scanning`), `workflow_dispatch`, jobs `sbom`, `vulnerability-review`, `digest`.
- `scripts/security/generate-security-digest.mjs` — NUEVO: script Node puro (sin deps) que consolida SBOM + osv-scanner en el digest markdown.
- `docs/security/SECURITY.md` — sección nueva sobre el digest semanal.
- **Sin cambios de código de runtime** (apps/server, apps/client), APIs ni esquemas. Solo tooling de CI/seguridad.
- **Sin dependencias npm nuevas**: las tools (anchore/sbom-action, google/osv-scanner-action, actions/checkout, upload/download-artifact) corren solo en workflow jobs.
- **Cross-change**: este change DEPENDE de `ci-secret-scanning` (provee `scheduled-security.yml` + artifact `gitleaks-report` — dependencia RUNTIME dura) y de `ci-security-enhance` (provee job `sbom`/`dependency-review` en `security.yml` — dependencia SOLO de orden/consistencia: este change NO consume artifacts de `security.yml` porque re-ejecuta su propio SBOM; se mantiene el orden de merge por coherencia de docs). NO toca sus archivos.
- **Permisos**: `contents: read` + `actions: read` (descargar artifact del run del sibling) + `pull-requests: write` solo en el job de comentario (opcional, si se postea summary comment). Sin secrets nuevos requeridos.
