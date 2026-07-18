# Módulo: ProviderOrder (Server + Client)

> Documentación técnica integral del módulo **ProviderOrder** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre tanto el backend (`apps/server/src/modules/providerOrder/`) como el frontend (`apps/client/src/modules/providerOrder/`).
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
| **Módulo** | `providerOrder` |
| **Estado** | En Desarrollo (routes no conectadas a Express, bugs conocidos) |
| **Versión** | `0.5.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/providerOrder/` |
| **Path Client** | `apps/client/src/modules/providerOrder/` |
| **Base URL API** | `/api/v1/providerOrder` (previsto) |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 0.5.0 | 2026-06-11 | Docs Bot | Creación inicial del documento integral (server + client) siguiendo arc42/C4/IEEE 1016. Se documentan 4 endpoints server, 4 hooks RTK Query client, 3 componentes client, esquemas Joi/Zod, 2 modelos Prisma (providerOrder + providerOrderDetail). Módulo sin rutas registradas en Express. |

---

## 2. Introducción y Objetivos

### 2.1 Propósito

El módulo **ProviderOrder** gestiona órdenes a proveedores (órdenes de compra o "purchase orders"). Permite registrar, consultar, actualizar y eliminar órdenes realizadas a proveedores del sistema. Cada orden puede convertirse posteriormente en una compra (`purchase`) cuando los productos son recibidos. Es el equivalente en lado proveedor del módulo `ClientOrder`.

Funcionalidades principales:

- **Registro de Órdenes a Proveedor**: Creación de órdenes asociadas a un proveedor (`productProviders`).
- **Vinculación con Proveedores**: Asociación de cada orden a un proveedor existente.
- **Estados de Orden**: Seguimiento del ciclo de vida (PENDING, PROCESSING, RECEIVED, COMPLETED, CANCELLED).
- **Conversión a Compra**: Relación opcional con una compra (`purchase`) generada al recibir la orden.
- **Filtros y Paginación**: Búsqueda por supplierId con paginación server-side.
- **Auditoría**: Trazabilidad de creador y última modificación.

### 2.2 Alcance Funcional

| ID | Función | Actor | Cubre |
| ------ | ---------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| F-001 | Listar órdenes a proveedor con filtros y paginación | ADMIN/MANAGER/USER | GET `/api/v1/providerOrder` con `checkRoleAuthOrPermisssion(canViewProviderOrder)` |
| F-002 | Crear orden a proveedor | ADMIN/MANAGER | POST `/api/v1/providerOrder` con `checkRoleAuthOrPermisssion(canCreateProviderOrder)` |
| F-003 | Actualizar orden a proveedor | ADMIN/MANAGER/USER | PATCH `/api/v1/providerOrder/:id` con `checkRoleAuthOrPermisssion(canEditProviderOrder)` |
| F-004 | Eliminar orden a proveedor | ADMIN/MANAGER/USER | DELETE `/api/v1/providerOrder/:id` con `checkRoleAuthOrPermisssion(canDeleteProviderOrder)` |

### 2.3 Alcance No Funcional

| ID | Requisito | Tipo |
| ------ | ------------------------------------------------------------ | --------- |
| Q-001 | Respuesta < 500ms para listados paginados con ≤ 5K registros | Performance |
| Q-002 | La orden solo puede eliminarse si no tiene compra asociada | Integridad |
| Q-003 | Los timestamps de auditoría deben ser precisos y automáticos | Auditabilidad |

---

## 3. Contexto y Alcance

### 3.1 Diagrama de Contexto (C4 Nivel 1)

```
[Usuario Admin/Manager/User]
       |
       v
[ProviderOrder Module] --GET/POST/PATCH/DELETE--> [/api/v1/providerOrder]
       |
       |-- FK --> [productProviders (PostgreSQL)]
       |-- FK --> [users (PostgreSQL)]
       |-- 1:N --> [providerOrderDetail (PostgreSQL)]
       |-- 1:1? --> [purchase (PostgreSQL)]
```

### 3.2 Límites del Sistema

- **Incluido**: CRUD de órdenes a proveedor, paginación, filtros, auditoría, control de roles/permisos.
- **No incluido**: Conversión automática a compra (pendiente), lógica de inventario, notificaciones.
- **Dependencias externas**: Tabla `productProviders` (FK supplierId), tabla `users` (FK createdBy/updatedBy), tabla `products` (FK en detail).
- **Dependencias internas**: `providerOrderDetail` (subentidad 1:N), `purchase` (relación opcional 1:1 por purchaseId).

---

## 4. Restricciones

| ID | Restricción | Motivo |
| -- | ------------------------------------------------------------ | --------------------------------------------------- |
| C-01 | PostgreSQL como BD relacional | Stack definido (Prisma ORM) |
| C-02 | Express.js para la capa HTTP | Stack backend establecido |
| C-03 | React + RTK Query para el frontend | Stack frontend definido |
| C-04 | Autenticación vía JWT + middleware `verifyToken` | Seguridad corporativa |
| C-05 | `req.userId` provisto por middleware de autenticación | Estándar del proyecto |
| C-06 | `supplierId` referenciado como FK a `productProviders`, no `providers` | Modelo de datos existente |

