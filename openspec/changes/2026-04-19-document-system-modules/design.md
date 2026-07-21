# Design: Document System Modules

> Plan de documentación técnica integral del sistema siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Objetivo: Documentar cada módulo del sistema en un único archivo consolidado full-stack (server + client).

---

## 1. Introducción y Objetivos

### 1.1 Propósito

Este documento describe el diseño y la estrategia para documentar todos los módulos del sistema utilizando el formato establecido en `events.md` como referencia. El resultado será un conjunto de documentos técnicos integrales que cubren tanto la capa de servidor como la de cliente para cada módulo.

### 1.2 Objetivos de Calidad

| ID | Prioridad | Objetivo |
|----|-----------|----------|
| Q-001 | Alta | **Fidelidad:** Cada documento debe reflejar el código fuente real, no intenciones de diseño. |
| Q-002 | Alta | **Consistencia:** Todos los módulos usan la misma estructura de 20 apartados. |
| Q-003 | Alta | **Completitud:** Cada documento cubre server + client, endpoints, componentes, esquemas, permisos, y flujos. |
| Q-004 | Media | **Diagramas:** Los diagramas Mermaid (ERD, C4, secuencia) deben ser sintácticamente correctos. |
| Q-005 | Media | **Navegabilidad:** INDEX.md consolidado permite encontrar cualquier módulo en ≤2 clics. |

---

## 2. Contexto y Alcance

### 2.1 Fuentes de Información

| Fuente | Ubicación | Propósito |
|--------|-----------|-----------|
| Código servidor | `apps/server/src/modules/<module>/` | Rutas, controladores, servicios, DAOs, esquemas Joi |
| Código cliente | `apps/client/src/modules/<module>/` | Páginas, componentes, API (RTK Query), utilidades (Zod, enums) |
| Schema Prisma | `apps/server/prisma/schema.prisma` | Entidades, relaciones, constraints |
| Documentos existentes | `docs/modules/events.md`, `docs/modules/notes.md` | Plantilla de formato y nivel de detalle |
| Módulos legacy | `docs/modules/server-*.md`, `client-*.md` | Stubs a reemplazar |

### 2.2 Dentro del Alcance

- 25 módulos del sistema documentados en formato arc42/C4/IEEE 1016.
- Documentos consolidados server+client en un único `.md` por módulo.
- INDEX.md actualizado con lista consolidada.
- Archivos stub legacy (`server-*.md`, `client-*.md`) eliminados tras la migración.

### 2.3 Fuera del Alcance

- Modificaciones al código fuente durante la documentación.
- Generación automatizada de documentación.
- Pruebas unitarias/de integración de los documentos.
- Internacionalización de la documentación.

---

## 3. Estructura del Documento por Módulo

Cada archivo `docs/modules/<module>.md` seguirá exactamente la misma estructura de 20 apartados que `events.md`:

```
# Module: <Name> (Server + Client)

> Technical documentation following arc42 / C4 Model / IEEE 1016 hybrid approach.

## Table of Contents

1.  Metadatos del Documento e Historial de Revisiones
2.  Introducción y Objetivos
    2.1 Propósito
    2.2 Alcance Funcional
    2.3 Objetivos de Calidad
    2.4 Stakeholders
3.  Contexto y Alcance
    3.1 Diagrama de Contexto (C4 Nivel 1)
    3.2 Dentro del Alcance (In-Scope)
    3.3 Fuera del Alcance (Out-of-Scope)
4.  Restricciones
5.  Stack Tecnológico
6.  Arquitectura del Módulo (Overview)
    6.1 Estructura de Archivos
    6.2 Diagrama de Contenedores (C4 Nivel 2)
7.  Vista de Building Blocks — Server
    7.1 Responsabilidades por Capa
    7.2 Rutas y Cadena de Middleware
    7.3 Controladores (Funciones Exportadas)
    7.4 Servicios (Lógica de Negocio)
    7.5 DAO (Acceso a Datos)
    7.6 Utilidades Compartidas (Server)
8.  Vista de Building Blocks — Client
    8.1 Orquestador de Página
    8.2 Diagrama del Árbol de Componentes
    8.3 Especificación de Componentes
    8.4 Endpoints RTK Query
    8.5 Utilidades del Cliente
    8.6 Mapeo de Colores / Constantes (si aplica)
9.  Vista de Runtime y Flujo de Datos
    9.1–9.N Secuencias (Happy Path)
    9.N+1 Escenarios de Error
10. Modelo de Datos
    10.1 Diagrama ER
    10.2 Tablas (columnas, tipos, constraints)
    10.3 Catálogos (si aplica)
    10.4 Alineación de Field Limits
11. Contratos de API
    11.1–11.N Endpoints (método, path, body, response, errores)
12. Reglas de Validación y Esquemas
13. Seguridad y Autorización
14. Manejo de Errores
15. Conceptos Transversales (Cross-Cutting)
16. Requisitos de Calidad
17. Decisiones de Diseño (ADRs)
18. Riesgos y Deuda Técnica
19. Glosario
20. Apéndices
```



