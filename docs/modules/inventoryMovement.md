# Módulo: InventoryMovement (Server + Client)

> Documentación técnica integral del módulo **InventoryMovement** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre tanto el backend (`apps/server/src/modules/inventoryMovement/`) como el frontend (`apps/client/src/modules/inventoryMovement/`).
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
| **Módulo** | `inventoryMovement` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/inventoryMovement/` |
| **Path Client** | `apps/client/src/modules/inventoryMovement/` |
| **Base URL API** | `/api/v1/inventory-movements` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial del documento integral (server + client) siguiendo arc42/C4/IEEE 1016. Se documentan 4 endpoints server, 4 hooks RTK Query client, 3 componentes client, esquemas Joi/Zod, 1 modelo Prisma. |

---

## 2. Introducción y Objetivos

### 2.1 Propósito

El módulo **InventoryMovement** registra todos los movimientos de inventario del sistema: entradas, salidas, transferencias y ajustes. Cada movimiento está vinculado a un producto y almacén, con cantidad, tipo y razón opcional. Los movimientos pueden asociarse opcionalmente a compras (`purchaseId`) o ventas (`saleId`) para trazabilidad transaccional.

Funcionalidades principales:

- **Registro de Movimientos**: CRUD completo de movimientos de inventario con tipo (ENTRY/EXIT/TRANSFERENCE/ADJUSTMENT).
- **Trazabilidad por Producto/Almacén**: Cada movimiento vinculado a un producto y almacén específico.
- **Vinculación Transaccional**: Asociación opcional con compras (`purchaseId`) y ventas (`saleId`).
- **Filtros y Paginación**: Búsqueda por producto, almacén, tipo y rango de fechas.
- **Auditoría**: Trazabilidad de creador y última modificación con timestamps.

### 2.2 Alcance Funcional

| ID | Función | Actor | Cubre |
| ------ | ---------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| F-001 | Listar movimientos con filtros y paginación | Autenticado | GET `/api/v1/inventory-movements` con `checkRoleAuthOrPermisssion(canViewInventory)` |
| F-002 | Crear movimiento de inventario | ADMIN/MANAGER | POST `/api/v1/inventory-movements` con `checkRoleAuthOrPermisssion(canCreateInventory)` |
| F-003 | Actualizar movimiento de inventario | ADMIN/MANAGER | PATCH `/api/v1/inventory-movements/:id` con `checkRoleAuthOrPermisssion(canEditInventory)` |
| F-004 | Eliminar movimiento de inventario | ADMIN/MANAGER | DELETE `/api/v1/inventory-movements/:id` con `checkRoleAuthOrPermisssion(canDeleteInventory)` |

### 2.3 Dependencias

| Módulo | Relación | Detalle |
| --------- | ----------- | ------------------------------------------------------------------- |
| **Products** | FK `productId` | Cada movimiento pertenece a un producto (relación `inventoryMovementProduct`) |
| **Warehouse** | FK `warehouseId` | Cada movimiento pertenece a un almacén (relación `inventoryMovementWarehouse`) |
| **Users** | FK `createdBy` / `updatedBy` | Auditoría de creación y modificación |
| **Purchase** | FK `purchaseId` (opcional) | Vinculación con compras (relación `inventoryMovementPurchase`) |
| **Sale** | FK `saleId` (opcional) | Vinculación con ventas (relación `inventoryMovementSale`) |

---

## 3. Contexto y Alcance

### 3.1 Contexto de Negocio

El módulo InventoryMovement es el registro de auditoría de todos los cambios en el inventario. A diferencia del módulo Stock (que refleja el estado actual), InventoryMovement captura eventos: cuando entra stock, cuando sale, cuando se transfiere entre almacenes o cuando se realiza un ajuste manual. Está diseñado para ser el "libro mayor" del inventario.

### 3.2 Límites del Módulo

**Incluye:**
- CRUD completo de movimientos de inventario
- Filtros por producto, almacén, tipo y rango de fechas
- Paginación con COUNT separado (metadatos correctos)
- Segregación por permisos CRUD (canViewInventory, canCreateInventory, canEditInventory, canDeleteInventory)

**No incluye:**
- Actualización automática de stock al crear movimiento (no hay trigger que sincronice stock con movimientos)
- Notificaciones de movimientos
- Reportes agregados de movimientos (solo listado plano)
- Historial de cambios por movimiento (solo timestamps de última modificación)

---

## 4. Restricciones

| ID | Restricción | Tipo |
| --- | -------------------------------------------------------------------------------- | --------- |
| R-01 | PostgreSQL como única base de datos soportada (Prisma ORM) | Técnica |
| R-02 | Paginación obligatoria en GET `/` — `getSafePagination` requiere `limit` y `page` | Técnica |
| R-03 | `type` restringido a enum `movementType` (ENTRY, EXIT, TRANSFERENCE, ADJUSTMENT) | Dominio |
| R-04 | `reason` limitado a 200 caracteres (`VarChar(200)` en BD) | Datos |
| R-05 | `quantity` debe ser positivo (>0 en server Joi, >0 en client Zod) | Dominio |
| R-06 | Autenticación JWT obligatoria en todos los endpoints (middleware global `verifyToken`) | Seguridad |
| R-07 | POST/PATCH/DELETE restringidos a roles ADMIN y MANAGER (USER no puede mutar) | Autorización |

---

## 5. Stack Tecnológico

| Capa | Tecnología | Versión | Uso |
| -------- | ------------ | ------- | ------------------------------------------------------ |
| Server Runtime | Node.js | — | Entorno de ejecución del backend |
| Server Framework | Express.js | — | Router HTTP y middleware pipeline |
| ORM | Prisma | — | `prisma.inventoryMovement.*` para todas las operaciones |
| DB | PostgreSQL | — | Persistencia de datos |
| Validation | Joi | — | Esquemas de validación en server (`inventoryMovement.joi.js`) |
| Auth | JWT + custom middleware | — | `verifyToken`, `checkRoleAuthOrPermisssion` |
| Client Runtime | React 18 | — | UI del módulo |
| Client State | Redux Toolkit (RTK Query) | — | API calls y caching (`inventoryMovementAPI.js`) |
| Client Forms | react-hook-form + Zod | — | Validación de formularios client-side |
| Client UI | shadcn/ui + Tailwind | — | Componentes de UI |
| Client Dates | date-fns | — | Formateo de fechas |
| Client i18n | react-i18next | — | Traducciones |

---

## 6. Arquitectura del Módulo (Overview)

### 6.1 C4 Nivel 1 (Contexto)

```
[Usuario Autenticado] --> [InventoryMovement API /api/v1/inventory-movements]
    |
    |--> [GET /] con filtros → PostgreSQL (Prisma findMany + count)
    |--> [POST /] Crear → PostgreSQL (Prisma create)
    |--> [PATCH /:id] Actualizar → PostgreSQL (Prisma update)
    |--> [DELETE /:id] Eliminar → PostgreSQL (Prisma delete)
