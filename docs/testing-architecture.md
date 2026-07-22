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
npm run test              # Full suite: unit + integration + e2e
npm run test:unit         # Unit tests (all workspaces)
npm run test:integration  # Integration tests (all workspaces)
npm run test:e2e          # E2E tests (Playwright)
npm run test:watch        # Watch mode (all workspaces)
npm run test:changed      # Only tests affected by git changes (CI)
npm run test:ci           # CI mode: test:changed with JUnit reporter
npm run test:server       # Server tests only
npm run test:client       # Client tests only
npm run test:coverage     # Coverage report (all workspaces)
```

### Importante

El root **no ejecuta herramientas directamente** (Vitest, Playwright).

El root actúa como **orquestador**, delegando la ejecución a cada workspace mediante:

```bash
npm run <script> --workspaces --if-present
```

Cada workspace define sus propios scripts granulares (`test:unit`, `test:integration`, `test:watch`, `test:changed`), lo que permite aislar la ejecución por tipo de test y por workspace.

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

### Backend

Backend adopta **enfoque híbrido** (ver sección 8). Migración **completada** — los 161 unit tests ya están colocados junto a sus módulos:

```plaintext
# Unit tests: COLOCADOS junto al código que prueban (migración completa)
apps/server/src/
  modules/
    events/
      controller.js
      dao.js
      service.js
      stateMachine.js
      events-dao-combined-filters.unit.test.js      # COLOCADO
      events-dao-soft-delete.unit.test.js            # COLOCADO
      events-helpers.unit.test.js                    # COLOCADO
      events-service-combined-filters.unit.test.js   # COLOCADO
      events-service-soft-delete.unit.test.js        # COLOCADO
      events-validation.unit.test.js                 # COLOCADO
      event-rsvp-stateMachine.unit.test.js           # COLOCADO
      attendee/
        service.js
        dao.js
        event-rsvp-admin.unit.test.js                # COLOCADO
        event-rsvp-audit.unit.test.js                # COLOCADO
        event-rsvp-cancel.unit.test.js               # COLOCADO
        event-rsvp-promote.unit.test.js              # COLOCADO
        event-rsvp-register.unit.test.js             # COLOCADO
    notes/
      utils/
        mentionParser.js
        mentionParser.unit.test.js                   # COLOCADO
        notes-mentions.unit.test.js                  # COLOCADO
  utils/
    prisma/
      sanitizePrismaMessage.js
      sanitizePrismaMessage.unit.test.js             # COLOCADO
    responses&Errors/
      errorHandler.unit.test.js                      # COLOCADO

# Integration tests: centralizados y AGRUPADOS POR MÓDULO
apps/server/tests/
  integration/
    events/
      events-combined-filters.integration.test.js
      events-soft-delete.integration.test.js
      events-validation.integration.test.js
    notes/
      notes-mentions.integration.test.js
  orphans/                                           # Excepciones (describe.skip/todo)
    bin/server.test.js                               # describe.todo
    components/role/role.test.js                     # describe.skip (DB)
    users-path-param-validation.test.js              # describe.skip (DB)

# E2E tests: top-level del monorepo
e2e/
  tests/
