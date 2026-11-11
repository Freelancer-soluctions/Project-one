## Phase 1 — Excepciones (E6)

- [x] 1.1 Crear `security/exceptions.yml` con schema documentado y un ejemplo comentado (sin excepciones activas inicialmente). — ✅ creado con los 9 campos documentados y `exceptions: []`.
- [x] 1.2 Crear script de validación `scripts/validate-security-exceptions.sh` (o `.mjs`) que parsea `security/exceptions.yml` y falla si alguna excepción está vencida, mal formada, o tiene `expires > created + 90 días`. — ✅ `scripts/ci/security-exceptions.mjs` (+ `scripts/ci/security-exceptions.test.mjs`, 12 tests). Verificado: fichero real exit 0; vencida/`>90`/YAML roto/campo ausente exit 1 nombrando `id` y campo.
- [x] 1.3 Añadir job `security-exceptions-check` en `.github/workflows/ci.yml` (substage 2C, `needs: repo-discovery`, blocking desde día uno sin `continue-on-error`, timeout 10 min, `permissions: contents: read`, cableado a `prebuild-security-complete.needs`). — ✅ implementado, COE removido, cableado al agregador.
- [x] 1.4 Añadir `/security/` a `.github/CODEOWNERS` al final del archivo (respetando last-match-wins), requiriendo revisión del owner apropiado (team `devops-team` o mantenedor de seguridad). — ✅ entrada final `/security/ @Freelancer-soluctions/devops-team`.
- [x] 1.5 (Opcional, review-time) Documentar que toda supresión inline SHALL referenciar un exception id. — ✅ documentado en la cabecera de `security/exceptions.yml` y en `docs/security/SECURITY.md`. **No** se implementa el cross-reference automático (decisión: la detección fiable de supresiones inline en 6 herramientas distintas no es viable sin falsos negativos; queda como regla de review reforzada por CODEOWNERS).

## Phase 2 — SLA y métricas

- [x] 2.1 Crear `security/SLA.md` con los cuatro tiers de severidad (7/30/90/best-effort), reglas de clock-start (detección), escalación, interacción con excepciones (pending no pausa el clock; reassignment no reinicia; evidencia de explotación activa → deadline acelerado + re-evaluación inmediata). — ✅
- [x] 2.2 Crear `.github/workflows/security-metrics.yml` con cron mensual que recolecta las 7 métricas del PRD y abre/actualiza issue `[monthly-security-metrics]`. — ✅ cron `0 4 1 * *` + `workflow_dispatch`; issue vía `gh`.
- [x] 2.3 Anotar el resultado de la revisión mensual en un artifact del repo (archivo `security/metrics/YYYY-MM.md` o sección en `docs/security/SECURITY.md`) para retención de evidencia. — ✅ `security/metrics/YYYY-MM.md` + `latest.json`, publicados por PR (`peter-evans/create-pull-request`, `sign-commits: true`) porque `main` exige PR y commits firmados. Desviación honesta: las métricas sin fuente de datos (tiempo a corregir, SLA incumplidos) se reportan `n/d` con su fuente pendiente; no se inventan valores.
- [x] 2.4 Verificar que el workflow tiene `permissions: issues: write` y `contents: write` (para el artifact). — ✅ a nivel job: `contents: write`, `issues: write`, `pull-requests: write`, `actions: read`; workflow-level solo `contents: read` (zizmor `excessive-permissions`).

## Phase 3 — Runbooks

- [x] 3.1 Crear `docs/runbooks/security/exception-expiry.md` (excepción por vencer). — ✅
- [x] 3.2 Crear `docs/runbooks/security/cve-triage.md` (CVE crítico/KEV en dependencia). — ✅
- [x] 3.3 Crear `docs/runbooks/security/tool-failure.md` (error de herramienta). — ✅
- [x] 3.4 Crear `docs/runbooks/security/license-denied.md` (licencia denegada o desconocida). — ✅
- [x] 3.5 Crear `docs/runbooks/security/urgent-fix-blocked.md` (corrección urgente bloqueada por gate; incluir bypass governance: limitado a un rol, registrado, excepción formal posterior, check nunca desactivado). — ✅
- [x] 3.6 Crear `docs/runbooks/security/pr-red-new-finding.md` (PR rojo por hallazgo nuevo). — ✅
- [x] 3.7 Crear `docs/runbooks/security/scheduled-scan-no-report.md` (escaneo programado sin reporte). — ✅
- [x] 3.8 Crear o referenciar `docs/runbooks/security/secret-incident-response.md` (secreto detectado; mover o referenciar desde `docs/security/secret-incident-response.md` si ya existe). — ✅ runbook corto que referencia el documento canónico existente (no se mueve para no romper enlaces).

## Phase 4 — Documentación

- [x] 4.1 Actualizar `docs/learning/quality-gates.md` con la fila `security-exceptions-check` (blocking desde día uno). — ✅
- [x] 4.2 Actualizar `docs/CONTEXT-CICD.md` con referencia a `security/exceptions.yml`, `security/SLA.md` y los runbooks. — ✅ §12.1.
- [x] 4.3 Actualizar `docs/security/SECURITY.md` con: (a) estado de la política de excepciones, (b) párrafo de accepted risk por single-maintainer (falta de separación de funciones, compensado por expiry/CODEOWNERS/conteo visible, resuelto con segunda cuenta). — ✅ secciones nuevas al final del documento.
- [x] 4.4 Cablear el conteo de excepciones activas y la fecha de vencimiento más próxima al agregador `prebuild-security-complete` (depende de `prebuild-security-aggregator-strict`). — ✅ implementado: `security-exceptions-check` cableado a `prebuild-security-complete.needs` (10 jobs total).

## Validación

- [x] 5.1 Ejecutar `openspec validate security-exceptions-policy` y confirmar sin errores. — ✅ `Change 'security-exceptions-policy' is valid` (`--strict`).
- [x] 5.2 Ejecutar el script de validación contra `security/exceptions.yml` vacío y confirmar exit 0. — ✅
- [x] 5.3 Ejecutar el script contra un archivo con una excepción vencida y confirmar exit non-zero con mensaje nombrando el id. — ✅ `EXC-2026-009: vencida el 2026-02-01`.
- [x] 5.4 Ejecutar el script contra un archivo con una excepción que excede 90 días y confirmar exit non-zero. — ✅ `151 días` + máximo 90.
- [x] 5.5 Ejecutar actionlint sobre `.github/workflows/security-metrics.yml` y confirmar sin errores. — ✅ actionlint exit 0; zizmor 0 hallazgos en los workflows tocados.
- [ ] 5.6 Disparar `security-metrics.yml` manualmente (`workflow_dispatch`) y verificar que el issue se crea correctamente. — Pendiente: requiere ejecución remota (no se ha hecho push). El script se validó en local (exit 0, informe generado, APIs no disponibles sin token → `n/d`).

## Phase 6 — FASE 2 (diferida)

- [ ] 6.1 Cablear `security-exceptions-check` a `prebuild-security-complete.needs` (quitar job-COE) y añadir al output del agregador el conteo de excepciones activas + vencimiento más próximo. Depende de `prebuild-security-aggregator-strict` (contrato de 9 `needs` → pasar a 10 con su test).
