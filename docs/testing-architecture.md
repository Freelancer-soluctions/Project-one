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

## 7.5. Estrategia de Ejecución por Capas (Pre-commit / Pre-push / CI)

Los tests se ejecutan en tres capas, cada una con un objetivo y presupuesto de tiempo distinto:

| Capa | Objetivo | Timeout | Qué ejecuta |
|------|----------|---------|-------------|
| **Pre-commit** | Feedback inmediato en staged files | < 10s | ESLint + Prettier + type-check |
| **Pre-push** | Validación rápida de cambios afectados | ~30s (límite SSH GitHub) | `vitest --changed origin/main` (scoped) |
| **CI** | Validación completa del sistema | Ilimitado | Full unit + integration + E2E + coverage + security |

### 7.5.1 Pre-commit
Se ejecuta vía Husky `pre-commit` hook. Corre ESLint, Prettier y type-check **solo sobre staged files** (`lint-staged`). Tiempo esperado: < 10 segundos.

### 7.5.2 Pre-push
Se ejecuta vía Husky `pre-push` hook. Corre únicamente tests afectados por cambios desde `origin/main` usando `npx vitest run --changed origin/main`. El límite duro es ~30 segundos (timeout de SSH de GitHub).

**Por qué `origin/main` como diff base:**
- `HEAD~1` solo cubre el último commit — si una rama tiene múltiples commits, solo el último dispararía tests
- `origin/main` cubre TODOS los commits de la rama desde el fork point
- Es el estándar de la industria: Nx Affected, Turborepo `--filter`, y Vitest `--changed` usan `origin/main`
- Compatible con TBD (Trunk-Based Development): branches cortas, pushes frecuentes

**Excluidos de pre-push:**
- Tests E2E (Playwright) — requieren browser binaries, lentos, pertenecen a CI
- Tests de integración con DB (Prisma + Supertest) — requieren PostgreSQL, no disponible en hook

### 7.5.3 CI
Se ejecuta en GitHub Actions (o similar) ante cada push/PR. Corre la suite completa: unit + integration + E2E + coverage + security scans. Sin límite de tiempo artificial.

### 7.5.4 Caching
`vitest --changed` usa la cache de Vitest por defecto (`node_modules/.cache/vitest`). En CI, considerar `--reporter=blob` para fusionar reportes. En local, la cache acelera ejecuciones sucesivas.

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
| Three-tier hook strategy (pre-commit / pre-push / CI) | Pre-commit: lint + type-check en staged (<10s). Pre-push: scoped tests via `vitest --changed origin/main` (~30s). CI: full suite (sin límite) |
| `origin/main` como diff base para scoped testing | `origin/main` cubre todos los commits de la rama, no solo el último (`HEAD~1`). Estándar industria (Nx, Turborepo, Vitest) |
| E2E + DB-integration tests diferidos a CI | Requieren browser binaries (Playwright) y PostgreSQL — no disponibles en pre-push. CI provee infraestructura + caching + retry |

---

## 12. Smoke Testing

Smoke tests (pruebas de humo) son validaciones rápidas de verificación post-deploy que confirman que los servicios críticos responden correctamente. No testean lógica de negocio profunda, solo confirman que la infraestructura y los endpoints esenciales están "vivos".

### 12.1 Qué Son Smoke Tests

- **Objetivo**: Verificación rápida (< 30s) de que el deploy no rompió la disponibilidad básica
- **Alcance**: Health checks, conectividad DB, auth endpoints, 6 endpoints críticos del ERP
- **Cuándo ejecutar**: Post-deploy (manual o en pipeline CI/CD), smoke test en staging/production
- **No son**: Tests funcionales completos, ni tests de regresión, ni tests E2E

### 12.2 Ubicación

```
apps/server/tests/smoke/
  health.smoke.test.js        # Health check + métricas
  database.smoke.test.js      # Conectividad Prisma/PostgreSQL
  auth.smoke.test.js          # Signin / signup básicos
  critical-endpoints.smoke.test.js  # 6 endpoints críticos ERP
```

Convención de nombres: `*.smoke.test.js` — permite filtrado fácil con `--testNamePattern` o glob patterns.

### 12.3 Ejecución

**Local / Manual (post-deploy):**
```bash
cd apps/server
npm run test:smoke
```

**CI (pipeline post-deploy):**
```bash
npm run test:smoke:ci
```

