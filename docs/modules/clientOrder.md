# Módulo: ClientOrder (Server + Client)

> Documentación técnica integral del módulo **ClientOrder** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre tanto el backend (`apps/server/src/modules/clientOrder/`) como el frontend (`apps/client/src/modules/clientOrder/`).
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
| **Módulo** | `clientOrder` |
| **Estado** | En Desarrollo (routes no conectadas a Express) |
| **Versión** | `0.5.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/clientOrder/` |
| **Path Client** | `apps/client/src/modules/clientOrder/` |
| **Base URL API** | `/api/v1/clientOrder` (previsto) |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 0.5.0 | 2026-06-11 | Docs Bot | Creación inicial del documento integral (server + client) siguiendo arc42/C4/IEEE 1016. Se documentan 4 endpoints server, 4 hooks RTK Query client, 3 componentes client, esquemas Joi/Zod, 2 modelos Prisma (clientOrder + clientOrderDetail). Módulo sin rutas registradas. |

---

## 2. Introducción y Objetivos

### 2.1 Propósito

El módulo **ClientOrder** gestiona órdenes de clientes (pedidos). Permite registrar, consultar, actualizar y eliminar órdenes de compra realizadas por clientes del sistema. Cada orden puede convertirse posteriormente en una venta (`sale`) cuando es confirmada. El módulo está estrechamente relacionado con `clients` (clientes) y `sales` (ventas).

Funcionalidades principales:

- **Registro de Órdenes**: Creación de órdenes asociadas a un cliente.
- **Vinculación con Clientes**: Asociación de cada orden a un cliente existente.
- **Estados de Orden**: Seguimiento del ciclo de vida (PENDING → PROCESSING → SHIPPED → RECEIVED → COMPLETED / CANCELLED).
- **Conversión a Venta**: Relación opcional con una venta (`sale`) generada a partir de la orden.
- **Filtros y Paginación**: Búsqueda por clientId y status con paginación server-side.
- **Auditoría**: Trazabilidad de creador y última modificación.

### 2.2 Alcance Funcional

| ID | Función | Actor | Cubre |
| ------ | ---------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| F-001 | Listar órdenes de cliente con filtros y paginación | ADMIN/MANAGER | GET `/api/v1/clientOrder` |
| F-002 | Crear orden de cliente | ADMIN/MANAGER | POST `/api/v1/clientOrder` |
| F-003 | Actualizar orden de cliente | ADMIN/MANAGER | PATCH `/api/v1/clientOrder/:id` |
| F-004 | Eliminar orden de cliente | ADMIN/MANAGER | DELETE `/api/v1/clientOrder/:id` |

### 2.3 Alcance No Funcional

| ID | Requisito | Tipo |
| ------ | ------------------------------------------------------------ | --------- |
| Q-001 | Respuesta < 500ms para listados paginados con ≤ 10K registros | Performance |
| Q-002 | La orden solo puede eliminarse si no tiene venta asociada | Integridad |
| Q-003 | Los timestamps de auditoría (createdOn/updatedOn) deben ser precisos y automáticos | Auditabilidad |

---

## 3. Contexto y Alcance

### 3.1 Diagrama de Contexto (C4 Nivel 1)

```
[Usuario Admin/Manager]
       |
       v
[ClientOrder Module] --GET/POST/PATCH/DELETE--> [/api/v1/clientOrder]
       |
       |-- JOIN --> [clients (PostgreSQL)]
       |-- JOIN --> [users (PostgreSQL)]
       |-- 1:N --> [clientOrderDetail (PostgreSQL)]
       |-- 1:1? --> [sale (PostgreSQL)]
```

### 3.2 Límites del Sistema

- **Incluido**: CRUD de órdenes de cliente, paginación, filtros, auditoría.
- **No incluido**: Conversión automática a venta (pendiente), lógica de inventario, notificaciones.
- **Dependencias externas**: Tabla `clients` (FK clientId), tabla `users` (FK createdBy/updatedBy), tabla `products` (FK en detail).
- **Dependencias internas**: `clientOrderDetail` (subentidad 1:N), `sale` (relación opcional 1:1 por saleId).

---

## 4. Restricciones

