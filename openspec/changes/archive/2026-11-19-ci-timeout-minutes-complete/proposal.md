# Proposal

## Why

6 de los jobs de `ci.yml` no tienen `timeout-minutes` a nivel de job: `verify-signatures` (solo lo tiene a nivel de step, 3 ocurrencias), `prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-tests-complete` y `ci-complete`. El PRD §"Gates del stage" (G6) exige que el job termine dentro de `timeout-minutes` y falle si lo excede. Un job colgado consume runner indefinidamente.

## What Changes

- Añadir `timeout-minutes` a los 8 jobs restantes de `ci.yml` (los 6 listados arriba más `commit-lint` y `dco`, que también carecían de él).
- Verificar que `build.yml` ya tiene timeout en todos sus jobs (6/6).
- Documentar los valores elegidos (p. ej. 10min para aggregators, 5min para verify-signatures).

## Capabilities

- **New Capabilities**: `ci-timeout-minutes-complete`.
- **Modified Capabilities**: (ninguna).

## Impact

- Archivos: `.github/workflows/ci.yml`.
- Riesgo: bajo.
- **Alcance real (2026-11-18):** 8 jobs sin timeout a nivel de job (`commit-lint` y `dco` no estaban
  en el listado inicial). `build.yml` ya estaba completo (6/6). Ver «Resultado de la verificación»
  en `tasks.md`.
