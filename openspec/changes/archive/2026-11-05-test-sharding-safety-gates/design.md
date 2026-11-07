# Design: test-sharding-safety-gates

## Context

Gaps reales del PRD de Test Sharding independientes del sharding: RI-10 (forbidOnly), RI-9 (comando local), A5 (conteo). El sharding matriz sigue dormido (N/A) por suites rápidas.

## Goals / Non-Goals

**Goals:**

- Cerrar RI-10 y RI-9 como cambios definitivos (blocking).
- Documentar el comando local de shard.

**Non-Goals:**

- No activar la matriz de sharding (suites rápidas, N/A documentado).

## Decisions

- **D1 — allowOnly en Vitest**: `allowOnly: !process.env.CI` (permite .only en local, prohíbe en CI).
- **D2 — forbidOnly en Playwright**: `forbidOnly: !!process.env.CI`.
- **D3 — Comando local documentado**: `npx playwright test --shard=2/4` y `npx vitest run --shard=2/4`.
