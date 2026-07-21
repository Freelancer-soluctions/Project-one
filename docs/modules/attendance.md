# Módulo: Attendance (Server + Client)

> Documentación técnica integral del módulo **Attendance** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre backend (`apps/server/src/modules/attendance/`) y frontend (`apps/client/src/modules/attendance/`).
>
> **Audiencia:** Arquitectos, Tech Leads, desarrolladores backend/frontend, revisores, auditores de seguridad, QA.

---

## 1. Metadatos del Documento e Historial de Revisiones

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `attendance` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/attendance/` |
| **Path Client** | `apps/client/src/modules/attendance/` |
| **Base URL API** | `/api/v1/attendance` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial. 4 endpoints server, 4 hooks RTK Query, 3 componentes client, 1 modelo Prisma (attendance), raw SQL + JOINs. |

---

## 2. Introducción y Objetivos

Registra asistencia diaria de empleados. CRUD con:

- **entryTime/exitTime**: HH:mm (VarChar(5)).
- **workedHours**: Decimal(18,2) — horas trabajadas.
- **Date filter**: rango `fromDate`/`toDate` con BETWEEN.
- **JOINs**: employee name/lastName, user creates/updates names.
- **Auditoría**: createdBy/updatedBy con timestamps.

---

## 3. Contexto y Alcance

```
[Admin / Manager / User]
      |
[Attendance Module] <--CRUD--> [/api/v1/attendance]
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
| C-04 | entryTime/exitTime como VarChar(5) en formato HH:mm |
| C-05 | workedHours como Decimal(18,2) |

---

## 5. Stack Tecnológico

Express, Prisma, PostgreSQL, React, RTK Query, Joi, Zod, react-hook-form.

---

## 6. Arquitectura del Módulo

