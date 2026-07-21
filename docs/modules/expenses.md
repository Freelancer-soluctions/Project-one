# Módulo: Expenses (Server + Client)

> Documentación técnica del módulo **Expenses**. arc42 / C4 / IEEE 1016.
> Backend: `apps/server/src/modules/expenses/`. Client: `apps/client/src/modules/expenses/`.

---

## 1. Metadatos

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `expenses` |
| **Estado** | Released |
| **Path Server** | `apps/server/src/modules/expenses/` |
| **Path Client** | `apps/client/src/modules/expenses/` |
| **Base URL API** | `/api/v1/expenses` |

---

## 2. Introducción y Objetivos

Registro de gastos empresariales categorizados con Prisma native enum `expenseCategory`. Ciclo de vida auditado con createdBy/createdOn + updatedBy/updatedOn.

Funcionalidades:
- CRUD gastos con categorías (14 tipos, Prisma native enum)
- Filtros por descripción, categoría, estado, rango de montos, rango de fechas
- Paginación server-side forzada
- Auditoría: createdBy/updatedBy con nombres via LEFT JOIN
- Roles restringidos: ADMIN/MANAGER (USER excluido)

---

## 3. Contexto y Alcance

```
[Admin / Manager]
      |
[Expenses Module] <--CRUD--> [/api/v1/expenses]
      |
      |-- N:1 --> [users] (createdBy/updatedBy)
```

**In-Scope**: CRUD gastos, filtros, paginación, categorías por enum PostgreSQL.

**Out-of-Scope**: Workflow de aprobación multi-paso, reportes contables, exportación.

---

## 4. Restricciones

| ID | Restricción |
| -- | ----------- |
| C-01 | PostgreSQL + Prisma ORM + native enum `expenseCategory` |
| C-02 | Express.js + React + RTK Query |
| C-03 | JWT + `verifyToken` obligatorio |
| C-04 | Roles: ADMIN, MANAGER (USER no tiene acceso) |
| C-05 | Paginación requerida (lanza error si `take <= 0`) |

---

## 5. Stack Tecnológico

Express, Prisma, PostgreSQL, React, RTK Query, Joi, Zod, react-hook-form, date-fns.

---

## 6. Arquitectura del Módulo