| ID | Restricción | Motivo |
| -- | ------------------------------------------------------------ | --------------------------------------------------- |
| C-01 | PostgreSQL como BD relacional | Stack definido (Prisma ORM) |
| C-02 | Express.js para la capa HTTP | Stack backend establecido |
| C-03 | React + RTK Query para el frontend | Stack frontend definido |
| C-04 | Autenticación vía JWT + middleware `verifyToken` | Seguridad corporativa |
| C-05 | `req.userId` provisto por middleware de autenticación | Estándar del proyecto |

---

## 5. Stack Tecnológico

| Componente | Tecnología | Versión |
| ---------- | --------------------------------------------- | ------- |
| ORM | Prisma (`@prisma/client`) | ~6.x |
| Base de datos | PostgreSQL (via schema.prisma) | ~16.x |
| Validación server | Joi (schemas en `utils/joiSchemas/joi.js`) | ~17.x |
| Validación client | Zod + hookform/resolvers | ~3.x |
| HTTP Server | Express.js | ~4.x |
| API Client | RTK Query (Redux Toolkit) | ~2.x |
| UI Framework | React + shadcn/ui | ~18.x |
| Formularios | react-hook-form | ~7.x |

---

## 6. Arquitectura del Módulo (Overview)

### 6.1 Estructura de Directorios

```
apps/server/src/modules/clientOrder/
├── routes.js              # Router de Express (VACÍO — sin implementar)
├── controller.js           # Handlers HTTP (4 endpoints)
├── service.js              # Lógica de negocio (4 métodos)
├── dao.js                  # Acceso a datos (Prisma + raw SQL)
```

```
apps/client/src/modules/clientOrder/
├── api/
│   └── clientOrderApi.js   # RTK Query (4 endpoints)
├── components/
│   ├── ClientOrderDatatable.jsx   # Tabla de datos
│   ├── ClientOrderDialog.jsx      # Diálogo crear/editar
│   ├── ClientOrderFiltersForm.jsx # Formulario de filtros
│   └── index.js                  # Barrel export
├── pages/
│   └── ClientOrder.jsx           # Página principal
└── utils/
    ├── schema.js                 # Esquemas Zod
    └── index.js                  # Barrel (vacío)
```

### 6.2 Patrón Arquitectónico

```
Controller → Service → DAO → Prisma Client → PostgreSQL
     ^
     |
  Middleware (verifyToken, safeQuery, roleCheck)
```

El cliente sigue el patrón:

```
Page → Components (Datatable, Dialog, FiltersForm)
  ↓
RTK Query (clientOrderApi) → axiosPrivateBaseQuery → Express API
```

---

## 7. Vista de Building Blocks — Server

### 7.1 Router (`routes.js`)

**Archivo vacío (0 líneas).** No contiene definiciones de rutas. El módulo **no está conectado** al router principal de Express en `routes/v1/index.js`.

Comportamiento esperado (inferido de controller):

| Método | Ruta | Handler | Middleware |
| ------ | ---------------- | ----------------------------- | ------------------------ |
| GET | `/` | `getAllClientOrders` | `verifyToken`, `safeQuery(clientOrderFiltersSchema)` |
| POST | `/` | `createClientOrder` | `verifyToken`, `validateData(clientOrderCreateUpdateSchema)` |
| PATCH | `/:id` | `updateClientOrderById` | `verifyToken`, `validateData(clientOrderCreateUpdateSchema)` |
| DELETE | `/:id` | `deleteClientOrderById` | `verifyToken` |

### 7.2 Controller (`controller.js`)

| Función | Ruta | Request | Response | Auditoría |
| ------- | ---------------- | ------------------------------ | --------------- | ------------------- |
| `getAllClientOrders` | GET / | `req.safeQuery` (page, limit, clientId, status) | 200 + `{ dataList, total }` | No |
| `createClientOrder` | POST / | `req.body` (clientId, total, details, status) + `req.userId` | 201 + objeto creado | `createdBy: req.userId` |
| `updateClientOrderById` | PATCH /:id | `req.params.id` + `req.body` + `req.userId` | 200 + objeto actualizado | `updatedBy: req.userId` |
| `deleteClientOrderById` | DELETE /:id | `req.params.id` | 200 + `{ message: 'ClientOrder deleted successfully' }` | No |

Detalles:

