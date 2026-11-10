## Phase 1 — Excepciones (E6)

- [ ] 1.1 Crear `security/exceptions.yml` con schema documentado y un ejemplo comentado (sin excepciones activas inicialmente).
- [ ] 1.2 Crear script de validación `scripts/validate-security-exceptions.sh` (o `.mjs`) que parsea `security/exceptions.yml` y falla si alguna excepción está vencida o mal formada.
- [ ] 1.3 Añadir job `security-exceptions-check` en `.github/workflows/ci.yml` (substage 2C, `needs: repo-discovery`, advisory en FASE 1 con `continue-on-error: true`, timeout 5 min).
- [ ] 1.4 Añadir `/security/` a `.github/CODEOWNERS` (si no existe) requiriendo revisión del mantenedor de seguridad.

## Phase 2 — SLA y métricas

- [ ] 2.1 Crear `security/SLA.md` con los cuatro tiers de severidad (7/30/90/best-effort), reglas de clock-start, escalación y interacción con excepciones.
- [ ] 2.2 Crear `.github/workflows/security-metrics.yml` con cron mensual que recolecta las 7 métricas del PRD y abre/actualiza issue `[monthly-security-metrics]`.
- [ ] 2.3 Verificar que el workflow tiene `permissions: issues: write` y `contents: read`.

## Phase 3 — Runbooks

- [ ] 3.1 Crear `docs/runbooks/security/exception-expiry.md` (excepción por vencer).
- [ ] 3.2 Crear `docs/runbooks/security/cve-triage.md` (CVE crítico/KEV en dependencia).
- [ ] 3.3 Crear `docs/runbooks/security/tool-failure.md` (error de herramienta).
- [ ] 3.4 Crear `docs/runbooks/security/license-denied.md` (licencia denegada o desconocida).
- [ ] 3.5 Crear `docs/runbooks/security/urgent-fix-blocked.md` (corrección urgente bloqueada por gate).
- [ ] 3.6 Crear `docs/runbooks/security/scheduled-scan-no-report.md` (escaneo programado sin reporte).

## Phase 4 — Documentación

- [ ] 4.1 Actualizar `docs/learning/quality-gates.md` con la fila `security-exceptions-check` (advisory FASE 1, promoción a blocking en FASE 2).
- [ ] 4.2 Actualizar `docs/CONTEXT-CICD.md` con referencia a `security/exceptions.yml`, `security/SLA.md` y los runbooks.
- [ ] 4.3 Actualizar `docs/security/SECURITY.md` con el estado de la política de excepciones.

## Validación

- [ ] 5.1 Ejecutar `openspec validate security-exceptions-policy` y confirmar sin errores.
- [ ] 5.2 Ejecutar el script de validación contra `security/exceptions.yml` vacío y confirmar exit 0.
- [ ] 5.3 Ejecutar el script contra un archivo con una excepción vencida y confirmar exit non-zero con mensaje nombrando el id.