```
apps/server/src/modules/expenses/
├── routes.js                          # 4 rutas, OpenAPI inline
├── controller.js                      # 4 handlers
├── service.js                         # 4 métodos
├── dao.js                             # raw SQL + Prisma ORM híbrido
└── schemas/expenses.joi.js            # filters, create, update

apps/client/src/modules/expenses/
├── api/expensesApi.js                 # RTK Query (4 hooks)
├── components/                        # Datatable, Dialog, FiltersForm
├── pages/                             # Expenses.jsx
└── utils/                             # schema.js, enums.js
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Middleware | Handler |
| ------ | ---- | ---------- | ------- |
| GET | `/` | `canViewExpense` + `validateQueryParams(expenseFiltersSchema)` | `getAllExpenses` |
| POST | `/` | `canCreateExpense` + `validateSchema(expenseCreateSchema)` | `createExpense` |
| DELETE | `/:id` | `canDeleteExpense` + `validatePathParam` | `deleteExpenseById` |
| PATCH | `/:id` | `canEditExpense` + `validatePathParam` + `validateSchema(expenseUpdateSchema)` | `patchExpenseById` |

Roles: ADMIN, MANAGER.

### Controller

- `getAllExpenses(req.safeQuery)` → `globalResponse(res, 200, { dataList, total })`
- `createExpense(req.body, req.userId)` → `globalResponse(res, 201, expense)`
- `deleteExpenseById(req.params.id)` → `globalResponse(res, 200, { message })`
- `patchExpenseById(req.params.id, req.body, req.userId)` → `globalResponse(res, 200, expense)`

### Service

- `getAllExpenses(filters)`: `getSafePagination`, pasa filters + take/skip a DAO
- `createExpense(data, userId)`: Agrega `createdOn: new Date()`, `createdBy: userId`
- `deleteExpenseById(id)`: `Number(id)` — aunque el Swagger doc dice "CUID string", Prisma schema es Int autoincrement
- `patchExpenseById(id, data, userId)`: Agrega `updatedOn: new Date()`, `updatedBy: userId`. `Number(id)`

### DAO (raw SQL + Prisma ORM híbrido)

- `getAllExpenses`: **raw SQL** `$queryRaw` con LEFT JOIN a `users` (userExpenseCreatedName, userExpenseUpdatedName). Filtros: description ILIKE, category ILIKE, status exact match. `ORDER BY createdOn DESC`. Count via `prisma.expenses.count` con misma lógica de filtros (Prisma ORM)
- **Bug**: Date range filters (`fromDate`/`toDate`) y amount range filters (`minTotal`/`maxTotal`) definidos en Joi pero NO implementados en raw SQL
- `createExpense`: `prisma.expenses.create` con `userExpenseCreated: { connect }`
- `patchExpenseById`: Construcción dinámica de `updateData` objeto + `userExpenseUpdated: { connect }`
- `deleteExpenseById`: `prisma.expenses.delete({ where: { id } })`

---

## 8. Building Blocks — Client

### RTK Query

| Endpoint | Ruta | Método |
| -------- | ---- | ------ |
| `getAllExpenses` | `/expenses` (params) | GET |
| `createExpense` | `/expenses` | POST |
| `updateExpenseById` | `/expenses/${id}` | PATCH |
| `deleteExpenseById` | `/expenses/${id}` | DELETE |

Tag: `'Expenses'`. Cache 5 min. Custom hooks: `useQueryData`, `useLoadingState`.

### Components

**ExpensesDatatable**: Columnas — description, total, category, userExpenseCreatedName, createdOn, userExpenseUpdatedName, updatedOn.

**ExpensesDialog**: Form con description (Textarea), total (number step=0.01), category (Select con expenseCategories). Audit fields deshabilitados. `pickDirty` para PATCH. `parseFloat(data.total)` en submit.

**ExpensesFiltersForm**: Filtros description, category (Select con categorías).

### Utils

**schema.js (Zod)**:
```js
ExpenseSchema: description (min1), total (preprocess parseFloat → positive number), category (min1).passthrough()
ExpensesFiltersSchema: description (opt), category (opt)
```

**enums.js**: `expenseCategories` array con `{ value, labelKey }` para Select.

**⚠️ Category mismatch**: Client enums usa espacios (`'BANK FEES'`, `'PROFESSIONAL SERVICES'`). Server Joi enum usa underscores (`'BANK_FEES'`, `'PROFESSIONAL_SERVICES'`). Peticiones de filtro por categoría fallan.

---

## 9. Modelo de Datos

### `expenses`

| Columna | Tipo | Constraints |
| ------- | ---- | ----------- |
| `id` | `Int` | PK autoincrement |
| `description` | `String` | |
| `total` | `Float` | |
| `category` | `expenseCategory` | Prisma native enum |
| `createdBy` | `Int` | FK → users.id |
| `updatedBy` | `Int?` | FK → users.id |
| `createdOn` | `DateTime` | |
| `updatedOn` | `DateTime?` | |

### `expenseCategory` (Prisma enum)

```
RENTAL, UTILITIES, SALARIES, SUPPLIES, TRANSPORT, MAINTENANCE,
MARKETING, SOFTWARE, PROFESSIONAL_SERVICES, TAXES, BANK_FEES,
TRAVEL, TRAINING, OTHER
```

---

## 10. Contratos de API

### GET /api/v1/expenses
Query: `description`, `category`, `status`, `fromDate`, `toDate`, `minTotal`, `maxTotal`, `page`, `limit`.
Response 200: `{ dataList: [...], total: N }`. Items incluyen `userExpenseCreatedName`, `userExpenseUpdatedName`.

### POST /api/v1/expenses
Body: `{ description, total, category }`.
Response 201: expense object.

### PATCH /api/v1/expenses/:id
Body: parcial (min 1 field).
Response 200: expense object.

### DELETE /api/v1/expenses/:id
Response 200: `{ message }`.

---

## 11. Validación

### Joi (Server)

```js
expenseCreateSchema: description (max255 req), total (float precision2 positive req), category (enum req)
expenseUpdateSchema: description (max255 null), total (float precision2 positive), category (enum null).min(1)
expenseFiltersSchema: description (max255), category (max100), status (enum opt),
                      fromDate (iso), toDate (iso .min(Joi.ref('fromDate'))),
                      minTotal (min0), maxTotal (conditional), page (int), limit (int)
```

### Zod (Client)

```js
ExpenseSchema: description (min1), total (preprocess parseFloat → positive number), category (min1).passthrough()
ExpensesFiltersSchema: description (opt), category (opt)
```

---

## 12. Seguridad

- `verifyToken` global
- Permisos: canViewExpense, canCreateExpense, canEditExpense, canDeleteExpense
- Roles: **ADMIN, MANAGER** (USER excluido — único módulo con esta restricción junto con ProviderOrder)
- Auditoría: createdBy/updatedBy trackeados

---

## 13. Pruebas

Único módulo con archivo de test: `apps/client/src/modules/expenses/schema.test.js`. Script manual con `safeParse` + `console.log`, NO integrado con Vitest.

---

## 14. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ----------- | --------- |
| R-01 | **Category enum mismatch**: Client envía `'BANK FEES'` (espacio), server espera `'BANK_FEES'` (underscore). Filtros rotos. | **HIGH** |
| R-02 | **Date range filters no implementados**: `fromDate`/`toDate` en Joi pero NO en raw SQL. | MEDIUM |
| R-03 | **Range filters no implementados**: `minTotal`/`maxTotal` en Joi pero NO en SQL. | MEDIUM |
| R-04 | **Sin tests Vitest**: schema.test.js es script manual. | HIGH |
| R-05 | **Swagger docs inconsistentes**: ID documentado como "CUID string" pero Prisma schema es `Int`. | LOW |

---

## 15. Glosario

| Término | Definición |
| ------- | ---------- |
| **expenseCategory** | Prisma native enum PostgreSQL — 14 categorías de gasto |
| **Native enum** | Tipo de dato PostgreSQL almacenado como enum, no como string |

---

## 16. Apéndices

### Archivos

```
SERVER: routes.js (261), controller.js (100), service.js (87), dao.js (163), schemas/expenses.joi.js (59)
CLIENT: api/expensesApi.js (67), pages/Expenses.jsx (235), 3 components, utils/schema.js (32), utils/enums.js (37)
```

### Middleware Stack

`verifyToken` → `checkRoleAuthOrPermisssion` → `validateQueryParams/validateSchema/validatePathParam` → Controller → Service → DAO
