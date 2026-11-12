# Design — security-exceptions-policy

## Decisiones

1. **Formato de excepciones.** YAML versionado en `security/exceptions.yml` con schema fijo: `id`, `tool`, `finding`, `scope`, `reason`, `owner`, `created`, `expires`, `ticket`. Cada supresión (inline o en archivo) referencia un `id`. El archivo es la única fuente de verdad para riesgos aceptados.

2. **Job de CI custom.** No existe un action de GitHub que valide expiración de excepciones. Se crea un script (bash + yq o python) que parsea `security/exceptions.yml` y falla si alguna excepción tiene `expires < today`, está mal formada, o tiene `expires > created + 90 días`. Se ejecuta en substage 2C como job blocking, cableado a `prebuild-security-complete.needs` desde día uno.

3. **SLA documentado, no automatizado (FASE 1).** El SLA se documenta en `security/SLA.md`. La medición automatizada (métrica "incumplimientos de SLA abiertos") se añade en el workflow de métricas mensual. Incluye: reassignment no reinicia el clock; evidencia de explotación activa → deadline acelerado + re-evaluación inmediata.

4. **Workflow de métricas mensual.** `.github/workflows/security-metrics.yml` con cron mensual que recolecta las 7 métricas del PRD y abre/actualiza un issue con los resultados. También anota el resultado en un artifact del repo (`security/metrics/` o sección en `SECURITY.md`) para retención de evidencia. Requiere `issues: write` permission.

5. **Runbooks.** Un runbook por tipo de fallo (excepción por vencer, secreto detectado, CVE crítico, error de herramienta, licencia denegada, corrección urgente bloqueada, PR rojo por hallazgo nuevo, escaneo programado sin reporte). Formato: situación → primer paso → siguiente paso.

6. **CODEOWNERS.** Añadir entrada `/security/` al CODEOWNERS existente, al final del archivo (respetando last-match-wins), requiriendo revisión del owner apropiado (team `devops-team` o mantenedor de seguridad).

7. **Max expiry 90 días.** Siguiendo la propuesta del PRD. Excepciones permanentes solo para falsos positivos (patrón GitLab).

8. **Single-maintainer accepted risk.** Documentar en `docs/security/SECURITY.md` que la falta de separación de funciones es un riesgo aceptado, compensado por expiry, CODEOWNERS y conteo visible.

9. **Emergency bypass governance.** Documentar en el runbook `urgent-fix-blocked.md` que el bypass se limita a un rol, se registra, y va seguido de una excepción formal. El check nunca se desactiva.

10. **Aggregator reporting.** El agregador `prebuild-security-complete` reporta el conteo de excepciones activas y la fecha de vencimiento más próxima. Cableado desde día uno (depende de `prebuild-security-aggregator-strict`).

## Artifacts a crear

| Archivo                                              | Contenido                                                                                     |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `security/exceptions.yml`                            | Archivo de excepciones (vacío inicialmente, con ejemplo comentado)                            |
| `security/SLA.md`                                    | SLA de remediación por severidad + reglas de clock (incl. reassignment y active-exploitation) |
| `docs/runbooks/security/exception-expiry.md`         | Runbook: excepción por vencer                                                                 |
| `docs/runbooks/security/cve-triage.md`               | Runbook: CVE crítico/KEV en dependencia                                                       |
| `docs/runbooks/security/tool-failure.md`             | Runbook: error de herramienta                                                                 |
| `docs/runbooks/security/license-denied.md`           | Runbook: licencia denegada o desconocida                                                      |
| `docs/runbooks/security/urgent-fix-blocked.md`       | Runbook: corrección urgente bloqueada (incl. bypass governance)                               |
| `docs/runbooks/security/pr-red-new-finding.md`       | Runbook: PR rojo por hallazgo nuevo                                                           |
| `docs/runbooks/security/scheduled-scan-no-report.md` | Runbook: escaneo programado sin reporte                                                       |
| `docs/runbooks/security/secret-incident-response.md` | Runbook: secreto detectado (referencia o mover desde `docs/security/`)                        |
| `.github/workflows/security-metrics.yml`             | Workflow mensual de métricas (con repo-annotated result)                                      |

## No se toca

- `ci.yml` jobs existentes (solo se añade el nuevo job blocking, cableado al agregador).
- `security.yml` ni `scheduled-security.yml`.
- No se implementa OSV-Scanner, Snyk, TruffleHog, ni push protection.
