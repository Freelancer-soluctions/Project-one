# Proposal: smart-test-ordering-ci-verification

## Why

El change archivado `smart-test-ordering` (2026-10-15) quedó con 3 verificaciones pendientes en GitHub Actions que no son ejecutables localmente:

1. Restore del historial `tia-history` en un PR real (task 1.1).
2. Step summary TTFF con un fallo sembrado + corrida verde + script roto (task 2.3).
3. Cuarentena no resucitada en un PR de prueba (task 3.2).

Sin un change dedicado, estas verificaciones se olvidan y el comportamiento end-to-end nunca se confirma.

## What Changes

- Crear un change de seguimiento que liste y trackee las 3 verificaciones pendientes-CI.
- Ejecutarlas en un PR de prueba y marcarlas `[x]` con evidencia.
- Cerrar el change al completar.

## Capabilities

### New Capabilities

- `smart-test-ordering-ci-verification`: checklist de verificación end-to-end del sequencer en CI.

### Modified Capabilities

_(ninguna)_

## Impact

- Solo documentación y tracking; sin cambios de código.