```js
// getAllClientOrders — pasa req.safeQuery directamente al service
const clientOrders = await getAllClientOrdersService(req.safeQuery);
globalResponse(res, 200, clientOrders);

// createClientOrder — extiende body con createdBy
const clientOrder = await createClientOrderService({
  ...req.body,
  createdBy: req.userId,
});
globalResponse(res, 201, clientOrder);

// updateClientOrderById — extiende body con updatedBy
const clientOrder = await updateClientOrderByIdService(req.params.id, {
  ...req.body,
  updatedBy: req.userId,
});
globalResponse(res, 200, clientOrder);

// deleteClientOrderById — solo pasa id
await deleteClientOrderByIdService(req.params.id);
globalResponse(res, 200, { message: 'ClientOrder deleted successfully' });
```

### 7.3 Service (`service.js`)

| Función | Parámetros | Validación | Llama |
| ------- | --------------------------- | -------------------------------------------------- | -------------------------- |
| `getAllClientOrders` | `filters` | `getSafePagination` — lanza error si `!take \|\| take <= 0` | `getAllClientOrdersDao(filters, take, skip)` |
| `createClientOrder` | `data` | Ninguna | `createClientOrderDao(dataClientOrder)` |
| `updateClientOrderById` | `id, data` | `Number(id)` | `updateClientOrderByIdDao(Number(id), dataClientOrder)` |
| `deleteClientOrderById` | `id` | `Number(id)` | `deleteClientOrderByIdDao(Number(id))` |

- `createClientOrder`: Agrega `createdOn: new Date()` al payload.
- `updateClientOrderById`: Agrega `updatedOn: new Date()` al payload.

### 7.4 DAO (`dao.js`)

#### getAllClientOrders (raw SQL + Prisma COUNT)

```sql
SELECT co.*,
       c.name AS "clientName",
       u.name AS "userClientOrderCreatedName",
       uu.name AS "userClientOrderUpdatedName"
FROM "clientOrder" co
LEFT JOIN "clients" c ON co."clientId" = c.id
LEFT JOIN "users" u ON co."createdBy" = u.id
LEFT JOIN "users" uu ON co."updatedBy" = uu.id
WHERE ...
ORDER BY co."createdOn" DESC
LIMIT ? OFFSET ?
```

- **Filtros**: `clientId` (exacto), `status` (ILIKE).
- **No implementados**: `startDate`, `endDate` (documentados en controller pero no en DAO).
- **Paginación**: Raw SQL con `LIMIT take OFFSET skip`.
- **Total**: `prisma.clientOrder.count({ where })` — compatible con filtros clientId/status.
- **Respuesta**: `{ dataList: clientOrders, total }`.

#### createClientOrder (Prisma ORM)

```js
prisma.clientOrder.create({
  data: {
    clientId, status, notes, createdOn,
    userClientOrderCreated: { connect: { id: createdBy } }
  }
});
```

- **No incluye**: `saleId` (aunque existe en el modelo y en el Joi schema).

#### updateClientOrderById (Prisma ORM)

```js
prisma.clientOrder.update({
  where: { id },
  data: {
    clientId, status, notes, updatedOn,
    userClientOrderUpdated: { connect: { id: updatedBy } }
  }
});
```

- **No incluye**: `saleId`.

#### deleteClientOrderById (Prisma ORM)

```js
prisma.clientOrder.delete({ where: { id } });
```

- **Sin verificación**: No valida si la orden tiene venta asociada antes de eliminar.
- **Sin manejo de errores**: No captura P2025 (registro no encontrado).

---

## 8. Vista de Building Blocks — Client

### 8.1 RTK Query API (`clientOrderApi.js`)

| Endpoint | Hook | Método | Ruta | Tags |
| ---------------- | ------------------------------- | ------ | ------------------ | ------------ |
| `getAllClientOrder` | `useLazyGetAllClientOrderQuery` / `useGetAllClientOrderQuery` | GET | `/clientOrder` | `['ClientOrder']` |
| `createClientOrder` | `useCreateClientOrderMutation` | POST | `/clientOrder/` | `['ClientOrder']` |
| `updateClientOrderById` | `useUpdateClientOrderByIdMutation` | PATCH | `/clientOrder/${id}` | `['ClientOrder']` |
| `deleteClientOrderById` | `useDeleteClientOrderByIdMutation` | DELETE | `/clientOrder/${id}` | `['ClientOrder']` |

- **Base URL**: `import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'`.
- **Base Query**: `axiosPrivateBaseQuery` (axios con interceptors JWT).
- **Cache**: `keepUnusedDataFor: 300` (5 min).
- **Invalidación**: Todos los mutations invalidan tag `'ClientOrder'`.

