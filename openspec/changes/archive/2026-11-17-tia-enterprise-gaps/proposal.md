# Proposal: tia-enterprise-gaps

## Why

El review del PRD `Test-Impact-Analysis-(TIA)-en-CI CD-enterprise.md` (2026-11-05) detectó 4 gaps altos que impiden que TIA cumpla el patrón enterprise (selección en PR + suite completa antes de integrar + métricas). Los gaps verificados:

1. **Merge queue no ejecuta tests**: los jobs de test (`test-unit-client`, `test-unit-server`, `property-tests`, `coverage-full-gate`, `test-integration`, `test-smoke`) solo corren en `pull_request`; en `merge_group` se saltan y los agregadores tratan `skipped` como éxito → merge sin tests.
2. **Sin override**: no hay `workflow_dispatch` ni label de PR para forzar la suite completa.
3. **Fallback incompleto**: `shared` no incluye `prisma/schema.prisma`, migraciones, `vite.config`, `vitest.config`, archivos de setup → cambios transversales en diff mixto no disparan suite completa.
4. **Integration sin inyección de fallidos previos**: `test-integration` no pasa por `tia-select` ni inyecta `tia-history`.

## What Changes

- Añadir ejecución de suite completa en `merge_group` para los jobs de test.
- Añadir `workflow_dispatch` con input `full_suite` + label `ci:full-suite` que fuerce suite completa.
- Ampliar `shared` (o comprobación en step TIA) con configs globales, prisma schema y migraciones.
- Routear `test:integration:changed` por `tia-select.mjs` con inyección de fallidos previos.

## Capabilities

### New Capabilities

- `tia-enterprise-gaps`: cierre de los 4 gaps altos del PRD TIA.

### Modified Capabilities

_(ninguna)_

## Impact

- `.github/workflows/ci.yml`: jobs de test, `repo-discovery`, `test-integration`.
- `apps/server/package.json`: `test:integration:changed`.
- `docs/testing-architecture.md`: actualizar paridad TIA.