---

## 5. Stack Tecnológico

| Componente | Tecnología | Versión |
| ---------- | --------------------------------------------- | ------- |
| ORM | Prisma (`@prisma/client`) | ~6.x |
| Base de datos | PostgreSQL (via schema.prisma) | ~16.x |
| Validación server | Joi (schema propio en `schemas/providerOrder.joi.js`) | ~17.x |
| Validación client | Zod + hookform/resolvers | ~3.x |
| HTTP Server | Express.js | ~4.x |
| API Client | RTK Query (Redux Toolkit) | ~2.x |
| UI Framework | React + shadcn/ui | ~18.x |
| Formularios | react-hook-form | ~7.x |

---

## 6. Arquitectura del Módulo (Overview)

### 6.1 Estructura de Directorios

```
apps/server/src/modules/providerOrder/
├── routes.js                       # Router de Express (4 rutas, middleware completo)
├── controller.js                   # Handlers HTTP (4 endpoints)
├── service.js                      # Lógica de negocio (4 métodos)
├── dao.js                          # Acceso a datos (Prisma ORM)
└── schemas/
    └── providerOrder.joi.js        # Esquema Joi de validación
```

```
apps/client/src/modules/providerOrder/
├── api/
│   ├── providerOrderApi.js         # RTK Query (4 endpoints — provider)
│   └── clientOrderApi.js           # DUPLICADO — copia del módulo clientOrder
├── components/
│   ├── ProviderOrdersDatatable.jsx      # Tabla de datos
│   ├── ProviderOrdersDialog.jsx         # Diálogo crear/editar
│   ├── ProviderOrdersFiltersForm.jsx    # Formulario de filtros
│   ├── ClientOrderDatatable.jsx         # DUPLICADO — copia de clientOrder
│   ├── ClientOrderDialog.jsx            # DUPLICADO — copia de clientOrder
│   ├── ClientOrderFiltersForm.jsx       # DUPLICADO — copia de clientOrder
│   └── index.js                         # Barrel export (incluye ambas familias)
├── pages/
│   ├── ProviderOrders.jsx               # Página principal (ProviderOrder)
│   └── ClientOrder.jsx                  # DUPLICADO — copia de clientOrder
└── utils/
    ├── schema.js                        # Esquemas Zod
    └── index.js                         # Barrel (vacío)
```

**Nota**: Existen archivos duplicados de `ClientOrder` dentro del directorio `providerOrder/` del cliente, probablemente copiados durante desarrollo. Deben limpiarse.

### 6.2 Patrón Arquitectónico

```
Controller → Service → DAO → Prisma Client → PostgreSQL
     ^
     |
  Middleware (verifyToken, checkRoleAuthOrPermission, validateSchema/validateQueryParams/validatePathParam)
```

El cliente sigue el patrón:

```
Page → Components (Datatable, Dialog, FiltersForm)
  ↓
RTK Query (providerOrderApi) → axiosPrivateBaseQuery → Express API
```

---

## 7. Vista de Building Blocks — Server

### 7.1 Router (`routes.js`)

| Método | Ruta | Middleware | Handler |
| ------ | ---------------- | ------------------------------------------------------------ | ----------------------------- |
| GET | `/` | `verifyToken`, `checkRoleAuthOrPermisssion(canViewProviderOrder)`, `validateQueryParams()` | `getAllProviderOrders` |
| POST | `/` | `verifyToken`, `checkRoleAuthOrPermisssion(canCreateProviderOrder)`, `validateSchema()` | `createProviderOrder` |
| PATCH | `/:id` | `verifyToken`, `checkRoleAuthOrPermisssion(canEditProviderOrder)`, `validatePathParam`, `validateSchema(providerOrderUpdateSchema)` | `updateProviderOrderById` |
| DELETE | `/:id` | `verifyToken`, `checkRoleAuthOrPermisssion(canDeleteProviderOrder)`, `validatePathParam` | `deleteProviderOrderById` |

- **Roles**: ADMIN, MANAGER, USER (lectura/edición/eliminación); solo ADMIN/MANAGER para creación.
- **Permisos**: `canViewProviderOrder`, `canCreateProviderOrder`, `canEditProviderOrder`, `canDeleteProviderOrder`.
- **Validación**: PATCH usa `providerOrderUpdateSchema`; POST usa `validateSchema()` sin esquema específico (comentario: "falta los esquemas").
- **Router no conectado**: No importado en `routes/v1/index.js`.

### 7.2 Controller (`controller.js`)

| Función | Ruta | Request | Response | Auditoría |
| ------- | ---------------- | ------------------------------ | --------------- | ------------------- |
| `getAllProviderOrders` | GET / | `req.safeQuery` (page, limit, providerId, status, startDate, endDate) | 200 + `{ dataList, total }` | No |
| `createProviderOrder` | POST / | `req.body` + `req.userId` | 201 + objeto creado | `createdBy: req.userId` |
| `updateProviderOrderById` | PATCH /:id | `req.params.id` + `req.body` + `req.userId` | 200 + objeto actualizado | `updatedBy: req.userId` |
| `deleteProviderOrderById` | DELETE /:id | `req.params.id` | 200 + mensaje | No |