```

### 6.2 C4 Nivel 2 (Contenedores — Server)

```
[Routes] --> [Controller] --> [Service] --> [DAO]
                                              |
                                              v
                                        [Prisma ORM]
                                              |
                                              v
                                        [PostgreSQL]
```

### 6.3 C4 Nivel 2 (Contenedores — Client)

```
[InventoryMovement.jsx (Page)]
    |
    |--> [InventoryMovementFiltersForm] → react-hook-form → dispatches filters
    |--> [InventoryMovementDatatable] → DataTable → 7 columnas
    |--> [InventoryMovementDialog] → react-hook-form + Zod → CRUD mutations
    |
    v
[inventoryMovementAPI.js (RTK Query)]
    |
    v
[InventoryMovement API /api/v1/inventory-movements]
```

---

## 7. Vista de Building Blocks — Server

### 7.1 Estructura de Archivos

```
apps/server/src/modules/inventoryMovement/
├── routes.js              # Definición de rutas + middleware + OpenAPI docs
├── controller.js          # Handlers HTTP (4 funciones exportadas)
├── service.js             # Lógica de negocio (4 funciones exportadas)
├── dao.js                 # Acceso a datos (Prisma ORM)
└── schemas/
    └── inventoryMovement.joi.js  # Esquemas de validación Joi (3 schemas)