### 8.2 Page (`ClientOrder.jsx`)

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

Flujo de datos:

```
[User Action] → handleSubmitFilters / handleSubmit / handleDelete
       ↓
  setPagination / setFilters → useEffect → getAllClientOrder({ page, limit, ...filters })
       ↓
  dataClientOrder = { data: { dataList: [], total: 0 } }
       ↓
  ClientOrderDatatable (render)
```

### 8.3 Components

#### ClientOrderDatatable

| Columna | AccessorKey | Tipo | Formato |
| --------- | --------------- | -------- | --------------- |
| clientId | `clientId` | number | Valor directo |
| status | `status` | string | `.toUpperCase()` |
| notes | `notes` | string | `.toUpperCase()` |
| createdOn | `createdOn` | date | `format(new Date(), 'PPP')` |
| updatedOn | `updatedOn` | date/null | `format(new Date(), 'PPP')` o null |
| saleId | `saleId` | number | Valor directo |

- Props: `dataClientOrder`, `onEditDialog`, `pagination`, `onPaginationChange`.
- Usa componente `<DataTable>` genérico con columnas definidas.

#### ClientOrderDialog

Campos del formulario:

| Campo | Tipo | Requerido | Label i18n | Placeholder i18n |
| --------- | ------ | --------- | --------------------------- | --------------------------------- |
| clientId | number | Sí | `clientId` | `clientOrder_clientId_placeholder` |
| notes | text | No | `notes` | `clientOrder_notes_placeholder` |
| saleId | number | No | `saleId` | `clientOrder_saleId_placeholder` |

**Estado comentado**: El campo `status` (Select con orderStatus) está comentado, no se renderiza.

```jsx
/*     <FormField
        control={form.control}
        name="status"
        ...
      />  */
```

- Usa `zodResolver()` **sin esquema** (vacío — no valida nada).
- Usa `pickDirty(data, dirtyFields)` para actualizaciones parciales.
- Botones: Cancel, Delete (solo en edición), Save/Update.
- Llamadas: `onSubmit({ id, body: changes })` en edición, `onSubmit(data)` en creación.

#### ClientOrderFiltersForm

Campos de filtro:

| Campo | Tipo | Placeholder i18n |
| --------- | ------ | --------------------------------- |
| clientId | number | `clientOrder_clientId_placeholder` |
| status | text | `clientOrder_status_placeholder` |

- Botones: Search, Add, Clear.
- Usa `zodResolver()` sin esquema.

---

## 9. Vista de Runtime y Flujo de Datos

### 9.1 Listar Órdenes

```
[Page mount / pagination change / filter change]
  →
  useEffect → getAllClientOrder({ page, limit, clientId?, status? })
  →
  [axiosPrivateBaseQuery] → GET /api/v1/clientOrder?page=1&limit=20&clientId=...
  →
  [Express Router] (NO CONECTADO — rutas.js vacío)
```

### 9.2 Crear Orden

```
[User fills dialog → clicks Save]
  →
  handleSubmit(data) → createClientOrder(data).unwrap()
  →
  POST /api/v1/clientOrder/  { clientId, status?, notes?, saleId? }
  →
  [Controller] createClientOrder → [Service] add createdOn → [DAO] prisma.clientOrder.create
  →
  Response 201 → AlertDialog "added_successfully" → close dialog
```

### 9.3 Actualizar Orden

```
[User edits row → clicks Update]
  →
  handleSubmit({ id, body: changes }) → updateClientOrderById({ id, data: changes }).unwrap()
  →
  PATCH /api/v1/clientOrder/:id  { clientId?, status?, notes?, saleId? }
  →
  [Controller] updateClientOrderById → [Service] add updatedOn → [DAO] prisma.clientOrder.update
  →
  Response 200 → AlertDialog "updated_successfully" → close dialog
```

### 9.4 Eliminar Orden

```
[User clicks Delete → confirm]
  →
  handleDelete(id) → deleteClientOrderById(id).unwrap()
  →
  DELETE /api/v1/clientOrder/:id
  →
  [Controller] deleteClientOrderById → [Service] → [DAO] prisma.clientOrder.delete
  →
  Response 200 → AlertDialog "deleted_successfully" → close dialog
```

---

## 10. Modelo de Datos

### 10.1 Entidad `clientOrder`