```js
// getAllProviderOrders
const providerOrders = await getAllProviderOrdersService(req.safeQuery);
globalResponse(res, 200, providerOrders);

// createProviderOrder
const providerOrder = await createProviderOrderService({
  ...req.body,
  createdBy: req.userId,
});
globalResponse(res, 201, providerOrder);

// updateProviderOrderById
const providerOrder = await updateProviderOrderByIdService(req.params.id, {
  ...req.body,
  updatedBy: req.userId,
});
globalResponse(res, 200, providerOrder);

// deleteProviderOrderById
await deleteProviderOrderByIdService(req.params.id);
globalResponse(res, 200, { message: 'ProviderOrder deleted successfully' });
```

### 7.3 Service (`service.js`)

| Función | Parámetros | Validación | Llama |
| ------- | --------------------------- | -------------------------------------------------- | ---------------------------- |
| `getAllProviderOrders` | `filters` | `getSafePagination` — lanza error si `!take \|\| take <= 0` | `getAllProviderOrdersDao(filters, take, skip)` |
| `createProviderOrder` | `data` | Ninguna | `createProviderOrderDao(dataProviderOrder)` |
| `updateProviderOrderById` | `id, data` | `Number(id)` | `updateProviderOrderByIdDao(Number(id), dataProviderOrder)` |
| `deleteProviderOrderById` | `id` | `Number(id)` | `deleteProviderOrderByIdDao(Number(id))` |

- **BUG**: `getSafePagination` recibe `{ page: filters.page, limit: filters }` — `limit` recibe el objeto `filters` entero, no `filters.limit`.
- `createProviderOrder`: Agrega `createdOn: new Date()` al payload.
- `updateProviderOrderById`: Agrega `updatedOn: new Date()` al payload.

### 7.4 DAO (`dao.js`)

#### getAllProviderOrders (Prisma ORM)

```js
prisma.providerOrder.findMany({
  where: filters,      // Pasa filters directamente — incluye page, limit, etc. en WHERE
  include: {
    productOrders: true,
    userProviderOrderCreated: true,
    userProviderOrderUpdated: true,
    details: true,
    purchase: true,
  },
  take,
  skip,
});
```

- **BUG**: `where: filters` pasa el objeto filters completo (incluyendo `page`, `limit`) como condiciones WHERE en lugar de solo los campos filtrables (`providerId`, `status`, `startDate`, `endDate`).
- **No implementa filtros reales**: No hay lógica para convertir `startDate`/`endDate` en condiciones de rango.
- **Incluye relaciones**: `productOrders`, usuarios de auditoría, `details`, `purchase`.

#### createProviderOrder (Prisma ORM)

```js
prisma.providerOrder.create({
  data: {
    supplierId: data.supplierId,
    createdBy: data.createdBy,
    notes: data.notes,
    createdOn: data.createdOn,
    productOrders: { connect: { id: data.supplierId } },
    userProviderOrderCreated: { connect: { id: data.createdBy } },
  },
  include: { productOrders, userProviderOrderCreated, userProviderOrderUpdated, details, purchase }
});
```

- **No usa `data.status`**: Ignora el campo status aunque se reciba del controller.
- **No usa `data.total`**: Ignora el campo total.
- **No usa `data.details`**: Ignora los detalles de la orden (providerOrderDetail).

#### updateProviderOrderById (Prisma ORM)

```js
prisma.providerOrder.update({
  where: { id },
  data: {
    supplierId: data.supplierId,
    updatedBy: data.updatedBy,
    notes: data.notes,
    updatedOn: data.updatedOn,
    ...(data.supplierId !== undefined && { productOrders: { connect: { id: data.supplierId } } }),
    ...(data.updatedBy !== undefined && { userProviderOrderUpdated: { connect: { id: data.updatedBy } } }),
  },
  include: { productOrders, userProviderOrderCreated, userProviderOrderUpdated, details, purchase }
});
```

- **No usa `data.status`**: Ignora el campo status.
- **No usa `data.total`**: Ignora el campo total.

#### deleteProviderOrderById (Prisma ORM)

```js
prisma.providerOrder.delete({ where: { id } });
```

- **Sin verificación**: No valida si tiene detalles hijos o compra asociada.

---

## 8. Vista de Building Blocks — Client

### 8.1 RTK Query API (`providerOrderApi.js`)

| Endpoint | Hook | Método | Ruta | Tags |
| ---------------- | ---------------------------------------- | ------ | ----------------------- | ----------------- |
| `getAllProviderOrders` | `useLazyGetAllProviderOrdersQuery` / `useGetAllProviderOrdersQuery` | GET | `/providerOrder` | `['ProviderOrders']` |
| `createProviderOrder` | `useCreateProviderOrderMutation` | POST | `/providerOrder/` | `['ProviderOrders']` |
| `updateProviderOrderById` | `useUpdateProviderOrderByIdMutation` | PATCH | `/providerOrder/${id}` | `['ProviderOrders']` |
| `deleteProviderOrderById` | `useDeleteProviderOrderByIdMutation` | DELETE | `/providerOrder/${id}` | `['ProviderOrders']` |