**Configuración Vitest** (`apps/server/vitest.smoke.config.js`):
- `testTimeout: 15000` (timeout estricto para feedback rápido)
- `pool: 'forks'` con `singleFork: true` (evita fork overhead en CI)
- `include: ['tests/smoke/**/*.smoke.test.js']` (solo smoke tests)
- `reporters: ['default', 'hanging-process']` (diagnóstico de hangs)

### 12.4 APIs Cubiertas

| Categoría | Endpoints | Justificación |
|-----------|-----------|---------------|
| **Health / Metrics** | `GET /health`, `GET /metrics` | Infraestructura viva, Prometheus scrape |
| **Database** | `GET /health/db` (Prisma `$queryRaw`) | Conectividad PostgreSQL real |
| **Auth** | `POST /api/auth/signin`, `POST /api/auth/signup` | Puerta de entrada del sistema |
| **Endpoints Críticos ERP (6)** | `GET /api/sales`, `GET /api/payroll`, `GET /api/purchases`, `GET /api/client-orders`, `GET /api/users`, `GET /api/products` | Módulos que mueven dinero o usuarios |

> **Nota**: Los 6 endpoints críticos corresponden a los módulos de prioridad CRÍTICA definidos en Sección 14.

### 12.5 Integración CI

En GitHub Actions (post-deploy job):
```yaml
- name: Smoke Tests
  run: npm run test:smoke:ci
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

Timeout estricto: 60s máximo (fallo rápido si el deploy está roto).

---

## 13. Regression Testing

Regression testing es la suite que protege contra regresiones en módulos core. Combina unit + integration tests de los módulos críticos y se ejecuta automáticamente en pre-push y CI.

### 13.1 Qué Es la Regression Suite

- **Composición**: Unit tests + Integration tests de módulos CRÍTICOS y ALTO (ver Sección 14)
- **Alcance**: ~70% de la suite total (excluye módulos NORMAL y tests E2E)
- **Objetivo**: Detectar breaking changes en lógica de negocio core antes de merge

### 13.2 Ejecución

**Comando unificado (root):**
```bash
npm run test:regression
```

**Qué ejecuta internamente:**
```bash
# Server: unit + integration de módulos críticos/alto
cd apps/server && vitest run --config vitest.regression.config.js