| Columna | Tipo | Constraints | Descripción |
| ----------- | ------------ | ------------------------------ | ------------------------------------------ |
| `id` | `Int` | PK, autoincrement | Identificador único |
| `clientId` | `Int` | FK → `clients.id`, NOT NULL | Cliente asociado |
| `createdBy` | `Int` | FK → `users.id`, NOT NULL | Usuario creador |
| `updatedBy` | `Int?` | FK → `users.id`, nullable | Usuario última modificación |
| `status` | `orderStatus` | DEFAULT `PENDING` | Estado de la orden |
| `notes` | `String?` | nullable | Notas u observaciones |
| `createdOn` | `DateTime` | NOT NULL, `@db.Timestamp(3)` | Fecha de creación |
| `updatedOn` | `DateTime?` | nullable, `@db.Timestamp(3)` | Fecha de última modificación |
| `saleId` | `Int?` | FK → `sale.id`, nullable | Venta generada a partir de la orden |

**Enumeración `orderStatus`**:

```prisma
enum orderStatus {
  PENDING
  PROCESSING
  SHIPPED
  RECEIVED
  COMPLETED
  CANCELLED
}
```

### 10.2 Entidad `clientOrderDetail`

| Columna | Tipo | Constraints | Descripción |
| --------- | ------- | -------------------------------- | ------------------------- |
| `id` | `Int` | PK, autoincrement | Identificador único |
| `orderId` | `Int` | FK → `clientOrder.id`, NOT NULL | Orden padre |
| `productId` | `Int` | FK → `products.id`, NOT NULL | Producto |
| `quantity` | `Int` | NOT NULL | Cantidad |
| `unitPrice` | `Float` | NOT NULL | Precio unitario |

### 10.3 Relaciones

```
clientOrder 1──N clientOrderDetail
clientOrder N──1 clients (clientId)
clientOrder N──1 users (createdBy)
clientOrder N──1 users? (updatedBy)
clientOrder 1──1? sale (saleId)
clientOrderDetail N──1 products (productId)
```

### 10.4 Diagrama DER (textual)

```
┌───────────────────┐       ┌──────────────────────────┐
│     clients       │       │      clientOrder          │
├───────────────────┤       ├──────────────────────────┤
│ id (PK)           │──1:N──│ clientId (FK)             │
│ name              │       │ id (PK)                   │
│ ...               │       │ status (orderStatus)      │
└───────────────────┘       │ notes (String?)           │
                            │ createdOn (DateTime)      │
┌───────────────────┐       │ updatedOn (DateTime?)     │
│     users         │       │ createdBy (FK)            │
├───────────────────┤──1:N──│ updatedBy (FK?)           │
│ id (PK)           │       │ saleId (FK?)       ───1:1─┐
│ name              │       │                           │
│ ...               │       └──────┬────────────────────┘
└───────────────────┘              │ 1
                                   │ N
                            ┌──────┴────────────────────┐
                            │    clientOrderDetail        │
                            ├───────────────────────────┤
                            │ id (PK)                    │
                            │ orderId (FK)               │
                            │ productId (FK)             │
                            │ quantity (Int)             │
                            │ unitPrice (Float)          │
                            └───────────────────────────┘
```

---

## 11. Contratos de API

### 11.1 GET /api/v1/clientOrder — Listar órdenes

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
| --------- | ------ | --------- | -------------------------------- |
| `page` | integer | No | Número de página (default 1) |
| `limit` | integer | No | Items por página (default 20) |
| `clientId` | integer | No | Filtrar por ID de cliente |
| `status` | string | No | Filtrar por estado (ILIKE) |
| `startDate` | date | No | (Documentado en controller, NO implementado en DAO) |
| `endDate` | date | No | (Documentado en controller, NO implementado en DAO) |

**Response 200:**

```json
{
  "dataList": [
    {
      "id": 1,
      "clientId": 5,
      "status": "PENDING",
      "notes": "Urgente",
      "createdOn": "2026-06-10T10:00:00.000Z",
      "updatedOn": null,
      "saleId": null,
      "clientName": "Cliente XYZ",
      "userClientOrderCreatedName": "Admin",
      "userClientOrderUpdatedName": null
    }
  ],
  "total": 1
}
```

### 11.2 POST /api/v1/clientOrder — Crear orden

**Request Body:**