> **Nota para módulos client-only:** Si el módulo no tiene capa de servidor, se omiten las secciones 7 (Vista de Building Blocks — Server) con todos sus subapartados (7.1–7.6) y la sección 11 (Contratos de API).
> **Nota para módulos server-only:** Si el módulo no tiene capa de cliente, se omiten las secciones 8 (Vista de Building Blocks — Client) con todos sus subapartados (8.1–8.6).

---

## 4. Listado Completo de Módulos

| #  | Módulo               | Archivo destino                | Path Server                                      | Path Client                                      |
|----|----------------------|--------------------------------|--------------------------------------------------|--------------------------------------------------|
| 1  | Auth                 | `auth.md`                      | `apps/server/src/modules/auth/`                  | `apps/client/src/modules/auth/`                  |
| 2  | Users                | `users.md`                     | `apps/server/src/modules/users/`                 | `apps/client/src/modules/users/`                 |
| 3  | Stock                | `stock.md`                     | `apps/server/src/modules/stock/`                 | `apps/client/src/modules/stock/`                 |
| 4  | Sales                | `sales.md`                     | `apps/server/src/modules/sales/`                  | `apps/client/src/modules/sales/`                 |
| 5  | Products             | `products.md`                  | `apps/server/src/modules/products/`              | `apps/client/src/modules/products/`              |
| 6  | Clients              | `clients.md`                   | `apps/server/src/modules/clients/`               | `apps/client/src/modules/clients/`               |
| 7  | ClientOrder          | `clientOrder.md`               | `apps/server/src/modules/clientOrder/`           | `apps/client/src/modules/clientOrder/`           |
| 8  | ProviderOrder        | `providerOrder.md`             | `apps/server/src/modules/providerOrder/`         | `apps/client/src/modules/providerOrder/`         |
| 9  | Providers            | `providers.md`                 | `apps/server/src/modules/providers/`             | `apps/client/src/modules/providers/`             |
| 10 | Purchase             | `purchase.md`                  | `apps/server/src/modules/purchase/`              | `apps/client/src/modules/purchase/`              |
| 11 | Warehouse            | `warehouse.md`                 | `apps/server/src/modules/warehouse/`             | `apps/client/src/modules/warehouse/`             |
| 12 | Attendance           | `attendance.md`                | `apps/server/src/modules/attendance/`            | `apps/client/src/modules/attendance/`            |
| 13 | Payroll              | `payroll.md`                   | `apps/server/src/modules/payroll/`               | `apps/client/src/modules/payroll/`               |
| 14 | Vacation             | `vacation.md`                  | `apps/server/src/modules/vacation/`              | `apps/client/src/modules/vacation/`              |
| 15 | PerformanceEvaluation| `performanceEvaluation.md`     | `apps/server/src/modules/performanceEvaluation/` | `apps/client/src/modules/performanceEvaluation/` |
| 16 | Permission           | `permission.md`                | `apps/server/src/modules/permission/`            | `apps/client/src/modules/permission/`            |
| 17 | Expenses             | `expenses.md`                  | `apps/server/src/modules/expenses/`              | `apps/client/src/modules/expenses/`              |
| 18 | InventoryMovement    | `inventoryMovement.md`         | `apps/server/src/modules/inventoryMovement/`     | `apps/client/src/modules/inventoryMovement/`     |
| 19 | News                 | `news.md`                      | `apps/server/src/modules/news/`                  | `apps/client/src/modules/news/`                  |
| 20 | Employees            | `employees.md`                 | `apps/server/src/modules/employees/`             | `apps/client/src/modules/employees/`             |
| 21 | Settings             | `settings.md`                  | `apps/server/src/modules/settings/`
| 22 | SettingsProductCategories | `settingsProductCategories.md` | — (client-only)                                | `apps/client/src/modules/settingsProductCategories/` |
| 23 | Home                 | `home.md`                      | — (client-only)                                | `apps/client/src/modules/home/`                  |
| 24 | Security             | `security.md`                  | `apps/server/src/modules/security/`              | (solo server)                                     |
| 25 | Notes                | `notes.md`                     | `apps/server/src/modules/notes/`                 | `apps/client/src/modules/notes/`                 |

---

## 5. Proceso de Documentación por Módulo

