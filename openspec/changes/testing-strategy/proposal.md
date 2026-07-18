## Why

Un ERP empresarial requiere una estrategia de testing robusta para garantizar la calidad del software, prevenir regresiones y prepararse para eventual cumplimiento regulatorio. Actualmente el proyecto tiene infraestructura de testing configurada (Vitest, Playwright) pero carece de tests E2E implementados y carece de documentación sobre smoke y regression testing.

## What Changes

- Completar la suite de E2E tests con Playwright (actualmente configurado pero sin tests)
- Implementar smoke tests para verificación post-deploy
- Establecer estrategia de regression testing con suite core
- Actualizar documentación de testing-architecture.md con gaps identificados
- Definir prioridades de testing por módulos del ERP

## Capabilities

### New Capabilities

- `e2e-testing`: Implementar tests E2E con Playwright para flujos críticos del ERP (login, dashboard, CRUD de módulos principales)
- `smoke-testing`: Scripts de verificación rápida post-deploy para validar que el sistema responde correctamente
- `regression-testing`: Suite de tests core que se ejecutan antes de cada commit para prevenir regresiones
- `testing-documentation`: Actualización de docs/testing-architecture.md con estrategia completa

### Modified Capabilities

- Ninguno (es una implementación nueva)

## Impact

- **apps/client/**: Tests unitarios e integracion existentes + nuevos E2E
- **apps/server/**: Tests de API existentes + coverage adicional
- **e2e/**: Nuevo directorio de tests Playwright
- **docs/**: Actualización de testing-architecture.md
- **package.json**: Scripts de smoke y regression testing
