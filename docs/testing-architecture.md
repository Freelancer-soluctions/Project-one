    # Testing Architecture

## 1. Overview

Este monorepo implementa una arquitectura de testing basada en separación de responsabilidades, orientada a garantizar calidad, escalabilidad y feedback rápido durante el desarrollo.

La estrategia no está centrada en herramientas, sino en capas de validación del sistema.

---

## 2. Estructura del Monorepo

```plaintext
apps/
  client/        # Aplicación React (UI)
  server/        # API Express

e2e/             # Suite de pruebas end-to-end (Playwright)

docs/            # Documentación técnica
```

---

## 3. Estrategia de Testing

Se utiliza una pirámide de testing clásica:

```
E2E (Playwright)
-------------------------
Integration (Backend)
-------------------------
Unit (Client + Server)
```

---

## 4. Capas de Testing

### 4.1 Unit Testing

#### Client (React)

* Herramientas: Vitest + Testing Library
* Entorno: `jsdom`

**Objetivo:**
Validar comportamiento de componentes y hooks sin depender de implementación interna.

---

#### Server (Express)

* Herramienta: Vitest
* Entorno: `node`

**Objetivo:**
Validar lógica de negocio, servicios y funciones puras.

---

### 4.2 Integration Testing (Server)

* Herramientas: Vitest + Supertest

**Objetivo:**
Validar endpoints HTTP, controladores y flujo entre capas del backend (Server).

---

### 4.3 End-to-End Testing (E2E)

* Herramienta: Playwright
* Ubicación: `e2e/tests`

**Características:**

* Ejecuta pruebas sobre el sistema completo
* Levanta frontend y backend automáticamente
* Simula interacción real del usuario

**Objetivo:**
Validar flujos críticos desde la perspectiva del usuario final.

---

### 4.4 UI Testing (Storybook)

* Herramienta: Storybook

**Objetivo:**

* Documentación visual de componentes
* Testing de estados de UI
* Base para visual regression

---

## 5. Workspaces y Orquestación

El monorepo utiliza **npm workspaces**, donde cada módulo define sus propios scripts de testing.

### Ejecución desde root

```bash
npm run test
```

### Scripts principales

* Unit tests:

  ```bash
  npm run test:unit
  ```

* Integration tests:

  ```bash
  npm run test:integration
  ```

* E2E:

  ```bash
  npm run test:e2e
  ```

---

### Importante

El root **no ejecuta herramientas directamente** (Vitest, Playwright).

El root actúa como **orquestador**, delegando la ejecución a cada workspace mediante:

```bash
npm run <script> --workspace=<name>
```

---

## 6. Principios de Diseño

### 6.1 Aislamiento

* Cada capa se prueba de forma independiente
* No se comparten estados entre tests

---

### 6.2 Independencia por entorno

* Client usa `jsdom`
* Server usa `node`
* E2E usa entorno real (browser)

---

### 6.3 Determinismo

* Tests no dependen de datos externos
* Uso de mocks, fixtures o entornos controlados

---

### 6.4 Escalabilidad

La arquitectura permite añadir fácilmente:

* Contract testing
* Visual regression testing
* Performance testing
* Testing con bases de datos reales

---

## 7. Convenciones

### Naming

*.unit.test.js         → lógica pura (unit testing)
*.ui.test.js           → componentes (UI testing con React Testing Library)
*.integration.test.js  → integración entre módulos (store, router, APIs)

Se evita el uso genérico de *.test.js o *.spec.js sin contexto, ya que no permite identificar la intención del test.

---

### Backend (Ajustar una vez se comience a hacer pruebas)

```plaintext
tests/
  unit/
  integration/
```

---

### Frontend

```plaintext
Ejemplo en código compartido

components/
  alertDialog/
    AlertDialog.jsx
    AlertDialog.ui.test.jsx

hooks/
  useAuth.js
  useAuth.unit.test.jsx

Ejemplo en módulos (feature-based)

modules/
  attendance/
    api/
      attendanceApi.js
      attendanceApi.unit.test.jsx

    components/
      AttendanceDialog.jsx
      AttendanceDialog.ui.test.jsx

    pages/
      Attendance.jsx
      Attendance.integration.test.jsx

    utils/
      schema.js
      schema.unit.test.js


```
Excepciones

Las pruebas que requieren entorno completo o navegador real se ubican fuera de src:
```plaintext
tests/
  e2e/   → Playwright / Cypress
```

---
## 8. Estrategia de Mocks

La estrategia de mocks define cómo se controlan las dependencias externas durante el testing, garantizando pruebas deterministas, rápidas y mantenibles. En este proyecto, se adopta un enfoque por capas alineado con buenas prácticas modernas en aplicaciones React con Redux Toolkit y RTK Query.