Para cada módulo, se seguirá este proceso sistemático:

### 5.1 Exploración del Código Fuente

```
1. Server: leer routes.js, controller.js, service.js, dao.js, schemas/*.joi.js
2. Client: leer pages/*.jsx, api/*API.js, components/*.jsx, utils/*.js
3. Prisma: identificar modelos relacionados en schema.prisma
4. Middleware: identificar permisos RBAC y cadenas de validación
```

### 5.2 Generación del Documento

Usando la plantilla de 20 apartados, rellenar cada sección con:
- **Metadatos:** paths reales, base URL API, estado actual
- **Introducción:** propósito del módulo, funcionalidades tabuladas con IDs
- **Contexto:** diagrama C4 Nivel 1, in-scope/out-of-scope
- **Restricciones:** tecnológicas, BD, validación, seguridad
- **Stack:** tecnologías específicas del módulo
- **Arquitectura:** estructura de archivos, diagrama C4 Nivel 2
- **Building Blocks Server:** rutas, controladores, servicios, DAOs
- **Building Blocks Client:** página, componentes, RTK Query, utilidades
- **Runtime:** diagramas de secuencia para flujos principales + tabla de errores
- **Modelo de Datos:** ERD, tablas, field limits alignment
- **API:** contratos completos por endpoint
- **Validación:** esquemas Joi (server) y Zod (client)
- **Seguridad:** permisos, roles, protección de rutas
- **Errores:** manejo server-side y client-side
- **Cross-Cutting:** utilidades compartidas, logging, auditoría
- **Calidad:** objetivos, métricas
- **ADRs:** decisiones arquitectónicas relevantes
- **Riesgos:** deuda técnica conocida, issues abiertos

### 5.3 Revisión de Consistencia

- Verificar que endpoints en el documento coinciden con `routes.js`
- Verificar que componentes listados existen en el filesystem
- Verificar que los esquemas Joi/Zod reflejan los del código
- Verificar diagramas Mermaid (sintaxis básica)

---

## 6. Cross-Module Dependencies

Las siguientes dependencias entre módulos deben documentarse explícitamente en cada documento, reflejando las relaciones en los diagramas C4 Nivel 1 y en las secciones de Contexto:

| Módulo (Origen) | Depende de (Destino) | Tipo de Relación |
|-----------------|----------------------|------------------|
| Sales | Products, Stock, Clients | Lectura/Escritura |
| Purchase | Providers, Stock, Products | Lectura/Escritura |
| ClientOrder | Clients, Products | Lectura/Escritura |
| Payroll | Attendance, Employees, Vacation | Lectura |
| InventoryMovement | Stock, Warehouse | Lectura/Escritura |
| Permission | Users (RBAC) | Lectura |

> **Regla:** Cada documento de módulo debe incluir en su sección 3 (Contexto) un diagrama C4 Nivel 1 que muestre las relaciones con los módulos de los que depende y los que dependen de él.

---

## 7. Archivos Legacy a Reemplazar

Los siguientes stubs serán eliminados una vez que sus versiones consolidadas estén creadas:

| Stub a eliminar           | Reemplazado por |
|---------------------------|-----------------|
| `docs/modules/server-auth.md` | `docs/modules/auth.md` |
| `docs/modules/client-auth.md` | `docs/modules/auth.md` |
| `docs/modules/server-users.md` | `docs/modules/users.md` |
| `docs/modules/client-users.md` | `docs/modules/users.md` |
| `docs/modules/server-stock.md` | `docs/modules/stock.md` |
| `docs/modules/client-stock.md` | `docs/modules/stock.md` |
| `docs/modules/server-notes.md` | `docs/modules/notes.md` (update) |
| `docs/modules/client-notes.md` | `docs/modules/notes.md` (update) |

---

## 8. INDEX.md — Estructura Final

El INDEX.md consolidado tendrá esta estructura:

```markdown
# Modules Index

## Full-stack (Consolidados)

- [Events](events.md)
- [Notes](notes.md)
- [Auth](auth.md)
- [Users](users.md)
- ... (todos los módulos, orden alfabético)
```

Sin separación Server/Client. Cada entrada linkea al documento consolidado.

---

## 9. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Módulo sin cliente (solo server, ej: Security) | Documento incompleto | Se marca como "Server only" y se omiten secciones de cliente |
| Módulo sin server (solo cliente, ej: Home) | Documento incompleto | Se marca como "Client only" y se omiten secciones de servidor |
| Código fuente cambia durante la documentación | Documentos desactualizados | Fecha de corte: código actual en el momento de generación |
| Diagramas Mermaid complejos | Errores de sintaxis | Validación manual post-generación |
