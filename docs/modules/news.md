# Módulo: News (Server + Client)

> Documentación técnica del módulo **News**. arc42 / C4 / IEEE 1016.
> Backend: `apps/server/src/modules/news/`. Client: `apps/client/src/modules/news/`.

---

## 1. Metadatos

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `news` |
| **Estado** | Released |
| **Path Server** | `apps/server/src/modules/news/` |
| **Path Client** | `apps/client/src/modules/news/` |
| **Base URL API** | `/api/v1/news` |

---

## 2. Introducción y Objetivos

Gestión de noticias con ciclo de vida ACTIVE → PENDING → CLOSED. Soporte para documentos adjuntos (Cloudinary, lógica comentada).

Funcionalidades:
- CRUD noticias con filtros por descripción, fechas, estado
- Status FSM: ACTIVE (C01) → PENDING (C02) → CLOSED (C03)
- Row-level lifecycle: createdBy/createdOn, pendingBy/pendingOn, closedBy/closedOn
- Documentos adjuntos vía Cloudinary (comentado en service)
- Paginación server-side forzada

---

## 3. Contexto y Alcance

```
[Admin / Manager / User]
      |
[News Module] <--CRUD--> [/api/v1/news]
      |
      |-- N:1 --> [newsStatus]
      |-- N:1 --> [users] (createdBy/pendingBy/closedBy)
```

**In-Scope**: CRUD noticias, status FSM, filtros, paginación.

**Out-of-Scope**: Publicación programada, notificaciones push, workflow de aprobación multi-paso.

---

## 4. Restricciones

| ID | Restricción |
| -- | ----------- |
| C-01 | PostgreSQL + Prisma ORM |
| C-02 | Express.js + React + RTK Query |
| C-03 | JWT + `verifyToken` obligatorio |
| C-04 | `description` max 400 chars |
| C-05 | Paginación requerida (lanza error si `take <= 0`) |

---

## 5. Stack Tecnológico

Express, Prisma, PostgreSQL, React, RTK Query, Joi, Zod, react-hook-form, Multer, Cloudinary (comentado).

---

## 6. Arquitectura del Módulo