---

### 8.1 Principios

- **Determinismo**: Los tests no deben depender de factores externos (red, tiempo, servicios reales).
- **Aislamiento controlado**: Se mockean únicamente dependencias externas.
- **Realismo progresivo**: A mayor nivel de test, menor uso de mocks manuales.
- **Fuente única de verdad**: Las APIs se mockean centralizadamente.

---

### 8.2 Qué se Mockea

#### ✅ Se mockea:
- Requests HTTP (APIs externas)
- Navegación (`react-router`)
- Funciones de librerías externas no deterministas
- Tiempo (`Date`, `setTimeout`, etc.)

#### ❌ No se mockea:
- Lógica de negocio interna
- Selectores de Redux
- Hooks propios (salvo casos muy específicos)
- Estado global en integration tests

---

### 8.3 Estrategia por Tipo de Test

---

#### 🧩 Unit Testing

Objetivo: Validar lógica aislada.

**Características:**
- Uso de `vi.mock`
- Sin conexión a red
- Sin MSW
- Sin store real de Redux

**Ejemplo:**

```js
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn()
}));
```

#### 🔗 Integration Testing
**Objetivo:** Validar la interacción entre componentes y el estado de la aplicación.

### Características
* **MSW:** Uso de *Mock Service Worker* para simular APIs.
* **Store:** Uso del store real de **Redux Toolkit**.
* **Router:** Uso del router real.
* **Hooks:** No se mockean los hooks de RTK Query.

### Flujo de Datos
Componente → RTK Query → fetch → **MSW intercepta** → MSW responde mock

---

## 8.4 Mocking de APIs con MSW
Se utiliza **Mock Service Worker (MSW)** como herramienta principal para interceptar y simular requests HTTP.

### Definición de handlers
```javascript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([{ id: 1, name: 'John Doe' }]);
  }),
];
```
### Configuración del servidor
```javascript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Setup global de tests
```javascript
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 8.5 Estrategia con RTK Query

Se definen dos enfoques según el tipo de test:
```javascript
vi.mock('../services/api', () => ({
  useGetUsersQuery: () => ({
    data: [{ id: 1 }],
    isLoading: false,
  }),
}));
```
---

## 8.6 Organización de 
Estructura recomendada:
```plaintext
tests/
  mocks/
    server.js
    handlers/
      auth.handlers.js
      user.handlers.js
    fixtures/
      user.fixture.js
```
Fixtures (datos reutilizables)
```javascript
export const userMock = {
  id: 1,
  name: 'John Doe',
};
``` 
---
## 8.7 Overrides por Test

Permite modificar el comportamiento de la API en tests específicos:
```javascript
server.use(
  http.get('/api/users', () => {
    return HttpResponse.json(null, { status: 500 });
  })
);
```
Casos de uso:

- Manejo de errores
- Edge cases
- Testing de reintentos

---
## 8.8 Buenas Prácticas
- Centralizar mocks de API en MSW
- Evitar mocks duplicados
- Mantener fixtures reutilizables
- Usar integration tests como base principal
- Limitar mocks manuales a unit tests

---
## 8.9 Anti-Patrones
- Mockear fetch manualmente cuando se usa MSW
- Mockear RTK Query en integration tests
- Tests dependientes entre sí
- Mezclar múltiples estrategias de mocking sin control
- Mockear lógica de negocio
---
## 8.10 Resumen Estratégico
- Unit ->	vi.mock
- Integration	-> MSW + Redux real
- E2E ->	Sin mocks (o mínimos)
---
## 8.11 Regla General
- MSW es la fuente de verdad para todo mocking HTTP.
- Los mocks manuales se usan únicamente para aislamiento en unit tests.
---
## 9. Cobertura (Coverage)

Se recomienda:

* ≥ 80% en lógica crítica
* No forzar coverage en componentes triviales

---
## 10. Decisiones Arquitectónicas

| Decisión                  | Justificación                             |
| ------------------------- | ----------------------------------------- |
| Separar `e2e/` de `apps/` | Evita acoplamiento con aplicaciones       |
| Usar Vitest               | Alto rendimiento y compatibilidad moderna |
| Usar Testing Library      | Testing orientado a comportamiento        |
| Usar Supertest            | Testing de APIs estándar                  |
| Usar Playwright           | E2E robusto y paralelo                    |

---

## 11. Resumen

La arquitectura de testing:

* Separa responsabilidades por capas
* Mantiene independencia entre módulos
* Escala con el crecimiento del proyecto
* Facilita pipelines eficientes

No está diseñada alrededor de herramientas, sino de validación del sistema.
