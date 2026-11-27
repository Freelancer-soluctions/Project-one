# Proposal

## Why

La auditoría integral del @researcher (2026-11-19) identificó 16 gaps entre la
implementación actual y los estándares empresariales (PRD Stage Build y
TypeScript empresarial). De esos, 4 son gaps reales de bajo/medio esfuerzo
(G1, G2, G3, G4, G8) y 3 son quick wins opcionales (G9, G11, G14). Los 8
restantes son fuera de alcance del PRD o requieren infraestructura que no
existe.

El único gap **real** (no cosmético) es G1+G12: la falta de `git add -N` en el
gate de drift OpenAPI permite que un archivo generado nuevo pase sin detección.

## What Changes

### Gaps reales (Prioridad 1 y 2)

- **G1+G12 (drift gate)**: Añadir `git add -N .` antes de `git diff --exit-code`
  en el gate de drift OpenAPI (`ci.yml:2725-2729`), o verificar `git status
--porcelain` vacío. Detecta archivos generados nuevos que no están trackeados.
- **G2+G3 (skipped eval)**: Añadir evaluación de skipped en
  `postbuild-tests-complete`, `postbuild-analysis-complete` y `ci-complete`
  (como en `build-complete`). Un job saltado sin autorización no debe pasar
  como verde.
- **G4 (CI_MINIMAL)**: Documentar el comportamiento de `CI_MINIMAL` y asegurar
  que no desactive required checks del ruleset.
- **G8 (permissions)**: Cambiar `permissions: contents: read` a `permissions: {}`
  en ci.yml para forzar declaración explícita por job (least privilege).

### Quick wins opcionales (Prioridad 3)

- **G9**: Añadir `# syntax=docker/dockerfile:1` como primera línea del Dockerfile.
- **G11**: Unificar unidades en `budget.json` (kB vs bytes) o documentar
  claramente.
- **G14**: Añadir `noUncheckedSideEffectImports: true` a `tsconfig.base.json`.

### Gaps fuera de alcance (documentados, no implementados)

- G5 (SLSA L3): requiere reusable workflow — PRD lo defiere.
- G6 (cosign/admisión): requiere orquestador (ECS/EKS) — no existe.
- G7 (reproducibilidad bit-a-bit): tsc no soporta SOURCE_DATE_EPOCH — PRD lo deja fuera.
- G10 (`--pull`): explícitamente no requerido con digest pinning.
- G13 (target ES2024): sin beneficio funcional.
- G15 (`isolatedDeclarations`): requiere anotar todo el código.
- G16 (no copiar `src` en runtime): requiere refactor de swagger config.

## Capabilities

- **New Capabilities**: `ci-gaps-priority-1-2`.
- **Modified Capabilities**: (ninguna).

## Impact

- Archivos: `.github/workflows/ci.yml`, `apps/server/Dockerfile`,
  `apps/client/budget.json`, `tsconfig.base.json`, `docs/learning/build-gap-analysis.md`.
- Riesgo: bajo — cambios de 1 línea mayormente, sin cambios de comportamiento
  funcional.