```
apps/server/src/modules/attendance/
├── routes.js                          # 4 rutas, OpenAPI inline
├── controller.js                      # 4 handlers
├── service.js                         # 5 métodos (incluye patch + update helpers)
├── dao.js                             # raw SQL + Prisma ORM híbrido
└── schemas/attendance.joi.js          # filters, create, update

apps/client/src/modules/attendance/
├── api/attendanceApi.js               # RTK Query
├── components/                        # Datatable, Dialog, FiltersForm
├── pages/
└── utils/                             # schema.js
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Middleware | Handler |
| ------ | --- | ------------------------------------------------------------ | --------------- |
| GET | `/` | `canViewAttendance` (ADMIN/MANAGER/USER), `validateQueryParams` | `getAllAttendance` |
| POST | `/` | `canCreateAttendance` (ADMIN/MANAGER), `validateSchema(attendanceCreateSchema)` | `createAttendance` |
| DELETE | `/:id` | `canDeleteAttendance` (ADMIN/MANAGER), `validatePathParam` | `deleteAttendanceById` |
| PATCH | `/:id` | `canEditAttendance` (ADMIN/MANAGER), `validatePathParam`, `validateSchema(attendanceUpdateSchema)` | `patchAttendanceById` |

Roles: USER solo GET (view); ADMIN/MANAGER create/edit/delete.

### Controller

- `getAllAttendance(req.safeQuery)` → `globalResponse(res, 200, data)`
- `createAttendance(req.body, req.userId)` → `globalResponse(res, 201, attendance)`
- `deleteAttendanceById(req.params.id)` → `globalResponse(res, 200, { message: '...' })`
- `patchAttendanceById(req.params.id, {...req.body}, req.userId)` → `globalResponse(res, 200, attendance)`

`req.userId` se pasa como segundo parámetro a service. Delete no recibe userId (no auditoría en delete).

### Service

**`getAllAttendance({ employeeId, fromDate, toDate, limit, page })`**: `getSafePagination`, pasa filtros + take/skip a DAO.

**`createAttendance(data, userId)`**: Type coercion: `employeeId: Number(...)`, `date: new Date(...)`, agrega `createdOn`, `createdBy`.

**`updateAttendanceById(id, data, userId)`**: Type coercion, agrega `updatedOn`, `updatedBy`. Usa `Number(id)`.

**`patchAttendanceById(id, data, userId)`**: Solo agrega `updatedOn`, `updatedBy`. Sin coercion de types (porque PATCH puede tener subset de campos).

**`deleteAttendanceById(id)`**: `Number(id)`.

### DAO

**`getAllAttendance`**: raw SQL `$queryRaw` con LEFT JOIN a `employees` (employeeName, employeeLastName), `users` (userAttendanceCreatedName, userAttendanceUpdatedName).

Filtros: `employeeId` (=), `fromDate`/`toDate` (BETWEEN). Si solo fromDate → `>=`, solo toDate → `<=`.

`LIMIT ${take || 10}`, `OFFSET ${skip || 0}` — default 10/0.

Count: `prisma.attendance.count({ where })` con lógica equivalente.

**`createAttendance`**: `prisma.attendance.create` con `employee: { connect }`, `userAttendanceCreated: { connect }`.

**`updateAttendanceById`**: Construcción dinámica de `updateData` objeto. Seta scalar fields si `!== undefined`. Relations via `connect`.

**`deleteAttendanceById`**: `prisma.attendance.delete({ where: { id } })`.

---

## 8. Building Blocks — Client

### RTK Query

| Endpoint | Ruta | Método |
| ---------------------- | -------------------- | ------ |
| `getAllAttendance` | `/attendance` (params) | GET |
| `createAttendance` | `/attendance` | POST |
| `updateAttendanceById` | `/attendance/${id}` | PATCH |
| `deleteAttendanceById` | `/attendance/${id}` | DELETE |

Tag: `'Attendance'`, cache: 5 min. No endpoint para filters (usa getAllAttendance con params).

### Components

**AttendanceDatatable**: 9 columnas — employeeName, date (PPP), entryTime, exitTime, workedHours (toFixed(2)), userAttendanceCreatedName, createdOn, userAttendanceUpdatedName, updatedOn.

**AttendanceDialog**: Form con employeeId (Select de employees), date (Calendar), entryTime (type=time HH:mm), exitTime (type=time HH:mm), workedHours (type=number step=0.01). Audit fields deshabilitados. `pickDirty` para PATCH. Convierte date a `yyyy-MM-dd` string en submit.

**AttendanceFiltersForm**: Filtros employeeId, fromDate, toDate.

### Utils

**schema.js**:
```js
AttendanceSchema:
  employeeId: z.preprocess(Number) → z.number().int().positive()
  date: z.date()
  entryTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)  // HH:mm
  exitTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)    // HH:mm
  workedHours: z.preprocess(Number) → z.number().int().positive()
  .passthrough()
