# Tasks

## 1. Prioridad 1 — Crítico (gap real)

- [ ] 1.1 Añadir `git add -N .` antes de `git diff --exit-code apps/server/openapi.yaml` en el gate de drift OpenAPI (`ci.yml:2725-2729`), o verificar `git status --porcelain` vacío.
- [ ] 1.2 Verificar que el gate ahora detecta archivos generados nuevos (test con un archivo nuevo no trackeado).

## 2. Prioridad 2 — Medio (governance)

- [ ] 2.1 Añadir evaluación de skipped en `postbuild-tests-complete` (`ci.yml:3851-3861`): fallar si hay skipped no autorizado.
- [ ] 2.2 Añadir evaluación de skipped en `postbuild-analysis-complete` (`ci.yml:3875-3885`): fallar si hay skipped no autorizado.
- [ ] 2.3 Añadir evaluación de skipped en `ci-complete` (`ci.yml:3916-3926`): fallar si hay skipped no autorizado.
- [ ] 2.4 Documentar el comportamiento de `CI_MINIMAL` (`ci.yml:3901`): asegurar que no desactive required checks del ruleset.
- [ ] 2.5 Cambiar `permissions: contents: read` a `permissions: {}` en ci.yml (`ci.yml:3-5`) y asegurar que cada job declare `contents: read` donde lo necesite.

## 3. Prioridad 3 — Quick wins opcionales

- [ ] 3.1 Añadir `# syntax=docker/dockerfile:1` como primera línea del Dockerfile (`apps/server/Dockerfile:1`).
- [ ] 3.2 Unificar unidades en `budget.json` (`apps/client/budget.json:7-11`) o documentar claramente (kB vs bytes).
- [ ] 3.3 Añadir `noUncheckedSideEffectImports: true` a `tsconfig.base.json`.

## 4. Verificación

- [ ] 4.1 Ejecutar `actionlint` sobre ci.yml (EXIT 0 esperado).
- [ ] 4.2 Ejecutar `npm run type-check` (EXIT 0 esperado).
- [ ] 4.3 Verificar que el gate de drift ahora detecta archivos nuevos (test manual).
