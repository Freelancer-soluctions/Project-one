# Proposal

## Why

El agregador `build-complete` en `ci.yml` está cableado pero emite verde "succeeded or skipped" (skipped cuenta como éxito), y `CI_MINIMAL` no lo gatea. El ruleset de `main` no exige ningún check de build. Los gates G1-G7 del PRD (compilación, construcción de imagen, atestaciones, escaneo, arranque, presupuesto de tiempo, tamaño) no están definidos ni conectados a un agregador estricto. Un job omitido sin autorización no bloquea.

## What Changes

- Reescribir `build-complete` para que falle ante `failure`, `cancelled` y `skipped` no autorizado (`if: always()` con evaluación explícita de resultados).
- Activar `merge_group` trigger en `ci.yml` (si hay cola de merge) para que los checks obligatorios no queden pending.
- Añadir `build-complete` al ruleset de `main` como required check (tras ≥1 run real).
- Definir los gates G1-G7 con niveles inicial (G1-G3 bloqueantes, G4 advisory 2-4 semanas, G5/G7 advisory).
- Añadir `timeout-minutes` a todos los jobs del stage build.
- Documentar excepciones (vulnerabilidades aceptadas con fecha de caducidad).

## Capabilities

- **New Capabilities**: `ci-build-gates`.
- **Modified Capabilities**: `ruleset-expansion` (añadir `build-complete` como required check).

## Impact

- Archivos: `.github/workflows/ci.yml` (agregador + triggers), ruleset de GitHub (via gh api), docs.
- Riesgo: bajo para el código; medio para la gobernanza (cambiar el ruleset requiere ≥1 run real).