```json
{
  "clientId": 5,
  "status": "PENDING",
  "notes": "Orden urgente",
  "saleId": null
}
```

**Response 201:** Objeto `clientOrder` creado.

### 11.3 PATCH /api/v1/clientOrder/:id — Actualizar orden

**Request Body:** (campos parciales)

```json
{
  "status": "PROCESSING",
  "notes": "En proceso de envío"
}
```

**Response 200:** Objeto `clientOrder` actualizado.

### 11.4 DELETE /api/v1/clientOrder/:id — Eliminar orden

**Response 200:**

```json
{
  "message": "ClientOrder deleted successfully"
}
```

### 11.5 OpenAPI (swagger)

Las definiciones OpenAPI están en `apps/server/src/docs/schemas.js`:

- `clientOrderFiltersSchema` — schema de filtros (clientId, status).
- `clientOrderCreateUpdateSchema` — schema de creación/actualización (clientId, status, notes, saleId).
- `ResponseGetClientOrder` — schema de respuesta (id, clientId, status, notes, createdOn, updatedOn, saleId).

**No hay paths OpenAPI documentados** para los endpoints de clientOrder (solo schemas).

---

## 12. Reglas de Validación y Esquemas

### 12.1 Joi (Server) — `utils/joiSchemas/joi.js`

```js
export const clientOrderFiltersSchema = Joi.object({
  clientId: Joi.number().integer().allow(''),
  status: Joi.string().allow(''),
});

export const clientOrderCreateUpdateSchema = Joi.object({
  clientId: Joi.number().integer().required(),
  status: Joi.string().required(),
  notes: Joi.string().allow(''),
  saleId: Joi.number().integer().allow(null),
});
```

### 12.2 Zod (Client) — `utils/schema.js`

```js
export const ClientOrderSchema = z.object({
  clientId: z.string().min(1, { message: getZodMessage('zod.clientOrder.clientId.empty') }),
  status: z.string().optional(),
  notes: z.string().optional(),
  saleId: z.string().optional(),
}).passthrough();

export const ClientOrderFiltersSchema = z.object({
  clientId: z.string().optional(),
  status: z.string().optional(),
});
```

### 12.3 Discrepancias entre Joi y Zod

| Campo | Joi (server) | Zod (client) |
| --------- | ---------------------------- | --------------------------- |
| `clientId` | `number().integer().required()` | `string().min(1)` — string, no number |
| `status` | `string().required()` | `string().optional()` |
| `saleId` | `number().integer().allow(null)` | `string().optional()` — string, no number/null |

---

## 13. Seguridad y Autorización

### 13.1 Autenticación

- Todas las rutas protegidas por middleware `verifyToken`.
- `req.userId` inyectado por middleware de autenticación JWT.

### 13.2 Autorización

- **No implementado**: No se aplican middlewares `checkRoleAuthOrPermission` en el controller ni en routes.js (vacío).
- Roles esperados: ADMIN, MANAGER con permisos CRUD sobre órdenes de cliente.

### 13.3 Validación de Entrada

- Server: Joi schemas via middleware `safeQuery` (GET) y `validateData` (POST/PATCH).
- Client: Zod esquemas definidos pero **no conectados** (`zodResolver()` sin argumento).

### 13.4 Auditoría

- `createdBy`: Set desde `req.userId` en creación.
- `updatedBy`: Set desde `req.userId` en actualización.
- `createdOn`/`updatedOn`: Set desde service (server timestamp).
- El GET incluye nombres de usuario (`userClientOrderCreatedName`, `userClientOrderUpdatedName`) via JOIN.

---

## 14. Manejo de Errores

### 14.1 Errores Conocidos (Sin Manejo)

| Error | Causa | Impacto |
| --------- | ------------------------------------------------------------- | ---------------------------------------- |
| P2025 | DELETE de orden inexistente | Prisma lanza excepción no capturada → 500 |
| P2003 | DELETE de orden con detalles hijos | Violación FK → Prisma lanza excepción |
| Validación | `clientId` no existe en tabla `clients` | Violación FK → Prisma lanza excepción |

### 14.2 Errores del Servicio

| Condición | Error | Código |
| ------------------------------------- | ------------------------------------ | ------ |
| Paginación sin `take` | `'Pagination is required'` | 500 |

### 14.3 Errores del Cliente

- Errores de API capturados en `handleSubmit` catch → `console.error`.
- Sin UI de error específica para el módulo (usa AlertDialog genérico).

