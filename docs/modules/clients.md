# Módulo: Clients (Server + Client)

> Documentación técnica integral del módulo **Clients** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre tanto el backend (`apps/server/src/modules/clients/`) como el frontend (`apps/client/src/modules/clients/`).
>
> **Audiencia:** Arquitectos de software, Tech Leads, desarrolladores backend/frontend, revisores de código, auditores de seguridad y QA.

---

## Tabla de Contenidos

1. [Metadatos del Documento e Historial de Revisiones](#1-metadatos-del-documento-e-historial-de-revisiones)
2. [Introducción y Objetivos](#2-introducción-y-objetivos)
3. [Contexto y Alcance](#3-contexto-y-alcance)
4. [Restricciones](#4-restricciones)
5. [Stack Tecnológico](#5-stack-tecnológico)
6. [Arquitectura del Módulo (Overview)](#6-arquitectura-del-módulo-overview)
7. [Vista de Building Blocks — Server](#7-vista-de-building-blocks--server)
8. [Vista de Building Blocks — Client](#8-vista-de-building-blocks--client)
9. [Vista de Runtime y Flujo de Datos](#9-vista-de-runtime-y-flujo-de-datos)
10. [Modelo de Datos](#10-modelo-de-datos)
11. [Contratos de API](#11-contratos-de-api)
12. [Reglas de Validación y Esquemas](#12-reglas-de-validación-y-esquemas)
13. [Seguridad y Autorización](#13-seguridad-y-autorización)
14. [Manejo de Errores](#14-manejo-de-errores)
15. [Conceptos Transversales (Cross-Cutting)](#15-conceptos-transversales-cross-cutting)
16. [Requisitos de Calidad](#16-requisitos-de-calidad)
17. [Decisiones de Diseño (ADRs)](#17-decisiones-de-diseño-adrs)
18. [Riesgos y Deuda Técnica](#18-riesgos-y-deuda-técnica)
19. [Glosario](#19-glosario)
20. [Apéndices](#20-apéndices)

---

## 1. Metadatos del Documento e Historial de Revisiones

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `clients` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/clients/` |
| **Path Client** | `apps/client/src/modules/clients/` |
| **Base URL API** | `/api/v1/clients` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial del documento integral (server + client) siguiendo arc42/C4/IEEE 1016. Se documentan 5 endpoints server, 5 hooks RTK Query client, 3 componentes client, esquemas Joi/Zod, 1 modelo Prisma (clients). |

---

## 2. Introducción y Objetivos

### 2.1 Propósito

El módulo **Clients** gestiona el catálogo de clientes del sistema. Proporciona operaciones CRUD completas para registrar, consultar, actualizar y eliminar clientes. Cada cliente puede tener asociadas ventas (sale) y órdenes de cliente (clientOrder).

Funcionalidades principales:

- **Registro de Clientes**: Creación de clientes con nombre, email, teléfono y dirección.
- **Catálogo de Clientes**: Listado completo para componentes de filtro UI (sin paginación).
- **Búsqueda y Filtrado**: Filtrado por nombre y email con paginación server-side.
- **Auditoría**: Trazabilidad de creador y última modificación.

### 2.2 Alcance Funcional

| ID | Función | Actor | Cubre |
| ------ | ---------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| F-001 | Listar clientes con filtros y paginación | ADMIN/MANAGER/USER | GET `/api/v1/clients` con `checkRoleAuthOrPermisssion(canViewClient)` |
| F-002 | Obtener todos los clientes (para filtros UI) | ADMIN/MANAGER/USER | GET `/api/v1/clients/clientsFilters` con `checkRoleAuthOrPermisssion(canViewClient)` |
| F-003 | Crear cliente nuevo | ADMIN/MANAGER | POST `/api/v1/clients` con `checkRoleAuthOrPermisssion(canCreateClient)` |
| F-004 | Actualizar cliente | ADMIN/MANAGER | PATCH `/api/v1/clients/:id` con `checkRoleAuthOrPermisssion(canEditClient)` |
| F-005 | Eliminar cliente | ADMIN/MANAGER | DELETE `/api/v1/clients/:id` con `checkRoleAuthOrPermisssion(canDeleteClient)` |

### 2.3 Alcance No Funcional

| ID | Requisito | Tipo |
| ------ | ------------------------------------------------------------ | --------- |
| Q-001 | Respuesta < 500ms para listados paginados con ≤ 5K registros | Performance |
| Q-002 | Unicidad de email por cliente | Integridad |
| Q-003 | Timestamps de auditoría precisos y automáticos | Auditabilidad |

---

## 3. Contexto y Alcance

### 3.1 Diagrama de Contexto (C4 Nivel 1)

```
[Usuario Admin/Manager/User]
       |
       v
[Clients Module] --GET/POST/PATCH/DELETE--> [/api/v1/clients]
       |
       |-- JOIN --> [users (PostgreSQL)]
       |-- 1:N --> [sale (PostgreSQL)]
       |-- 1:N --> [clientOrder (PostgreSQL)]
```

### 3.2 Límites del Sistema

- **Incluido**: CRUD de clientes, paginación, filtros, auditoría, control de roles/permisos.
- **No incluido**: Importación masiva, historial de cambios, segmentación de clientes.
- **Dependencias externas**: Tabla `users` (FK createdBy/updatedBy).
- **Dependencias internas**: `sale` (1:N), `clientOrder` (1:N).

---

## 4. Restricciones

| ID | Restricción | Motivo |
| -- | ------------------------------------------------------------ | --------------------------------------------------- |
| C-01 | PostgreSQL como BD relacional | Stack definido (Prisma ORM) |
| C-02 | Express.js para la capa HTTP | Stack backend establecido |
| C-03 | React + RTK Query para el frontend | Stack frontend definido |
| C-04 | Autenticación vía JWT + middleware `verifyToken` | Seguridad corporativa |
| C-05 | Email único en tabla `clients` | Integridad de datos |
| C-06 | `name`, `email`, `phone`, `address` con longitud máxima definida | Consistencia de datos |

---

## 5. Stack Tecnológico

| Componente | Tecnología | Versión |
| ---------- | --------------------------------------------- | ------- |
| ORM | Prisma (`@prisma/client`) | ~6.x |
| Base de datos | PostgreSQL (via schema.prisma) | ~16.x |
| Validación server | Joi (schema propio en `schemas/clients.joi.js`) | ~17.x |
| Validación client | Zod + hookform/resolvers | ~3.x |
| HTTP Server | Express.js | ~4.x |
| API Client | RTK Query (Redux Toolkit) | ~2.x |
| UI Framework | React + shadcn/ui | ~18.x |
| Formularios | react-hook-form | ~7.x |

---

## 6. Arquitectura del Módulo (Overview)

### 6.1 Estructura de Directorios

```
apps/server/src/modules/clients/
├── routes.js                       # Router de Express (5 rutas, OpenAPI inline)
├── controller.js                   # Handlers HTTP (5 endpoints)
├── service.js                      # Lógica de negocio (5 métodos)
├── dao.js                          # Acceso a datos (raw SQL GET + Prisma CUD)
└── schemas/
    └── clients.joi.js              # Esquemas Joi (filters, create, update)
```

```
apps/client/src/modules/clients/
├── api/
│   └── clientsApi.js               # RTK Query (5 endpoints)
├── components/
│   ├── ClientsDatatable.jsx        # Tabla de datos
│   ├── ClientsDialog.jsx           # Diálogo crear/editar
│   ├── ClientsFiltersForm.jsx      # Formulario de filtros
│   └── index.js                    # Barrel export
├── pages/
│   └── Clients.jsx                 # Página principal
└── utils/
    ├── schema.js                   # Esquemas Zod
    └── index.js                    # Barrel (vacío)
```

### 6.2 Patrón Arquitectónico

```
Controller → Service → DAO → Prisma Client → PostgreSQL
     ^
     |
  Middleware (verifyToken, checkRoleAuthOrPermission, validateQueryParams/validateSchema/validatePathParam)
```

El cliente sigue el patrón:

```
Page → Components (Datatable, Dialog, FiltersForm)
  ↓
RTK Query (clientsApi) → axiosPrivateBaseQuery → Express API
```

---

## 7. Vista de Building Blocks — Server

### 7.1 Router (`routes.js`)

| Método | Ruta | Middleware | Handler |
| ------ | ---------------------- | ------------------------------------------------------------ | ----------------------- |
| GET | `/` | `checkRoleAuthOrPermisssion(canViewClient)`, `validateQueryParams(clientFiltersSchema)` | `getAllClients` |
| GET | `/clientsFilters` | `checkRoleAuthOrPermisssion(canViewClient)` | `getAllClientsFilters` |
| POST | `/` | `checkRoleAuthOrPermisssion(canCreateClient)`, `validateSchema(clientCreateSchema)` | `createClient` |
| PATCH | `/:id` | `checkRoleAuthOrPermisssion(canEditClient)`, `validatePathParam`, `validateSchema(clientUpdateSchema)` | `updateClientById` |
| DELETE | `/:id` | `checkRoleAuthOrPermisssion(canDeleteClient)`, `validatePathParam` | `deleteClientById` |

- **Roles**: ADMIN, MANAGER, USER para lectura; ADMIN, MANAGER para escritura/eliminación.
- **Permisos**: `canViewClient`, `canCreateClient`, `canEditClient`, `canDeleteClient`.
- **OpenAPI docs**: Documentación inline completa para GET, POST, PATCH, DELETE.

### 7.2 Controller (`controller.js`)

| Función | Ruta | Request | Response | Auditoría |
| ---------------- | ---------------------- | ------------------------------ | --------------- | ------------------- |
| `getAllClients` | GET / | `req.safeQuery` (page, limit, name, email) | 200 + `{ dataList, total }` | No |
| `getAllClientsFilters` | GET /clientsFilters | (ninguno) | 200 + `Array<clients>` | No |
| `createClient` | POST / | `req.body` (name, email, phone, address) + `req.userId` | 201 + objeto creado | `createdBy: req.userId` |
| `updateClientById` | PATCH /:id | `req.params.id` + `req.body` + `req.userId` | 200 + objeto actualizado | `updatedBy: req.userId` |
| `deleteClientById` | DELETE /:id | `req.params.id` | 200 + mensaje | No |

### 7.3 Service (`service.js`)

| Función | Parámetros | Validación | Llama |
| --------------------- | ----------- | -------------------------------------------------- | --------------------------- |
| `getAllClients` | `filters` | `getSafePagination` — lanza error si `!take \|\| take <= 0` | `getAllClientsDao(filters, take, skip)` |
| `getAllClientsFilters` | — | Ninguna | `getAllClientsFiltersDao()` |
| `createClient` | `data` | Ninguna | `createClientDao(dataClient)` |
| `updateClientById` | `id, data` | `Number(id)` | `updateClientByIdDao(Number(id), dataClient)` |
| `deleteClientById` | `id` | `Number(id)` | `deleteClientByIdDao(Number(id))` |

- `createClient`: Agrega `createdOn: new Date()` al payload.
- `updateClientById`: Agrega `updatedOn: new Date()` al payload.

### 7.4 DAO (`dao.js`)

#### getAllClients (raw SQL + Prisma COUNT)

```sql
SELECT c.*,
       u.name AS "userClientCreatedName",
       uu.name AS "userClientUpdatedName"
FROM "clients" c
LEFT JOIN "users" u ON c."createdBy" = u.id
LEFT JOIN "users" uu ON c."updatedBy" = uu.id
WHERE c."name" ILIKE ? AND c."email" ILIKE ?
ORDER BY c."createdOn" DESC
LIMIT ? OFFSET ?
```

- **Filtros**: `name` (ILIKE), `email` (ILIKE).
- **No implementados**: `phone` (documentado en controller JSDoc pero no en whereClauses).
- **Paginación**: Raw SQL con `LIMIT take OFFSET skip`.
- **Total**: `prisma.clients.count({ where })` con soporte de ILIKE.
- **Respuesta**: `{ dataList: clients, total }`.

#### getAllClientsFilters (Prisma ORM — sin filtros)

```js
prisma.clients.findMany(); // Retorna todos los registros sin paginación
```

#### createClient (Prisma ORM)

```js
prisma.clients.create({
  data: {
    name, email, phone, address, createdOn,
    userClientCreated: { connect: { id: createdBy } }
  }
});
```

#### updateClientById (Prisma ORM)

```js
prisma.clients.update({
  where: { id },
  data: {
    name, email, phone, address, updatedOn,
    userClientUpdated: { connect: { id: updatedBy } }
  }
});
```

#### deleteClientById (Prisma ORM)

```js
prisma.clients.delete({ where: { id } });
```

- **Sin verificación**: No valida si el cliente tiene ventas u órdenes asociadas antes de eliminar.

---

## 8. Vista de Building Blocks — Client

### 8.1 RTK Query API (`clientsApi.js`)

| Endpoint | Hook | Método | Ruta | Tags |
| ---------------------- | ------------------------------------------ | ------ | ---------------------------- | ------------ |
| `getAllClients` | `useLazyGetAllClientsQuery` / `useGetAllClientsQuery` | GET | `/clients` | `['Clients']` |
| `getAllClientsFilters` | `useGetAllClientsFiltersQuery` | GET | `/clients/clientsFilters` | `['Clients']` |
| `createClient` | `useCreateClientMutation` | POST | `/clients/` | `['Clients']` |
| `updateClientById` | `useUpdateClientByIdMutation` | PATCH | `/clients/${id}` | `['Clients']` |
| `deleteClientById` | `useDeleteClientByIdMutation` | DELETE | `/clients/${id}` | `['Clients']` |

- **Base URL**: `import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'`.
- **Base Query**: `axiosPrivateBaseQuery` (axios con interceptors JWT).
- **Cache**: `keepUnusedDataFor: 300` (5 min).
- **Invalidación**: Todos los mutations invalidan tag `'Clients'`.

### 8.2 Page (`Clients.jsx`)

Estado local:

| Variable | Tipo | Inicial | Propósito |
| -------------- | --------- | ----------- | -------------------------- |
| `selectedRow` | `Object` | `{}` | Fila seleccionada para edición |
| `openDialog` | `boolean` | `false` | Control del diálogo modal |
| `openAlertDialog` | `boolean` | `false` | Control del diálogo de alerta |
| `alertProps` | `Object` | `{}` | Props del diálogo de alerta |
| `actionDialog` | `string` | `''` | Título del diálogo (add/edit) |
| `filters` | `Object` | `{}` | Filtros activos |
| `pagination` | `Object` | `{ pageIndex: 0, pageSize: 20 }` | Estado de paginación |

- Usa custom hooks `useQueryData` y `useLoadingState` para manejar estados de query.
- `useEffect` reactivo para refetch en cambios de paginación/filtros.

### 8.3 Components

#### ClientsDatatable

| Columna | AccessorKey | Tipo | Formato |
| --------- | --------------- | -------- | --------------- |
| name | `name` | string | `.toUpperCase()` |
| email | `email` | string | `.toUpperCase()` |
| phone | `phone` | string | `.toUpperCase()` |
| address | `address` | string | `.toUpperCase()` |
| createdOn | `createdOn` | date | `format(new Date(), 'PPP')` |
| updatedOn | `updatedOn` | date/null | `format(new Date(), 'PPP')` o null |

- Props: `dataClients`, `onEditDialog`, `pagination`, `onPaginationChange`.
- Usa `dataList` y `total` de `dataClients`.

#### ClientsDialog

Campos del formulario:

| Campo | Tipo | Requerido | Label i18n | Límite |
| --------------------------------- | ------ | --------- | ---------------------------- | ------------------------- |
| `name` | text | Sí | `name` | `FIELD_LIMITS.clients.name` |
| `email` | email | Sí | `email` | `FIELD_LIMITS.clients.email` |
| `phone` | tel | Sí | `phone` | `FIELD_LIMITS.clients.phone` |
| `address` | text | Sí | `address` | `FIELD_LIMITS.clients.address` |
| `userClientCreatedName` | text | Solo edición | `created_by` | Deshabilitado |
| `createdOn` | date | Solo edición | `created_on` | Calendar deshabilitado |
| `userClientUpdatedName` | text | Solo edición (si updatedOn) | `updated_by` | Deshabilitado |
| `updatedOn` | date | Solo edición (si updatedOn) | `updated_on` | Calendar deshabilitado |

- Usa `zodResolver(ClientSchema)` — esquema conectado.
- Usa `pickDirty(data, dirtyFields)` para actualizaciones parciales.
- Campos de auditoría como solo lectura con Popover/Calendar deshabilitado.

#### ClientsFiltersForm

Campos de filtro:

| Campo | Tipo | Límite |
| --------- | -------- | ------------------------- |
| name | text | `FIELD_LIMITS.clients.name` |
| email | email | `FIELD_LIMITS.clients.email` |

- Botones: Search, Add, Clear.
- Usa `zodResolver(ClientsFiltersSchema)` — esquema conectado.

---

## 9. Vista de Runtime y Flujo de Datos

### 9.1 Listar Clientes con Filtros

```
[Page mount / pagination change / filter change]
  →
  useEffect → getAllClients({ page, limit, name?, email? })
  →
  GET /api/v1/clients?page=1&limit=20&name=...
  →
  [Express Router] → [checkRoleAuthOrPermisssion] → [validateQueryParams]
  → [Controller] → [Service: getSafePagination] → [DAO: raw SQL + COUNT]
  →
  Response 200: { dataList: [...], total: N }
  →
  ClientsDatatable (render with pagination)
```

### 9.2 Obtener Clientes para Filtros UI

```
[Component mount (clients filter dropdown)]
  →
  getAllClientsFilters()
  →
  GET /api/v1/clients/clientsFilters
  →
  [Express Router] → [Controller] → [DAO: prisma.clients.findMany()]
  →
  Response 200: [{ id, name }, ...]
```

### 9.3 Crear Cliente

```
[User fills dialog → clicks Save]
  →
  handleSubmit(data) → createClient(data).unwrap()
  →
  POST /api/v1/clients/  { name, email, phone, address }
  →
  [Controller] → [Service] add createdOn → [DAO] prisma.clients.create
  →
  Response 201 → AlertDialog "added_successfully" → close dialog
```

### 9.4 Actualizar Cliente

```
[User edits row → clicks Update]
  →
  handleSubmit({ id, body: changes }) → updateClientById({ id, data: changes }).unwrap()
  →
  PATCH /api/v1/clients/:id  { name?, email?, phone?, address? }
  →
  [Controller] → [Service] add updatedOn → [DAO] prisma.clients.update
  →
  Response 200 → AlertDialog "updated_successfully" → close dialog
```

### 9.5 Eliminar Cliente

```
[User clicks Delete → confirm]
  →
  handleDelete(id) → deleteClientById(id).unwrap()
  →
  DELETE /api/v1/clients/:id
  →
  [Controller] → [Service] → [DAO] prisma.clients.delete
  →
  Response 200 → AlertDialog "deleted_successfully" → close dialog
```

---

## 10. Modelo de Datos

### 10.1 Entidad `clients`

| Columna | Tipo | Constraints | Descripción |
| ----------- | ------------ | ------------------------------ | -------------------------------------- |
| `id` | `Int` | PK, autoincrement | Identificador único |
| `name` | `String` | NOT NULL, `@db.VarChar(100)` | Nombre del cliente |
| `email` | `String` | NOT NULL, `@db.VarChar(100)` | Correo electrónico |
| `phone` | `String` | NOT NULL, `@db.VarChar(15)` | Teléfono |
| `address` | `String` | NOT NULL, `@db.VarChar(120)` | Dirección |
| `createdOn` | `DateTime` | NOT NULL, `@db.Timestamp(3)` | Fecha de creación |
| `updatedOn` | `DateTime?` | nullable, `@db.Timestamp(3)` | Fecha de última modificación |
| `createdBy` | `Int` | FK → `users.id`, NOT NULL | Usuario creador |
| `updatedBy` | `Int?` | FK → `users.id`, nullable | Usuario última modificación |

### 10.2 Relaciones

```
clients 1──N sale (saleClient)
clients 1──N clientOrder (orderClient)
clients N──1 users (createdBy: userClientCreated)
clients N──1 users? (updatedBy: userClientUpdated)
```

### 10.3 Diagrama DER (textual)

```
┌───────────────────┐       ┌───────────────────┐
│      users        │       │     clients        │
├───────────────────┤       ├───────────────────┤
│ id (PK)           │──1:N──│ createdBy (FK)     │
│ name              │       │ updatedBy (FK?)    │
│ ...               │       │ id (PK)            │
└───────────────────┘       │ name (VarChar 100) │
                            │ email (VarChar 100)│
┌───────────────────┐       │ phone (VarChar 15) │
│      sale         │       │ address (VarChar120)│
├───────────────────┤       │ createdOn (DateTime)│
│ clientId (FK)     │──N:1──│ updatedOn (DateTime?)│
│ id (PK)           │       └───────────────────┘
│ ...               │
└───────────────────┘
```

---

## 11. Contratos de API

### 11.1 GET /api/v1/clients — Listar clientes

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
| --------- | ------ | --------- | -------------------------------- |
| `page` | integer | No | Número de página (default 1) |
| `limit` | integer | No | Items por página (default 20) |
| `name` | string | No | Filtrar por nombre (ILIKE) |
| `email` | string | No | Filtrar por email (ILIKE) |

**Response 200:**

```json
{
  "dataList": [
    {
      "id": 1,
      "name": "CLIENTE ABC",
      "email": "CLIENTE@EMAIL.COM",
      "phone": "1234567890",
      "address": "CALLE 123",
      "createdOn": "2026-06-10T10:00:00.000Z",
      "updatedOn": null,
      "userClientCreatedName": "Admin",
      "userClientUpdatedName": null
    }
  ],
  "total": 1
}
```

### 11.2 GET /api/v1/clients/clientsFilters — Listar todos los clientes (UI)

**Response 200:** Array de objetos `clients` sin paginación.

### 11.3 POST /api/v1/clients — Crear cliente

**Request Body:**

```json
{
  "name": "Cliente ABC",
  "email": "cliente@email.com",
  "phone": "1234567890",
  "address": "Calle 123"
}
```

**Response 201:** Objeto `clients` creado.

### 11.4 PATCH /api/v1/clients/:id — Actualizar cliente

**Request Body:** (campos parciales)

```json
{
  "phone": "0987654321"
}
```

**Response 200:** Objeto `clients` actualizado.

### 11.5 DELETE /api/v1/clients/:id — Eliminar cliente

**Response 200:**

```json
{
  "message": "Client deleted successfully"
}
```

### 11.6 OpenAPI (swagger)

Documentación inline en `routes.js` para endpoints GET, POST, PATCH, DELETE con schemas referenciados desde `docs/schemas.js`.

---

## 12. Reglas de Validación y Esquemas

### 12.1 Joi (Server) — `schemas/clients.joi.js`

```js
export const clientFiltersSchema = Joi.object({
  name: Joi.string().max(100).allow(''),
  email: Joi.string().email().allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const clientCreateSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(15).required(),
  address: Joi.string().max(120).required(),
});

export const clientUpdateSchema = Joi.object({
  name: Joi.string().max(100).optional().min(1),
  email: Joi.string().email().optional().min(1),
  phone: Joi.string().max(15).optional().min(1),
  address: Joi.string().max(120).optional().min(1),
});
```

### 12.2 Zod (Client) — `utils/schema.js`

```js
export const ClientSchema = z.object({
  name: z.string().min(1, { message: getZodMessage('zod.clients.name.empty') }),
  email: z.string().email({ message: getZodMessage('zod.clients.email.invalid') }),
  phone: z.string().min(1, { message: getZodMessage('zod.clients.phone.empty') }),
  address: z.string().min(1, { message: getZodMessage('zod.clients.address.empty') }),
}).passthrough();

export const ClientsFiltersSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: getZodMessage('zod.clients.email.invalid') }).optional(),
});
```

### 12.3 Consistencia Joi vs Zod

| Campo | Joi (server) | Zod (client) | Coinciden |
| --------- | -------------------------------------- | --------------------------- | --------- |
| `name` | `string().max(100).required()` | `string().min(1)` | Parcial (server tiene max) |
| `email` | `string().email().required()` | `string().email()` | ✓ |
| `phone` | `string().max(15).required()` | `string().min(1)` | Parcial (server tiene max) |
| `address` | `string().max(120).required()` | `string().min(1)` | Parcial (server tiene max) |

---

## 13. Seguridad y Autorización

### 13.1 Autenticación

- Todas las rutas protegidas por middleware `verifyToken` (aplicado globalmente en router mediante `router.use(verifyToken)`).

### 13.2 Autorización

Middlewares `checkRoleAuthOrPermisssion` con roles y permisos específicos:

| Endpoint | Roles Permitidos | Permiso |
| ---------------- | --------------------------- | ------------------- |
| GET / | ADMIN, MANAGER, USER | `canViewClient` |
| GET /clientsFilters | ADMIN, MANAGER, USER | `canViewClient` |
| POST / | ADMIN, MANAGER | `canCreateClient` |
| PATCH /:id | ADMIN, MANAGER | `canEditClient` |
| DELETE /:id | ADMIN, MANAGER | `canDeleteClient` |

### 13.3 Validación de Entrada

- GET: `validateQueryParams(clientFiltersSchema)`.
- GET /clientsFilters: Sin validación de query.
- POST: `validateSchema(clientCreateSchema)`.
- PATCH: `validatePathParam` + `validateSchema(clientUpdateSchema)`.
- DELETE: `validatePathParam`.

### 13.4 Auditoría

- `createdBy` / `updatedBy`: Set desde `req.userId`.
- `createdOn` / `updatedOn`: Set desde service (server timestamp).
- GET incluye nombres de usuario (`userClientCreatedName`, `userClientUpdatedName`) via JOIN.

---

## 14. Manejo de Errores

### 14.1 Errores Conocidos

| Error | Causa | Impacto |
| --------- | ------------------------------------------------------------- | ---------------------------------------- |
| P2002 | Email duplicado en creación/actualización | Prisma lanza excepción no capturada → 500 |
| P2025 | DELETE de cliente inexistente | Prisma lanza excepción no capturada → 500 |
| P2003 | DELETE de cliente con ventas u órdenes asociadas | Violación FK → Prisma lanza excepción |
| Validación | Campos exceden longitud máxima Joi | 400 Bad Request |

### 14.2 Errores del Servicio

| Condición | Error | Código |
| ------------------------------------- | ------------------------------------ | ------ |
| Paginación sin `take` | `'Pagination is required'` | 500 |

### 14.3 Errores del Cliente

- Errores de API capturados en `handleSubmit` catch → `console.error`.
- Sin UI de error específica para el módulo (usa AlertDialog genérico).
- Zod validation errors mostrados via `FormMessage` en cada campo.

---

## 15. Conceptos Transversales (Cross-Cutting)

### 15.1 Auditoría y Trazabilidad

- `createdBy` / `updatedBy` conectados vía Prisma relations a `users`.
- `createdOn` / `updatedOn` timestamps locales del servidor.
- GET incluye `userClientCreatedName` y `userClientUpdatedName` via JOIN.

### 15.2 Paginación

- Server: `getSafePagination` desde `utils/pagination/pagination.js`.
- Client: `pagination` estado con `pageIndex` + `pageSize`, reset a 0 al cambiar filtros.
- `useEffect` reactivo dispara refetch automático.

### 15.3 Internacionalización (i18n)

- Cliente usa `react-i18next` con claves como `clients`, `client_name_placeholder`, etc.

### 15.4 Cache de API

- RTK Query con tag `'Clients'` e invalidación automática en mutations.
- `keepUnusedDataFor: 300` (5 min).

### 15.5 Custom Hooks

- `useQueryData`: Normaliza estado de query RTK Query.
- `useLoadingState`: Combina múltiples estados de carga.

### 15.6 Manejo de Errores Global

- Server: `handleCatchErrorAsync` wrapper async.
- `globalResponse` utility para respuestas estandarizadas.

---

## 16. Requisitos de Calidad

### 16.1 Rendimiento

| Escenario | Objetivo | Métrica |
| --------------- | ----------- | ----------------- |
| Listar 5K clientes con filtros | < 500ms | Tiempo de respuesta |
| GET /clientsFilters (todos los registros) | < 200ms | Tiempo de respuesta |
| Crear/actualizar cliente | < 200ms | Tiempo de respuesta |

### 16.2 Mantenibilidad

- Código server modular (Controller → Service → DAO).
- Componentes client separados por responsabilidad.
- OpenAPI docs inline en routes.js.
- **Cobertura de tests**: 0% — no existen tests unitarios ni de integración.

### 16.3 Seguridad

- CSRF aplicado condicionalmente.
- Rate limiting aplicado a rutas no auth.
- JWT obligatorio en todos los endpoints.
- Roles y permisos granulares por endpoint.

---

## 17. Decisiones de Diseño (ADRs)

### ADR-001: Ruta separada /clientsFilters para dropdowns UI

- **Contexto**: Los componentes de filtro (selects/comboboxes) necesitan la lista completa de clientes sin paginación.
- **Decisión**: Endpoint GET `/clients/clientsFilters` separado que retorna todos los clientes.
- **Consecuencia**: Duplicación de lógica vs GET principal. Riesgo de performance con muchos registros.

### ADR-002: Raw SQL con JOINs en GET principal

- **Contexto**: `getAllClients` necesita incluir nombres de usuario de auditoría.
- **Decisión**: Usar `prisma.$queryRaw` con JOINs explícitos.
- **Consecuencia**: Mayor control sobre la query. El COUNT usa `prisma.clients.count` (Prisma) con lógica de filtros replicada.

### ADR-003: pickDirty para actualizaciones parciales

- **Contexto**: Formulario de cliente con múltiples campos.
- **Decisión**: Usar `pickDirty` en el cliente + PATCH en el servidor.
- **Consecuencia**: Payload reducido ∼60-80%. Mayor complejidad en manejo de dirtyFields.

---

## 18. Riesgos y Deuda Técnica

### 18.1 Bugs

| ID | Descripción | Severidad | Archivo |
| -- | ------------------------------------------------------------ | --------- | ----------------------------------------------- |
| R-001 | **Filtro phone no implementado en DAO** — controller JSDoc documenta filtro por phone pero DAO no lo incluye en whereClauses. | LOW | `apps/server/src/modules/clients/dao.js` |
| R-002 | **Filtro address no implementado en DAO** — No existe filtro por address aunque sería útil. | LOW | `apps/server/src/modules/clients/dao.js` |
| R-003 | **GET /clientsFilters sin paginación** — Retorna todos los registros sin límite. Riesgo de performance con grandes volúmenes. | MEDIUM | `apps/server/src/modules/clients/dao.js:71` |
| R-004 | **DELETE sin verificar integridad referencial** — Elimina cliente sin validar si tiene ventas u órdenes asociadas. | HIGH | `apps/server/src/modules/clients/dao.js` |
| R-005 | **Sin manejo de errores Prisma (P2002/P2025/P2003)** — Ninguna operación captura errores de Prisma. | HIGH | `apps/server/src/modules/clients/dao.js` |
| R-006 | **Sin tests** — No hay cobertura de tests unitarios ni de integración. | HIGH | `apps/server/src/modules/clients/`, `apps/client/src/modules/clients/` |
| R-007 | **Respuesta inconsistente en getAllClientsFilters** — Retorna array plano, no `{ dataList, total }`. | LOW | `apps/server/src/modules/clients/controller.js` |

### 18.2 Deuda Técnica

| ID | Descripción | Impacto | Archivos |
| -- | ------------------------------------------------------------ | --------- | ----------------------------------------- |
| T-001 | Ruta `/clientsFilters` duplica lógica vs GET principal | Mantenibilidad | `apps/server/src/modules/clients/routes.js` |
| T-002 | Sin validación de unicidad de email client-side | UX | `apps/client/src/modules/clients/utils/schema.js` |
| T-003 | Métricas de performance no implementadas | Observabilidad | — |

---

## 19. Glosario

| Término | Definición |
| --------- | --------------------------------------------------------------------------- |
| **Clients** | Catálogo de clientes del sistema. Entidad raíz para ventas y órdenes. |
| **getAllClientsFilters** | Endpoint específico que retorna todos los clientes sin paginación para componentes UI de selección. |
| **pickDirty** | Técnica para extraer solo los campos modificados de un formulario RHF. |
| **ILIKE** | Operador PostgreSQL para comparación case-insensitive. |

---

## 20. Apéndices

### 20.1 Archivos del Módulo

```
SERVER (5 archivos):
- routes.js                       — Router Express con 5 rutas + OpenAPI inline (266 líneas)
- controller.js                   — 5 handlers HTTP (97 líneas)
- service.js                      — 5 métodos de negocio (90 líneas)
- dao.js                          — 5 métodos de acceso a datos (144 líneas)
- schemas/clients.joi.js          — Esquemas Joi (22 líneas)

CLIENT (7 archivos):
- api/clientsApi.js               — RTK Query (75 líneas)
- pages/Clients.jsx               — Página principal (214 líneas)
- components/ClientsDatatable.jsx — Tabla (75 líneas)
- components/ClientsDialog.jsx    — Diálogo (410 líneas)
- components/ClientsFiltersForm.jsx — Filtros (134 líneas)
- components/index.js              — Barrel (export)
- utils/schema.js                  — Zod schemas (29 líneas)
- utils/index.js                   — Barrel (vacío)
```

### 20.2 Stack de Middlewares

```
Request
  → rateLimiter (limit)
  → csrfConditional
  → verifyToken (JWT) [global en router]
  → checkRoleAuthOrPermisssion (roles + permisos)
  → validateQueryParams / validateSchema / validatePathParam
  → handler (Controller)
  → Service
  → DAO (raw SQL / Prisma)
  → globalResponse
```

### 20.3 FIELD_LIMITS (cliente)

| Campo | Límite |
| --------- | --------------------------- |
| `name` | `FIELD_LIMITS.clients.name` |
| `email` | `FIELD_LIMITS.clients.email` |
| `phone` | `FIELD_LIMITS.clients.phone` |
| `address` | `FIELD_LIMITS.clients.address` |
