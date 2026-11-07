# Design: tia-enterprise-gaps

## Context

El PRD TIA exige suite completa antes de integrar (merge queue) y override manual. El sistema actual solo corre tests en PRs.

## Goals / Non-Goals

**Goals:**

- Cerrar los 4 gaps altos verificados por el review.

**Non-Goals:**

- No cambiar la selección estática ni el sequencer (ya implementados).

## Decisions

- **D1 — Merge queue**: quitar la cláusula `pull_request` de los jobs de test para que también corran en `merge_group`, o añadir job dedicado. Preferir quitar la cláusula (menos duplicación).
- **D2 — Override**: `workflow_dispatch` con input `full_suite: boolean` + label `ci:full-suite` comprobada en `Resolve TIA scope`.
- **D3 — Fallback**: ampliar `shared` con `apps/client/vite*`, `apps/client/vitest*`, `apps/server/vitest*`, `apps/**/setup*`, `apps/server/prisma/**`, `vitest.shared.js`, `vitest.sequencer.js`, `tsconfig.json` (raíz).
- **D4 — Integration injection**: routear por `tia-select.mjs` como los jobs unit.

## Migration Plan

1. Ampliar `shared` filter (más seguro, menos riesgo).
2. Añadir override.
3. Routear integration por tia-select.
4. Habilitar merge queue (último, requiere validación).