---

## 15. Conceptos Transversales (Cross-Cutting)

### 15.1 Auditoría y Trazabilidad

- `createdBy` / `updatedBy` se conectan vía Prisma relations a `users`.
- `createdOn` / `updatedOn` timestamps locales del servidor.

### 15.2 Paginación

- Server: `getSafePagination` desde `utils/pagination/pagination.js`.
- Client: `pagination` estado con `pageIndex` + `pageSize`, reset a 0 al cambiar filtros.

### 15.3 Internacionalización (i18n)

- Cliente usa `react-i18next` con claves como `clientOrder`, `clientOrder_clientId_placeholder`, etc.

### 15.4 Cache de API

- RTK Query con tag `'ClientOrder'` e invalidación automática en mutations.

### 15.5 Manejo de Errores Global

- Server: `handleCatchErrorAsync` wrapper async.
- `globalResponse` utility para respuestas estandarizadas.

---

## 16. Requisitos de Calidad

### 16.1 Rendimiento

| Escenario | Objetivo | Métrica |
| --------------- | ----------- | ----------------- |
| Listar 10K órdenes con filtros | < 500ms | Tiempo de respuesta |
| Crear orden con 1 detalle | < 200ms | Tiempo de respuesta |

### 16.2 Mantenibilidad

- Código server modular (Controller → Service → DAO).
- Componentes client separados por responsabilidad.
- **Cobertura de tests**: 0% — no existen tests unitarios ni de integración.

### 16.3 Seguridad

- CSRF aplicado condicionalmente (`csrfConditional` middleware global).
- Rate limiting (`limiter`) aplicado a rutas no auth.

---

## 17. Decisiones de Diseño (ADRs)

### ADR-001: Inconsistencia raw SQL + Prisma en GET vs CREATE/UPDATE

- **Contexto**: GET usa `prisma.$queryRaw` para JOINs con nombres; CREATE/UPDATE usan Prisma ORM.
- **Decisión**: Mantener ambos enfoques. Raw SQL permite SELECT con JOINs de tablas relacionadas (`clients`, `users`). Prisma ORM para CUD.
- **Consecuencia**: La respuesta GET tiene campos virtuales (`clientName`, `userClientOrderCreatedName`) que no existen en el modelo. El COUNT usa `prisma.clientOrder.count` (Prisma) en lugar de raw SQL.

### ADR-002: Estado del campo `status` en UI (comentado)

- **Contexto**: El campo `status` en ClientOrderDialog está comentado con un `<Select>` de `orderStatus`.
- **Decisión**: Temporalmente deshabilitado. El estado se asigna por defecto (`PENDING`) en el modelo Prisma.
- **Consecuencia**: Los usuarios no pueden cambiar el estado desde la UI.

### ADR-003: `saleId` no implementado en DAO

- **Contexto**: El modelo Prisma tiene `saleId` y el Joi schema lo incluye, pero DAO create/update no lo mapea.
- **Decisión**: No implementado aún (funcionalidad de conversión a venta pendiente).
- **Consecuencia**: `saleId` se envía desde el cliente pero se ignora en persistencia.

---

## 18. Riesgos y Deuda Técnica

### 18.1 Bugs

