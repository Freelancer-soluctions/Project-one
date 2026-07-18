# Módulo: Payroll (Server + Client)

> Documentación técnica integral del módulo **Payroll** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre backend (`apps/server/src/modules/payroll/`) y frontend (`apps/client/src/modules/payroll/`).
>
> **Audiencia:** Arquitectos, Tech Leads, desarrolladores backend/frontend, revisores, auditores de seguridad, QA.

---

## 1. Metadatos del Documento e Historial de Revisiones

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `payroll` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/payroll/` |
| **Path Client** | `apps/client/src/modules/payroll/` |
| **Base URL API** | `/api/v1/payroll` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial. 4 endpoints server, 4 hooks RTK Query, 3 componentes client, 1 modelo Prisma (payroll), sensitive data (salarios encriptados). |

---

## 2. Introducción y Objetivos

Gestiona nómina mensual de empleados. CRUD con:

- **Salarios encriptados**: `baseSalary`, `extraHours`, `deductions`, `totalPayment` como `VarChar(128)` cifrado.
- **decryptResults**: Desencripta post-query.
- **Filtros**: employeeId, month, year.
- **Auditoría**: createdBy/updatedBy con timestamps + JOIN users.

---

## 3. Contexto y Alcance

```
[Admin / Manager]
      |
[Payroll Module] <--CRUD--> [/api/v1/payroll]
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
| C-04 | Todos los montos monetarios: `String` encrypted en `@db.VarChar(128)` |
| C-05 | `decryptResults` aplicado post-query en GetAllPayroll |
| C-06 | Roles: ADMIN, MANAGER |

---

## 5. Stack Tecnológico

Express, Prisma, PostgreSQL, React, RTK Query, Joi, Zod, react-hook-form, `decryptResults`.

---

## 6. Arquitectura del Módulo