- **Base URL**: `import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'`.
- **Base Query**: `axiosPrivateBaseQuery` (axios con interceptors JWT).
- **Cache**: `keepUnusedDataFor: 300` (5 min).
- **Invalidación**: Todos los mutations invalidan tag `'ProviderOrders'`.

### 8.2 Page (`ProviderOrders.jsx`)

Estado local:

| Variable | Tipo | Inicial | Propósito |
| -------------- | --------- | ----------- | -------------------------- |
| `selectedRow` | `Object` | `{}` | Fila seleccionada para edición |
| `openDialog` | `boolean` | `false` | Control del diálogo modal |
| `openAlertDialog` | `boolean` | `false` | Control del diálogo de alerta |
| `alertProps` | `Object` | `{}` | Props del diálogo de alerta |
| `actionDialog` | `string` | `''` | Título del diálogo (add/edit) |

Flujo de datos:

```
[User Action] → handleSubmitFilters / handleSubmit / handleDelete
       ↓
  getAllProviderOrders({ ...data }) // llamada directa, sin useEffect
       ↓
  dataProviderOrders = { data: [] }
       ↓
  ProviderOrdersDatatable (render)
```

**Diferencia clave vs ClientOrder**: No hay `useEffect` para refetch automático. Las llamadas se disparan manualmente desde `handleSubmitFilters`. No hay estado `pagination` ni `filters` — los filtros se pasan directamente a `getAllProviderOrders`.

### 8.3 Components

#### ProviderOrdersDatatable

| Columna | AccessorKey | Tipo | Formato |
| --------- | ------------------------------------ | -------- | --------------- |
| supplierId | `supplierId` | number | Valor directo |
| notes | `notes` | string | `.toUpperCase()` |
| createdOn | `createdOn` | date | `format(new Date(), 'PPP')` |
| updatedOn | `updatedOn` | date/null | `format(new Date(), 'PPP')` o null |

- Props: `dataProviderOrders`, `onEditDialog`.
- Sin paginación ni totalRows (no pasa `pagination`/`onPaginationChange`).
- Usa `dataProviderOrders.data` directamente (asume array).

#### ProviderOrdersDialog

Campos del formulario:

| Campo | Tipo | Requerido | Label i18n | Notas |
| ----------------------------- | ------ | --------- | ------------------------------- | ------------------------------------------------- |
| `supplierId` | number | Sí | `supplierId` | Proveedor |
| `notes` | text | No | `notes` | MaxLength de `FIELD_LIMITS.providerOrder.notes` |
| `userProviderOrderCreatedName` | text | Solo edición | `created_by` | Deshabilitado, solo visual |
| `userProviderOrderUpdatedName` | text | Solo edición | `updated_by` | Deshabilitado, solo visual |

- Usa `zodResolver(ProviderOrderSchema)` — esquema conectado.
- Usa `pickDirty(data, dirtyFields)` para actualizaciones parciales.
- Incluye campos de auditoría (created/updated by) como solo lectura.
- Botones: Cancel, Delete (solo edición), Save/Update.

#### ProviderOrdersFiltersForm

Campos de filtro:

| Campo | Tipo | Placeholder i18n |
| --------- | ------ | ---------------- |
| supplierId | number | `supplierId` |

- Botones: Search, Add, Clear.
- Usa `zodResolver(ProviderOrdersFiltersSchema)` — esquema conectado.

---

## 9. Vista de Runtime y Flujo de Datos

### 9.1 Listar Órdenes a Proveedor

```
[User clicks Search]
  →
  getAllProviderOrders({ supplierId: ... })
  →
  GET /api/v1/providerOrder?supplierId=...
  →
  [Express Router] (NO CONECTADO — no registrado en v1/index.js)
```

### 9.2 Crear Orden

```
[User fills dialog → clicks Save]
  →
  handleSubmit(data) → createProviderOrder(data).unwrap()
  →
  POST /api/v1/providerOrder/  { supplierId, notes }
  →
  [Controller] → [Service] add createdOn → [DAO] prisma.providerOrder.create
  → (Nota: ignora status, total, details)
  →
  Response 201 → AlertDialog "added_successfully" → close dialog
```

### 9.3 Actualizar Orden

```
[User edits row → clicks Update]
  →
  handleSubmit({ id, body: changes }) → updateProviderOrderById({ id, data: changes }).unwrap()
  →
  PATCH /api/v1/providerOrder/:id  { supplierId?, notes? }
  →
  [Controller] → [Service] add updatedOn → [DAO] prisma.providerOrder.update
  → (Nota: ignora status, total)
  →
  Response 200 → AlertDialog "updated_successfully" → close dialog
```

### 9.4 Eliminar Orden

```
[User clicks Delete → confirm]
  →
  handleDelete(id) → deleteProviderOrderById(id).unwrap()
  →
  DELETE /api/v1/providerOrder/:id
  →
  [Controller] → [Service] → [DAO] prisma.providerOrder.delete
  →
  Response 200 → AlertDialog "deleted_successfully" → close dialog
```

