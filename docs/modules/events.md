# Módulo: Events (Server + Client)

> Documentación técnica del módulo **Events**. arc42 / C4 / IEEE 1016.
> Backend: `apps/server/src/modules/events/`. Client: `apps/client/src/modules/events/`.

---

## 1. Metadatos

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `events` |
| **Estado** | Released |
| **Path Server** | `apps/server/src/modules/events/` |
| **Path Client** | `apps/client/src/modules/events/` |
| **Base URL API** | `/api/v1/events` |

---

## 2. Introducción y Objetivos

CRUD de eventos con tipos, horarios y descripciones. Validación cruzada startTime/endTime.

Funcionalidades:
- Listar eventos con filtro por tipo y rango de fechas
- Crear, actualizar, eliminar eventos
- Validación server-side: startTime < endTime
- Paginación server-side forzada

---

## 3. Contexto y Alcance

```
[Admin / Manager / User]
      |
[Events Module] <--CRUD--> [/api/v1/events]
      |
      |-- N:1 --> [eventTypes]
      |-- N:1 --> [users] (createdBy/updatedBy)
```

**In-Scope**: CRUD eventos, filtros por tipo/fecha, paginación.

**Out-of-Scope**: Eventos recurrentes, calendario compartido, notificaciones.

---

## 4. Restricciones

| ID | Restricción |
| -- | ----------- |
| C-01 | PostgreSQL + Prisma ORM |
| C-02 | Express.js + React + RTK Query |
| C-03 | JWT + `verifyToken` obligatorio |
| C-04 | `startTime`/`endTime` como Time(0) sin timezone |
| C-05 | Paginación requerida (lanza error si `take <= 0`) |

---

## 5. Stack Tecnológico

Express, Prisma, PostgreSQL, React, RTK Query, Joi, Zod, react-hook-form, date-fns.

---

## 6. Arquitectura del Módulo

```
apps/server/src/modules/events/
├── routes.js                          # 5 rutas, OpenAPI inline
├── controller.js                      # 5 handlers
├── service.js                         # 5 métodos
├── dao.js                             # Prisma ORM puro
└── schemas/events.joi.js              # filters, create, update

apps/client/src/modules/events/
├── api/eventsAPI.js                   # RTK Query (5 hooks)
├── components/                        # Datatable, Dialog, FiltersForm
├── pages/                             # Events.jsx
└── utils/                             # schema.js (Zod)
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Middleware | Handler |
| ------ | ---- | ---------- | ------- |
| GET | `/` | `canViewEvent` + `validateQueryParams` | `getAll` |
| POST | `/` | `canCreateEvent` + `validateSchema` | `create` |
| GET | `/:id` | `canViewEvent` + `validatePathParam` | `getById` |
| PATCH | `/:id` | `canEditEvent` + `validatePathParam` + `validateSchema` | `updateById` |
| DELETE | `/:id` | `canDeleteEvent` + `validatePathParam` | `deleteById` |

Roles: ADMIN, MANAGER, USER.

### Controller

- `getAll(req.safeQuery)` → `globalResponse(res, 200, data)`
- `create(req.body, req.userId)` → `globalResponse(res, 201, item)`
- `getById(req.params.id)` → `globalResponse(res, 200, item)`
- `updateById(req.params.id, req.body, req.userId)` → `globalResponse(res, 200, item)`
- `deleteById(req.params.id)` → `globalResponse(res, 200, { message })`

`req.userId` extraído de `verifyToken`.

### Service

- `getAll`: `getSafePagination`, valida `take > 0`, pasa filtros + take/skip
- `create`: Arma objeto con `createdOn`, `createdBy`. Type coercion `startTime`/`endTime` a `Date`, `typeId` a `Number`
- `getById`: `Number(id)`, busca por ID
- `updateById`: Arma objeto con `updatedOn`, `updatedBy`. Type coercion
- `deleteById`: `Number(id)`

### DAO (Prisma ORM puro)

- `getAll`: `prisma.events.findMany` con `where` dinámico (typeId, startDate/endDate range), `include: { type: true }`, take/skip. Count separado
- `create`: `prisma.events.create` con `eventTypes: { connect }`, `userEventsCreated: { connect }`
- `getById`: `prisma.events.findUnique` con `include: { type: true }`
- `updateRow`: Construcción dinámica de `updateData`. `eventTypes: { connect }` si typeId presente
- **Bug**: `updateRow` verifica `data.type !== undefined` pero `type` extraído en service de `dataToSave` — FK type nunca se actualiza

---

## 8. Building Blocks — Client

### RTK Query

| Endpoint | Ruta | Método |
| -------- | ---- | ------ |
| `getAllEvents` | `/events` (params) | GET |
| `getEventById` | `/events/${id}` | GET |
| `createEvent` | `/events` | POST |
| `updateEventById` | `/events/${id}` | PATCH |
| `deleteEventById` | `/events/${id}` | DELETE |

Tag: `'Events'`. Cache 5 min.

### Components

**EventsDatatable**: Columnas — title, type.description, startDate, startTime, endDate, endTime, userEventsCreated.name

**EventsDialog**: Form con title, description, type (Select de tipos), startDate/endDate (Calendar), startTime/endTime (type=time). Validación startTime < endTime. `pickDirty` para PATCH.

**EventsFiltersForm**: Filtros type, fromDate, toDate.

### Utils

**schema.js (Zod)**:
```js
EventsSchema:
  title: z.string().min(1).max(50)
  description: z.string().max(1000)
  typeId: z.preprocess(Number) → z.number().int().positive()
  startDate: z.date()
  endDate: z.date()
  startTime: z.string().regex(HH:mm)
  endTime: z.string().regex(HH:mm)
  .refine(data => data.startTime < data.endTime, { message: 'startTime must be before endTime' })
