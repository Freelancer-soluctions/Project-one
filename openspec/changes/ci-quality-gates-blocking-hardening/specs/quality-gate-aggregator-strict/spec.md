# quality-gate-aggregator-strict Specification

## Purpose

Hace estricto el agregador `prebuild-quality-complete`: cualquier resultado distinto de `success` (`failure`, `cancelled`, `skipped` no autorizado) falla el gate, y los valores de `needs` se pasan por variable de entorno en lugar de interpolarse en `run:`. Sin esto, un job saltado o cancelado pasaba en verde y ningún bloqueo posterior protegía el merge.

## ADDED Requirements

### Requirement: Agregador trata `skipped` como fail salvo autorizado

El job `prebuild-quality-complete` SHALL fallar si algún job en `needs` termina en `failure`, `cancelled` o `skipped`, salvo que el `skipped` esté autorizado por la salida de `repo-discovery` (change detection). Un job omitido por condición `if` reporta `Success` y satisface el requisito; un workflow omitido por filtro de rutas/ramas/mensaje reporta `Pending` y bloquea el merge.

#### Scenario: Job obligatorio saltado sin autorización

- **WHEN** un job obligatorio de calidad termina en `skipped` sin que `repo-discovery` lo autorice
- **THEN** `prebuild-quality-complete` SHALL fallar (exit 1)
- **AND** el PR no se mergea

#### Scenario: Job saltado autorizado por change detection

- **WHEN** `repo-discovery` indica que un área no cambió (p. ej. `client == false`)
- **THEN** el job correspondiente se omite y `prebuild-quality-complete` lo tolera
- **AND** el agregador reporta success si el resto pasa

#### Scenario: Job cancelado

- **WHEN** un job de calidad se cancela
- **THEN** `prebuild-quality-complete` SHALL fallar (exit 1)

### Requirement: Sin interpolación de `needs` en `run:`

El agregador SHALL pasar los resultados de `needs` mediante una variable de entorno (`env: NEEDS: ${{ toJSON(needs) }}`) y evaluarlos en el script con `jq`/`node`, nunca interpolando `${{ }}` directamente dentro de `run:`. Esto evita template injection y sigue el patrón documentado por GitHub.

#### Scenario: Evaluación segura

- **WHEN** el agregador evalúa los resultados
- **THEN** el script lee `$NEEDS` desde el entorno
- **AND** no contiene `${{ }}` dentro del bloque `run:`

#### Scenario: Veredicto estricto

- **WHEN** todos los jobs en `needs` terminan en `success`
- **THEN** el agregador reporta success
- **WHEN** algún job termina en `failure`, `cancelled` o `skipped` no autorizado
- **THEN** el agregador falla con exit 1

### Requirement: Un solo check requerido (ruleset)

El ruleset de `main` SHALL exigir únicamente `Prebuild Quality Complete` (y `Prebuild Governance Complete` si aplica) como check requerido del stage Quality, de modo que los nombres de jobs individuales puedan cambiar sin bloquear merges. Los workflows SHALL incluir el trigger `merge_group` para revalidar contra la base actualizada.

#### Scenario: Merge queue

- **WHEN** un PR entra en la merge queue
- **THEN** los workflows de calidad se re-ejecutan con `merge_group`
- **AND** el agregador se re-evalúa contra la base actualizada
