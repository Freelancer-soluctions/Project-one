# Design — security-exceptions-policy

## Decisiones

1. **Formato de excepciones.** YAML versionado en `security/exceptions.yml` con schema fijo: `id`, `tool`, `finding`, `scope`, `reason`, `owner`, `created`, `expires`, `ticket`. Cada supresión (inline o en archivo) referencia un `id`. El archivo es la única fuente de verdad para riesgos aceptados.

2. **Job de CI custom.** No existe un action de GitHub que valide expiración de excepciones. Se crea un script (bash + yq o python) que parsea `security/exceptions.yml` y falla si alguna excepción tiene `expires < today` o está mal formada. Se ejecuta en substage 2C como job advisory en FASE 1; en FASE 2 se cablea al agregador.

3. **SLA documentado, no automatizado (FASE 1).** El SLA se documenta en `security/SLA.md`. La medición automatizada (métrica "incumplimientos de SLA abiertos") se añade en el workflow de métricas mensual.

4. **Workflow de métricas mensual.** `.github/workflows/security-metrics.yml` con cron mensual que recolecta las 7 métricas del PRD y abre/actualiza un issue con los resultados. Requiere `issues: write` permission.

5. **Runbooks.** Un runbook por tipo de fallo (excepción por vencer, secreto detectado, CVE crítico, error de herramienta, licencia denegada, corrección urgente bloqueada). Formato: situación → primer paso → siguiente paso.

6. **CODEOWNERS.** Añadir entrada `/security/` al CODEOWNERS existente (si no está) para que cambios en excepciones requieran revisión.

7. **Max expiry 90 días.** Siguiendo la propuesta del PRD. Excepciones permanentes solo para falsos positivos (patrón GitLab).

## Artifacts a crear

| Archivo                                      | Contenido                                                          |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `security/exceptions.yml`                    | Archivo de excepciones (vacío inicialmente, con ejemplo comentado) |
| `security/SLA.md`                            | SLA de remediación por severidad + reglas de clock                 |
| `docs/runbooks/security/exception-expiry.md` | Runbook: excepción por vencer                                      |
| `docs/runbooks/security/cve-triage.md`       | Runbook: CVE crítico/KEV en dependencia                            |
| `docs/runbooks/security/tool-failure.md`     | Runbook: error de herramienta                                      |
| `.github/workflows/security-metrics.yml`     | Workflow mensual de métricas                                       |

## No se toca

- `ci.yml` jobs existentes (solo se añade el nuevo job advisory).
- `security.yml` ni `scheduled-security.yml`.
- No se implementa OSV-Scanner, Snyk, TruffleHog, ni push protection.