```

**Migración completa**: los 161 unit tests existentes fueron movidos de `tests/unit/` a sus módulos correspondientes en `src/modules/` y `src/utils/`. La carpeta `tests/unit/` ya no contiene tests — solo `manual-test.js` (script, no test real). Los unit tests nuevos se colocan directamente junto al módulo desde día uno.

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

## 8. Organización de Tests: Enfoque Híbrido (Consenso 2025-2026)

Backend adopta un **enfoque híbrido** para la organización de tests: unit tests **colocados** junto al código que prueban, integration tests **centralizados** en `tests/integration/`, E2E tests **top-level** en `e2e/`. Este es el consenso que emerged en la comunidad Node.js/TypeScript entre 2025 y 2026.

### 8.1 Colocated vs Centralized — Comparación

| Dimensión | Colocado (unit) | Centralizado (integration/E2E) |
|-----------|-----------------|--------------------------------|
| Descubrimiento | ✅ Test a 1 archivo de distancia, visible en la misma carpeta | ❌ Debe navegar árbol paralelo o buscar |
| Refactoring | ✅ Mover/renombrar source = test se mueve automáticamente | ❌ Debe espejar cada cambio estructural en 2 lugares |
| Acoplamiento estructural | ❌ Más acoplado (Clean Architecture advierte contra esto) | ✅ Test independiente, componente desplegable |
| Visibilidad de cobertura | ✅ Falta `.test.js` = señal visual inmediata | ❌ Debe cruzar 2 árboles para detectar gaps |
| Empaquetado para deploy | ⚠️ Debe excluir `*.test.js` del dist/pkg | ✅ Carpeta única `tests/` fácil de excluir |
| Cohesión de código | ✅ Source + test = una unidad de trabajo; ownership claro | ❌ Tests físicamente separados del código que verifican |
| Simplicidad de imports | ✅ `import { X } from './X'` | ❌ `import { X } from '../../src/modules/X'` |

### 8.2 Qué Recomienda Cada Autoridad

Industria técnica consultada (2025-2026):

#### NestJS (Documentación oficial)

> *"Co-locate unit tests with the code they test. Put E2E tests in a separate top-level folder."*

- **Posición**: Colocación fuerte para unit tests (`*.spec.ts` junto al módulo). E2E en `test/` separado.
- **Por qué**: NestJS CLI genera `*.spec.ts` junto al archivo del módulo. El contenedor DI hace trivial el mocking, así los unit tests están inherentemente acoplados al módulo. E2E cruza módulos y necesita su propio espacio.
- **Fuente**: [Encore — NestJS Project Structure Best Practices](https://encore.dev/resources/nestjs-project-structure-best-practices)

#### Kent C. Dodds (Blog "Colocation", 2019)

> *"Co-locate unit test files next to source files. Put integration/E2E at root level."*

- **Posición**: Colocar unit tests. E2E tests en raíz del proyecto.
- **Por qué**: Testing debe ser como los comentarios de código — mantenerlos cerca de lo que describen. Refactors que mueven source mueven tests automáticamente. Import paths cortos. Si fuera otra ubicación, sería como un `DOCUMENTATION.md` gigante — nobody wants that.
- **Fuente**: [Kent C. Dodds — Colocation](https://kentcdodds.com/blog/colocation)

#### TypeScript TV (2026)

> *"Co-located Tests Scale Better"*

- **Posición**: Colocación gana a centralizado en codebases TypeScript.
- **Por qué**: Discovery instantáneo (test es el siguiente archivo en el sidebar), refactors sobreviven (mover carpeta = mover tests), visibilidad de gaps (no test file = señal visual), import paths cortos, ownership claro por squad.
- **Fuente**: [TypeScript TV — Co-located Tests Scale Better](https://typescript.tv/best-practices/co-located-tests-scale-better/)

#### Clean Architecture (Robert C. Martin)

> *"Tests are independently deployable components. Strong structural coupling between test and production code is an anti-pattern."*

- **Posición**: Tests como componentes independientes. Acoplamiento estructural entre test y producción code es dañino.
- **Por qué**: El "Fragile Tests Problem" ocurre cuando tests están estructuralmente acoplados al código de producción. Una Testing API debería desacoplarlos. La colocación inherentemente crea acoplamiento estructural.
- **Esta es la ARGUMENTACIÓN EN CONTRA más fuerte desde una fuente autoritativa.**
- **Fuente**: Clean Architecture (Robert C. Martin), capítulo sobre testing

#### Goldbergyoni / Node.js Best Practices

- **Posición**: Estructura por componentes de negocio, no por capas. Tests implícitos como parte de cada componente.
- **Por qué**: La recomendación 3-tier (entry-points / domain / data-access por componente) se presta naturalmente a tests colocados dentro de cada carpeta de componente. Pero el guide NO prescribe explícitamente la ubicación de archivos.
- **Fuentes**: [nodebestpractices](https://github.com/goldbergyoni/nodebestpractices), [nodejs-testing-best-practices](https://github.com/goldbergyoni/nodejs-testing-best-practices)

#### Google Testing Blog

- **Posición**: Sin prescripción explícita de ubicación de archivos. El monorepo interno (Bazel) típicamente coloca test targets en BUILD files junto al source.
- **Focus**: Automation, TDD, continuous testing, test pyramid.
- **Fuente**: [testing.googleblog.com](https://testing.googleblog.com/)

#### Martin Fowler

- **Posición**: Sin recomendación específica sobre ubicación de archivos.
- **Focus**: Test Pyramid (ratio unit vs integration vs E2E), self-testing code, TDD, exploratory testing.
- **Fuente**: [martinfowler.com/testing](https://martinfowler.com/testing/)

#### Proyectos Express a gran escala (referencia empírica)

| Proyecto | Estructura | Stars | Notas |
|----------|-----------|-------|-------|
| Ghost | Centralizado `test/` | 54K | Herencia histórica — predata colocación trend |
| KeystoneJS | Centralizado `tests/` + `tests2/` | 10K | Herencia |
| Strapi | Centralizado `test/` folder | 65K | Herencia |
| Payload CMS | Centralizado `tests/` | 30K | Herencia |

**Patrón**: Enterprise Express projects overwhelmingly use centralized test directories — pero es históricamente cultural, no óptimo. Estos proyectos pre-datan la trend de colocación.

### 8.3 Consenso Híbrido (2025-2026)

| Tipo de Test | Ubicación | Rationale |
|--------------|-----------|-----------|
| **Unit tests** (lógica pura, single module) | **Colocado**: `src/modules/X/X.service.unit.test.js` | Feedback rápido, sobrevive refactors, ownership claro |
| **Integration tests** (multi-module, DB, HTTP) | **Centralizado**: `tests/integration/` | Cruza módulos, no pertenece a un solo módulo; necesita DB setup |
| **E2E tests** (API completa, browser) | **Top-level**: `e2e/` | Span del sistema completo; NO debe acoplarse a la estructura de source |

**Endorsado por**: NestJS, Kent C. Dodds, TypeScript TV, y crecientemente la comunidad Node.js.

### 8.4 Estado de la Migración — COMPLETADA

La migración fue ejecutada en el change `refactor-test-architecture`. Los 161 unit tests fueron movidos de `tests/unit/` a sus ubicaciones coloadas en `src/`. La carpeta `tests/unit/` ya no contiene archivos de test (solo `manual-test.js` — script, no test).

La estrategia "move-when-touched" sigue siendo válida para **futuros cambios**: al modificar un módulo, si encuentra tests en `tests/unit/`, muévalos junto al módulo como parte del mismo PR.

### 8.5 Vitest Config — Patrones de Inclusión

```js
// apps/server/vitest.config.js
test: {
  include: [
    'src/**/*.unit.test.js',                    // Unit tests colocados en src/
    'tests/integration/**/*.integration.test.js' // Integration centralizados por módulo
  ]
}
```

Esto permite coexistencia sin fricción durante la migración incremental.

### 8.6 REFERENCIAS

- NestJS Best Practices: https://encore.dev/resources/nestjs-project-structure-best-practices
- Kent C. Dodds — Colocation: https://kentcdodds.com/blog/colocation
- TypeScript TV — Co-located Tests Scale Better: https://typescript.tv/best-practices/co-located-tests-scale-better/
- Node.js Best Practices (goldbergyoni): https://github.com/goldbergyoni/nodebestpractices
- Node.js Testing Best Practices: https://github.com/goldbergyoni/nodejs-testing-best-practices
- Martin Fowler — Testing: https://martinfowler.com/testing/
- Google Testing Blog: https://testing.googleblog.com/
- Ghost CMS: https://github.com/TryGhost/Ghost
- KeystoneJS: https://github.com/keystonejs/keystone
- Strapi: https://github.com/strapi/strapi
- Clean Architecture (Robert C. Martin) — libro, capítulo sobre testing

---
## 9. Estrategia de Mocks

La estrategia de mocks define cómo se controlan las dependencias externas durante el testing, garantizando pruebas deterministas, rápidas y mantenibles. En este proyecto, se adopta un enfoque por capas alineado con buenas prácticas modernas en aplicaciones React con Redux Toolkit y RTK Query.

---

### 9.1 Principios

- **Determinismo**: Los tests no deben depender de factores externos (red, tiempo, servicios reales).
- **Aislamiento controlado**: Se mockean únicamente dependencias externas.
- **Realismo progresivo**: A mayor nivel de test, menor uso de mocks manuales.
- **Fuente única de verdad**: Las APIs se mockean centralizadamente.

---

### 9.2 Qué se Mockea

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

### 9.3 Estrategia por Tipo de Test

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

## 9.4 Mocking de APIs con MSW
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

## 9.5 Estrategia con RTK Query

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

## 9.6 Organización de 
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
## 9.7 Overrides por Test

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
## 9.8 Buenas Prácticas
- Centralizar mocks de API en MSW
- Evitar mocks duplicados
- Mantener fixtures reutilizables
- Usar integration tests como base principal
- Limitar mocks manuales a unit tests

---
## 9.9 Anti-Patrones
- Mockear fetch manualmente cuando se usa MSW
- Mockear RTK Query en integration tests
- Tests dependientes entre sí
- Mezclar múltiples estrategias de mocking sin control
- Mockear lógica de negocio
---
## 9.10 Resumen Estratégico
- Unit ->	vi.mock
- Integration	-> MSW + Redux real
- E2E ->	Sin mocks (o mínimos)
---
## 9.11 Regla General
- MSW es la fuente de verdad para todo mocking HTTP.
- Los mocks manuales se usan únicamente para aislamiento en unit tests.
---
## 10. Cobertura (Coverage)

Se recomienda:

* ≥ 80% en lógica crítica
* No forzar coverage en componentes triviales

---
## 11. Decisiones Arquitectónicas

| Decisión                  | Justificación                             |
| ------------------------- | ----------------------------------------- |
| Separar `e2e/` de `apps/` | Evita acoplamiento con aplicaciones       |
| Usar Vitest               | Alto rendimiento y compatibilidad moderna |
| Usar Testing Library      | Testing orientado a comportamiento        |
| Usar Supertest            | Testing de APIs estándar                  |
| Usar Playwright           | E2E robusto y paralelo                    |
| Compartir config Vitest via `vitest.shared.js` | Reduce duplicación entre workspaces, unifica cobertura |
| Usar `--workspaces --if-present` en scripts root | Auto-descubre workspaces, no requiere mantener lista manual |
| Adoptar enfoque híbrido (unit colocado + integration centralizado) | Consenso industria 2025-2026 (NestJS, Kent C. Dodds, TypeScript TV). Unit tests junto al source → discovery + refactoring. Integration tests centralizados → cruzan módulos + DB setup. **Migración completada** — 161 unit tests movidos a `src/` |
| Migración move-when-touched completada — 161 unit tests movidos a `src/` | Migración ejecutada en change `refactor-test-architecture`. Tests legados en `tests/unit/` migrados a ubicaciones coloadas en `src/`. Estrategia move-when-touched permanece para futuros cambios |

---

## 12. Resumen

La arquitectura de testing:

* Separa responsabilidades por capas
* Mantiene independencia entre módulos
* Escala con el crecimiento del proyecto
* Facilita pipelines eficientes

No está diseñada alrededor de herramientas, sino de validación del sistema.
