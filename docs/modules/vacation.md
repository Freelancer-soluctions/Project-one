# Módulo: Vacation (Server + Client)

> Documentación técnica integral del módulo **Vacation** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre backend (`apps/server/src/modules/vacation/`) y frontend (`apps/client/src/modules/vacation/`).
>
> **Audiencia:** Arquitectos, Tech Leads, desarrolladores backend/frontend, revisores, auditores de seguridad, QA.

---

## 1. Metadatos del Documento e Historial de Revisiones

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `vacation` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/vacation/` |
| **Path Client** | `apps/client/src/modules/vacation/` |
| **Base URL API** | `/api/v1/vacation` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial. 4 endpoints server, 4 hooks RTK Query, 3 componentes client, 1 modelo Prisma (vacation), enum vacationStatus. |

---

## 2. Introducción y Objetivos

Gestiona solicitudes de vacaciones de empleados. CRUD con:

- **Estados**: `vacationStatus` enum (PENDING, APPROVED, REJECTED).
- **Filtros**: employeeId, status, fromDate, toDate.
- **Auditoría**: createdBy/updatedBy con timestamps + JOIN users.
- **Roles**: Acceso completo a USER (view, create, delete, edit).

---

## 3. Contexto y Alcance

```
[Admin / Manager / User]
      |
[Vacation Module] <--CRUD--> [/api/v1/vacation]
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
| C-04 | Enum `vacationStatus`: PENDING, APPROVED, REJECTED |
| C-05 | No sensitive data (datos no encriptados) |

---

## 5. Stack Tecnológico

Express, Prisma, PostgreSQL, React, RTK Query, Joi, Zod, react-hook-form.

---

## 6. Arquitectura del Módulo

```
apps/server/src/modules/vacation/
├── routes.js                          # 4 rutas, Swagger inline
├── controller.js                      # 4 handlers
├── service.js                         # 4 métodos
├── dao.js                             # raw SQL + Prisma ORM híbrido
└── schemas/vacation.joi.js            # filters, create, update

apps/client/src/modules/vacation/
├── api/vacationApi.js                 # RTK Query
├── components/                        # Datatable, Dialog, FiltersForm
├── pages/
└── utils/                             # schema.js, enums.js
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Middleware | Handler |
| ------ | --- | --------------------------------------------------------------- | ------------------ |
| GET | `/` | `canViewVacations` (ADMIN/MANAGER/**USER**), `validateQueryParams` | `getAllVacation` |
| POST | `/` | `canRequestVacation` (ADMIN/MANAGER/**USER**), `validateSchema(vacationCreateSchema)` | `createVacation` |
| DELETE | `/:id` | `canDeleteVacation` (ADMIN/MANAGER/**USER**), `validatePathParam` | `deleteVacationById` |
| PATCH | `/:id` | `canEditRequestVacation` (ADMIN/MANAGER/**USER**), `validatePathParam`, `validateSchema(vacationUpdateSchema)` | `patchVacationById` |

Roles: USER tiene permisos completos en todos los endpoints.

### Controller

- `getAllVacation(req.safeQuery)` → `globalResponse(res, 200, data)`
- `createVacation(req.body)` → `globalResponse(res, 201, data)` — **no pasa req.userId** ⚠️
- `deleteVacationById(req.params.id)` → `globalResponse(res, 200, data, '...')` — 4 args
- `patchVacationById(req.params.id, req.body)` → `globalResponse(res, 200, data)` — **no pasa req.userId** ⚠️

**Bug crítico**: Controller no pasa `req.userId` a service. `createdBy`/`updatedBy` nunca se setean.

### Service

**`getAllVacation(filters)`**: `getSafePagination`. Throws si `take <= 0`.

**`createVacation(data)`**: Solo agrega `createdOn: new Date()`. Sin `createdBy`.

**`patchVacationById(id, data)`**: Solo agrega `updatedOn: new Date()`. Sin `updatedBy`.

**`deleteVacationById(id)`**: `deleteVacationByIdDao(id)` — sin `parseInt(id)` ⚠️.

### DAO

**`getAllVacation`**: raw SQL `$queryRaw` con LEFT JOIN a `employees` (employeeName), `users` (userVacationCreatedName, userVacationUpdatedName).

Filtros: `employeeId` (=), `status` (ILIKE), `type` (ILIKE), `fromDate`/`toDate` sobre `va."createdOn"`.

**Bug DAO**: Verifica `filters.startDate`/`filters.endDate` pero usa `filters.fromDate`/`filters.toDate` en la query. `fromDate`/`toDate` del Joi nunca se mapean a `startDate`/`endDate`. Filtro de fechas siempre falla.

**Bug DAO**: Filtra `va."createdOn"` no `va."startDate"` — filtra por fecha de creación, no por fecha de vacación.

`LIMIT ${take || 10}`, `OFFSET ${skip || 0}`.

Count con Prisma `vacation.count({ where })` con lógica equivalente.

**`createVacation`**: `prisma.vacation.create` — sin `createdBy` ⚠️. No conecta user relation.

**`updateVacationById`**: `prisma.vacation.update` con `parseInt(id)`. Construcción dinámica de updateData.

**`deleteVacationById`**: `prisma.vacation.delete` con `parseInt(id)`.

---

## 8. Building Blocks — Client

### RTK Query

| Endpoint | Ruta | Método |
| ---------------------- | -------------------- | ------ |
| `getAllVacations` | `/vacation` (params) | GET |
| `createVacation` | `/vacation` | POST |
| `updateVacationById` | `/vacation/${id}` | PATCH |
| `deleteVacationById` | `/vacation/${id}` | DELETE |

Tag: `'Vacation'`, cache: 5 min.

### Components

**VacationDatatable**: columnas — employeeName, startDate, endDate, status, userVacationCreatedName, createdOn, userVacationUpdatedName, updatedOn.

**VacationDialog**: Form con employeeId (Select), startDate (Calendar), endDate (Calendar), status (Select con VACATION_STATUS enum). Audit fields deshabilitados.

**VacationFiltersForm**: Filtros employeeId, status, fromDate, toDate.

### Utils

**schema.js**:
```js
VacationStatusEnum: z.enum(['PENDING', 'APPROVED', 'REJECTED'])
VacationSchema:
  employeeId: z.preprocess(Number) → z.number().int().positive()
  startDate: z.date()
  endDate: z.date()
  status: VacationStatusEnum.default('PENDING')
  .passthrough()
