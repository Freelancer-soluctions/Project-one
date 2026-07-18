# Módulo: PerformanceEvaluation (Server + Client)

> Documentación técnica integral del módulo **PerformanceEvaluation** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre backend (`apps/server/src/modules/performanceEvaluation/`) y frontend (`apps/client/src/modules/performanceEvaluation/`).
>
> **Audiencia:** Arquitectos, Tech Leads, desarrolladores backend/frontend, revisores, auditores de seguridad, QA.

---

## 1. Metadatos del Documento e Historial de Revisiones

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `performanceEvaluation` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/performanceEvaluation/` |
| **Path Client** | `apps/client/src/modules/performanceEvaluation/` |
| **Base URL API** | `/api/v1/performance-evaluations` (server) / `/performance-evaluation` (client) |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial. 4 endpoints server, 4 hooks RTK Query, 3 componentes client, 1 modelo Prisma, enum 1-10. |

---

## 2. Introducción y Objetivos

Gestiona evaluaciones de desempeño de empleados. CRUD con:

- **Calificación**: Int 1-10.
- **Comentarios**: VarChar(200) opcional.
- **Filtros**: employeeId, fromDate, toDate.
- **Auditoría**: createdBy/updatedBy con timestamps + JOIN users.

---

## 3. Contexto y Alcance

```
[Admin / Manager]
      |
[PerformanceEval Module] <--CRUD--> [/api/v1/performance-evaluations]
      |
      |-- N:1 --> [employees]
      |-- N:1 --> [users] (createdBy/updatedBy)
```

---

## 4. Restricciones

| ID | Restricción |
| -- | ------------------------------------------------------------ |
| C-01 | PostgreSQL + Prisma ORM |
| C-02 | Express.js + React + RTK Query |
| C-03 | JWT + `verifyToken` obligatorio |
| C-04 | Calificación Int 1-10 |
| C-05 | Comments max 200 chars |
| C-06 | Roles: ADMIN, MANAGER |

---

## 5. Arquitectura del Módulo

```
apps/server/src/modules/performanceEvaluation/
├── routes.js                          # 4 rutas, OpenAPI inline
├── controller.js                      # 4 handlers
├── service.js                         # 4 métodos
├── dao.js                             # raw SQL + Prisma ORM híbrido
└── schemas/performanceEvaluation.joi.js

apps/client/src/modules/performanceEvaluation/
├── api/performanceEvaluationApi.js    # RTK Query ⚠️ singular path
├── components/                        # Datatable, Dialog, FiltersForm
├── pages/
└── utils/                             # schema.js, enums.js
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Middleware | Handler |
| ------ | --- | ------------------------------------------------------------ | ----------------------------- |
| GET | `/` | `canViewPerformanceEvaluations` (ADMIN/MANAGER), `validateQueryParams` | `getAllPerformanceEvaluations` |
| POST | `/` | `canCreateEvaluatePerformance` (ADMIN/MANAGER), `validateSchema(createSchema)` | `createPerformanceEvaluation` |
| PATCH | `/:id` | `canEditEvaluatePerformance` (ADMIN/MANAGER), `validatePathParam`, `validateSchema(updateSchema)` | `patchPerformanceEvaluationById` |
| DELETE | `/:id` | `canDeleteEvaluationPerformance` (ADMIN/MANAGER), `validatePathParam` | `deletePerformanceEvaluationById` |

### Controller

- `getAllPerformanceEvaluations(req.safeQuery)` → `globalResponse(res, 200, data)`
- `createPerformanceEvaluation({...req.body}, req.userId)` → `globalResponse(res, 201, evaluation)`
- `patchPerformanceEvaluationById(req.params.id, {...req.body}, req.userId)` → `globalResponse(res, 200, evaluation)`
- `deletePerformanceEvaluationById(req.params.id)` → `globalResponse(res, 200, evaluation)`

### Service

**`createPerformanceEvaluation(data, userId)`**: agrega `createdOn`, `date: new Date(data.date)`, `createdBy: userId`.

**`patchPerformanceEvaluationById(id, data, userId)`**: agrega `updatedOn`, `updatedBy: userId`. `Number(id)`.

**`deletePerformanceEvaluationById(id)`**: `Number(id)`.

### DAO

**`getAllPerformanceEvaluations`**: raw SQL `$queryRaw` con LEFT JOIN. Filtros: `employeeId` (=), `startDate` (`>=`), `endDate` (`<=`).

⚠️ Joi filters usa `fromDate`/`toDate`. DAO verifica `filters.startDate`/`filters.endDate`. **Date filter nunca funciona** — valor undefined si safeQuery usa nombres Joi.

Count redundante: 3 bloques condicionales para dates (individual gte, individual lte, combinado).

**`createPerformanceEvaluation`**: `prisma.performanceEvaluation.create` con relations.

**`patchPerformanceEvaluationById`**: Construcción dinámica updateData, `Number(id)`.

**`deletePerformanceEvaluationById`**: `prisma.performanceEvaluation.delete({ where: { id } })`.

---

## 8. Building Blocks — Client

### RTK Query

| Endpoint | Ruta | Método |
| -------------------------------- | -------------------------------------- | ------ |
| `getAllPerformanceEvaluations` | `/performance-evaluation` (params) | GET |
| `createPerformanceEvaluation` | `/performance-evaluation` | POST |
| `updatePerformanceEvaluationById` | `/performance-evaluation/${id}` | PATCH |
| `deletePerformanceEvaluationById` | `/performance-evaluation/${id}` | DELETE |

⚠️ **URL mismatch**: Client usa `/performance-evaluation` (singular). Server routes registran `/performance-evaluations` (plural) en `v1/index.js`. 404.

