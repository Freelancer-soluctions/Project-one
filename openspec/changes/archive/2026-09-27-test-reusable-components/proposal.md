## Why

Los componentes reutilizables en `apps/client/src/components/` (excluyendo `ui/` que es shadcn) actualmente carecen de cobertura de tests, lo que limita la capacidad de refactorizar con confianza y detectar regresiones. Solo `404/NotFound` tiene tests como prueba de concepto.

## What Changes

- Agregar tests unitarios para todos los componentes reutilizables del cliente
- Agregar tests de integración donde aplique (guards, alertDialog, etc.)
- Seguir las convenciones establecidas en `docs/testing-architecture.md`
- Usar el patrón de naming: `.unit.test.jsx` y `.integration.test.jsx`

## Capabilities

### New Capabilities

- `client-component-testing`: Cobertura completa de tests para componentes reutilizables en `apps/client/src/components/`

### Modified Capabilities

- Ninguna

## Impact

- **Archivos affected**: 9 carpetas de componentes (`500/`, `alertDialog/`, `backDash/`, `dataTable/`, `guards/`, `layout/`, `loader/`, `quickAccess/`)
- **Dependencias**: Vitest, Testing Library, MSW (ya configurados)
- **Nuevas carpetas**: `tests/setup/msw/fixtures/` y handlers para auth