```

### 7.2 Capa de Rutas (`routes.js`)

**Middleware global:** `router.use(verifyToken)` — todas las rutas requieren JWT.

| Método | Ruta | Middleware Adicional | Handler | Permiso |
| ------ | ------- | ------------------------------- | --------------- | --------------- |
| GET | `/` | `checkRoleAuthOrPermisssion(canViewInventory)`, `validateQueryParams(inventoryMovementFiltersSchema)` | `getAllInventoryMovements` | canViewInventory |
| POST | `/` | `checkRoleAuthOrPermisssion(canCreateInventory)`, `validateSchema(inventoryMovementCreateSchema)` | `createInventoryMovement` | canCreateInventory |
| PATCH | `/:id` | `checkRoleAuthOrPermisssion(canEditInventory)`, `validatePathParam`, `validateSchema(inventoryMovementUpdateSchema)` | `updateInventoryMovementById` | canEditInventory |
| DELETE | `/:id` | `checkRoleAuthOrPermisssion(canDeleteInventory)`, `validatePathParam` | `deleteInventoryMovementById` | canDeleteInventory |

**Roles permitidos:**
- GET: ADMIN, MANAGER, USER
- POST/PATCH/DELETE: ADMIN, MANAGER (USER no tiene permisos de mutación)

**OpenAPI docs:** Decoradores `@openapi` incluidos en GET, POST y DELETE (PATCH no tiene decorador).

### 7.3 Capa de Controlador (`controller.js`)

4 funciones exportadas, todas envueltas en `handleCatchErrorAsync`:

| Función | Parámetros | Respuesta |
| ----------- | ---------- | --------- |
| `getAllInventoryMovements` | `req.safeQuery` (productId, warehouseId, type, limit, page) — **no propaga startDate/endDate** | `globalResponse(res, 200, movements)` |
| `createInventoryMovement` | `req.body` | `globalResponse(res, 201, ...)` |
| `updateInventoryMovementById` | `req.params.id`, `req.body` | `globalResponse(res, 200, ...)` |
| `deleteInventoryMovementById` | `req.params.id` | `globalResponse(res, 200, ...)` |

**⚠️ Bug R-001:** `startDate` y `endDate` están definidos en el Joi filters schema pero el controlador no los lee ni propaga al service/DAO.

**⚠️ Bug R-002:** `createInventoryMovement` no recibe `req.userId` — no se setea `createdBy` en el service. El campo `createdBy` es NOT NULL en Prisma, por lo que la creación fallaría o usaría un valor por defecto inexistente.

### 7.4 Capa de Servicio (`service.js`)

Delegación directa a DAO:

- **`getAllInventoryMovements`**: Extrae `getSafePagination({ page, limit })`, valida `take > 0`, delega a DAO
- **`createInventoryMovement`**: Delegación directa a DAO (sin agregar createdBy/createdOn)
- **`updateInventoryMovementById`**: Delegación directa a DAO (sin agregar updatedBy/updatedOn)
- **`deleteInventoryMovementById`**: Conversión de id a Number, delega a DAO

### 7.5 Capa de Acceso a Datos (`dao.js`)

**Prisma ORM** exclusivamente (sin raw SQL).

#### `getAllInventoryMovements` — Prisma findMany

```js
prisma.inventoryMovement.findMany({
  where: {
    ...(productId ? { productId: { equals: productId } } : {}),
    ...(warehouseId ? { warehouseId: { equals: warehouseId } } : {}),
    ...(type ? { type: { equals: type } } : {}),
  },
  include: { product: true, warehouse: true },
  orderBy: { createdAt: 'desc' },
  take,
  skip,
});
```

**⚠️ Bug R-003:** `orderBy` usa `createdAt` pero el campo real en Prisma es `createdOn`. Esto causaría error de columna inexistente (Prisma lanza error si el campo no existe en el modelo).

**COUNT separado** — Query independiente para `total` con los mismos filtros:

```js
const total = await prisma.inventoryMovement.count({ where: { ... } });
```

Retorna `{ dataList: inventoryMovements, total }`.

#### `createInventoryMovement` — Prisma create

```js
prisma.inventoryMovement.create({ data, include: { product, warehouse } })
```

#### `updateInventoryMovementById` — Prisma update

```js
prisma.inventoryMovement.update({ where: { id }, data, include: { product, warehouse } })
```

#### `deleteInventoryMovementById` — Prisma delete

```js
prisma.inventoryMovement.delete({ where: { id } })
```

---

## 8. Vista de Building Blocks — Client

### 8.1 Estructura de Archivos

```
apps/client/src/modules/inventoryMovement/
├── api/
│   └── inventoryMovementAPI.js         # RTK Query (4 endpoints)
├── pages/
│   └── InventoryMovement.jsx           # Página principal
├── components/
│   ├── InventoryMovementFiltersForm.jsx # Formulario de filtros (5 campos)
│   ├── InventoryMovementDatatable.jsx   # Tabla de datos (7 columnas)
│   └── InventoryMovementDialog.jsx      # Dialog de creación/edición
└── utils/
    ├── schema.js                        # Zod schema (InventoryMovementSchema)
    └── enums.js                         # movementTypes + MOVEMENT_TYPES