# Client: unit + integration de módulos críticos/alto
cd apps/client && vitest run --config vitest.regression.config.js
```

**Configuración Vitest** (`vitest.regression.config.js` en cada workspace):
- `include`: patterns que cubren solo módulos críticos/alto
- `exclude`: módulos NORMAL, tests E2E, smoke tests
- `testTimeout: 30000`, `hookTimeout: 15000`

### 13.3 Integración lint-staged (Pre-commit)

`lint-staged` **NO ejecuta tests de regresión** en pre-commit (muy lento para <10s). Solo corre:
- ESLint + Prettier (staged files)
- Type-check (staged files)

### 13.4 Integración Husky Pre-push Hook

El hook `pre-push` (`.husky/pre-push`) ejecuta la regression suite **scoped a cambios**:

```bash
# En .husky/pre-push
vitest run --changed origin/main --config vitest.regression.config.js
```

- **Base diff**: `origin/main` (cubre TODOS los commits de la rama, no solo HEAD~1)
- **Timeout**: ~30s (límite SSH GitHub)
- **Excluidos**: E2E tests, smoke tests, integración con DB real

> **Por qué no en pre-commit**: La suite de regresión tarda ~15-45s. Pre-commit debe ser <10s para no bloquear flujo de trabajo.

### 13.5 Módulos Críticos Cubiertos

| Prioridad | Módulos | Tests Incluidos |
|-----------|---------|-----------------|
| **CRÍTICO** | sale, payroll, purchase, clientOrder, users | Unit + Integration |
| **ALTO** | inventoryMovement, stock, products, employees, attendance, vacation, permission | Unit + Integration |
| **NORMAL** | news, notes, events, settings, clients, providers | **Excluidos** de regression suite |

---

## 14. Priority Testing (Módulos ERP)

La priorización de testing sigue el principio de **riesgo de negocio**: módulos que mueven dinero o gestionan identidad tienen prioridad máxima. Recursos limitados → máximo impacto.

### 14.1 Tabla de Prioridades (3 Niveles)

| Prioridad | Módulos | Justificación (Riesgo) |
|-----------|---------|------------------------|
| **CRÍTICO** 🔴 | `sale`, `payroll`, `purchase`, `clientOrder`, `users` | **Dinero + Identidad**: Transacciones financieras directas, nómina, compras, pedidos clientes, autenticación/autorización. Fallo = pérdida económica, legal, o breach seguridad. |
| **ALTO** 🟠 | `inventoryMovement`, `stock`, `products`, `employees`, `attendance`, `vacation`, `permission` | **Negocio core**: Operaciones diarias del ERP. Fallo = parálisis operativa, datos inconsistentes, compliance laboral. |
| **NORMAL** 🟢 | `news`, `notes`, `events`, `settings`, `clients`, `providers` | **Soporte / Auxiliar**: Funcionalidad secundaria. Fallo = degradación UX, no bloqueo crítico. |

### 14.2 Justificación por Riesgo (Design Decision D4)

**CRÍTICO (Dinero/Identidad)**:
- **sale / clientOrder**: Facturación, revenue recognition, impuestos. Error = multas, pérdida confianza cliente.
- **payroll**: Nómina, seguridad social, contratos. Error = demandas laborales, multas gubernamentales.
- **purchase**: Cuentas por pagar, inventario valuado. Error = desbalance financiero, auditoría.
- **users**: AuthN/AuthZ, roles, permisos. Error = escalada privilegios, data breach.

**ALTO (Negocio Core)**:
- **inventoryMovement / stock / products**: Trazabilidad inventario, costo promedio, stockouts. Error = rupture stock, valuación errónea.
- **employees / attendance / vacation / permission**: RRHH core, compliance laboral, liquidaciones. Error = incumplimiento legal, conflictos internos.

**NORMAL (Soporte)**:
- **news / notes / events**: Comunicación interna, no bloquea operación.
- **settings**: Configuración, cambios infrecuentes.
- **clients / providers**: Maestros de datos — importantes pero no transaccionales en tiempo real.

### 14.3 Implicaciones Prácticas

| Acción | CRÍTICO | ALTO | NORMAL |
|--------|---------|------|--------|
| **Coverage target** | ≥80% | ≥60% | Best effort |
| **Regression suite** | ✅ Incluido | ✅ Incluido | ❌ Excluido |
| **E2E tests** | 2-3 flows | 1-2 flows | 0-1 flow |
| **Code review** | Obligatorio 2 aprobaciones | 1 aprobación | 1 aprobación |
| **Deploy gate** | Smoke test obligatorio | Smoke test | Solo CI |

### 14.4 Evolución de Prioridades

- Revisar trimestralmente en planning
- Cambios de negocio (nuevo módulo financiero → CRÍTICO)
- Incidents post-mortem pueden elevar prioridad
- Documentar cambios en este archivo (historial de decisiones)

---

## 15. E2E Setup Guide (Playwright)

Guía completa para ejecutar, mantener y extender la suite E2E con Playwright.

### 15.1 Stack

| Componente | Versión | Propósito |
|------------|---------|-----------|
| **Playwright Test** | ^1.40+ | Test runner, parallelización, reporters |
| **Playwright Core** | ^1.40+ | Browser automation (Chromium, Firefox, WebKit) |
| **@playwright/test** | ^1.40+ | Test framework con fixtures, assertions |

### 15.2 Estructura de Tests

```
e2e/
  tests/
    specs/
      auth/
        login.spec.js
        logout.spec.js
      dashboard/
        dashboard.spec.js
      users/
        users-crud.spec.js
      sales/
        sales-view.spec.js
    page-objects/
      LoginPage.js
      DashboardPage.js
      UsersPage.js
      SalesPage.js
      BasePage.js
    fixtures/
      users.fixture.js
      test-data.js
  playwright.config.js
  package.json
```

### 15.3 Configuración (`e2e/playwright.config.js`)

```javascript
export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

**Puntos clave:**
- `baseURL`: Apunta al frontend Vite dev server (puerto 5173)
- `webServer`: Levanta `npm run dev` (client + server concurrentemente via concurrently)
- `reuseExistingServer`: En local reusa server corriendo; en CI siempre levanta fresco
- `projects`: Multi-browser (Chromium, Firefox, WebKit)

### 15.4 Page Object Model (Patrón)

Cada página/flujo tiene su Page Object en `e2e/tests/page-objects/`:

