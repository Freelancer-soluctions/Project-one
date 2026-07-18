## Context

El proyecto es un ERP empresarial (monorepo con Express + React). Ya existe infraestructura de testing pero faltan componentes críticos:

**Estado actual:**

- Unit tests: Vitest configurado en client y server (~30 test files)
- Integration: Vitest + Supertest en server
- E2E: Playwright configurado pero SIN tests implementados
- Documentación: docs/testing-architecture.md incomplete (falta smoke, regression, priorities)

**Contexto del proyecto:**

- Solo un desarrollador
- 30+ módulos en el ERP (usuarios, empleados, ventas, payroll, inventario, etc.)
- Objetivo: terminar desarrollo y escalar
- Sin usuarios reales aún (simular como si los hubiera)

## Goals / Non-Goals

**Goals:**

1. Implementar 5-7 tests E2E con Playwright para flujos críticos
2. Crear smoke tests para verificación post-deploy
3. Establecer suite de regression testing
4. Actualizar documentación de testing
5. Definir prioridades de testing por módulos del ERP

**Non-Goals:**

- Contract testing (sin múltiples consumers)
- Mutation testing (recursos limitados)
- Performance testing con k6 (sin usuarios reales)
- Tests para TODOS los módulos (solo los críticos)

## Decisions

### D1: Herramienta E2E

**Decisión:** Playwright (ya configurado)
**Alternativas:** Cypress, Puppeteer
**Rationale:** Configuración existente, mejor soporte para múltiples browsers, integración con CI

### D2: Estructura de tests E2E

**Decisión:**tests/e2e/specs/ con subdirectorios por módulo
**Rationale:** Organizado por área de negocio, escalable

### D3: Smoke tests como scripts npm

**Decisión:** Scripts en package.json que ejecutan tests seleccionados
**Alternativas:** Docker healthchecks, CI pipeline
**Rationale:** Simple, ejecutable manualmente o en CI

### D4: Priorización de módulos

**Decisión:** Tres niveles de prioridad basados en riesgo
**Rationale:**有限的 recursos = máximo impacto

```
CRÍTICO (dinero): sale, payroll, purchase, clientOrder, users
ALTO (negocio): inventoryMovement, stock, products, employees, attendance, vacation, permission
NORMAL (support): news, notes, events, settings, clients, providers
```

## Risks / Trade-offs

- [R1: Tests E2E son fragiles] → Mitigation: Mantener solo 5-7 tests core, actualizar cuando el UI cambie
- [R2: Tiempo de ejecución E2E] → Mitigation: Ejecutar solo en CI, no en pre-commit local
- [R3: Cobertura insuficiente] → Mitigation: Focus en módulos críticos primero
- [R4: Maintenance load] → Mitigation: Documentar patrones y mantener nombres consistentes

## Migration Plan

1. Crear estructura de archivos E2E
2. Implementar primer test (login)
3. Agregar 4-6 tests más progresivamente
4. Agregar scripts de smoke a package.json
5. Configurar pre-commit para regression
6. Actualizar documentación

## Open Questions

- ¿Cuántos E2E tests iniciales? Propuesta: 5-7 flows
- ¿Ejecutar E2E en pre-commit o solo en CI? Propuesta: CI only
- ¿Usar datos reales o fixtures en E2E? Propuesta: Fixtures controlados
