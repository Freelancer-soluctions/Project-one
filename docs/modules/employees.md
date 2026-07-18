# Módulo: Employees (Server + Client)

> Documentación técnica integral del módulo **Employees** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre tanto el backend (`apps/server/src/modules/employees/`) como el frontend (`apps/client/src/modules/employees/`).
>
> **Audiencia:** Arquitectos, Tech Leads, desarrolladores backend/frontend, revisores, auditores de seguridad, QA.

---

## 1. Metadatos del Documento e Historial de Revisiones

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `employees` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/employees/` |
| **Path Client** | `apps/client/src/modules/employees/` |
| **Base URL API** | `/api/v1/employees` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial. 5 endpoints server, 5 hooks RTK Query, 3 componentes client, 1 modelo Prisma (employees), esquemas Joi/Zod, sensitive data (dni hash, salary encrypt). |

---

## 2. Introducción y Objetivos

### 2.1 Propósito

Gestiona empleados de la organización. CRUD completo con:

- **DNI hash + encrypted**: `dni_hash` (SHA-256 para búsqueda), `dni` (cifrado AES).
- **Salary encryption**: Almacenado como string cifrado en `@db.VarChar(128)`.
- **Auditoría**: `createdBy`/`updatedBy` conectados a `users`, timestamps.
- **Filtros**: name, lastName, dni (hasheado), email, department, position.
- **Paginación server-side**: raw SQL `$queryRaw` + Prisma `count`.

---

## 3. Contexto y Alcance

```
[HR Admin / Manager]
      |
[Employees Module] <--CRUD--> [/api/v1/employees]
      |
      |-- 1:N --> [attendance]
      |-- 1:N --> [payroll]
      |-- 1:N --> [performanceEvaluation]
      |-- 1:N --> [vacation]
      |-- 1:N --> [permission]
```

---

## 4. Restricciones

| ID | Restricción |
| -- | ------------------------------------------------------------ |
| C-01 | PostgreSQL + Prisma ORM |
| C-02 | Express.js + React + RTK Query |
| C-03 | JWT + `verifyToken` obligatorio |
| C-04 | DNI hash (`hashValue`) para búsqueda, DNI encrypt (`@db.VarChar(128)`) para almacenamiento |
| C-05 | Salary encrypt como string (`@db.VarChar(128)`) — no es número plano |
| C-06 | `decryptResults` aplicado post-query en GetAllEmployees |
| C-07 | Roles: ADMIN, MANAGER |

---

## 5. Stack Tecnológico

Express, Prisma, PostgreSQL, React, RTK Query, Joi, Zod, react-hook-form, `hashValue` (crypto), `decryptResults` (sensitive transform).

---

## 6. Arquitectura del Módulo

```
apps/server/src/modules/employees/
├── routes.js                          # 5 rutas, OpenAPI inline
├── controller.js                      # 5 handlers
├── service.js                         # 5 métodos
├── dao.js                             # raw SQL + Prisma ORM híbrido
└── schemas/employees.joi.js           # filters, create, update

apps/client/src/modules/employees/
├── api/employeesApi.js                # RTK Query
├── components/                        # Datatable, Dialog, FiltersForm
├── pages/Employees.jsx
└── utils/                             # schema.js, index.js
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Middleware | Handler |
| ------ | ---------------------- | ------------------------------------------------------------ | ------------------- |
| GET | `/` | `canViewEmployee`, `validateQueryParams(employeeFiltersSchema)` | `getAllEmployees` |
| GET | `/employeeFilters` | `canViewEmployee` | `getAllEmployeesFilters` |
| POST | `/` | `canCreateEmployee`, `validateSchema(employeeCreateSchema)` | `createEmployee` |
| PATCH | `/:id` | `canEditEmployee`, `validatePathParam`, `validateSchema(employeeUpdateSchema)` | `updateEmployeeById` |
| DELETE | `/:id` | `canDeleteEmployee`, `validatePathParam` | `deleteEmployeeById` |

Roles: ADMIN, MANAGER en todos. USER no tiene acceso.

### Controller

- `getAllEmployees(req.safeQuery)` → `globalResponse(res, 200, data)`
- `getAllEmployeesFilters()` → `globalResponse(res, 200, Array)`
- `createEmployee({...req.body, createdBy: req.userId})` → `globalResponse(res, 201, employee)`
- `updateEmployeeById(req.params.id, {...req.body, updatedBy: req.userId})` → `globalResponse(res, 200, employee)`
- `deleteEmployeeById(req.params.id)` → `globalResponse(res, 200, { message: 'Employee deleted successfully' })`