```
apps/server/src/modules/news/
├── routes.js                          # 5 rutas, OpenAPI inline
├── controller.js                      # 5 handlers
├── service.js                         # 5 métodos (Cloudinary comentado)
├── dao.js                             # Prisma ORM puro
└── schemas/news.joi.js                # filters, create, update

apps/client/src/modules/news/
├── api/newsAPI.js                     # RTK Query (5 hooks)
├── components/                        # Datatable, Dialog, FiltersForm
├── pages/                             # News.jsx
└── utils/                             # schema.js, enums.js, adapters.js
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Middleware | Handler |
| ------ | ---- | ---------- | ------- |
| GET | `/` | `canViewNews` + `validateQueryParams(NewsFilters)` | `getAllNews` |
| GET | `/status` | `canViewNews` | `getAllNewsStatus` |
| POST | `/` | `canCreateNews` + `validateSchema` + `upload.single('document')` | `createNew` |
| PATCH | `/:id` | `canEditNews` + `validatePathParam` + `validateSchema` + `upload.single('document')` | `updateById` |
| DELETE | `/:id` | `canDeleteNews` + `validatePathParam` | `deleteById` |

Roles: ADMIN, MANAGER, USER en todos los endpoints.

### Controller

- `getAllNews(req.safeQuery)` → `globalResponse(res, 200, { dataList, total })`
- `getAllNewsStatus()` → `globalResponse(res, 200, data)`
- `createNew(req.body, req.userId)` → `globalResponse(res, 201, { message })`
- `updateById(req.params.id, req.body, req.userId)` → `globalResponse(res, 200, { message })`
- `deleteById(req.params.id)` → `globalResponse(res, 200, { message })`

### Service

- `getAllNews`: `getSafePagination`, valida `take > 0`, pasa description/fromDate/toDate/statusCode + take/skip
- `createNew`: Arma objeto con `createdOn: new Date()`, `createdBy: userId`. Si statusCode === PENDING → setea `pendingBy`/`pendingOn`. Cloudinary upload comentado
- `updateById`: Si statusCode === CLOSED → setea `closedBy`/`closedOn`. Si PENDING → `pendingBy`/`pendingOn`. Cloudinary update comentado
- `deleteById`: Cloudinary delete comentado
- `getAllNewsStatus`: Sin parámetros — retorna todos los status

### DAO (Prisma ORM puro)

- `getAllNews`: `prisma.news.findMany` con `where` dinámico (description ILIKE, createdOn range, status.code). `include: { status, userNewsCreated, userNewsClosed, userNewsPending }`. Count separado con misma lógica de filtros
- **Bug**: lógica de filtros duplicada entre `findMany` y `count`
- `createNew`: `prisma.news.create` con `userNewsCreated: { connect }`, `status: { connect }`
- `updateRow`: Construcción dinámica. `userNewsPending`/`userNewsClosed` condicional
- `deleteRow`: `prisma.news.delete` via helper genérico `prismaService.deleteRow`

---

## 8. Building Blocks — Client

### RTK Query

| Endpoint | Ruta | Método |
| -------- | ---- | ------ |
| `getAllNews` | `/news` (params) | GET |
| `getAllNewsStatus` | `/news/status` | GET |
| `createNew` | `/news/` | POST |
| `updateNewById` | `/news/${id}` | PATCH |
| `deleteNewById` | `/news/${id}` | DELETE |

Tag: `'News'`.

### Components

**NewsDatatable**: Columnas — createdOn, description, status.description, userNewsCreated.name, userNewsPending.name, pendingOn, userNewsClosed.name, closedOn.

**NewsDialog**: Form con description (Textarea), status (Select), document (file input). CLOSED status deshabilita edición. Campos audit deshabilitados. `pickDirty` para PATCH.

**NewsFiltersForm**: Filtros description, fdate/tdate (Calendar), statusNews (Select con status).

**Field name mismatch**: Client schema usa `fdate`/`tdate`, server Joi espera `fromDate`/`toDate`. Client mapea en submit vía `formatISO`.

### Utils

- `schema.js` (Zod): `NewsDialogSchema` (description min1, status { id, code, description }), `NewsFiltersSchema` (description opt, fdate opt, tdate opt, statusNews opt + refinement fdate <= tdate)
- `enums.js`: `NewsStatusCode` — ACTIVE (C01), PENDING (C02), CLOSED (C03)
- `adapters.js`: `adaptQueryStatus` hook wrapper

---

## 9. Modelo de Datos

### `news`

| Columna | Tipo | Constraints |
| ------- | ---- | ----------- |
| `id` | `Int` | PK |
| `description` | `String` | `VarChar(400)` |
| `document` | `String?` | (Cloudinary URL, comentado) |
| `documentId` | `String?` | (Cloudinary public ID, comentado) |
| `statusId` | `Int` | FK → newsStatus.id |
| `createdBy` | `Int` | FK → users.id |
| `createdOn` | `DateTime` | |
| `pendingBy` | `Int?` | FK → users.id |
| `pendingOn` | `DateTime?` | |
| `closedBy` | `Int?` | FK → users.id |
| `closedOn` | `DateTime?` | |

### `newsStatus`

| Columna | Tipo | Constraints |
| ------- | ---- | ----------- |
| `id` | `Int` | PK |
| `code` | `String` | UNIQUE `VarChar(3)` |
| `description` | `String` | UNIQUE `VarChar(10)` |

**Codes**: C01=ACTIVE, C02=PENDING, C03=CLOSED.

---

## 10. Contratos de API

### GET /api/v1/news
Query: `description`, `fromDate`, `toDate`, `statusCode`, `page`, `limit`.
Response 200: `{ dataList: [...], total: N }`. Items incluyen `status`, `userNewsCreated`, `userNewsClosed`, `userNewsPending`.

### GET /api/v1/news/status
Response 200: `[{ id, code, description }]`.

### POST /api/v1/news
Body: `{ description, statusId, statusCode }` + multipart `document` (file).
Response 201: `{ message }`.

### PATCH /api/v1/news/:id
Body: parcial. Response 200: `{ message }`.

### DELETE /api/v1/news/:id
Response 200: `{ message }`.

---

## 11. Validación

### Joi (Server)

```js
NewsCreateSchema: description (max400 req), statusId (int req), statusCode (max3 req), document (allow '')
NewsUpdate: description (max400 opt), statusId (int opt), statusCode (max3 opt), document (allow '' opt)
NewsFilters: description (max30), statusCode (3 chars), fromDate (date), toDate (date), page (int), limit (int)
```

### Zod (Client)

```js
NewsDialogSchema: description (min1), status ({ id, code, description })
NewsFiltersSchema: description (opt), fdate (date|string opt), tdate (date|string opt), statusNews (string opt)
                   + refinement: fdate <= tdate
```

---

## 12. Seguridad

- `verifyToken` global
- Permisos: canViewNews, canCreateNews, canEditNews, canDeleteNews
- Roles: ADMIN, MANAGER, USER
- CLOSED status bloquea edición en cliente (statusCodeSaved === NewsStatusCode.CLOSED)

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ----------- | --------- |
| R-01 | **No updatedBy/updatedOn**: Sin tracking de modificaciones. | MEDIUM |
| R-02 | **Cloudinary comments**: Lógica de adjuntos comentada pero schema tiene campos document/documentId. | MEDIUM |
| R-03 | **Paginación forzada**: Lanza error si `take <= 0`. | MEDIUM |
| R-04 | **Duplicación de builders**: Filtros duplicados entre `findMany` y `count`. | LOW |
| R-05 | **Sin tests**: 0% cobertura. | HIGH |

---

## 14. Glosario

| Término | Definición |
| ------- | ---------- |
| **newsStatus** | Catálogo de estados con code 3 chars (C01-C03) |
| **FSM** | ACTIVE → PENDING → CLOSED |

---

## 15. Apéndices

### Archivos

```
SERVER: routes.js (305), controller.js (93), service.js (143), dao.js (245), schemas/news.joi.js (31)
CLIENT: api/newsAPI.js (68), pages/News.jsx (217), 3 components, utils/schema.js (40)
```

### Middleware Stack

`verifyToken` → `checkRoleAuthOrPermisssion` → `validateQueryParams/validateSchema/validatePathParam` → Controller → Service → DAO