```
apps/server/src/modules/payroll/
├── routes.js                          # 4 rutas, Swagger inline
├── controller.js                      # 4 handlers
├── service.js                         # 4 métodos
├── dao.js                             # raw SQL + Prisma ORM híbrido
└── schemas/payroll.joi.js             # filters, create, update

apps/client/src/modules/payroll/
├── api/payrollApi.js                  # RTK Query
├── components/                        # Datatable, Dialog, FiltersForm
├── pages/
└── utils/                             # schema.js, enums.js
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Middleware | Handler |
| ------ | --- | ------------------------------------------------------------ | ---------------------- |
| GET | `/` | `canViewPayroll` (ADMIN/MANAGER), `validateQueryParams` | `getAllPayroll` |
| POST | `/` | `canCreatePayroll` (ADMIN/MANAGER), `validateSchema(payrollCreateSchema)` | `createPayroll` |
| DELETE | `/:id` | `canDeletePayroll` (ADMIN/MANAGER), `validatePathParam` | `deletePayrollById` |
| PATCH | `/:id` | `canEditPayroll` (ADMIN/MANAGER), `validatePathParam`, `validateSchema(payrollUpdateSchema)` | `updatePayrollByIdPartial` |

### Controller

- `getAllPayroll(filters)` → `globalResponse(res, 200, payroll, '...')` — **4 args** (message incluido)
- `createPayroll(req.body, req.userId)` → `globalResponse(res, 201, payroll, '...')` — **4 args**
- `deletePayrollById(id)` → `globalResponse(res, 200, 'Payroll deleted successfully')` — **3 args, string, not object** ⚠️
- `updatePayrollByIdPartial(id, req.body, req.userId)` → `globalResponse(res, 200, payroll, '...')`

### Service

**`createPayroll(data, userId)`**: Convierte montos numéricos a string: `String(data.baseSalary)`, `String(data.extraHours)`, `String(data.deductions)`, `String(data.totalPayment)`. Agrega `createdOn`, `createdBy`.

**`getAllPayroll(filters)`**: `getSafePagination`, delega a DAO.

**`updatePayrollByIdPartial(id, data, userId)`**: Agrega `updatedOn`, `updatedBy`.

**`deletePayrollById(id)`**: `Number(id)`.

### DAO

**`getAllPayroll`**: raw SQL `$queryRaw` con LEFT JOIN a `employees` (employeeName, employeeLastName), `users` (userPayrollCreatedName, userPayrollUpdatedName).

Filtros: `employeeId` (=), `month` (ILIKE ⚠️), `year` (ILIKE ⚠️). Month/year son `Int` en DB pero DAO usa ILIKE sobre string — bug potencial.

`decryptResults(payrolls)` post-query. Count con `prisma.payroll.count({ where })` con contains.

**`createPayroll`**: `prisma.payroll.create` con `employee: { connect }`, `userPayrollCreated: { connect }`.

**`updatePayrollById`**: `prisma.payroll.update` con spread condicional, `parseInt(id)`.

**`deletePayrollById`**: `prisma.payroll.delete({ where: { id } })`.

---

## 8. Building Blocks — Client

### RTK Query

| Endpoint | Ruta | Método |
| -------------------- | ---------------- | ------ |
| `getAllPayroll` | `/payroll` (params) | GET |
| `createPayroll` | `/payroll` | POST |
| `updatePayrollById` | `/payroll/${id}` | PATCH |
| `deletePayrollById` | `/payroll/${id}` | DELETE |

Tag: `'Payroll'`, cache: 5 min.

### Components

**PayrollDatatable**: 11 columnas — employeeName, month, year, baseSalary, extraHours, deductions, totalPayment, userPayrollCreatedName, createdOn, userPayrollUpdatedName, updatedOn.

⚠️ `dataPayroll.data` nested path (`const { dataList, total } = dataPayroll.data`) — distinto de otros módulos.

**PayrollDialog**: Form con employeeId (Select), month (Select de enums), year (Input number), baseSalary, extraHours, deductions, totalPayment. Audit fields deshabilitados.

**PayrollFiltersForm**: Filtros employeeId, month, year.

### Utils

**schema.js**:
```js
PayrollSchema:
  employeeId: z.preprocess(Number) → z.number().int().positive()
  month: z.preprocess(Number) → z.number().int().min(1).max(12)
  year: z.preprocess(Number) → z.number().int().min(2000).max(currentYear+1)
  baseSalary: z.preprocess(Number) → z.number().positive()
  extraHours: z.preprocess(Number) → z.number().nonnegative().optional().default(0)
  deductions: z.preprocess(Number) → z.number().nonnegative().optional().default(0)
  totalPayment: z.preprocess(Number) → z.number().positive()
  .passthrough()