---

## 10. Modelo de Datos

### 10.1 Entidad `providerOrder`

| Columna | Tipo | Constraints | Descripción |
| ----------- | ------------ | ------------------------------ | ------------------------------------------ |
| `id` | `Int` | PK, autoincrement | Identificador único |
| `supplierId` | `Int` | FK → `productProviders.id`, NOT NULL | Proveedor asociado |
| `createdBy` | `Int` | FK → `users.id`, NOT NULL | Usuario creador |
| `updatedBy` | `Int?` | FK → `users.id`, nullable | Usuario última modificación |
| `status` | `orderStatus` | DEFAULT `PENDING` | Estado de la orden |
| `notes` | `String?` | nullable | Notas u observaciones |
| `createdOn` | `DateTime` | NOT NULL, `@db.Timestamp(3)` | Fecha de creación |
| `updatedOn` | `DateTime?` | nullable, `@db.Timestamp(3)` | Fecha de última modificación |
| `purchaseId` | `Int?` | FK → `purchase.id`, nullable | Compra generada al recibir la orden |

### 10.2 Entidad `providerOrderDetail`

| Columna | Tipo | Constraints | Descripción |
| -------------- | ------- | -------------------------------- | ------------------------- |
| `id` | `Int` | PK, autoincrement | Identificador único |
| `orderId` | `Int` | FK → `providerOrder.id`, NOT NULL | Orden padre |
| `productId` | `Int` | FK → `products.id`, NOT NULL | Producto |
| `quantity` | `Int` | NOT NULL | Cantidad |
| `estimatedPrice` | `Float` | NOT NULL | Precio estimado por unidad |

### 10.3 Relaciones

```
providerOrder 1──N providerOrderDetail
providerOrder N──1 productProviders (supplierId)
providerOrder N──1 users (createdBy)
providerOrder N──1 users? (updatedBy)
providerOrder 1──1? purchase (purchaseId)
providerOrderDetail N──1 products (productId)
```

### 10.4 Diagrama DER (textual)

```
┌──────────────────────┐       ┌───────────────────────────┐
│   productProviders   │       │      providerOrder          │
├──────────────────────┤       ├───────────────────────────┤
│ id (PK)              │──1:N──│ supplierId (FK)            │
│ name                 │       │ id (PK)                    │
│ ...                  │       │ status (orderStatus)       │
└──────────────────────┘       │ notes (String?)            │
                               │ createdOn (DateTime)       │
┌──────────────────────┐       │ updatedOn (DateTime?)      │
│      users           │       │ createdBy (FK)             │
├──────────────────────┤──1:N──│ updatedBy (FK?)            │
│ id (PK)              │       │ purchaseId (FK?)      ───1:1┐
│ name                 │       │                            │
│ ...                  │       └──────┬─────────────────────┘
└──────────────────────┘              │ 1
                                      │ N
                               ┌──────┴─────────────────────┐
                               │   providerOrderDetail       │
                               ├───────────────────────────┤
                               │ id (PK)                    │
                               │ orderId (FK)               │
                               │ productId (FK)             │
                               │ quantity (Int)             │
                               │ estimatedPrice (Float)     │
                               └───────────────────────────┘
```

---

## 11. Contratos de API

### 11.1 GET /api/v1/providerOrder — Listar órdenes

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
| --------- | ------ | --------- | -------------------------------- |
| `page` | integer | No | Número de página (default 1) |
| `limit` | integer | No | Items por página (default 20) |
| `supplierId` | integer | No | Filtrar por ID de proveedor |
| `status` | string | No | Filtrar por estado |
| `startDate` | date | No | (Documentado en controller, NO implementado en DAO) |
| `endDate` | date | No | (Documentado en controller, NO implementado en DAO) |

**Response 200:**

```json
{
  "dataList": [
    {
      "id": 1,
      "supplierId": 3,
      "status": "PENDING",
      "notes": "Pedido urgente",
      "createdOn": "2026-06-10T10:00:00.000Z",
      "updatedOn": null,
      "purchaseId": null,
      "productOrders": { ... },
      "userProviderOrderCreated": { "id": 1, "name": "Admin" },
      "userProviderOrderUpdated": null,
      "details": [],
      "purchase": null
    }
  ],
  "total": 1
}
```

### 11.2 POST /api/v1/providerOrder — Crear orden

**Request Body:**

```json
{
  "supplierId": 3,
  "notes": "Pedido urgente",
  "status": "PENDING",
  "total": 1500.00,
  "details": [
    { "productId": 5, "quantity": 10, "estimatedPrice": 150.00 }
  ]
}
```

**Nota**: DAO solo persiste `supplierId`, `notes`, `createdBy`, `createdOn`. Ignora `status`, `total`, `details`.

**Response 201:** Objeto `providerOrder` creado con relaciones incluidas.

### 11.3 PATCH /api/v1/providerOrder/:id — Actualizar orden

**Request Body:** (campos parciales)