```

### 8.2 RTK Query API (`inventoryMovementAPI.js`)

```js
const inventoryMovementAPI = createApi({
  reducerPath: 'inventoryMovementAPI',
  baseQuery: axiosPrivateBaseQuery({ baseUrl: '...' }),
  tagTypes: ['InventoryMovement'],
  endpoints: (builder) => ({ ... })
})
```

**Endpoints mapeados:**

| Hook | Método | Ruta | Query/Body | Tags |
| ----- | ------ | ------- | ----------- | ---- |
| `useLazyGetAllInventoryMovementsQuery` | GET | `/inventory-movements` | Sin parámetros (⚠️) | `providesTags: ['InventoryMovement']` |
| `useCreateInventoryMovementMutation` | POST | `/inventory-movements` | `body: data` | `invalidatesTags: ['InventoryMovement']` |
| `useUpdateInventoryMovementByIdMutation` | PATCH | `/inventory-movements/:id` | `{ id, data }` | `invalidatesTags: ['InventoryMovement']` |
| `useDeleteInventoryMovementByIdMutation` | DELETE | `/inventory-movements/:id` | `id` en path | `invalidatesTags: ['InventoryMovement']` |

**⚠️ Bug R-004:** `getAllInventoryMovements` query no acepta parámetros (`query: () => ...`). La página llama `getAllInventoryMovements({ page, limit, ...filters })` pero los argumentos son ignorados — el backend siempre recibe GET sin query params.

### 8.3 Página Principal (`InventoryMovement.jsx`)

Mismo patrón que Stock.jsx con ciclo de vida reactivo:

- **Hooks RTK Query**: `useLazyGetAllInventoryMovementsQuery`, `useUpdateInventoryMovementByIdMutation`, `useCreateInventoryMovementMutation`, `useDeleteInventoryMovementByIdMutation`
- **Hooks de datos auxiliares**: `useGetAllProductsFiltersQuery`, `useGetAllWarehousesFiltersQuery`
- **useEffect 2**: Dispara `getAllInventoryMovements` con `{ page, limit, ...filters }` (aunque RTK Query ignora los params)
- **handleSubmitFilters**: Resetea pageIndex a 0 y actualiza filters
- **handleSubmit/Delete**: Mismo patrón de AlertDialog en dos pasos

### 8.4 Componentes

#### InventoryMovementFiltersForm

Formulario con `react-hook-form`, 5 campos:

| Campo | Tipo | Placeholder | Source |
| ----- | ---- | ----------- | ------ |
| `productId` | Select | `select_product` | `products` prop |
| `warehouseId` | Select | `select_warehouse` | `warehouses` prop |
| `type` | Select | `select_type` | `movementTypes` (ENTRY/EXIT/TRANSFERENCE/ADJUSTMENT) |
| `fdate` | DatePicker | `from_date` | Calendar (sin restricción de fecha futura/pasada) |
| `tdate` | DatePicker | `to_date` | Calendar |

**⚠️ Bug R-005:** Filtro envía `fdate` y `tdate` como nombres de campo pero el backend espera `startDate` y `endDate`. Además, los valores son objetos Date mientras que Joi espera strings ISO.

Botones: Search (submit), Add (abre dialog), Clear (resetea form y envía `{}`).

#### InventoryMovementDatatable

Tabla con `DataTable` genérico, 7 columnas:

| Columna | Accessor | Formato |
| --------- | ------------ | --------- |
| product | `product.name` | raw (acceso a nested object via dot notation) |
| warehouse | `warehouse.name` | raw |
| quantity | `quantity` | raw number |
| type | `type` | raw enum value |
| reason | `reason` | raw string |
| createdOn | `createdOn` | `format(new Date(), 'PPP')` |
| updatedOn | `updatedOn` | `format(new Date(), 'PPP')` o '' |

Row click → `onEditDialog(row.original)`.

Paginación correcta con `totalRows={total}` (el backend devuelve `{ dataList, total }`).

#### InventoryMovementDialog

Dialog de creación/actualización con `react-hook-form` + `zodResolver(InventoryMovementSchema)`.

**Campos:**
- `productId`: Select (usa native `<select>` con `<option>`, no shadcn Select)
- `warehouseId`: Select (native)
- `quantity`: Input type="number"
- `type`: Select (native) con `Object.values(MOVEMENT_TYPES)`
- `reason`: Textarea con `maxLength={FIELD_LIMITS.inventoryMovement.reason}` (200)

**Modo edición:**
- Usa `pickDirty` para enviar solo campos modificados
- Botón Delete visible solo si `selectedRow?.id`

**⚠️ Bug R-006:** El dialog usa native `<select>`/`<option>` en lugar de shadcn `<SelectTrigger>`/`<SelectItem>` — inconsistente con otros módulos (Stock, Products).

**⚠️ Bug R-007:** `handleCloseDialog` se llama dentro de `handleSubmit` ANTES de que `await onSubmit(...)` resuelva, causando cierre del dialog antes de la confirmación del backend.

---

## 9. Vista de Runtime y Flujo de Datos

### 9.1 Flujo: Listar Movimientos

```
[Usuario] → [InventoryMovement.jsx useEffect]
  → useLazyGetAllInventoryMovementsQuery({ page, limit, productId, ... })
  → (RTK Query ignora params — Bug R-004)
  → GET /api/v1/inventory-movements
  → [verifyToken] → [checkRoleAuthOrPermisssion(canViewInventory)]
  → [validateQueryParams(filtersSchema)] (startDate/endDate no propagados — Bug R-001)
  → [getAllInventoryMovements controller → service → DAO]
  → [prisma.inventoryMovement.findMany + count] (orderBy createdAt — Bug R-003)
  → PostgreSQL
  → Response: { dataList: [...], total: N } → [InventoryMovementDatatable]
```

### 9.2 Flujo: Crear Movimiento

```
[Usuario] → [InventoryMovementDialog] → react-hook-form → Zod validation
  → handleSubmit(data) → createInventoryMovement(data).unwrap()
  → POST /api/v1/inventory-movements
  → [verifyToken] → [checkRoleAuthOrPermisssion(canCreateInventory)]
  → [validateSchema(createSchema)] Joi
  → [createInventoryMovement controller → service → DAO]
  → [prisma.inventoryMovement.create(data)] (sin createdBy — Bug R-002)
  → Response 201 → AlertDialog éxito → refetch
```

### 9.3 Mapa de Estados (State Machine)

| Estado | Trigger | Siguiente Estado |
| --------- | --------- | ----------------- |
| Idle (carga inicial) | `useEffect` dispara `getAllInventoryMovements` | Loading |
| Loading | Respuesta OK | Data (tabla renderizada) |
| Data | Usuario cambia filtros | Loading (resetea pageIndex a 0) |
| Data | Usuario cambia página | Loading (nueva pageIndex) |
| Data | Usuario abre dialog | Dialog (create o edit) |
| Dialog visible | Submit exitoso | Data (refetch automático) |
| Dialog visible | Delete exitoso | Data (refetch automático) |
| Cualquiera | Error | Console.error (sin manejo visual) |

---

## 10. Modelo de Datos

### 10.1 Modelo Prisma

```prisma
model inventoryMovement {
  id                  Int          @id @default(autoincrement())
  productId           Int          @db.Integer
  warehouseId         Int          @db.Integer
  quantity            Int          @db.Integer
  type                movementType
  reason              String?      @db.VarChar(200)
  product             products     @relation("inventoryMovementProduct", fields: [productId], references: [id])
  warehouse           warehouse    @relation("inventoryMovementWarehouse", fields: [warehouseId], references: [id])
  createdOn           DateTime     @db.Timestamp(3)
  createdBy           Int          @db.Integer
  userMovementCreated users        @relation("inventoryMovementUserCreated", fields: [createdBy], references: [id])
  updatedOn           DateTime?    @db.Timestamp(3)
  updatedBy           Int?         @db.Integer
  userMovementUpdated users?       @relation("inventoryMovementUserUpdated", fields: [updatedBy], references: [id])
  purchase            purchase?    @relation("inventoryMovementPurchase", fields: [purchaseId], references: [id])
  purchaseId          Int?         @db.Integer
  sale                sale?        @relation("inventoryMovementSale", fields: [saleId], references: [id])
  saleId              Int?         @db.Integer
}