### Components

**PerformanceEvaluationDatatable**: 8 columnas — employeeName, date, calification, comments, userPerformanceCreatedName, createdOn, userPerformanceUpdatedName, updatedOn. `dataEvaluations.data` nested path.

**PerformanceEvaluationDialog**: Form con employeeId (Select), date (Calendar), calification (Select 1-10), comments (Textarea). Audit fields deshabilitados. `pickDirty` para PATCH.

**PerformanceEvaluationFiltersForm**: Filtros employeeId, fromDate, toDate.

### Utils

**schema.js**:
```js
PerformanceEvaluationSchema:
  employeeId: z.preprocess(Number) → z.number().int().positive()
  date: z.date()
  calification: z.preprocess(Number) → z.number().int().min(1).max(10)
  comments: z.string().max(200).optional()
  .passthrough()
```

**enums.js**: `PerformanceEvaluationCalidation` (typo) — array value '1'-'10' / label '01'-'10'.

---

## 9. Modelo de Datos

### Entidad `performanceEvaluation`

| Columna | Tipo | Constraints |
| --------------- | ------------ | ------------------------------------ |
| `id` | `Int` | PK, autoincrement |
| `employeeId` | `Int` | FK → employees.id |
| `date` | `DateTime` | `@db.Timestamp(3)` |
| `calification` | `Int` | `@db.Integer` (1-10) |
| `comments` | `String?` | nullable, `@db.VarChar(200)` |
| `createdBy` | `Int` | FK → users.id |
| `updatedBy` | `Int?` | FK → users.id |
| `createdOn` | `DateTime` | `@db.Timestamp(3)` |
| `updatedOn` | `DateTime?` | `@db.Timestamp(3)` |

### Relaciones

```
performanceEvaluation N:1 employees (employeeId)
performanceEvaluation N:1 users (createdBy — userPerformanceEvaluationCreated)
performanceEvaluation N:1 users? (updatedBy — userPerformanceEvaluationUpdated)
```

---

## 10. Contratos de API

### GET /api/v1/performance-evaluations
Query: `employeeId`, `fromDate`, `toDate`, `page`, `limit`.
Response: `{ dataList: [...], total: N }` con `employeeName`, `userPerformanceCreatedName`, `userPerformanceUpdatedName`.

### POST /api/v1/performance-evaluations
Body: `{ employeeId, date, calification, comments? }`.
Response 201: evaluation object.

### PATCH /api/v1/performance-evaluations/:id
Body: parcial.
Response 200: evaluation object.

### DELETE /api/v1/performance-evaluations/:id
Response 200: evaluation object.

---

## 11. Validación

### Joi (Server)

```js
filtersSchema: employeeId (int opt), fromDate (date), toDate (date), limit, page
createSchema: employeeId (int req), date (date iso req), calification (int 1-10 req), comments (max200 opt)
updateSchema: employeeId, date, calification, comments (todos opcionales). Sin .min(1) ⚠️
```

### Zod (Client)

```js
PerformanceEvaluationSchema: employeeId (int positive), date (date), calification (int 1-10), comments (string max200 opt).passthrough()
```

---

## 12. Seguridad

- `verifyToken` global.
- `checkRoleAuthOrPermisssion` con permisos: canViewPerformanceEvaluations, canCreateEvaluatePerformance, canEditEvaluatePerformance, canDeleteEvaluationPerformance.
- Roles: ADMIN, MANAGER (USER sin acceso).

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ------------------------------------------------------------ | --------- |
| R-001 | **Client-server URL mismatch**: Client usa `/performance-evaluation` (singular). Server registra `/performance-evaluations` (plural). **Endpoints no funcionan desde client.** | **CRITICAL** |
| R-002 | **DAO date filter bug**: Joi valida `fromDate`/`toDate`. DAO verifica `filters.startDate`/`filters.endDate`. Date filter nunca coincide. | **HIGH** |
| R-003 | **Count date filter redundante**: 3 bloques condicionales pueden sobrescribir condición date. | MEDIUM |
| R-004 | **Joi updateSchema sin .min(1)**: Permite body vacío en PATCH. | MEDIUM |
| R-005 | **JSDoc fields inexistentes**: `period`, `rating`, `status` documentados pero no existen. Código legacy. | MEDIUM |
| R-006 | **Datatable nested path**: `dataEvaluations.data` (con .data). Inconsistente con otros módulos. | MEDIUM |
| R-007 | **Sin tests**: 0% cobertura. | HIGH |
| R-008 | **Sin manejo Prisma errors**: P2025, P2003 no capturados. | HIGH |

---

## 14. Glosario

| Término | Definición |
| --------- | --------------------------------------------------------------------------- |
| **calification** | Calificación de desempeño, Int 1-10. Nombre de campo no estándar (sugerido: `rating`). |
| **userPerformanceCreatedName** | Nombre del usuario que creó evaluación, via LEFT JOIN. |
| **PerformanceEvaluationCalidation** | Nombre de variable con typo en enums.js (debería ser `Calification`). |

---

## 15. Apéndices

### Archivos

```
SERVER: routes.js (221), controller.js (104), service.js (82), dao.js (154), schemas/joi (24)
CLIENT: api/performanceEvaluationApi.js (60), pages/, 3 components, utils/schema.js (33), utils/enums.js (12)
```

### Middleware Stack

`verifyToken` → `checkRoleAuthOrPermisssion` → `validateQueryParams/validateSchema/validatePathParam` → Controller → Service → DAO

### URL Discrepancy

```
Server route:  /performance-evaluations    (plural, correct)
Client API:    /performance-evaluation     (singular, bug → 404)
```
