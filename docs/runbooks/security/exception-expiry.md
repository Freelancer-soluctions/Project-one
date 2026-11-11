# Runbook — excepción por vencer / vencida

## Situación

`security-exceptions-check` falla (o el informe mensual avisa) porque una
entrada de `security/exceptions.yml` vence en ≤ 14 días o ya venció.

## Primer paso

1. Localizar la entrada: `node scripts/ci/security-exceptions.mjs` (nombra el
   `id` y la fecha) o el issue `[monthly-security-metrics]`.
2. Abrir el `ticket` de la excepción y comprobar si el motivo sigue vigente
   (¿el falso positivo persiste? ¿hay parche disponible?).

## Siguiente paso

- **Si el motivo ya no aplica:** retirar la supresión (config de la
  herramienta o pragma inline) y borrar la entrada del YAML **en el mismo PR**.
- **Si sigue vigente:** renovar `created`/`expires` (máx. 90 días) con la
  justificación actualizada y revisión de `/security/` (CODEOWNERS).
- **Si no hay acuerdo:** escalar en el issue mensual; una excepción vencida
  que no se renueva ni se retira es un riesgo no gobernado (SLA.md §5).

No se desactiva el job ni se añade `continue-on-error` para salir del paso.