| ID | Descripción | Severidad | Archivo |
| -- | ------------------------------------------------------------ | --------- | ------------------------------------------ |
| R-001 | **routes.js vacío** — El módulo no está conectado a Express. Las rutas no existen. | CRITICAL | `apps/server/src/modules/clientOrder/routes.js` |
| R-002 | **DAO no filtra por fechas** — `startDate`/`endDate` documentados en controller JSDoc pero no implementados en DAO. | HIGH | `apps/server/src/modules/clientOrder/dao.js` |
| R-003 | **saleId ignorado en persistencia** — Campo existe en modelo y Joi schema pero no en DAO create/update. | MEDIUM | `apps/server/src/modules/clientOrder/dao.js` |
| R-004 | **zodResolver sin esquema** — `ClientOrderDialog` y `ClientOrderFiltersForm` llaman `zodResolver()` sin argumento. Sin validación client-side. | HIGH | `apps/client/src/modules/clientOrder/components/ClientOrderDialog.jsx`, `ClientOrderFiltersForm.jsx` |
| R-005 | **Status field comentado** — Select de orderStatus no se renderiza. Usuario no puede cambiar estado desde UI. | MEDIUM | `apps/client/src/modules/clientOrder/components/ClientOrderDialog.jsx` |
| R-006 | **Zod clientId como string** — `ClientOrderSchema.clientId` es `z.string()` mientras Joi espera `number().integer()`. Desajuste de tipos. | HIGH | `apps/client/src/modules/clientOrder/utils/schema.js` |
| R-007 | **DELETE sin verificar integridad referencial** — Elimina orden sin validar si tiene detalles hijos o venta asociada. | HIGH | `apps/server/src/modules/clientOrder/dao.js` |
| R-008 | **Sin manejo de errores Prisma (P2025/P2003/P2002)** — Ninguna operación captura errores de Prisma. | HIGH | `apps/server/src/modules/clientOrder/dao.js`, `controller.js` |
| R-009 | **console.log(req.body) en producción** — Línea de debug en createClientOrder. | LOW | `apps/server/src/modules/clientOrder/controller.js` (línea 43) |
| R-010 | **Sin tests** — No hay cobertura de tests unitarios ni de integración. | HIGH | `apps/server/src/modules/clientOrder/`, `apps/client/src/modules/clientOrder/` |

### 18.2 Deuda Técnica

| ID | Descripción | Impacto | Archivos |
| -- | ------------------------------------------------------------ | --------- | ----------------------------------------- |
| T-001 | Módulo sin registrar en `routes/v1/index.js` | No accesible | `apps/server/src/routes/v1/index.js` |
| T-002 | Sin middlawares de role/permission check | Sin control de acceso | `apps/server/src/modules/clientOrder/controller.js` |
| T-003 | Estados de orden hardcodeados en enum Prisma pero no expuestos en UI | UX incompleta | `apps/client/src/modules/clientOrder/components/ClientOrderDialog.jsx` |
| T-004 | Esquemas Zod definidos pero sin conectar al resolver | Validación client-side ausente | `apps/client/src/modules/clientOrder/utils/schema.js` |

---

## 19. Glosario

| Término | Definición |
| --------- | --------------------------------------------------------------------------- |
| **ClientOrder** | Orden de compra realizada por un cliente. Precursor de una venta (`sale`). |
| **clientOrderDetail** | Detalle de línea de productos dentro de una orden de cliente. |
| **orderStatus** | Enumeración de posibles estados de una orden (PENDING, PROCESSING, SHIPPED, RECEIVED, COMPLETED, CANCELLED). |
| **saleId** | Referencia opcional a la venta generada cuando la orden es confirmada. |
| **Auditoría** | Trazabilidad de quién creó/modificó cada registro (createdBy/updatedBy) y cuándo (createdOn/updatedOn). |

---

## 20. Apéndices

### 20.1 Archivos del Módulo

```
SERVER (5 archivos):
- routes.js              — Router vacío (0 líneas)
- controller.js           — 4 handlers HTTP (84 líneas)
- service.js              — 4 métodos de negocio (79 líneas)
- dao.js                  — 4 métodos de acceso a datos (128 líneas)

CLIENT (7 archivos):
- api/clientOrderApi.js           — RTK Query (67 líneas)
- pages/ClientOrder.jsx           — Página principal (216 líneas)
- components/ClientOrderDatatable.jsx  — Tabla (71 líneas)
- components/ClientOrderDialog.jsx     — Diálogo (266 líneas)
- components/ClientOrderFiltersForm.jsx — Filtros (131 líneas)
- components/index.js                 — Barrel (3 líneas)
- utils/schema.js                     — Zod schemas (18 líneas)
- utils/index.js                      — Barrel (0 líneas — vacío)
```

### 20.2 Estados de ordenStatus (Prisma enum)

| Estado | Descripción |
| ----------- | --------------------------------------------------- |
| `PENDING` | Orden creada, pendiente de procesamiento |
| `PROCESSING` | Orden en proceso de preparación |
| `SHIPPED` | Orden enviada al cliente |
| `RECEIVED` | Cliente ha recibido la orden |
| `COMPLETED` | Orden completada exitosamente |
| `CANCELLED` | Orden cancelada |

### 20.3 Stack de Middlewares (esperado)

```
Request
  → rateLimiter (limit)
  → csrfConditional
  → verifyToken (JWT)
  → safeQuery / validateData (Joi)
  → handler (Controller)
  → Service
  → DAO
  → globalResponse
```