```javascript
// e2e/tests/page-objects/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.submitButton = page.locator('[data-testid="login-submit"]');
    this.errorMessage = page.locator('[data-testid="login-error"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

**Beneficios:**
- Encapsula selectores y acciones
- Tests legibles: `await loginPage.login('user@test.com', 'pass')`
- Mantenimiento centralizado cuando UI cambia
- Reutilizable across tests

### 15.5 Ejecución

**Local (con dev server):**
```bash
cd e2e
npm run test:e2e
```

**CI (headless, multi-browser):**
```bash
cd e2e
npm run test:e2e:ci
```

**Debug (headed, slow motion):**
```bash
cd e2e
npm run test:e2e:debug
```

**Solo Chromium (rápido):**
```bash
cd e2e
npm run test:e2e -- --project=chromium
```

### 15.6 Cobertura Actual (Implementada)

| Test | Archivo | Estado | Qué Valida |
|------|---------|--------|------------|
| Login | `auth/login.spec.js` | ✅ | Login exitoso, redirect a dashboard, error handling |
| Logout | `auth/logout.spec.js` | ✅ | Logout limpia session, redirect a login |
| Dashboard | `dashboard/dashboard.spec.js` | ✅ | Carga widgets, navegación lateral, user menu |
| Users CRUD | `users/users-crud.spec.js` | ✅ | Listar, crear, editar, eliminar usuarios |
| Sales View | `sales/sales-view.spec.js` | ✅ | Listar ventas, filtros, paginación, detalle |

### 15.7 Tests Skipeados y Por Qué

| Test | Motivo Skip | Qué Requiere |
|------|-------------|--------------|
| `payroll-flow.spec.js` | `test.skip` | Datos nómina complejos (contratos, convenios, deducciones) — requiere seed DB específico |
| `inventory-movement.spec.js` | `test.skip` | Movimientos stock requieren productos, almacenes, lotes pre-creados |
| `purchase-order.spec.js` | `test.skip` | Flujo compra: proveedor + productos + aprobaciones — setup DB pesado |

**Patrón recomendado para habilitar:**
1. Crear fixtures/seed scripts en `e2e/tests/fixtures/`
2. Usar `test.beforeAll` para setup DB via API o Prisma seed
3. Marcar como `test.skip` hasta que fixtures estén listos
4. Documentar dependencias en el archivo de test

---

## 16. Coverage Targets

Metas de cobertura diferenciadas por criticidad del módulo. No existe un target único global — forzar 80% en todo el código genera tests de bajo valor en código trivial.

### 16.1 Targets por Prioridad

| Prioridad | Módulos | Coverage Target | Justificación |
|-----------|---------|-----------------|---------------|
| **CRÍTICO** | sale, payroll, purchase, clientOrder, users | **≥ 80%** | Dinero + identidad. Bugs = impacto financiero/legal directo. |
| **ALTO** | inventoryMovement, stock, products, employees, attendance, vacation, permission | **≥ 60%** | Negocio core. Bugs = parálisis operativa, datos inconsistentes. |
| **NORMAL** | news, notes, events, settings, clients, providers | **Best effort** (sin target obligatorio) | Soporte. Tests de valor, no métrica. |

### 16.2 Cómo Medir Coverage

**Comando unificado (root):**
```bash
npm run test:coverage
```

**Qué ejecuta:**
```bash
# Server
cd apps/server && vitest run --coverage