```

**enums.js**: `months` array (value '01'-'12', label 'January'-'December').

---

## 9. Modelo de Datos

### Entidad `payroll`

| Columna | Tipo | Constraints |
| -------------- | ------------ | ------------------------------------ |
| `id` | `Int` | PK, autoincrement |
| `employeeId` | `Int` | FK → employees.id |
| `month` | `Int` | `@db.Integer` (1-12) |
| `year` | `Int` | `@db.Integer` |
| `baseSalary` | `String` | `@db.VarChar(128)` — encrypt |
| `extraHours` | `String` | `@db.VarChar(128)` — encrypt |
| `deductions` | `String` | `@db.VarChar(128)` — encrypt |
| `totalPayment` | `String` | `@db.VarChar(128)` — encrypt |
| `createdBy` | `Int` | FK → users.id |
| `updatedBy` | `Int?` | FK → users.id |
| `createdOn` | `DateTime` | `@db.Timestamp(3)` |
| `updatedOn` | `DateTime?` | `@db.Timestamp(3)` |

### Relaciones

```
payroll N:1 employees (employeeId)
payroll N:1 users (createdBy — userPayrollCreated)
payroll N:1 users? (updatedBy — userPayrollUpdated)
```

---

## 10. Contratos de API

### GET /api/v1/payroll
Query: `employeeId`, `month`, `year`, `page`, `limit`.
Response: `{ dataList: [...], total: N }` con `employeeName`, `employeeLastName`, `userPayrollCreatedName`, `userPayrollUpdatedName`.

### POST /api/v1/payroll
Body: `{ employeeId, month, year, baseSalary, extraHours, deductions, totalPayment }`.
Response 201: payroll object (montos decrypt).

### PATCH /api/v1/payroll/:id
Body: parcial de create fields (min 1).
Response 200: payroll object.

### DELETE /api/v1/payroll/:id
Response 200: string `"Payroll deleted successfully"` (no objeto).

---

## 11. Validación

### Joi (Server)

```js
payrollFiltersSchema: employeeId (int), month (int 1-12), year (int 1900-2100), limit, page
payrollCreateSchema: employeeId (int req), month (int 1-12 req), year (int 1900-2100 req), baseSalary (number precision(2) positive req), extraHours (precision(2) min0 req), deductions (precision(2) min0 req), totalPayment (precision(2) positive req)
payrollUpdateSchema: todos con .min(1)
```

### Zod (Client)

```js
PayrollSchema: employeeId (int positive), month (int 1-12), year (int 2000-curr+1), baseSalary (number positive), extraHours (number nonnegative default0), deductions (number nonnegative default0), totalPayment (number positive).passthrough()
```

---

## 12. Seguridad

- `verifyToken` global.
- `checkRoleAuthOrPermisssion` con permisos: canViewPayroll, canCreatePayroll, canEditPayroll, canDeletePayroll.
- Roles: ADMIN, MANAGER (USER no tiene acceso).
- **Sensitive data**: 4 campos monetarios encriptados, `decryptResults` post-query.

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ------------------------------------------------------------ | --------- |
| R-001 | **DAO ILIKE en Int**: `month`/`year` son Int en DB, pero DAO usa `ILIKE '%...%'` y `contains` — bug. Postgres lanza error de tipos. | **HIGH** |
| R-002 | **globalResponse inconsistente**: Delete retorna string plano en lugar de objeto. Datos consumer espera `{ data }`. | MEDIUM |
| R-003 | **Datatable nested path**: `dataPayroll.data` vs `dataPayroll` en otros módulos. | MEDIUM |
| R-004 | **Datatable muestra encrypted values**: `info.getValue()` sobre baseSalary/extraHours/deductions/totalPayment (no hay decrypt en client). | **HIGH** |
| R-005 | **Sin tests**: 0% cobertura. | HIGH |
| R-006 | **Sin manejo Prisma errors**: P2025, P2003 no capturados. | HIGH |
| R-007 | **Swagger vs OpenAPI tags**: Usa `@swagger` en lugar de `@openapi`. Diferente nomenclatura. | LOW |

---

## 14. Glosario

| Término | Definición |
| --------- | --------------------------------------------------------------------------- |
| **decryptResults** | Desencripta `baseSalary`, `extraHours`, `deductions`, `totalPayment` post-query. |
| **userPayrollCreatedName** | Nombre del usuario que creó nómina, via LEFT JOIN. |
| **payroll** | Registro de nómina mensual con montos encriptados. |

---

## 15. Apéndices

### Archivos

```
SERVER: routes.js (241), controller.js (77), service.js (82), dao.js (170), schemas/payroll.joi.js (29)
CLIENT: api/payrollApi.js (62), pages/, 3 components, utils/schema.js (65), utils/enums.js (14)
```

### Middleware Stack

`verifyToken` → `checkRoleAuthOrPermisssion` → `validateQueryParams/validateSchema/validatePathParam` → Controller → Service → DAO

### Encrypted Fields Pattern

```
Service: Number (Joi) → String(data.field) → Prisma (VarChar(128))
DAO: $queryRaw → decryptResults → desencripta montos
Client: Datatable muestra valores decrypt (post-API)
```

### Controller globalResponse Pattern

```js
// Payroll (4 args con message):
globalResponse(res, 200, payroll, 'Payroll retrieved successfully');

// Otros módulos (3 args, sin message):
globalResponse(res, 200, data);
```
