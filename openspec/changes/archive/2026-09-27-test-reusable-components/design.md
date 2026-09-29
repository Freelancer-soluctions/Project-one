## Context

El proyecto tiene una estrategia de testing documentada en `docs/testing-architecture.md` pero no está completamente implementada para componentes reutilizables del frontend.

**Estado actual:**

- Infraestructura lista: Vitest, Testing Library, MSW, jsdom
- `tests/setup/msw/` existe con handlers básicos
- Solo `404/NotFound` tiene tests como prueba de concepto

**Infraestructura existente:**

```
tests/setup/
├── setupTest.js       → MSW lifecycle + cleanup
├── test-utils.js      → Custom render
└── msw/
    ├── server.js      → setupServer
    ├── handlers/
    │   └── handlers.js → Auth básico (needs extension)
    └── fixtures/      → Vacío, listo para usar
```

## Goals / Non-Goals

**Goals:**

- Tests unitarios para todos los componentes reutilizables (`.unit.test.jsx`)
- Tests de integración para componentes con dependencias externas (`.integration.test.jsx`)
- Seguir patrones establecidos en `NotFound` y convenciones del `testing-architecture.md`
- Mocks con `vi.mock` para unit tests
- MSW + Redux real + Router real para integration tests

**Non-Goals:**

- No modificar componentes (solo agregar tests)
- No agregar storybook tests
- No agregar e2e tests
- Backend testing (futuro)

## Decisions

### 1. Estrategia de testing por componente

| Tipo de Test                          | Cuándo                                            | Herramientas                   |
| ------------------------------------- | ------------------------------------------------- | ------------------------------ |
| Unit (`.unit.test.jsx`)               | Todos los componentes                             | `vi.mock`, sin MSW, sin Redux  |
| Integration (`.integration.test.jsx`) | Guards, AlertDialog, QuickAccess, ProtectedRoutes | MSW + Router real + Redux real |

**Decisión**: Seguir el patrón de `NotFound` que ya existe en el proyecto.

### 2. Estructura de archivos

Tests al lado del componente:

```
components/
  alertDialog/
    AlertDialog.jsx
    AlertDialog.unit.test.jsx
    AlertDialog.integration.test.jsx
```

**Decisión**: Co-located tests como indica `testing-architecture.md`.

### 3. Mocks específicos

**Unit tests** (`vi.mock`):

```javascript
// react-router
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => vi.fn() };
});

// i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

// Componentes UI (shadcn)
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
```

**Integration tests** (MSW):

- MSW interceptor para requests HTTP
- Store Redux real
- Router real (MemoryRouter)

### 4. Componentes con necesidades especiales

| Componente        | Desafío         | Solución                                            |
| ----------------- | --------------- | --------------------------------------------------- |
| `ProtectedRoutes` | Redux + JWT     | Unit: mock todo. Integration: MSW + store real      |
| `AlertDialog`     | Radix UI Dialog | Unit: smoke test. Integration: tests de interacción |
| `DataTable`       | @tanstack/table | Unit por archivo (Filter, Pagination, etc.)         |
| `QuickAccess`     | Radix Popover   | Integration test con interacción real               |

### 5. Handlers de MSW

Extender `tests/setup/msw/handlers/handlers.js` con handlers para auth:

```javascript
http.get('/api/auth/me', () => HttpResponse.json({ id: 1, role: 'admin' }));
http.post('/api/auth/logout', () => HttpResponse.json({ success: true }));
```

## Risks / Trade-offs

| Riesgo                                     | Mitigación                                           |
| ------------------------------------------ | ---------------------------------------------------- |
| Radix UI Dialogs son difíciles de testear  | Usar `screen.findByRole` + waitFor                   |
| ProtectedRoutes depende de estado complejo | Integration test con store pre-poblado               |
| DataTable tiene múltiples sub-componentes  | Tests independientes por archivo                     |
| Tests lentos por MSW overhead              | Unit tests rápidos, solo integration donde necesario |

## Open Questions

1. ¿Los tests de `dataTable/` necesitan datos mockeados reales o fixtures genéricos?
2. ¿`ProtectedRoutes` integration test necesita simular rehidratación de Redux persist?