enum movementType {
  ENTRY
  EXIT
  TRANSFERENCE
  ADJUSTMENT
}
```

### 10.2 Diagrama ER

```
┌─────────────────────────────┐
│      inventoryMovement      │
├─────────────────────────────┤
│ id (PK)                     │
│ productId (FK) ─────────────┼───→ products (id)
│ warehouseId (FK) ───────────┼───→ warehouse (id)
│ quantity (Int, > 0)         │
│ type (movementType enum)    │
│ reason (VarChar(200)?)      │
│ createdOn (TS)              │
│ createdBy (FK) ─────────────┼───→ users (id) "userMovementCreated"
│ updatedOn (TS?)             │
│ updatedBy (FK?) ────────────┼───→ users (id) "userMovementUpdated"
│ purchaseId (FK?) ───────────┼───→ purchase (id)
│ saleId (FK?) ───────────────┼───→ sale (id)
└─────────────────────────────┘
```

### 10.3 Mapeo de Tipos

| Campo | Prisma | PostgreSQL | Joi | Zod Client |
| --------- | --------- | ------------ | ----- | ----------- |
| id | Int | INTEGER | — | — |
| productId | Int | INTEGER | number().integer().positive() | string().min(1) |
| warehouseId | Int | INTEGER | number().integer().positive() | string().min(1) |
| quantity | Int | INTEGER | number().integer().positive() | string → int, > 0 |
| type | movementType | "movementType" | valid('ENTRY','EXIT','TRANSFERENCE','ADJUSTMENT') | z.enum([...]) |
| reason | String?(200) | VARCHAR(200) | string().max(200).optional() | string().optional() |
| purchaseId | Int? | INTEGER | number().integer().positive().optional() | string().optional() |
| saleId | Int? | INTEGER | number().integer().positive().optional() | string().optional() |
| createdOn | DateTime | TIMESTAMP(3) | — | — |
| updatedOn | DateTime? | TIMESTAMP(3) | — | — |
| createdBy | Int | INTEGER | — | — |
| updatedBy | Int? | INTEGER | — | — |

### 10.4 Índices y Constraints

| Nombre | Tipo | Columnas |
| --------- | ---- | ----------- |
| PK | PRIMARY KEY | `(id)` |
| FK | FOREIGN KEY | `productId` → `products(id)` |
| FK | FOREIGN KEY | `warehouseId` → `warehouse(id)` |
| FK | FOREIGN KEY | `createdBy` → `users(id)` |
| FK | FOREIGN KEY | `updatedBy` → `users(id)` |
| FK | FOREIGN KEY | `purchaseId` → `purchase(id)` |
| FK | FOREIGN KEY | `saleId` → `sale(id)` |

---

## 11. Contratos de API

### 11.1 GET /api/v1/inventory-movements — Listar

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
| ----------- | ------ | --------- | --------------- |
| page | number | Sí | Número de página |
| limit | number | Sí | Items por página |
| productId | number | No | Filtrar por producto |
| warehouseId | number | No | Filtrar por almacén |
| type | enum | No | Filtrar por tipo (ENTRY/EXIT/TRANSFERENCE/ADJUSTMENT) |
| startDate | ISO date | No | Fecha inicio (en schema Joi pero no implementado) |
| endDate | ISO date | No | Fecha fin (en schema Joi pero no implementado) |

**Response 200:**

```json
{
  "error": false,
  "statusCode": 200,
  "data": {
    "dataList": [
      {
        "id": 1,
        "productId": 5,
        "warehouseId": 2,
        "quantity": 50,
        "type": "ENTRY",
        "reason": "Initial stock",
        "createdOn": "2026-01-15T10:00:00.000Z",
        "updatedOn": null,
        "product": { "id": 5, "name": "Widget A" },
        "warehouse": { "id": 2, "name": "Main Warehouse" }
      }
    ],
    "total": 1
  }
}
```

### 11.2 POST /api/v1/inventory-movements — Crear

**Request Body:**

```json
{
  "productId": 5,
  "warehouseId": 2,
  "quantity": 50,
  "type": "ENTRY",
  "reason": "Initial stock"
}
```

**Response 201:**

```json
{
  "error": false,
  "statusCode": 201,
  "message": "Inventory movement created successfully",
  "data": { "id": 1, "productId": 5, ... }
}
```

### 11.3 PATCH /api/v1/inventory-movements/:id — Actualizar

**Request Body:** (campos parciales)

```json
{
  "quantity": 60,
  "reason": "Corrected count"
}
```

**Response 200:**

```json
{
  "error": false,
  "statusCode": 200,
  "message": "Inventory movement updated successfully"
}
```

### 11.4 DELETE /api/v1/inventory-movements/:id — Eliminar

**Response 200:**

```json
{
  "error": false,
  "statusCode": 200,
  "data": {
    "message": "Inventory movement deleted successfully"
  }
}
```

---

## 12. Reglas de Validación y Esquemas

### 12.1 Server — Joi (`inventoryMovement.joi.js`)

#### `inventoryMovementFiltersSchema`

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| productId | number | `.integer().positive().optional()` |
| warehouseId | number | `.integer().positive().optional()` |
| type | string | `.valid('ENTRY', 'EXIT', 'TRANSFERENCE', 'ADJUSTMENT').optional()` |
| startDate | date | `.iso().optional()` |
| endDate | date | `.iso().min(Joi.ref('startDate')).optional()` |
| limit | number | `.integer()` |
| page | number | `.integer()` |

#### `inventoryMovementCreateSchema`

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| productId | number | `.integer().positive().required()` |
| warehouseId | number | `.integer().positive().required()` |
| quantity | number | `.integer().positive().required()` |
| type | string | `.valid('ENTRY', 'EXIT', 'TRANSFERENCE', 'ADJUSTMENT').required()` |
| reason | string | `.max(200).optional()` |
| purchaseId | number | `.integer().positive().optional()` |
| saleId | number | `.integer().positive().optional()` |

#### `inventoryMovementUpdateSchema`

Mismos campos que create, todos `.optional()`.

### 12.2 Client — Zod (`schema.js`)

**`InventoryMovementSchema`:**

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| productId | string | `.min(1)` |
| warehouseId | string | `.min(1)` |
| quantity | string → int | `transform(parseInt)`, `refine(val > 0)` |
| type | enum | `z.enum([ENTRY, EXIT, TRANSFERENCE, ADJUSTMENT])` |
| reason | string | `.optional()` |
| purchaseId | string | `.optional()` |
| saleId | string | `.optional()` |

**`passthrough()`:** Permite campos adicionales.

### 12.3 Field Limits

| Ubicación | Campo | Límite |
| ----------- | --------- | ----- |
| `FIELD_LIMITS.inventoryMovement.reason` | reason (client Textarea) | 200 caracteres |
| Joi schema | reason (server) | `max(200)` |
| Prisma schema | reason | `VarChar(200)` |

**Consistente:** Límite 200 en las 3 capas.

---

## 13. Seguridad y Autorización

### 13.1 Autenticación

- Middleware `verifyToken` aplicado globalmente via `router.use(verifyToken)`
- JWT requerido en header `Authorization: Bearer <token>`

### 13.2 Permisos CRUD

| Acción | Permiso | Roles |
| --------- | ----------- | ----- |
| Ver movimientos | `canViewInventory` | ADMIN, MANAGER, **USER** |
| Crear movimiento | `canCreateInventory` | ADMIN, MANAGER |
| Editar movimiento | `canEditInventory` | ADMIN, MANAGER |
| Eliminar movimiento | `canDeleteInventory` | ADMIN, MANAGER |

**Diferencia clave con Stock:** USER solo puede **ver** movimientos, no puede crearlos/editarlos/eliminarlos.

### 13.3 Validación de Parámetros

- `validateQueryParams(filtersSchema)` en GET — sanitiza query params
- `validatePathParam` en PATCH/DELETE — valida que `id` sea número
- `validateSchema(createSchema/updateSchema)` — valida body

### 13.4 OWASP Consideraciones

| Riesgo | Mitigación |
| --------- | -------------- |
| SQL Injection | Prisma ORM parametriza automáticamente — sin raw SQL |
| IDOR | No hay verificación de propiedad — cualquier ADMIN/MANAGER puede modificar/eliminar cualquier movimiento |
| Mass Assignment | `validateSchema` con Joi evita campos extra. Zod usa `.passthrough()` pero no afecta al backend |

---

## 14. Manejo de Errores

### 14.1 Patrón General

- Controller: `handleCatchErrorAsync` async wrapper
- Errores de validación Joi: manejados por middleware `validateSchema` / `validateQueryParams` / `validatePathParam`
- Errores de Prisma: **sin manejo específico** — errores `P2025` (not found) y `P2002` (unique) se propagan como 500

### 14.2 Formatos de Error

Mismo formato estándar que otros módulos:

```json
{
  "error": true,
  "statusCode": 400,
  "message": "\"quantity\" must be a positive number"
}
```

**⚠️ Bug R-008:** Sin manejo de Prisma `P2025` (record not found) en update/delete — devuelve 500 en lugar de 404.

---

## 15. Conceptos Transversales (Cross-Cutting)

### 15.1 Paginación

- Server: `getSafePagination({ page, limit })` → `{ take, skip }`
- DAO: `findMany` con `take`/`skip` + `count` separado con mismos filtros
- Client: Estado `pagination` con `pageIndex` (0-based) y `pageSize` (default 20)
- **Metadatos correctos:** `{ dataList, total }` — a diferencia de Stock

### 15.2 i18n

Todas las etiquetas UI usan `useTranslation()` con claves como:
- `inventory_movements`, `add_inventory_movement`, `edit_inventory_movement`
- `from_date`, `to_date`, `select_type`, `reason`
- `zod.inventoryMovement.*` — mensajes de error Zod internacionalizados

### 15.3 Auditoría

- `createdOn` / `createdBy`: Existen en el modelo Prisma pero **no se setean** en service.createInventoryMovement (⚠️ Bug R-002)
- `updatedOn` / `updatedBy`: Existen en el modelo pero **no se setean** en service.updateInventoryMovementById
- Prisma no usa `@default(now())` para `createdOn` — el campo debe ser provisto explícitamente

### 15.4 Vinculación Transaccional

- `purchaseId` opcional: vincula movimiento a una compra
- `saleId` opcional: vincula movimiento a una venta
- Estas relaciones solo se usan para trazabilidad, no para lógica automática

---

## 16. Requisitos de Calidad

| ID | Atributo | Escenario | Métrica |
| --- | ----------- | ------------ | --------- |
| Q-01 | Rendimiento | GET con `findMany` + `count` con includes | < 200ms para 10K registros |
| Q-02 | Consistencia | Datos referencialmente íntegros (FKs) | Zero huérfanos |
| Q-03 | Seguridad | Endpoints de mutación restringidos a ADMIN/MANAGER | Sin accesos no autorizados |
| Q-04 | Mantenibilidad | Arquitectura 4-capas (routes→controller→service→dao) | Bajo acoplamiento |
| Q-05 | Cobertura | Sin tests unitarios ni de integración | ❌ 0% cobertura |

---

## 17. Decisiones de Diseño (ADRs)

### ADR-001: Prisma ORM Exclusivo vs Raw SQL

| Contexto | El módulo InventoryMovement no requiere consultas complejas con JOINs ni campos computados |
| ----------- | -------------------------------------------------------------------------------------------- |
| Decisión | Usar `prisma.inventoryMovement.*` con `include` para todas las operaciones |
| Consecuencia | + Type-safety de Prisma. + Código más legible. - Dependencia de Prisma para queries complejas futuras |

### ADR-002: COUNT Separado vs SQL_CALC_FOUND_ROWS

| Contexto | Se requiere paginación con metadatos de total |
| ----------- | ----------------------------------------------- |
| Decisión | Usar `prisma.inventoryMovement.count()` con los mismos filtros que `findMany` |
| Consecuencia | + Dos queries separadas (una para datos, otra para count). - Consistencia garantizada al duplicar lógica de filtros |

### ADR-003: Servicio Sin Lógica de Auditoría

| Contexto | El service.createInventoryMovement no agrega `createdBy`/`createdOn` |
| ----------- | -------------------------------------------------------------------- |
| Decisión | No implementar auditoría en service (actual) |
| Consecuencia | - `createdBy` no se setea → error en BD (NOT NULL). - `updatedBy` no se setea en updates. - Inconsistencia con módulo Stock que sí lo hace |

---

## 18. Riesgos y Deuda Técnica

### 18.1 Bugs Conocidos

| ID | Severidad | Descripción | Archivo | Línea |
| --- | --------- | ----------- | --------- | ----- |
| **R-001** | 🟠 **Medium** | `startDate`/`endDate` en Joi filters schema pero controlador no los propaga al service/DAO. Filtros de fecha inoperantes. | `controller.js` | L25 |
| **R-002** | 🔴 **High** | `createInventoryMovement` no recibe `req.userId` — no setea `createdBy`. Campo NOT NULL en Prisma → error 500. | `service.js` | L53-55 |
| **R-003** | 🔴 **High** | DAO usa `orderBy: { createdAt: 'desc' }` pero el campo Prisma es `createdOn`. Columna inexistente → error. | `dao.js` | L49-51 |
| **R-004** | 🟠 **Medium** | RTK Query `getAllInventoryMovements` no acepta params. Filtros/paginación del cliente nunca llegan al backend. | `inventoryMovementAPI.js` | L12-17 |
| **R-005** | 🟡 **Low** | Filtros `fdate`/`tdate` enviados desde el cliente pero backend espera `startDate`/`endDate`. Además, Date objects vs ISO strings. | `InventoryMovementFiltersForm.jsx` | L163-243 |
| **R-006** | 🟢 **Info** | Dialog usa native `<select>`/`<option>` en vez de shadcn `<SelectTrigger>`/`<SelectItem>` — inconsistencia UI | `InventoryMovementDialog.jsx` | L104-134, L156-164 |
| **R-007** | 🟡 **Low** | `handleCloseDialog()` llamado antes de que `await onSubmit()` resuelva en `handleSubmit` → dialog se cierra antes de confirmación | `InventoryMovementDialog.jsx` | L67-74 |
| **R-008** | 🟠 **Medium** | Sin manejo de Prisma `P2025` (not found) en update/delete — devuelve 500 en lugar de 404 | `dao.js` | — |
| **R-009** | 🟢 **Info** | Sin OpenAPI decorator para PATCH `/:id` (GET, POST, DELETE tienen, PATCH no) | `routes.js` | L143 |
| **R-010** | 🟢 **Info** | Sin unit tests ni integration tests | — | — |

### 18.2 Deuda Técnica

| ID | Deuda | Impacto | Esfuerzo estimado |
| --- | ----- | --------- | ----------------- |
| D-01 | Auditoría no implementada (R-002) | Funcional — creación falla por NOT NULL | Bajo (agregar userId al service) |
| D-02 | `createdAt` vs `createdOn` (R-003) | Funcional — query falla con error de BD | Bajo (corregir a `createdOn`) |
| D-03 | RTK Query sin params (R-004) | Funcional — filtros/paginación no funcionan | Medio (agregar `params` a la query) |
| D-04 | Filtros de fecha rotos (R-001 + R-005) | Funcional — filtros de fecha inoperantes | Medio (propagar en controller y alinear nombres) |
| D-05 | Sin tests | QA — riesgo de regresiones | Alto |

---

## 19. Glosario

| Término | Definición |
| --------- | ------------ |
| **Movimiento de Inventario** | Registro de entrada, salida, transferencia o ajuste de stock |
| **ENTRY** | Movimiento que incrementa el stock (compra, devolución, ajuste positivo) |
| **EXIT** | Movimiento que decrementa el stock (venta, consumo, pérdida) |
| **TRANSFERENCE** | Movimiento entre almacenes (cambia ubicación, no cantidad total) |
| **ADJUSTMENT** | Corrección manual de inventario (sobrante/faltante) |
| **Razón (Reason)** | Descripción textual opcional del motivo del movimiento (max 200 chars) |

---

## 20. Apéndices

### 20.1 Referencias

| Recurso | Ubicación |
| --------- | ----------- |
| Prisma Model | `apps/server/prisma/schema.prisma` (línea 397, model `inventoryMovement`) |
| Server Routes | `apps/server/src/modules/inventoryMovement/routes.js` |
| Server Controller | `apps/server/src/modules/inventoryMovement/controller.js` |
| Server Service | `apps/server/src/modules/inventoryMovement/service.js` |
| Server DAO | `apps/server/src/modules/inventoryMovement/dao.js` |
| Server Joi Schemas | `apps/server/src/modules/inventoryMovement/schemas/inventoryMovement.joi.js` |
| Client API | `apps/client/src/modules/inventoryMovement/api/inventoryMovementAPI.js` |
| Client Page | `apps/client/src/modules/inventoryMovement/pages/InventoryMovement.jsx` |
| Client Filters | `apps/client/src/modules/inventoryMovement/components/InventoryMovementFiltersForm.jsx` |
| Client Datatable | `apps/client/src/modules/inventoryMovement/components/InventoryMovementDatatable.jsx` |
| Client Dialog | `apps/client/src/modules/inventoryMovement/components/InventoryMovementDialog.jsx` |
| Client Zod Schema | `apps/client/src/modules/inventoryMovement/utils/schema.js` |
| Client Enums | `apps/client/src/modules/inventoryMovement/utils/enums.js` |
| Field Limits Config | `apps/client/src/config/fieldLimits.js` (línea 70: `inventoryMovement: { reason: 200 }`) |
| Permissions Constants | `apps/server/src/utils/constants/enums.js` (PERMISSIONCODES.canViewInventory, etc.) |

### 20.2 Endpoints Resumidos

| Método | Ruta | Permiso | Roles | Uso |
| ------ | ------- | --------- | ----- | ---- |
| GET | `/api/v1/inventory-movements` | canViewInventory | ADMIN, MANAGER, USER | Listar movimientos |
| POST | `/api/v1/inventory-movements` | canCreateInventory | ADMIN, MANAGER | Crear movimiento |
| PATCH | `/api/v1/inventory-movements/:id` | canEditInventory | ADMIN, MANAGER | Actualizar movimiento |
| DELETE | `/api/v1/inventory-movements/:id` | canDeleteInventory | ADMIN, MANAGER | Eliminar movimiento |

### 20.3 Hooks RTK Exportados

```js
useLazyGetAllInventoryMovementsQuery   // GET /inventory-movements (lazy, sin params — Bug R-004)
useCreateInventoryMovementMutation     // POST /inventory-movements
useUpdateInventoryMovementByIdMutation // PATCH /inventory-movements/:id
useDeleteInventoryMovementByIdMutation // DELETE /inventory-movements/:id
```

### 20.4 Diferencias con Stock Module

| Aspecto | Stock | InventoryMovement |
| --------- | ----- | ------------------- |
| Endpoints | 6 (incluye GET /:id y GET /alerts) | 4 (solo CRUD básico) |
| DAO | Raw SQL con JOINs | Prisma ORM con `include` |
| Paginación | Sin COUNT (bug) | Con COUNT correcto |
| Auditoría | `createdBy`/`updatedBy` seteados en service | No seteados (bug) |
| Roles USER | CRUD completo | Solo lectura (canView) |
| Filtros | 6 filtros implementados en SQL | 3 filtros implementados + 2 sin conexión |
| Type enum | unitMeasureStock (PIECES/KG/L/M) | movementType (ENTRY/EXIT/TRANSFERENCE/ADJUSTMENT) |

### 20.5 Checklist de Verificación

| Aspecto | Estado | Notas |
| --------- | ------ | ----- |
| Server endpoints documentados | ✅ | 4 endpoints |
| Client hooks documentados | ✅ | 4 hooks RTK Query |
| Componentes documentados | ✅ | 3 componentes |
| Validación server (Joi) | ✅ | 3 schemas |
| Validación client (Zod) | ✅ | 1 schema |
| Modelo de datos (Prisma) | ✅ | Modelo inventoryMovement + enum movementType |
| Seguridad/Auth | ✅ | verifyToken + 4 permisos CRUD |
| Filtros documentados | ✅ | 5 filtros (3 implementados, 2 no) |
| Bugs documentados | ✅ | 10 bugs (R-001 a R-010) |
| Tests | ❌ | Sin tests |