```json
{
  "status": "RECEIVED",
  "notes": "Recibido parcialmente"
}
```

**Nota**: DAO solo actualiza `supplierId`, `notes`, `updatedBy`, `updatedOn`. Ignora `status`, `total`.

**Response 200:** Objeto `providerOrder` actualizado.

### 11.4 DELETE /api/v1/providerOrder/:id — Eliminar orden

**Response 200:**

```json
{
  "message": "ProviderOrder deleted successfully"
}
```

---

## 12. Reglas de Validación y Esquemas

### 12.1 Joi (Server) — `schemas/providerOrder.joi.js`

```js
export const providerOrderUpdateSchema = Joi.object({
  total: Joi.number().integer().positive(),
  status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'),
  supplierId: Joi.number().integer().positive(),
  notes: Joi.string().max(2000),
  updatedBy: Joi.number().integer().positive(),
}).min(1).message('At least one field must be provided');
```

- Solo para PATCH (actualización parcial).
- **No existe schema Joi para creación (POST)**.
- El POST usa `validateSchema()` sin argumento (sin validación efectiva).
- Status acepta 4 valores: `PENDING`, `PROCESSING`, `COMPLETED`, `CANCELLED` (falta `SHIPPED` y `RECEIVED`).

### 12.2 Zod (Client) — `utils/schema.js`

```js
export const ProviderOrderSchema = z.object({
  supplierId: z.number({ required_error: '...' }),
  notes: z.string().optional(),
}).passthrough();

export const ProviderOrdersFiltersSchema = z.object({
  supplierId: z.number().optional(),
});
```

- `supplierId` es `z.number()` en Zod, `number().integer()` en Joi (compatibles).

### 12.3 Discrepancias

| Aspecto | Joi (server) | Zod (client) | DAO |
| --------------- | ------------------------------------------------ | ---------------------------------------- | ----------------------------- |
| `supplierId` | `number().integer().positive()` | `number()` | `data.supplierId` ✓ |
| `status` | `string().valid(...)` — 4 valores | No incluido | **Ignorado** |
| `total` | `number().integer().positive()` | No incluido | **Ignorado** |
| `notes` | `string().max(2000)` | `string().optional()` | `data.notes` ✓ |
| `details` | No validado | No incluido | **Ignorado** |

---

## 13. Seguridad y Autorización

### 13.1 Autenticación

- Todas las rutas protegidas por middleware `verifyToken` (aplicado globalmente en router).

### 13.2 Autorización

Middlewares `checkRoleAuthOrPermisssion` con roles y permisos específicos:

| Endpoint | Roles Permitidos | Permiso |
| --------- | ----------------------------------- | --------------------------- |
| GET / | ADMIN, MANAGER, USER | `canViewProviderOrder` |
| POST / | ADMIN, MANAGER | `canCreateProviderOrder` |
| PATCH /:id | ADMIN, MANAGER, USER | `canEditProviderOrder` |
| DELETE /:id | ADMIN, MANAGER, USER | `canDeleteProviderOrder` |

### 13.3 Validación de Entrada

- GET: `validateQueryParams()` (sin schema específico — usa schema vacío).
- POST: `validateSchema()` sin argumento (sin validación).
- PATCH: `validateSchema(providerOrderUpdateSchema)` + `validatePathParam`.
- DELETE: `validatePathParam`.

### 13.4 Auditoría

- `createdBy`: Set desde `req.userId` en creación.
- `updatedBy`: Set desde `req.userId` en actualización.
- `createdOn`/`updatedOn`: Set desde service (server timestamp).
- El GET incluye `userProviderOrderCreated` y `userProviderOrderUpdated` como objetos completos.

---

## 14. Manejo de Errores

### 14.1 Errores Conocidos (Sin Manejo)

| Error | Causa | Impacto |
| --------- | ------------------------------------------------------------- | ---------------------------------------- |
| P2025 | DELETE de orden inexistente | Prisma lanza excepción no capturada → 500 |
| P2003 | DELETE de orden con detalles hijos o compra asociada | Violación FK → Prisma lanza excepción |
| Validación | `supplierId` no existe en `productProviders` | Violación FK → Prisma lanza excepción |

### 14.2 Errores del Servicio

| Condición | Error | Código |
| ------------------------------------- | ------------------------------------ | ------ |
| Paginación sin `take` | `'Pagination is required'` | 500 |

### 14.3 Errores del Cliente

- Errores de API capturados en `handleSubmit` catch → `console.error`.
- Sin UI de error específica para el módulo.

---

## 15. Conceptos Transversales (Cross-Cutting)

### 15.1 Auditoría y Trazabilidad

- `createdBy` / `updatedBy` se conectan vía Prisma relations a `users`.
- `createdOn` / `updatedOn` timestamps locales del servidor.

### 15.2 Paginación

- Server: `getSafePagination` (con bug: `limit: filters` en vez de `filters.limit`).
- Client: Sin paginación — `handleSubmitFilters` llama directamente sin estado de página.

### 15.3 Internacionalización (i18n)

- Cliente usa `react-i18next` con claves como `provider_orders`, `supplierId`, `notes_placeholder`, etc.