# Client
cd apps/client && vitest run --coverage
```

**Reporte:** Genera `coverage/index.html` en cada workspace. Abrir en browser para análisis por archivo.

### 16.3 Configuración Vitest Coverage v8 (`vitest.shared.js`)

```javascript
// apps/server/vitest.shared.js (compartido)
export const coverageConfig = {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  reportsDirectory: './coverage',
  exclude: [
    'node_modules/**',
    'tests/**',              // Tests no se miden a sí mismos
    '**/*.test.js',          // Archivos de test
    '**/*.spec.js',
    '**/*.smoke.test.js',    // Smoke tests excluidos
    '**/vitest.*.js',        // Config files
    '**/prisma/**',          // Generated Prisma client
    '**/migrations/**',      // DB migrations
    'dist/**',               // Build output
    '**/*.d.ts',             // Type definitions
  ],
  thresholds: {
    // Thresholds globales (warning only, no fail build)
    lines: 50,
    functions: 50,
    branches: 40,
    statements: 50,
  },
};
```

**Nota**: Los thresholds globales son bajos intencionalmente — la métrica real se valida **por módulo** en code review usando la tabla de la Sección 16.1. El coverage global puede ser bajo por módulos NORMAL sin que falle CI.

### 16.4 Exclusiones Estándar

| Patrón | Razón |
|--------|-------|
| `node_modules/**` | Dependencias externas |
| `tests/**` | Tests no se testean a sí mismos |
| `**/*.test.js`, `**/*.spec.js` | Archivos de test |
| `**/*.smoke.test.js` | Smoke tests (no testean lógica) |
| `**/vitest.*.js` | Config files |
| `**/prisma/**` | Generated client |
| `**/migrations/**` | SQL migrations |
| `dist/**` | Build output |
| `**/*.d.ts` | Type definitions |

### 16.5 Validación en Code Review

En PR que toque módulos CRÍTICOS/ALTO:
1. Revisar `npm run test:coverage` output
2. Verificar que archivos modificados en módulos críticos cumplan ≥80% / ≥60%
3. Si no: requerir tests adicionales antes de merge
4. Módulos NORMAL: sin bloqueo, solo recomendación

---

## 17. Resumen

La arquitectura de testing:

* Separa responsabilidades por capas
* Mantiene independencia entre módulos
* Escala con el crecimiento del proyecto
* Facilita pipelines eficientes

No está diseñada alrededor de herramientas, sino de validación del sistema.

---

## 18. Cross-Platform Considerations (Windows / Linux / macOS)

Esta sección documenta los problemas de compatibilidad multiplataforma encontrados y las soluciones adoptadas para garantizar que la suite de testing funcione consistentemente en Windows (Git Bash/MSYS2), Linux y macOS.

### 18.1 Windows Spawn Loop Issue con `npx`

**Problema:** En Windows con Git Bash (MSYS2), `npx` invoca un shim `.cmd` que no propaga correctamente `EOF`/`SIGTERM`, causando procesos colgados (spawn loop) que no terminan — visible en Task Manager como múltiples procesos `node.exe` huérfanos tras ejecutar `npm run test`.

**Referencias:**
- [npm/cli#8259](https://github.com/npm/cli/issues/8259) — `npx` no propaga señales en Windows
- [nodejs/node#52681](https://github.com/nodejs/node/issues/52681) — Child process handling en Windows

**Solución adoptada (D5, D12):** Eliminar `npx` de **todos** los scripts npm. Usar bins directos resolvidos por npm automáticamente desde `node_modules/.bin/`:
```json
// ❌ MALO - causa spawn loop en Windows
"test": "npx vitest run"

// ✅ BUENO - bin directo, npm resuelve PATH
"test": "vitest run"
```

**Aplicado a:**
- Root `package.json`: todos los scripts `test*`, `lint`, `format`, `build`
- Workspace `package.json` (server, client): scripts internos
- `.husky/pre-push`: reemplazado `npx vitest` → `vitest`
- `.husky/commit-msg`: reemplazado `npx --no-install commitlint` → `commitlint`

### 18.2 Patrón de Delegación a Workspaces (`--workspaces --if-present`)

**Problema:** Scripts root que invocan `npx vitest --config apps/X/vitest.config.js` ejecutan desde CWD incorrecto, rompen resolución de paths y añaden proceso intermediario. Adicionalmente, scripts root que encadenan workspaces con `&&` (ej. `npm run X --workspace=A && npm run X --workspace=B`) causan spawn loops en Windows: npm envuelve el `&&` en `cmd.exe /d /s /c`, perdiendo PATH y propagación de EOF (ver npm/cli#8259, npm/cli#7768).

**Solución (D6 + corrección Windows):** Usar `--workspaces --if-present` para delegar a todos los workspaces, o `concurrently -m 1 --kill-others-on-fail` para cadenas secuenciales:
```json
// ✅ Multi-workspace — npm maneja iteración internamente, sin cmd.exe wrapper
"test:unit": "npm run test:unit --workspaces --if-present"

// ✅ Single workspace — sin &&, sin wrapper
"test:e2e": "npm run test --workspace=e2e"

// ✅ Cadena secuencial (fail-fast) — concurrently usa spawn, no cmd.exe
"test": "concurrently -m 1 --kill-others-on-fail -n unit,integration,e2e -c cyan,yellow,green \"npm run test:unit\" \"npm run test:integration\" \"npm run test:e2e\""
```

**Anti-patrón (NO USAR en Windows):**
```json
// ❌ && con --workspace causa spawn loop en Windows
"test:unit": "npm run test:unit --workspace=server-express && npm run test:unit --workspace=client-react"

