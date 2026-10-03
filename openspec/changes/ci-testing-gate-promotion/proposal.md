# Proposal

## Why

`ci-testing-pipeline-reactivation` dejó los 6 jobs de testing (unit client/server, integration, smoke y los dos
guards de cobertura) corriendo en **FASE 1 advisory**: ejecutan de verdad, publican artefactos y anotan el PR, pero
llevan `continue-on-error: true`, así que un test rojo **no bloquea el merge**.

Eso fue deliberado y correcto: reactivar gates sin haber visto fallos reales convierte el primer flake de
infraestructura en un bloqueo que empuja al developer a `--no-verify`. Pero un gate que avisa y no bloquea tiene un
coste propio: cada PR depende de que alguien lea los logs a mano para saber si estaba rojo. Eso no es gobernanza,
es cortesía.

Este change recoge lo que quedó fuera del anterior **a propósito**: la ventana de calibración y la promoción a
FASE 2. Se separó porque no es "implementación pendiente" — es esperar a que la realidad ocurra, con su propio riesgo
y su propia evidencia.

## What Changes

- **Ventana de calibración** sobre corridas reales de `ci.yml` en GitHub: cada fallo se tria explícitamente (test
  rojo → corregir el test; timeout → ajustar con la duración medida; infraestructura → corregir la infra, nunca
  reintentar en silencio). Se registra la duración por job.
- **Promoción a FASE 2**: quitar `continue-on-error: true` de los 6 jobs en un único PR, con el cambio de estado
  documentado en lockstep en `docs/learning/quality-gates.md` §2 y §4.2.
- **Guard de "cero tests" en el gate local** (tarea 8.8 de `ci-testing-pipeline-reactivation`, abierta): el guard
  existe en los jobs de CI pero no en `.husky/pre-push`, donde un diff sin tests relacionados produce un falso verde.
- **Cierre de `4.V` y `5.V`** del change anterior, que solo se pueden observar con corridas reales.

## Non-Goals

- **Sharding**: cerrado como `N/A` con evidencia en `ci-testing-pipeline-reactivation` (tarea 6.0). Las suites
  miden 5-6s (server) y 14s (client) frente a un umbral de activación de 5-8 min. No se reabre sin evidencia nueva.
- **E2E**: el job `e2e` sigue `if: false`; su activación es otro change (`ci-e2e` contract ya está especificado).
- Cambios de comportamiento en TIA, quarantine o métrica semanal: ya están implementados y verificados.

## Impact

- `openspec/specs/ci-test-jobs-activation` — se le añade el requirement de FASE 2 blocking (se le retiró del delta
  del change anterior para no sincronizar un requirement incumplido).
- `.github/workflows/ci.yml` — 6 jobs pierden `continue-on-error: true`.
- `.husky/pre-push` — guard de cero tests.
- `docs/learning/quality-gates.md` — estado advisory → blocking.
- `docs/CONTEXT-CICD.md` §3.3 / §10.6 — tabla de jobs y hueco del hook.

## Capabilities

### New Capabilities

- Ninguna: este change **completa** `ci-test-jobs-activation` con su segunda fase.

### Modified Capabilities

- `ci-test-jobs-activation`: añade el requirement de promoción a FASE 2 blocking (ya descrito arriba).

### Removed Capabilities

- Ninguna.