EventsFiltersSchema: typeId (opt), fromDate (date opt), toDate (date opt)
```

---

## 9. Modelo de Datos

### `events`

| Columna | Tipo | Constraints |
| ------- | ---- | ----------- |
| `id` | `Int` | PK autoincrement |
| `title` | `String` | `VarChar(50)` |
| `description` | `String?` | `VarChar(1000)` |
| `startDate` | `DateTime` | |
| `endDate` | `DateTime` | |
| `startTime` | `DateTime` | Time(0) — HH:mm:ss |
| `endTime` | `DateTime` | Time(0) — HH:mm:ss |
| `typeId` | `Int` | FK → eventTypes.id |
| `createdBy` | `Int` | FK → users.id |
| `updatedBy` | `Int?` | FK → users.id |
| `createdOn` | `DateTime` | |
| `updatedOn` | `DateTime?` | |

### `eventTypes`

| Columna | Tipo | Constraints |
| ------- | ---- | ----------- |
| `id` | `Int` | PK |
| `description` | `String` | `VarChar(50)` |

---

## 10. Contratos de API

### GET /api/v1/events
Query: `typeId`, `fromDate`, `toDate`, `page`, `limit`.
Response 200: `{ dataList: [...], total: N }`. Items incluyen `type.description`.

### POST /api/v1/events
Body: `{ title, description?, startDate, endDate, startTime, endTime, typeId }`.
Response 201: event object.

### GET /api/v1/events/:id
Response 200: event object.

### PATCH /api/v1/events/:id
Body: parcial de create fields (min 1).
Response 200: event object.

### DELETE /api/v1/events/:id
Response 200: `{ message }`.

---

## 11. Validación

### Joi (Server)

```js
eventsFiltersSchema: typeId (int), fromDate (date), toDate (date), page, limit
eventsCreateSchema: title (max50 req), description (max1000), startDate (date req), endDate (date req), startTime (string req), endTime (string req), typeId (int req)
eventsUpdateSchema: todos opcionales, .min(1)
```

### Zod (Client)

```js
EventsSchema: title (max50 req), description (max1000 opt), typeId (int positive req),
              startDate (date req), endDate (date req), startTime (regex HH:mm), endTime (regex HH:mm),
              .refine(startTime < endTime)
EventsFiltersSchema: typeId (int opt), fromDate (date opt), toDate (date opt)
```

---

## 12. Seguridad

- `verifyToken` global
- `checkRoleAuthOrPermisssion` con permisos: canViewEvent, canCreateEvent, canEditEvent, canDeleteEvent
- Roles: ADMIN, MANAGER, USER

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ----------- | --------- |
| R-01 | **updateEventById no puede actualizar FK type**: DAO verifica `data.type !== undefined` pero `type` extraído en service — FK nunca se actualiza. | **HIGH** |
| R-02 | **Time columns como DateTime**: Prisma Time(0) mapeado a DateTime JS. Puede causar issues de timezone. | MEDIUM |
| R-03 | **Paginación forzada**: Lanza error si `take <= 0`. | MEDIUM |
| R-04 | **Sin tests**: 0% cobertura. | HIGH |

---

## 14. Glosario

| Término | Definición |
| ------- | ---------- |
| **eventTypes** | Catálogo de tipos de evento (reunión, taller, etc.) |
| **startTime/endTime** | Hora de inicio/fin en formato HH:mm, guardado como Time(0) |

---

## 15. Apéndices

### Archivos

```
SERVER: routes.js (265), controller.js (70), service.js (95), dao.js (135), schemas/events.joi.js (30)
CLIENT: api/eventsAPI.js (60), pages/Events.jsx (200), 3 components, utils/schema.js (40)
```

### Middleware Stack

`verifyToken` → `checkRoleAuthOrPermisssion` → `validateQueryParams/validateSchema/validatePathParam` → Controller → Service → DAO