// ❌ && en script raíz causa cmd.exe wrapper que pierde PATH
"test": "npm run test:unit && npm run test:integration && npm run test:e2e"
```

**Ventajas:**
- CWD correcto automáticamente
- Hereda `.npmrc` y config del workspace
- Sin proceso `npx` intermediario
- `--workspaces --if-present` auto-descubre workspaces
- Sin `cmd.exe /d /s /c` wrapper (elimina spawn loop en Windows)
- `concurrently -m 1` preserva fail-fast sin shell metacharacters

### 18.3 `hanging-process` Reporter para Diagnóstico

**Configuración (D8):** Agregar reporter `hanging-process` en `vitest.config.js`:
```javascript
reporters: ['default', 'hanging-process']
```
**Uso:** Cuando vitest no termina, este reporter imprime handles abiertos (timers, connections, file handles) para identificar la causa raíz.

### 18.4 Pool Forks + `singleFork` Condicional (CI-only)

**Configuración (D7):** En `apps/server/vitest.config.js`:
```javascript
pool: 'forks',
poolOptions: {
  forks: {
    singleFork: process.env.CI === 'true'
  }
}
```
- **Dev local:** Paralelismo completo (múltiples forks) → velocidad
- **CI (Windows GitHub Actions):** `singleFork: true` → un solo proceso hijo → evita agotamiento de recursos / spawn issues en runners Windows

### 18.5 Husky Hooks sin `npx` (D12)

**Antes (problemático):**
```sh
# .husky/pre-push
npx vitest run --changed origin/main --config apps/server/vitest.config.js
npx --no-install commitlint --edit "$1"
```

**Después (corregido):**
```sh
# .husky/pre-push
vitest run --changed origin/main
# .husky/commit-msg
commitlint --edit "$1"
```

**Principio:** Husky 9.x ya expone bins en PATH. `npx` es redundante y dañino en Windows.

### 18.6 Timeouts Globales Explícitos (D11)

**Configuración en `vitest.shared.js`:**
```javascript
testTimeout: 30000,
hookTimeout: 15000,
teardownTimeout: 5000
```
Previene tests colgados indefinidamente. Fail-fast principle.

### 18.7 Script de Diagnóstico: `npm run test:debug`

**Root `package.json`:**
```json
"test:debug": "node --import why-is-node-running/include node_modules/vitest/vitest.mjs run --config apps/server/vitest.config.js"
```

**Uso:** Cuando los tests no terminan, ejecutar `npm run test:debug` para ver qué handles mantienen el proceso vivo.

**Dependencia:** `why-is-node-running` agregado como `devDependency` formal en `apps/server/package.json` y `apps/client/package.json` (D10) — no depender de copias en `docs/opencode/.../node_modules/`.

### 18.8 Resumen de Patrones Cross-Platform

| Patrón | Windows (Git Bash) | Linux/macOS | Recomendación |
|--------|-------------------|-------------|---------------|
| `npx cmd` | ❌ Spawn loop | ✅ Funciona | **Nunca usar `npx` en scripts** |
| `npm run X --workspace=Y` | ✅ Correcto | ✅ Correcto | **Patrón estándar** |
| `concurrently` | ✅ Funciona | ✅ Funciona | Usar para paralelismo CI (`test:all`) |
| `&&` en scripts | ✅ Funciona | ✅ Funciona | OK para fail-fast (prepush) |
| `vitest` (bin directo) | ✅ Correcto | ✅ Correcto | **Siempre preferir a `npx vitest`** |
| `#!/usr/bin/env sh` shebang | ✅ Git Bash | ✅ Bash/Zsh | **Hooks husky portables** |

### 18.9 Checklist de Validación Cross-Platform

Antes de mergear cambios a testing:
- [ ] Ningún script en `package.json` usa `npx`
- [ ] Scripts root delegan con `--workspace=`
- [ ] Hooks `.husky/*` usan bins directos (`vitest`, `commitlint`, etc.)
- [ ] `vitest.config.js` tiene `pool: 'forks'` + `singleFork: CI === 'true'`
- [ ] `reporters: ['default', 'hanging-process']` presente
- [ ] Timeouts globales configurados en `vitest.shared.js`
- [ ] `why-is-node-running` en `devDependencies` de workspaces
- [ ] `npm run test` termina limpio en Windows (sin procesos huérfanos en Task Manager)

