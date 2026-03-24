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
* Ubicación: `apps/client/tests`
* Entorno: `jsdom`

**Objetivo:**
Validar comportamiento de componentes y hooks sin depender de implementación interna.

---

#### Server (Express)

* Herramienta: Vitest
* Ubicación: `apps/server/tests/unit`
* Entorno: `node`

**Objetivo:**
Validar lógica de negocio, servicios y funciones puras.

---

### 4.2 Integration Testing (Backend)

* Herramientas: Vitest + Supertest
* Ubicación: `apps/server/tests/integration`

**Objetivo:**
Validar endpoints HTTP, controladores y flujo entre capas del backend.

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
* Ubicación: `apps/client`

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
    AlertDialog.ui.test.js

hooks/
  useAuth.js
  useAuth.unit.test.js

Ejemplo en módulos (feature-based)

modules/
  attendance/
    api/
      attendanceApi.js
      attendanceApi.unit.test.js

    components/
      AttendanceDialog.jsx
      AttendanceDialog.ui.test.js

    pages/
      Attendance.jsx
      Attendance.integration.test.js

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

## 8. Cobertura (Coverage)

Se recomienda:

* ≥ 80% en lógica crítica
* No forzar coverage en componentes triviales

---


## 9. Decisiones Arquitectónicas

| Decisión                  | Justificación                             |
| ------------------------- | ----------------------------------------- |
| Separar `e2e/` de `apps/` | Evita acoplamiento con aplicaciones       |
| Usar Vitest               | Alto rendimiento y compatibilidad moderna |
| Usar Testing Library      | Testing orientado a comportamiento        |
| Usar Supertest            | Testing de APIs estándar                  |
| Usar Playwright           | E2E robusto y paralelo                    |

---

## 10. Resumen

La arquitectura de testing:

* Separa responsabilidades por capas
* Mantiene independencia entre módulos
* Escala con el crecimiento del proyecto
* Facilita pipelines eficientes

No está diseñada alrededor de herramientas, sino de validación del sistema.