```

**enums.js**: `VACATION_STATUS = ['PENDING', 'APPROVED', 'REJECTED']`.

---

## 9. Modelo de Datos

### Entidad `vacation`

| Columna | Tipo | Constraints |
| ----------- | ------------ | ------------------------------------ |
| `id` | `Int` | PK, autoincrement |
| `employeeId` | `Int` | FK → employees.id |
| `startDate` | `DateTime` | `@db.Timestamp(3)` |
| `endDate` | `DateTime` | `@db.Timestamp(3)` |
| `status` | `vacationStatus` | DEFAULT `PENDING` |
| `createdBy` | `Int` | FK → users.id |
| `updatedBy` | `Int?` | FK → users.id |
| `createdOn` | `DateTime` | `@db.Timestamp(3)` |
| `updatedOn` | `DateTime?` | `@db.Timestamp(3)` |

### Enum `vacationStatus`
```
PENDING, APPROVED, REJECTED
```

### Relaciones

```
vacation N:1 employees (employeeId)
vacation N:1 users (createdBy — userVacationCreated)
vacation N:1 users? (updatedBy — userVacationUpdated)
```

---

## 10. Contratos de API

### GET /api/v1/vacation
Query: `employeeId`, `status`, `fromDate`, `toDate`, `page`, `limit`.
Response: `{ dataList: [...], total: N }` con `employeeName`, `userVacationCreatedName`, `userVacationUpdatedName`.

### POST /api/v1/vacation
Body: `{ employeeId, startDate, endDate, status? }`.
Response 201: vacation object.

### PATCH /api/v1/vacation/:id
Body: parcial.
Response 200: vacation object.

### DELETE /api/v1/vacation/:id
Response 200: vacation object + message.

---

## 11. Validación

### Joi (Server)

```js
vacationFiltersSchema: employeeId (int), status (PENDING|APPROVED|REJECTED), fromDate (date), toDate (date), limit, page
vacationCreateSchema: employeeId (int req), startDate (date req), endDate (date req), status (enum, default PENDING)
vacationUpdateSchema: employeeId, startDate, endDate, status (todos opcionales). Sin .min(1) ⚠️
```

### Zod (Client)

```js
VacationSchema: employeeId (int positive), startDate (date), endDate (date), status (PENDING|APPROVED|REJECTED default PENDING).passthrough()
```

---

## 12. Seguridad

- `verifyToken` global.
- `checkRoleAuthOrPermisssion` con permisos: canViewVacations, canRequestVacation, canDeleteVacation, canEditRequestVacation.
- Roles: ADMIN, MANAGER, **USER** — USER tiene acceso completo (create, edit, delete).

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ------------------------------------------------------------ | --------- |
| R-001 | **Controller no pasa userId**: `createVacation` y `patchVacationById` no envían `req.userId` → `createdBy`/`updatedBy` NULL en DB. | **CRITICAL** |
| R-002 | **DAO date filter bug**: Verifica `filters.startDate` pero usa `filters.fromDate` (undefined). Filtro de fechas inoperativo. | **HIGH** |
| R-003 | **DAO filtra `createdOn` en vez de `startDate`**: Date range opera sobre fecha de creación, no de vacación. | HIGH |
| R-004 | **Swagger/JSDoc fields inexistentes**: `type` (ANNUAL, SICK, PERSONAL, UNPAID) y `reason` documentados pero no existen en Prisma schema. Código legacy/documentación incorrecta. | MEDIUM |
| R-005 | **Joi updateSchema sin .min(1)**: Permite body vacío en PATCH. | MEDIUM |
| R-606 | **deleteVacationById sin parseInt**: `id` string no convertido a número antes de Prisma (aunque Prisma acepta string en `where`). | LOW |
| R-007 | **DAO type filter sin campo**: Filtra `va."type"` pero columna no existe en DB → error SQL. | **HIGH** |
| R-008 | **Sin tests**: 0% cobertura. | HIGH |
| R-009 | **Sin manejo Prisma errors**: P2025, P2003 no capturados. | HIGH |

---

## 14. Glosario

| Término | Definición |
| --------- | --------------------------------------------------------------------------- |
| **vacationStatus** | Enum: PENDING, APPROVED, REJECTED. |
| **userVacationCreatedName** | Nombre del usuario que creó vacación, via LEFT JOIN. |
| **canRequestVacation** | Permiso para crear solicitud de vacaciones. |

---

## 15. Apéndices

### Archivos

```
SERVER: routes.js (282), controller.js (84), service.js (87), dao.js (163), schemas/vacation.joi.js (28)
CLIENT: api/vacationApi.js (60), pages/, 3 components, utils/schema.js (24), utils/enums.js (1)
```

### Middleware Stack

`verifyToken` → `checkRoleAuthOrPermisssion` → `validateQueryParams/validateSchema/validatePathParam` → Controller → Service → DAO