### 15.4 Cache de API

- RTK Query con tag `'ProviderOrders'` e invalidación automática en mutations.

### 15.5 Manejo de Errores Global

- Server: `handleCatchErrorAsync` wrapper async.
- `globalResponse` utility para respuestas estandarizadas.

---

## 16. Requisitos de Calidad

### 16.1 Rendimiento

| Escenario | Objetivo | Métrica |
| --------------- | ----------- | ----------------- |
| Listar 5K órdenes con filtros | < 500ms | Tiempo de respuesta |
| Crear orden | < 200ms | Tiempo de respuesta |

### 16.2 Mantenibilidad

- Código server modular (Controller → Service → DAO).
- Componentes client separados por responsabilidad.
- Archivos duplicados de ClientOrder dentro del directorio ProviderOrder (deuda técnica).
- **Cobertura de tests**: 0%.

### 16.3 Seguridad

- CSRF aplicado condicionalmente.
- Rate limiting aplicado a rutas no auth.
- Roles y permisos granulares por endpoint.

---

## 17. Decisiones de Diseño (ADRs)

### ADR-001: Prisma ORM en GET (vs raw SQL en otros módulos)

- **Contexto**: ProviderOrder GET usa `prisma.providerOrder.findMany()` con `include` en lugar de raw SQL con JOINs.
- **Decisión**: Usar Prisma ORM para mantener consistencia con el resto del módulo.
- **Consecuencia**: La respuesta incluye objetos completos de relaciones anidadas en lugar de campos planos con nombres.

### ADR-002: DAO ignora status, total, details en create/update

- **Contexto**: El DAO de ProviderOrder no persiste `status`, `total` ni `details` aunque existen en el modelo y los esquemas.
- **Decisión**: Implementación parcial. El módulo fue desarrollado como MVP y estas funcionalidades están pendientes.
- **Consecuencia**: Las órdenes se crean siempre con status `PENDING` (default Prisma), sin total calculado y sin detalles de productos.

### ADR-003: `supplierId` conectado a `productProviders` en vez de `providers`

- **Contexto**: La FK `supplierId` referencia la tabla `productProviders`, no `providers`.
- **Decisión**: Coherente con el modelo existente donde `productProviders` almacena la relación producto-proveedor.
- **Consecuencia**: Un `supplierId` representa un registro en `productProviders`, no un proveedor independiente.

### ADR-004: Archivos duplicados de ClientOrder en directorio ProviderOrder

- **Contexto**: El directorio `providerOrder/` del cliente contiene archivos `ClientOrder*` duplicados.
- **Decisión**: Copia accidental durante desarrollo. Pendiente de limpieza.
- **Consecuencia**: Riesgo de confusión y código muerto.

---

## 18. Riesgos y Deuda Técnica

### 18.1 Bugs

| ID | Descripción | Severidad | Archivo |
| -- | ------------------------------------------------------------ | --------- | ------------------------------------------------- |
| R-001 | **Módulo no registrado en Express** — No importado en `routes/v1/index.js`. | CRITICAL | `apps/server/src/routes/v1/index.js` |
| R-002 | **getSafePagination bug** — `limit: filters` pasa objeto entero como limit. | HIGH | `apps/server/src/modules/providerOrder/service.js:25` |
| R-003 | **where: filters sin sanitizar** — `findMany({ where: filters })` pasa page, limit como condiciones WHERE. | HIGH | `apps/server/src/modules/providerOrder/dao.js:12-13` |
| R-004 | **DAO ignora status en create/update** — El campo status no se persiste aunque se recibe. | HIGH | `apps/server/src/modules/providerOrder/dao.js` |
| R-005 | **DAO ignora total en create/update** — El campo total no se persiste. | HIGH | `apps/server/src/modules/providerOrder/dao.js` |
| R-006 | **DAO ignora details en create** — providerOrderDetail nunca se crea con la orden padre. | CRITICAL | `apps/server/src/modules/providerOrder/dao.js` |
| R-007 | **POST sin schema Joi** — `validateSchema()` sin argumento, sin validación efectiva. | MEDIUM | `apps/server/src/modules/providerOrder/routes.js:34` |
| R-008 | **ProviderOrderUpdateSchema faltan valores enum** — Status no incluye `SHIPPED` ni `RECEIVED`. | LOW | `apps/server/src/modules/providerOrder/schemas/providerOrder.joi.js` |
| R-009 | **DELETE sin verificar integridad referencial** — No valida si tiene detalles o compra asociada. | HIGH | `apps/server/src/modules/providerOrder/dao.js` |
| R-010 | **Sin manejo de errores Prisma (P2025/P2003)** — Ninguna operación captura errores de Prisma. | HIGH | `apps/server/src/modules/providerOrder/dao.js` |
| R-011 | **Sin paginación client-side** — ProviderOrders.jsx no maneja estado de paginación, llama sin page/limit. | MEDIUM | `apps/client/src/modules/providerOrder/pages/ProviderOrders.jsx` |
| R-012 | **Sin tests** — Sin cobertura de tests unitarios ni de integración. | HIGH | `apps/server/src/modules/providerOrder/`, `apps/client/src/modules/providerOrder/` |
| R-013 | **Archivos ClientOrder duplicados** — 5 archivos duplicados dentro del directorio providerOrder. | LOW | `apps/client/src/modules/providerOrder/` |