```

Nota: Zod `workedHours` es `.int()`, pero Joi/Prisma son `.precision(2)` decimal. Discrepancia.

---

## 9. Modelo de Datos

### Entidad `attendance`

| Columna | Tipo | Constraints |
| ----------- | ------------ | ------------------------------------ |
| `id` | `Int` | PK, autoincrement |
| `employeeId` | `Int` | FK → employees.id |
| `date` | `DateTime` | `@db.Timestamp(3)` |
| `entryTime` | `String` | `@db.VarChar(5)` — HH:mm |
| `exitTime` | `String` | `@db.VarChar(5)` — HH:mm |
| `workedHours` | `Decimal` | `@db.Decimal(18, 2)` |
| `createdBy` | `Int` | FK → users.id |
| `updatedBy` | `Int?` | FK → users.id |
| `createdOn` | `DateTime` | `@db.Timestamp(3)` |
| `updatedOn` | `DateTime?` | `@db.Timestamp(3)` |

### Relaciones

```
attendance N:1 employees (employeeId)
attendance N:1 users (createdBy — userAttendanceCreated)
attendance N:1 users? (updatedBy — userAttendanceUpdated)
```

---

## 10. Contratos de API

### GET /api/v1/attendance
Query: `employeeId`, `fromDate`, `toDate`, `page`, `limit`.
Response: `{ dataList: [...], total: N }`.
Cada item incluye `employeeName`, `employeeLastName`, `userAttendanceCreatedName`, `userAttendanceUpdatedName`.

### POST /api/v1/attendance
Body: `{ employeeId, date, entryTime, exitTime, workedHours }`.
Response 201: attendance object.

### PATCH /api/v1/attendance/:id
Body: parcial de create fields (min 1).
Response 200: attendance object.

### DELETE /api/v1/attendance/:id
Response 200: `{ message }`.

---

## 11. Validación

### Joi (Server)

```js
attendanceFiltersSchema: employeeId (int), fromDate (date), toDate (date), limit, page
attendanceCreateSchema: employeeId (int req), date (date req), entryTime (string max5 req), exitTime (string max5 req), workedHours (number precision(2) positive req)
attendanceUpdateSchema: todos opcionales, .min(1)
```

### Zod (Client)

```js
AttendanceSchema: employeeId (int positive req), date (date req), entryTime (regex HH:mm), exitTime (regex HH:mm), workedHours (int positive req).passthrough()
```

**Discrepancia**: Zod `workedHours` es `.int()`, API/DB acepta decimal (`.precision(2)`).

---

## 12. Seguridad

- `verifyToken` global.
- `checkRoleAuthOrPermisssion` con permisos: canViewAttendance, canCreateAttendance, canEditAttendance, canDeleteAttendance.
- Roles: ADMIN, MANAGER, **USER** (solo view). USER no puede create/edit/delete.

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ------------------------------------------------------------ | --------- |
| R-001 | **console.log en DAO**: 4 statements (filters, whereClauses, whereSql, take/skip). Debug leftover. | LOW |
| R-002 | **workedHours type mismatch**: Zod `.int()` vs DB `Decimal(18,2)`. Datos decimales truncados. | MEDIUM |
| R-003 | **DAO LIMIT/OFFSET defaults**: `take || 10`, `skip || 0` silencioso si no hay paginación. | MEDIUM |
| R-004 | **Sin manejo Prisma errors**: P2025 (not found), P2003 (FK) no capturados. | HIGH |
| R-005 | **Sin tests**: 0% cobertura. | HIGH |
| R-006 | **Delete no audita**: No registra quién eliminó. | MEDIUM |
| R-007 | **Joi filters desincronizado con OpenAPI**: OpenAPI menciona `date` y `status` filters que Joi/DAO no soportan. | LOW |
| R-008 | **Service `updateAttendanceById` no usado**: Controller solo llama `patchAttendanceById`. `updateAttendanceById` existe pero es unreferenced. | LOW |
| R-009 | **Service `updateAttendanceById` hace coercion de tipos** (employeeId Number, date new Date), mientras `patchAttendanceById` no — inconsistente. | LOW |

---

## 14. Glosario

| Término | Definición |
| --------- | --------------------------------------------------------------------------- |
| **entryTime/exitTime** | Hora de entrada/salida en formato HH:mm, VarChar(5). |
| **workedHours** | Horas trabajadas, Decimal(18,2). |
| **userAttendanceCreatedName** | Nombre del usuario que creó el registro, via LEFT JOIN. |

---

## 15. Apéndices

### Archivos

```
SERVER: routes.js (271), controller.js (95), service.js (114), dao.js (180), schemas/attendance.joi.js (26)
CLIENT: api/attendanceApi.js (60), pages/, 3 components (Datatable 107, Dialog 475), utils/schema.js (37)
```

### Middleware Stack

`verifyToken` → `checkRoleAuthOrPermisssion` → `validateQueryParams/validateSchema/validatePathParam` → Controller → Service → DAO

### DAO Raw SQL Pattern

```sql
SELECT a.*, e.name AS "employeeName", u.name AS "userAttendanceCreatedName", uu.name AS "userAttendanceUpdatedName"
FROM "attendance" a
LEFT JOIN "employees" e ON a."employeeId" = e.id
LEFT JOIN "users" u ON a."createdBy" = u.id
LEFT JOIN "users" uu ON a."updatedBy" = uu.id
WHERE ...  /* dynamic filters */
ORDER BY a."date" DESC, a."entryTime" DESC
LIMIT take OFFSET skip
```

### Update Dynamic Build Pattern

```js
const updateData = {};
if (data.date !== undefined) updateData.date = data.date;
if (data.entryTime !== undefined) updateData.entryTime = data.entryTime;
// ... etc
if (data.employeeId !== undefined) {
  updateData.employee = { connect: { id: data.employeeId } };
}
```
