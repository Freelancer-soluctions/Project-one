## Phase 1 — Excepciones (E6)

- [ ] 1.1 Crear `security/exceptions.yml` con schema documentado y un ejemplo comentado (sin excepciones activas inicialmente).
- [ ] 1.2 Crear script de validación `scripts/validate-security-exceptions.sh` (o `.mjs`) que parsea `security/exceptions.yml` y falla si alguna excepción está vencida, mal formada, o tiene `expires > created + 90 días`.
- [ ] 1.3 Añadir job `security-exceptions-check` en `.github/workflows/ci.yml` (substage 2C, `needs: repo-discovery`, advisory en FASE 1 con `continue-on-error: true`, timeout 5 min).
- [ ] 1.4 Añadir `/security/` a `.github/CODEOWNERS` al final del archivo (respetando last-match-wins), requiriendo revisión del owner apropiado (team `devops-team` o mantenedor de seguridad).
- [ ] 1.5 (Opcional, review-time) Documentar que toda supresión inline SHALL referenciar un exception id. Si se implementa cross-reference automático, añadir detección de supresiones sin id en el script de validación.

## Phase 2 — SLA y métricas

- [ ] 2.1 Crear `security/SLA.md` con los cuatro tiers de severidad (7/30/90/best-effort), reglas de clock-start (detección), escalación, interacción con excepciones (pending no pausa el clock; reassignment no reinicia; evidencia de explotación activa → deadline acelerado + re-evaluación inmediata).
- [ ] 2.2 Crear `.github/workflows/security-metrics.yml` con cron mensual que recolecta las 7 métricas del PRD y abre/actualiza issue `[monthly-security-metrics]`.
- [ ] 2.3 Anotar el resultado de la revisión mensual en un artifact del repo (archivo `security/metrics/YYYY-MM.md` o sección en `docs/security/SECURITY.md`) para retención de evidencia.
- [ ] 2.4 Verificar que el workflow tiene `permissions: issues: write` y `contents: write` (para el artifact).

## Phase 3 — Runbooks

- [ ] 3.1 Crear `docs/runbooks/security/exception-expiry.md` (excepción por vencer).
- [ ] 3.2 Crear `docs/runbooks/security/cve-triage.md` (CVE crítico/KEV en dependencia).
- [ ] 3.3 Crear `docs/runbooks/security/tool-failure.md` (error de herramienta).
- [ ] 3.4 Crear `docs/runbooks/security/license-denied.md` (licencia denegada o desconocida).
- [ ] 3.5 Crear `docs/runbooks/security/urgent-fix-blocked.md` (corrección urgente bloqueada por gate; incluir bypass governance: limitado a un rol, registrado, excepción formal posterior, check nunca desactivado).
- [ ] 3.6 Crear `docs/runbooks/security/pr-red-new-finding.md` (PR rojo por hallazgo nuevo).
- [ ] 3.7 Crear `docs/runbooks/security/scheduled-scan-no-report.md` (escaneo programado sin reporte).
- [ ] 3.8 Crear o referenciar `docs/runbooks/security/secret-incident-response.md` (secreto detectado; mover o referenciar desde `docs/security/secret-incident-response.md` si ya existe).

## Phase 4 — Documentación

- [ ] 4.1 Actualizar `docs/learning/quality-gates.md` con la fila `security-exceptions-check` (advisory FASE 1, promoción a blocking en FASE 2).
- [ ] 4.2 Actualizar `docs/CONTEXT-CICD.md` con referencia a `security/exceptions.yml`, `security/SLA.md` y los runbooks.
- [ ] 4.3 Actualizar `docs/security/SECURITY.md` con: (a) estado de la política de excepciones, (b) párrafo de accepted risk por single-maintainer (falta de separación de funciones, compensado por expiry/CODEOWNERS/conteo visible, resuelto con segunda cuenta).
- [ ] 4.4 (FASE 2) Añadir task para cablear el conteo de excepciones activas y la fecha de vencimiento más próxima al agregador `prebuild-security-complete` (depende de `prebuild-security-aggregator-strict`).

## Validación

- [ ] 5.1 Ejecutar `openspec validate security-exceptions-policy` y confirmar sin errores.
- [ ] 5.2 Ejecutar el script de validación contra `security/exceptions.yml` vacío y confirmar exit 0.
- [ ] 5.3 Ejecutar el script contra un archivo con una excepción vencida y confirmar exit non-zero con mensaje nombrando el id.
- [ ] 5.4 Ejecutar el script contra un archivo con una excepción que excede 90 días y confirmar exit non-zero.
- [ ] 5.5 Ejecutar actionlint sobre `.github/workflows/security-metrics.yml` y confirmar sin errores.
- [ ] 5.6 Disparar `security-metrics.yml` manualmente (`workflow_dispatch`) y verificar que el issue se crea correctamente.