### 18.2 Deuda Técnica

| ID | Descripción | Impacto | Archivos |
| -- | ------------------------------------------------------------ | --------- | ----------------------------------------- |
| T-001 | Módulo sin registrar en `routes/v1/index.js` | No accesible | `apps/server/src/routes/v1/index.js` |
| T-002 | Esquema Joi para POST no implementado | Sin validación server en creación | `apps/server/src/modules/providerOrder/routes.js` |
| T-003 | DAO no maneja detalles de orden | Funcionalidad incompleta | `apps/server/src/modules/providerOrder/dao.js` |
| T-004 | Archivos ClientOrder duplicados en directorio ProviderOrder | Código muerto | `apps/client/src/modules/providerOrder/` |

---

## 19. Glosario

| Término | Definición |
| --------- | --------------------------------------------------------------------------- |
| **ProviderOrder** | Orden de compra realizada a un proveedor. Precursor de una compra (`purchase`). |
| **providerOrderDetail** | Detalle de línea de productos dentro de una orden a proveedor. |
| **orderStatus** | Enumeración de posibles estados (PENDING, PROCESSING, SHIPPED, RECEIVED, COMPLETED, CANCELLED). |
| **purchaseId** | Referencia opcional a la compra generada cuando la orden es recibida. |
| **productProviders** | Tabla puente que relaciona productos con proveedores. `supplierId` es FK a esta tabla. |

---

## 20. Apéndices

### 20.1 Archivos del Módulo

```
SERVER (5 archivos):
- routes.js                           — Router Express con 4 rutas (57 líneas)
- controller.js                       — 4 handlers HTTP (87 líneas)
- service.js                          — 4 métodos de negocio (81 líneas)
- dao.js                              — 4 métodos de acceso a datos (120 líneas)
- schemas/providerOrder.joi.js        — Esquema Joi para PATCH (19 líneas)

CLIENT (archivos providerOrder propios: 7 archivos)
- api/providerOrderApi.js             — RTK Query (67 líneas)
- pages/ProviderOrders.jsx            — Página principal (176 líneas)
- components/ProviderOrdersDatatable.jsx   — Tabla (54 líneas)
- components/ProviderOrdersDialog.jsx      — Diálogo (289 líneas)
- components/ProviderOrdersFiltersForm.jsx — Filtros (107 líneas)
- components/index.js                      — Barrel (6 líneas)
- utils/schema.js                          — Zod schemas (15 líneas)
- utils/index.js                           — Barrel (0 líneas)

CLIENT (archivos DUPLICADOS de ClientOrder: 5 archivos)
- api/clientOrderApi.js                    — DUPLICADO
- pages/ClientOrder.jsx                    — DUPLICADO
- components/ClientOrderDatatable.jsx      — DUPLICADO
- components/ClientOrderDialog.jsx         — DUPLICADO
- components/ClientOrderFiltersForm.jsx    — DUPLICADO
```

### 20.2 Estados de orderStatus

| Estado | Descripción |
| ----------- | --------------------------------------------------- |
| `PENDING` | Orden creada, pendiente de procesamiento |
| `PROCESSING` | Orden en proceso de preparación |
| `SHIPPED` | Orden enviada por el proveedor |
| `RECEIVED` | Productos recibidos |
| `COMPLETED` | Orden completada exitosamente |
| `CANCELLED` | Orden cancelada |

### 20.3 Stack de Middlewares

```
Request
  → rateLimiter (limit)
  → csrfConditional
  → verifyToken (JWT)
  → checkRoleAuthOrPermisssion (roles + permisos)
  → validateQueryParams / validateSchema / validatePathParam
  → handler (Controller)
  → Service
  → DAO (Prisma)
  → globalResponse
```

### 20.4 Comparativa ClientOrder vs ProviderOrder

| Aspecto | ClientOrder | ProviderOrder |
| ---------------------- | -------------------------------------- | -------------------------------------- |
| Estado routes.js | Vacío (0 líneas) | Implementado (57 líneas) |
| Middleware roles | No implementado | Completo (checkRoleAuthOrPermisssion) |
| DAO approach | Raw SQL GET + Prisma CUD | Prisma ORM (todo) |
| Paginación GET | `{ dataList, total }` + COUNT | `{ dataList, total }` + COUNT |
| Filtros fecha | No implementados en DAO | No implementados en DAO |
| Auditoría JOIN | Campos planos (clientName) | Objetos anidados (include) |
| status en DAO | Implementado | Ignorado |
| details en DAO | No implementado | Ignorado |
| Client paginación | Sí (pageIndex/pageSize + useEffect) | No (llamada directa) |
| Zod resolver | Vacío (sin esquema) | Conectado (ProviderOrderSchema) |
| Duplicados | No | Sí (archivos ClientOrder) |
