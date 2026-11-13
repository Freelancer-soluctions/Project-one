# Design

## Context

knip blocking en modo default, sin cache, desactualizado, config con muchos ignore. PRD quiere advisory + --production + --cache + ratchet.

## Goals / Non-Goals

**Goals:** Calibrar knip (upgrade, modos, cache, ratchet, promoción documentada).

**Non-Goals:** No bloquear legado de golpe; no cambiar reglas de negocio.

## Decisions

1. Upgrade a 6.45.1 primero.
2. `--production --cache --no-exit-code` en PR; default en scheduled.
3. Ratchet por severidad (warn→error al llegar a cero).
4. Promoción a blocking estricto documentada en `quality-policy.md`.

## Risks / Trade-offs

- Falsos positivos de config. Mitigación: `--no-exit-code` hasta calibrar.
- Upgrade puede cambiar hallazgos. Mitigación: regenerar baseline en PR de upgrade; validar flags en 6.45.1 antes de mergear (verificación A3).
- Dependencia oculta sobre `quality-policy.md`: este change exige documentar ratchet/promoción en ese archivo, pero lo crea `ci-quality-gates-blocking-hardening` (P1). Mitigación: si hardening no aterrizó, crear la plantilla mínima de la tabla de gates aquí.
- Conflicto con `ci-prebuild-substage-structure-phase2`: phase2 está superseded (sus jobs ya no tienen `continue-on-error`). Este change establece el estado advisory durante calibración. Reconciliar antes de implementar.

## Migration Plan

1. Upgrade knip + actualizar $schema.
2. Añadir flags a jobs.
3. Revisar ignore/ignoreDependencies.
4. Documentar ratchet y promoción.

## Open Questions

- D5: nivel final del gate (advisory vs blocking) se decide tras calibración.