---

## 19. Diagnóstico de Tests Colgados (npm run test:debug)

Esta sección documenta cómo diagnosticar tests que **cuelgan** (no terminan, no fallan, no pasan — el proceso se queda vivo indefinidamente).

### 19.1 Qué es `npm run test:debug`

`test:debug` es un script de diagnóstico que utiliza `why-is-node-running` para imprimir todos los handles abiertos (timers, sockets, conexiones de base de datos, file handles, etc.) que mantienen el proceso de Node.js vivo después de que los tests deberían haber terminado.

**Cuándo usarlo:**
- Tests que no terminan (hang) tras ejecutar `npm run test`
- Procesos huérfanos visibles en Task Manager (Windows) o `ps aux` (Linux/macOS)
- Cuando el reporter `hanging-process` no da suficiente detalle

**Cuándo NO usarlo:**
- Tests que **fallan** (assertions rotas, errores de código) — usa `npm run test` normal
- Tests que **pasan** pero son lentos — usa `--reporter=verbose` para ver tiempo por test
- Debugging de lógica de negocio — usa `console.log` o debugger de VS Code

### 19.2 Cómo Funciona

El script en `package.json` (root):

```json
"test:debug": "node --import why-is-node-running/include node_modules/vitest/vitest.mjs run --config apps/server/vitest.config.js"
```

Ejecuta Vitest con el módulo `why-is-node-running` importado via `--import`. Este módulo se engancha en el event loop de Node y, al finalizar (o al recibir SIGINT), imprime una lista de todos los handles abiertos con sus stack traces.

### 19.3 Ejemplo de Comando

```bash
# Desde root del monorepo
npm run test:debug
```

> **Nota**: El script actual apunta a `apps/server/vitest.config.js`. Para diagnosticar tests del client, crear un script variante o editar temporalmente el config path.

### 19.4 Ejemplo de Output

```
[why-is-node-running] Open handles preventing exit:
──────────────────────────────────────────────────────
Timer (setTimeout)
    at setTimeout (<anonymous>)
    at Function.setTimeout (node:timers:423:14)
    at PrismaClient.connect (node_modules/@prisma/client/runtime/library.js:1:12345)
    at Object.<anonymous> (apps/server/src/modules/users/service.js:45:12)

TCPWRAP (socket)
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1456:10)
    at Socket.connect (node:net:1024:12)
    at Pool.connect (node_modules/pg-pool/index.js:45:18)
    at PrismaClient._connect (node_modules/@prisma/client/runtime/library.js:1:67890)

[why-is-node-running] Total: 2 handles
```

### 19.5 Cómo Interpretar el Output

| Tipo de Handle | Qué Indica | Acción Típica |
|----------------|------------|---------------|
| **Timer (setTimeout/setInterval)** | Timer no limpiado en `afterAll` / `afterEach` | Agregar `vi.useFakeTimers()` o limpiar en teardown |
| **TCPWRAP / Socket** | Conexión DB (Prisma/PostgreSQL) no cerrada | Llamar `await prisma.$disconnect()` en `afterAll` |
| **TCPWRAP (HTTP)** | Servidor Express no cerrado | `await app.close()` o `server.close()` en teardown |
| **FSReqCallback** | File handle abierto (logs, uploads) | Cerrar streams, usar `await fileHandle.close()` |
| **Immediate** | `setImmediate` no limpiado | Raro — revisar librerías terceras |

**Patrón común en este proyecto:** Prisma Client mantiene pool de conexiones. Asegurar `afterAll(async () => { await prisma.$disconnect() })` en tests de integración.

### 19.6 Limitaciones

- **No identifica el handle exacto que causa el hang** — lista **todos** los handles abiertos al momento de la impresión. Debes correlacionar con tu código.
- **Solo funciona si el proceso termina** — si el hang es un deadlock total, `why-is-node-running` puede no imprimir nada (el event loop nunca llega al checkpoint).
- **Requiere reproducción local** — algunos hangs solo ocurren en CI (diferentes recursos, límites de procesos).
- **Output verbose** — en suites grandes puede listar decenas de handles; filtrar por stack trace de tu código (`apps/server/src/`, `apps/client/src/`).

### 19.7 Referencia Externa

- Documentación oficial: https://github.com/nuxt/why-is-node-running
- Issue relacionado en este repo: Cross-Platform Considerations §18.7

