# Design: coverage-merge-gate-hardening

## Context

Gaps del Coverage Merge Gate verificados por el review (2026-11-05). El bindeo al ruleset se hace después (acción manual). Aquí se cierran los gaps implementables como blocking.

## Goals / Non-Goals

**Goals:**

- ci-complete falla en cancelled/skipped inesperado.
- Conteo exacto de parciales.
- Artefacto fusionado 14d.
- CODEOWNERS explícito.
- Diff coverage básico.
- Validación en PR real.

**Non-Goals:**

- No bindear al ruleset (acción manual posterior).

## Decisions

- **D1 — ci-complete**: fallar en cancelled siempre; skipped solo si es esperado (docs-only).
- **D2 — Conteo exacto**: verificar `blob-<i>-<n>.json` contra M, listar ausentes.
- **D3 — Diff coverage**: script que cruza lcov con `git diff` y falla si archivos nuevos bajan del umbral. Herramienta: script propio sobre lcov.
- **D4 — Artefacto fusionado**: upload `coverage/` como artefacto 14d desde client-coverage/server-coverage.
