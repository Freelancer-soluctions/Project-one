# Design: smart-test-ordering-ci-verification

## Context

El change `smart-test-ordering` (archivado 2026-10-15) implementó el sequencer fail-first, la métrica TTFF y la auditoría de order-dependence. Las verificaciones end-to-end en GitHub Actions quedaron como "Pendiente-CI" porque no son ejecutables en local.

## Goals / Non-Goals

**Goals:**

- Trackear y ejecutar las 3 verificaciones pendientes en un PR de prueba.
- Registrar evidencia (links a runs, step summaries) en tasks.md.

**Non-Goals:**

- No modificar código ni specs del change original.

## Decisions

**D1 — Change de seguimiento, no de implementación.** Solo checklist y evidencia. Sin cambios de código.

## Migration Plan

1. Abrir un PR de prueba con un fallo sembrado.
2. Ejecutar las 3 verificaciones.
3. Marcar tasks `[x]` con evidencia.
4. Archivar.