Nota: `req.userId` usado para auditoría (no `req.user.id`). Conforme a patrón encontrado en módulos tempranos.

### Service

- `getAllEmployees(filters)`: `getSafePagination({ page, limit })` → pasa `(filters, take, skip)` a DAO. Si `take <= 0`, lanza error.
- `getAllEmployeesFilters()`: delega directo a DAO.
- `createEmployee(data)`: agrega `createdOn: new Date()`, delega.
- `updateEmployeeById(id, data)`: agrega `updatedOn: new Date()`, `Number(id)`.
- `deleteEmployeeById(id)`: `Number(id)`.

### DAO

**`getAllEmployees`**: raw SQL `$queryRaw` con LEFT JOIN a `users` para `userEmployeeCreatedName`/`userEmployeeUpdatedName`. `decryptResults(employees)`. Count con Prisma `employees.count({ where })`.

Filtros aplicados en WHERE: name, lastName, dni (`dni_hash ILIKE ${hashValue(filters.dni)}%`), email, department, position. Todos `ILIKE`.

**`getAllEmployeesFilters`**: `prisma.employees.findMany()`.

**`createEmployee`**: `prisma.employees.create` con `dni_hash: hashValue(data.dni)`, `userEmployeeCreated: { connect: { id } }`.

**`updateEmployeeById`**: `prisma.employees.update` con `dni_hash: hashValue(data.dni)`, `userEmployeeUpdated: { connect: { id } }`.

**`deleteEmployeeById`**: `prisma.employees.delete({ where: { id } })`.

---

## 8. Building Blocks — Client

### RTK Query

| Endpoint | Ruta | Método |
| ---------------------- | ------------------------------ | ------ |
| `getAllEmployees` | `/employees` (params) | GET |
| `getAllEmployeesFilters` | `/employees/employeeFilters` | GET |
| `createEmployee` | `/employees/` | POST |
| `updateEmployeeById` | `/employees/${id}` | PATCH |
| `deleteEmployeeById` | `/employees/${id}` | DELETE |

Tag: `'Employees'`, cache: 5 min.

### Components

**EmployeesDatatable**: 11 columnas — name, lastName, dni, email, position, department, salary (COP format), userEmployeeCreatedName, createdOn, userEmployeeUpdatedName, updatedOn. Paginación con `DataTable`.

**EmployeesDialog**: Form con name, lastName, dni, email, phone, address, startDate (Calendar), position, department, salary. `pickDirty` para PATCH.

**EmployeesFiltersForm**: Filtros name, dni, email.

### Utils

**schema.js**:
```js
EmployeeSchema: name (min 1), lastName (min 1), dni (min 1), email (valid), phone (opt), address (opt), startDate (date req), position (min 1), department (min 1), salary (string min 1).passthrough()
EmployeeFiltersSchema: name (opt), dni (opt), email (valid opt)
```

Nota: `salary` es **string** en Zod (coincide con DB encrypted string). `startDate` es `z.date()`.

---

## 9. Modelo de Datos

### Entidad `employees`

| Columna | Tipo | Constraints |
| ----------- | ------------ | ------------------------------ |
| `id` | `Int` | PK, autoincrement |
| `name` | `String` | NOT NULL, `@db.VarChar(100)` |
| `lastName` | `String` | NOT NULL, `@db.VarChar(100)` |
| `dni_hash` | `String` | UNIQUE, `@db.VarChar(64)` — SHA-256 |
| `dni` | `String` | `@db.VarChar(128)` — encrypt (AES) |
| `phone` | `String?` | nullable, `@db.VarChar(15)` |
| `email` | `String` | UNIQUE, `@db.VarChar(100)` |
| `address` | `String?` | nullable, `@db.VarChar(120)` |
| `startDate` | `DateTime` | `@db.Timestamp(3)` |
| `position` | `String` | `@db.VarChar(100)` |
| `department` | `String` | `@db.VarChar(100)` |
| `salary` | `String` | `@db.VarChar(128)` — encrypt |
| `createdBy` | `Int` | FK → `users.id` |
| `updatedBy` | `Int?` | FK → `users.id` |
| `createdOn` | `DateTime` | `@db.Timestamp(3)` |
| `updatedOn` | `DateTime?` | `@db.Timestamp(3)` |

### Relaciones

```
employees 1:N attendance, 1:N payroll, 1:N performanceEvaluation, 1:N vacation, 1:N permission
employees N:1 users (createdBy), N:1 users (updatedBy)
```

---

## 10. Contratos de API

