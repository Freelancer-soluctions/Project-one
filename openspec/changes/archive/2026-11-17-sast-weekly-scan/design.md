# Design

## Context

Ver `proposal.md - Why`. Estado actual (verificado 2026-09-25):

- `.github/workflows/security.yml` (CodeQL `sast`, Trivy `dependency-scan`, `sbom`) y `.github/workflows/scheduled-security.yml` (Gitleaks full + `notify-failure`) → ya `active` (rehabilitados por `secret-scanning` 2026-09-25); el gap es falta Semgrep full + SARIF upload + artifacts retención diferenciada + `continue-on-error` en Trivy/CodeQL de `security.yml`.
- `scheduled-security.yml` ya trae cron `0 3 * * 1` (lunes 03:00 UTC), `workflow_dispatch`, permisos `security-events: write`, scan steps con `continue-on-error: true`, job outputs `scan-json-outcome`/`scan-sarif-outcome` (líneas 17-24), `notify-failure` con `if: always()`.
- `security.yml` NO tiene `schedule` (solo `workflow_call`/`pull_request`/`push`) → CodeQL/Trivy/SBOM no son semanales hoy.
- Falta Semgrep full scan en schedule (solo existe diff-scoped en `ci.yml`).
- Specs vecinos: `sast-governance-gate` (L2 diff PR), `ci-secret-scanning` (Gitleaks full ownership de `scheduled-security.yml`), `ci-scheduled-security-review` (digest semanal, prohíbe duplicar scheduled-security.yml), `ruleset-expansion` (required checks).

## Goals / Non-Goals

**Goals:**

- Rehabilitar ambos workflows y darles triggers semanales completos (Semgrep full + CodeQL + Gitleaks full + Trivy/SBOM).
- SARIF → Code Scanning con category única por herramienta.
- Notificación de fallas fiable vía `steps.*.outcome`.
- Evidencia auditable: artifacts JSON/SARIF/SBOM con retención 30/90/365d.
- Taxonomy 100% advisory.

**Non-Goals:**

- Convertir L2 (`ci.yml` job `sast`) de advisory a blocking — scope de otro change (`sast-governance-gate` F2).
- Cambiar required checks del ruleset 21227644 (`ruleset-expansion` intacto).
- Reemplazar Gitleaks por Betterleaks/TruffleHog (§4.3).
- Crear baseline fail-on-new con `--baseline-commit` en L3 (§4.2 medio plazo; contradictorio con full-history audit).

## Decisions

### D1 — Full-history = advisory/audit

- **Decisión**: scan steps con `continue-on-error: true`; artifacts JSON/SARIF siempre subidos (`if: always()`); `notify-failure` basado en `steps.*.outcome` exportado como job outputs.
- **Rationale**: deuda histórica requiere plan de remediación, no bloqueo inmediato (§2 L3 "Nunca bloquear releases"). Con `continue-on-error` el job queda `success` → `needs.*.result` es dead path; `steps.<id>.outcome` solo es legible dentro del job → exportar en `outputs:` (patrón ya implementado en `scheduled-security.yml:17-24`, propagarlo a security.yml y a cualquier scan step nuevo).
- **Alternativas descartadas**: (a) quitar `continue-on-error` → releases bloqueados por deuda vieja; (b) `if: failure()` en notify-failure → nunca dispara (dead path, ya corregido en scheduled-security.yml).

### D2 — Triggers: cron semanal lunes 03:00 UTC + workflow_dispatch + merge_group

- **Decisión**: `schedule: cron '0 3 * * 1'` como base (consistente con `scheduled-security.yml:5` y `ci-scheduled-security-review`), más `workflow_dispatch` para triaje on-demand, más `merge_group` para compatibilidad futura con merge queue (gap §6.2.7).
- **Rationale**: lunes 03:00 UTC → resultados frescos para el triaje semanal de security champions; `workflow_dispatch` sin inputs = reproducibilidad manual; `merge_group` evita que la queue quede sin cobertura SAST cuando se active merge queue.
- **Trade-off**: `security.yml` también corre en `pull_request`/`push` → el cron agrega 1 run/semana extra; concurrency group existente (`security-${{ github.ref }}`) evita carreras.
- **Alternativas descartadas**: cron diario (ruido + minutos sin valor); mover todo a scheduled-security.yml (duplicaría jobs dueños de `ci-scheduled-security-review`/`ci-secret-scanning`).

### D3 — Ruleset: wiring `scheduled-scanning` opcional, no required

- **Decisión**: registrar el resultado del scan semanal como check informativo; NO añadirlo a los required status checks del ruleset 21227644.
- **Rationale**: taxonomy advisory (D1) — un required check sobre un job `continue-on-error` sería siempre green (inútil) o exigiría bloqueo (contradice L3). Mantener separación: L1/L2 bloquean, L3 audita.
- **Alternativas descartadas**: required check con umbral `Required code scanning results` → eso aplica a L2 code scanning diff (§3.3/§4.2), no al schedule full-history; forzarlo aquí acoplaría `ruleset-expansion` sin beneficio.

## Risks / Trade-offs

- [Workflows aún `disabled_manually` tras enable o tras secret-scanning] → verificar con `gh api .../workflows`; si `state: disabled_manually` → `gh workflow enable`; si `active` (rehabilitado por secret-scanning 2026-09-25) → paso 1 condicional; tarea de validación explícita.
- [Ruido inicial: muchos findings históricos + issues] → audit mode + triaje semanal (security champions + due dates, §3.4.3); dedupe de issues por fecha en `notify-failure`.
- [Semgrep full scan lento en repo completo] → `timeout-minutes` explícito, `--exclude` node_modules/dist, jobs limitados (§3.2); cron semanal absorbe latencia.
- [Uploads SARIF duplicados por categoría en mismo run] → una categoría por herramienta/run (§3.3); no re-subir en retry sin limpiar.
- [CodeQL doble definición (`security.yml` v4 vs `ci-enterprise.yml` v3)] → mantener solo `security.yml` como fuente semanal; desalineación documentada como follow-up (§6.2.6).
- [Doble costo: security.yml corre en push/PR + schedule] → aceptado: PR/scan es diff-rápido, schedule agrega full CodeQL; si cuesta, condicionar autobuild.

## Migration Plan

1. Verificar estado de workflows (`gh api .../workflows`) — habilitar (`gh workflow enable`) ÚNICAMENTE si `state: disabled_manually`; si `active` (rehabilitado por secret-scanning 2026-09-25), saltar paso. Reversible con `gh workflow disable`.
2. Añadir triggers/jobs nuevos en PR (audit-first, sin required checks) → merge.
3. Ejecutar `workflow_dispatch` de prueba en ambos workflows; validar artifacts + SARIF en Security tab.
4. Rollback: revert del PR + `gh workflow disable`; no toca gates existentes (L1/L2 intactos).

## Open Questions

- ¿Crear issue por cada run con fallas o deduplicar (abrir uno solo si ya existe issue abierto del mismo workflow)? → decidir en implementación; no cambia specs (el spec solo exige "crear issue cuando scan step falla").
- ¿Añadir `semgrep` al wiring informativo `scheduled-scanning` o categorías separadas por herramienta? → informativo; no afecta required checks.