### GET /api/v1/employees
Query: `name`, `lastName`, `dni`, `email`, `department`, `position`, `page`, `limit`.
Response: `{ dataList: [...], total: N }`.
Cada item incluye `userEmployeeCreatedName`, `userEmployeeUpdatedName` de JOIN users.

### GET /api/v1/employees/employeeFilters
Response: Array de employees sin paginación.

### POST /api/v1/employees
Body: `{ name, lastName, dni, email, phone?, address?, startDate, position, department, salary }`.
Response 201: employee object.

### PATCH /api/v1/employees/:id
Body: parcial de create fields.
Response 200: employee object.

### DELETE /api/v1/employees/:id
Response 200: `{ message }`.

---

## 11. Validación

### Joi (Server)

```js
employeeFiltersSchema: name (max100), lastName (max100), dni (max10), email (email), department (max100), position (max100), limit, page
employeeCreateSchema: name (max100 req), lastName (max100 req), dni (max10 req), email (email req), phone (max15), address (max120), startDate (date req), position (max100 req), department (max100 req), salary (number precision(2) positive req)
employeeUpdateSchema: todos opcionales min1
```

### Zod (Client)

```js
EmployeeSchema: name (min1), lastName (min1), dni (min1), email (email), phone (opt), address (opt), startDate (date req), position (min1), department (min1), salary (string min1).passthrough()
EmployeeFiltersSchema: name (opt), dni (opt), email (valid opt)
```

**Discrepancia**: Joi `salary` es `number()`, Zod `salary` es `string()` (coincide con DB encrypted string). Joi employeeFilters no tiene lastName/department/position filters, pero DAO sí los soporta.

---

## 12. Seguridad

- `verifyToken` global.
- `checkRoleAuthOrPermisssion` con permisos: `canViewEmployee`, `canCreateEmployee`, `canEditEmployee`, `canDeleteEmployee`.
- Roles: ADMIN, MANAGER.
- **Sensitive data**: DNI hasheado (`dni_hash`), DNI y salary encriptados (AES). `decryptResults` post-query.

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ------------------------------------------------------------ | --------- |
| R-001 | **DAO raw SQL sin prepared statements en filtro dni**: `dni_hash ILIKE ${hashValue(filters.dni)}%` — aunque hashValue sanitiza, el patrón es frágil. Otros filtros usan `Prisma.sql` correctamente. | MEDIUM |
| R-002 | **DAO desincronizado con Joi filters**: DAO soporta lastName, department filters que Joi no expone (Joi employeeFilters no los define). | LOW |
| R-003 | **Sin manejo Prisma errors**: P2002 (unique dni/email), P2025 (not found), P2003 (FK) no capturados. | HIGH |
| R-004 | **Sin tests**: 0% cobertura. | HIGH |
| R-005 | **salary type mismatch**: Joi `number()`, Zod `string()`. DB almacena String encrypt. Server recibe number de Joi, lo guarda como string en encrypt. | MEDIUM |
| R-006 | **delete cascade**: Si employee tiene attendance/payroll/vacation/permission/performanceEvaluation, DELETE falla por FK. Sin soft delete ni verificación. | HIGH |
| R-007 | **Controller delete no retorna objeto**: `{ message }` solo, sin data del registro eliminado. | LOW |
| R-008 | **Controller create tiene `console.log(req.body)`**: Debug leftover. | LOW |

---

## 14. Glosario

| Término | Definición |
| --------- | --------------------------------------------------------------------------- |
| **dni_hash** | Hash SHA-256 del DNI para búsqueda ILIKE. Único. |
| **decryptResults** | Función que desencripta campos sensibles (`dni`, `salary`) post-query. |
| **hashValue** | Función crypto que genera SHA-256 hash para búsqueda de DNI. |
| **employeeFilters** | Endpoint separado para dropdowns UI. |
| **userEmployeeCreatedName** | Nombre del usuario que creó el employee, obtenido via LEFT JOIN. |

---

## 15. Apéndices

### Archivos

```
SERVER: routes.js (268), controller.js (103), service.js (93), dao.js (230), schemas/employees.joi.js (38)
CLIENT: api/employeesApi.js (67), pages/Employees.jsx, 3 components, utils/schema.js (44)
```

### Middleware Stack

`verifyToken` → `checkRoleAuthOrPermisssion` → `validateQueryParams/validateSchema/validatePathParam` → Controller → Service → DAO

### Patrón Sensitive Data

```
create: dni → hashValue(dni) → dni_hash. Prisma guarda dni y dni_hash.
query: $queryRaw + decryptResults → desencripta dni/salary post-query.
salary: Joi valida como number → DB almacena como string encrypt → Zod recibe como string.
```
