# Módulo: Stock (Server + Client)

> Documentación técnica integral del módulo **Stock** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre tanto el backend (`apps/server/src/modules/stock/`) como el frontend (`apps/client/src/modules/stock/`).
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
| **Módulo** | `stock` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/stock/` |
| **Path Client** | `apps/client/src/modules/stock/` |
| **Base URL API** | `/api/v1/stock` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial del documento integral (server + client) siguiendo arc42/C4/IEEE 1016. Se documentan 6 endpoints server, 6 hooks RTK Query client, 3 componentes client, esquemas Joi/Zod, 1 modelo Prisma. |

---

## 2. Introducción y Objetivos

### 2.1 Propósito

El módulo **Stock** gestiona el inventario de productos en almacenes. Proporciona control de existencias por producto/almacén/lote, alertas de stock bajo y vencido, y seguimiento de auditoría (createdBy/updatedBy). Cada registro de stock representa una combinación única de producto, almacén, lote y fecha de vencimiento.

Funcionalidades principales:

- **Control de Existencias**: Registro de cantidad en stock por producto y almacén con unidad de medida configurable.
- **Lotes y Vencimientos**: Seguimiento por lote con fecha de vencimiento y estado de caducidad (EXPIRED/NOT EXPIRED).
- **Alertas de Stock**: Conteo de productos vencidos y con stock por debajo del mínimo.
- **Umbrales de Inventario**: Configuración de mínimos y máximos por registro para control de niveles.
- **Auditoría**: Trazabilidad de creador y última modificación con timestamps.

### 2.2 Alcance Funcional

| ID | Función | Actor | Cubre |
| ------ | ---------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| F-001 | Listar stock con filtros y paginación | Autenticado | GET `/api/v1/stock` con `checkRoleAuthOrPermisssion(canViewStock)` |
| F-002 | Obtener stock por ID de producto | Autenticado | GET `/api/v1/stock/:id` con `checkRoleAuthOrPermisssion(canViewStock)` |
| F-003 | Obtener alertas de stock (vencidos + bajo mínimo) | Autenticado | GET `/api/v1/stock/alerts` con `checkRoleAuthOrPermisssion(canViewStock)` |
| F-004 | Crear registro de stock | ADMIN/MANAGER/USER | POST `/api/v1/stock` con `checkRoleAuthOrPermisssion(canCreateStock)` |
| F-005 | Actualizar registro de stock (parcial) | ADMIN/MANAGER/USER | PATCH `/api/v1/stock/:id` con `checkRoleAuthOrPermisssion(canEditStock)` |
| F-006 | Eliminar registro de stock | ADMIN/MANAGER/USER | DELETE `/api/v1/stock/:id` con `checkRoleAuthOrPermisssion(canDeleteStock)` |
| F-007 | Filtrar stock por producto (UI) | Autenticado | Filtro en `StockFiltersForm` con `productId` |
| F-008 | Filtrar stock por almacén (UI) | Autenticado | Filtro en `StockFiltersForm` con `warehouseId` |
| F-009 | Filtrar stock por lote (UI) | Autenticado | Filtro en `StockFiltersForm` con `lot` |
| F-010 | Filtrar stock por unidad de medida (UI) | Autenticado | Filtro en `StockFiltersForm` con `unitMeasure` |
| F-011 | Alertas de stock vencido | Autenticado | Cálculo automático `expirationStatus` (EXPIRED/NOT EXPIRED) vía raw SQL |

### 2.3 Dependencias

| Módulo | Relación | Detalle |
| --------- | ----------- | ------------------------------------------------------------------- |
| **Products** | FK `productId` | Cada registro de stock pertenece a un producto (relación `stockProduct`) |
| **Warehouse** | FK `warehouseId` | Cada registro de stock está en un almacén (relación `stockWarehouse`) |
| **Users** | FK `createdBy` / `updatedBy` | Auditoría de creación y modificación |
| **InventoryMovement** | Lógica de negocio | Movimientos de inventario modifican cantidades en stock (no implementado directamente — es manual vía creación/edición de stock) |

---

## 3. Contexto y Alcance

### 3.3 Contexto de Negocio

El módulo Stock es el núcleo del sistema de inventario. Cada producto puede tener múltiples registros de stock en diferentes almacenes, con diferentes lotes y fechas de vencimiento. La constraint única `@@unique([productId, warehouseId, lot, expirationDate])` garantiza que no haya duplicados exactos.

### 3.4 Límites del Módulo

**Incluye:**
- CRUD completo de registros de stock
- Filtros por producto, almacén, lote, unidad de medida, stock vencido, stock bajo
- Cómputo de campos derivados: `expirationStatus` y `totalCost`
- Alertas de stock (vencidos + bajo mínimo)
- Segregación por permisos CRUD (canViewStock, canCreateStock, canEditStock, canDeleteStock)

**No incluye:**
- Movimientos de inventario automáticos (el módulo `inventoryMovement` es independiente)
- Notificaciones push para alertas de stock (solo cómputo consultable)
- Integración con órdenes de compra/venta para actualización automática de stock
- Historial de cambios por registro (solo timestamps de última modificación)

---

## 4. Restricciones

| ID | Restricción | Tipo |
| --- | -------------------------------------------------------------------------------- | --------- |
| R-01 | PostgreSQL como única base de datos soportada (raw SQL + Prisma ORM) | Técnica |
| R-02 | Paginación obligatoria en GET `/` — `getSafePagination` requiere `limit` y `page` | Técnica |
| R-03 | Los campos `expirationStatus` y `totalCost` son computados en SQL (no persistidos) | Diseño |
| R-04 | `unitMeasure` restringido a enum `unitMeasureStock` (PIECES, KILOGRAMS, LITERS, METERS) | Dominio |
| R-05 | Unique constraint compuesta: `[productId, warehouseId, lot, expirationDate]` | Datos |
| R-06 | Autenticación JWT obligatoria en todos los endpoints (middleware global `verifyToken`) | Seguridad |

---

## 5. Stack Tecnológico

| Capa | Tecnología | Versión | Uso |
| -------- | ------------ | ------- | ------------------------------------------------------ |
| Server Runtime | Node.js | — | Entorno de ejecución del backend |
| Server Framework | Express.js | — | Router HTTP y middleware pipeline |
| ORM | Prisma | — | `prisma.stock.*` para CRUD, `$queryRaw` para consultas complejas |
| DB | PostgreSQL | — | Persistencia de datos |
| Validation | Joi | — | Esquemas de validación en server (`stock.joi.js`) |
| Auth | JWT + custom middleware | — | `verifyToken`, `checkRoleAuthOrPermisssion` |
| Client Runtime | React 18 | — | UI del módulo |
| Client State | Redux Toolkit (RTK Query) | — | API calls y caching (`stockApi.js`) |
| Client Forms | react-hook-form + Zod | — | Validación de formularios client-side |
| Client UI | shadcn/ui + Tailwind | — | Componentes de UI (DataTable, Dialog, Calendar, Select) |
| Client Dates | date-fns | — | Formateo de fechas en tabla |
| Client i18n | react-i18next | — | Traducciones |

---

## 6. Arquitectura del Módulo (Overview)

### 6.1 C4 Nivel 1 (Contexto)

```
[Usuario Autenticado] --> [Stock Module API /api/v1/stock]
    |
    |--> [GET /] con filtros → PostgreSQL (raw SQL con JOINs)
    |--> [GET /:id] por productId → PostgreSQL (Prisma findUnique)
    |--> [GET /alerts] → PostgreSQL (raw SQL con COUNT)
    |--> [POST /] Crear → PostgreSQL (Prisma create)
    |--> [PATCH /:id] Actualizar → PostgreSQL (Prisma update)
    |--> [DELETE /:id] Eliminar → PostgreSQL (Prisma delete)
```

### 6.2 C4 Nivel 2 (Contenedores — Server)

```
[Routes] --> [Controller] --> [Service] --> [DAO]
                                              |
                                              v
                                        [Prisma ORM / raw SQL]
                                              |
                                              v
                                        [PostgreSQL]
```

### 6.3 C4 Nivel 2 (Contenedores — Client)

```
[Stock.jsx (Page)]
    |
    |--> [StockFiltersForm] → react-hook-form → dispatches filters
    |--> [StockDatatable] → DataTable → columnDefStock (13 columns)
    |--> [StockDialog] → react-hook-form + Zod → CRUD mutations
    |
    v
[stockApi.js (RTK Query)]
    |
    v
[Stock Module API /api/v1/stock]
```

---

## 7. Vista de Building Blocks — Server

### 7.1 Estructura de Archivos

```
apps/server/src/modules/stock/
├── routes.js              # Definición de rutas + middleware + OpenAPI docs
├── controller.js          # Handlers HTTP (6 funciones exportadas)
├── service.js             # Lógica de negocio (6 funciones exportadas)
├── dao.js                 # Acceso a datos (Prisma + raw SQL)
└── schemas/
    └── stock.joi.js       # Esquemas de validación Joi (3 schemas)
```

### 7.2 Capa de Rutas (`routes.js`)

**Middleware global:** `router.use(verifyToken)` — todas las rutas requieren JWT.

| Método | Ruta | Middleware Adicional | Handler | Permiso |
| ------ | ------- | ------------------------------- | --------------- | --------------- |
| GET | `/` | `checkRoleAuthOrPermisssion(canViewStock)`, `validateQueryParams(stockFiltersSchema)` | `getAllStock` | canViewStock |
| GET | `/` | `checkRoleAuthOrPermisssion(canViewStock)` | `getStockByProductId` | canViewStock |
| GET | `/alerts` | `checkRoleAuthOrPermisssion(canViewStock)` | `getStockAlerts` | canViewStock |
| POST | `/` | `checkRoleAuthOrPermisssion(canCreateStock)`, `validateSchema(stockCreateSchema)` | `createStock` | canCreateStock |
| PATCH | `/:id` | `checkRoleAuthOrPermisssion(canEditStock)`, `validatePathParam`, `validateSchema(stockUpdateSchema)` | `patchStockById` | canEditStock |
| DELETE | `/:id` | `checkRoleAuthOrPermisssion(canDeleteStock)`, `validatePathParam` | `deleteStockById` | canDeleteStock |

**⚠️ Bug R-001:** Dos handlers GET en la misma ruta `/` — Express solo ejecuta el primero registrado (`getAllStock`). El segundo (`getStockByProductId`) es inalcanzable. Ver §18.

**Roles permitidos** para todos los endpoints: ADMIN, MANAGER, USER.

**OpenAPI docs:** Incluye decoradores `@openapi` para Swagger en todas las rutas.

### 7.3 Capa de Controlador (`controller.js`)

6 funciones exportadas, todas envueltas en `handleCatchErrorAsync`:

| Función | Parámetros | Respuesta |
| ----------- | ---------- | --------- |
| `getAllStock` | `req.safeQuery` (productId, warehouseId, lot, unitMeasure, stocksExpirated, stocksLow) | `globalResponse(res, 200, stock)` |
| `getStockByProductId` | `req.params.id` (productId) | `globalResponse(res, 200, stock)` |
| `getStockAlerts` | — | `globalResponse(res, 200, stockAlerts)` |
| `createStock` | `req.body`, `req.userId` | `globalResponse(res, 201, ...)` |
| `patchStockById` | `req.params.id`, `req.body`, `req.userId` | `globalResponse(res, 200, ...)` |
| `deleteStockById` | `req.params.id` | `globalResponse(res, 200, ...)` |

### 7.4 Capa de Servicio (`service.js`)

Delegación directa a DAO con transformación mínima:

- **`getAllStock`**: Extrae `getSafePagination({ page, limit }`), valida `take > 0`, delega a DAO
- **`getStockByProductId`**: Convierte `id` a Number, delega a DAO
- **`getStockAlerts`**: Delegación directa a DAO
- **`createStock`**: Agrega `createdBy` (de `userId`) y `createdOn` (new Date()), delega a DAO
- **`updateStockById`**: Agrega `updatedBy` y `updatedOn`, delega a DAO con `where: { id }`
- **`deleteStockById`**: Convierte `stockId` a Number, delega a DAO con `where: { id }`

### 7.5 Capa de Acceso a Datos (`dao.js`)

**Dos modalidades:**
- **Raw SQL** (`prisma.$queryRaw`) para `getAllStock` y `getStockAlerts` (requieren JOINs y funciones agregadas)
- **Prisma ORM** para CRUD directo (`prisma.stock.create/update/delete/findUnique`)

#### `getAllStock` — Raw SQL con JOINs

```sql
SELECT s.*,
  u.name AS "userStockCreatedName",
  uu.name AS "userStockUpdatedName",
  p.name AS "productName",
  p.price AS "productPrice",
  p.cost AS "productCost",
  w.name AS "warehouseName",
  CASE
    WHEN s."expirationDate" IS NULL THEN NULL
    WHEN s."expirationDate" < CURRENT_DATE THEN 'EXPIRED'
    ELSE 'NOT EXPIRED'
  END AS "expirationStatus",
  (s."quantity" * p."price") AS "totalCost"
FROM "stock" s
LEFT JOIN "users" u ON s."createdBy" = u.id
LEFT JOIN "users" uu ON s."updatedBy" = uu.id
LEFT JOIN "products" p ON s."productId" = p.id
LEFT JOIN "warehouse" w ON s."warehouseId" = w.id
WHERE ...
ORDER BY s."createdOn" DESC
LIMIT ${take} OFFSET ${skip}
```

**JOINs:** 4 LEFT JOINs (users x2 para creador/actualizador, products, warehouse)

**Campos computados:**
- `expirationStatus`: `NULL` si `expirationDate` es null, `'EXPIRED'` si es pasado, `'NOT EXPIRED'` si es futuro
- `totalCost`: `quantity * price` (precio del producto)

**Filtros condicionales:**
- `productId`: igualdad exacta si presente
- `warehouseId`: igualdad exacta si presente
- `lot`: ILIKE `%{valor}%` si presente
- `unitMeasure`: casteo a `unitMeasureStock` enum si presente
- `stocksExpirated`: filtra `expirationDate < CURRENT_DATE` si true (incluye NULLs — ⚠️ ver bug R-003)
- `stocksLow`: filtra `quantity < minimum` si true

**⚠️ Bug R-002:** Sin paginación — `getAllStock` no tiene query COUNT separado para `total`, por lo que la respuesta no incluye metadatos de paginación. Ver §18.

**⚠️ Bug R-003:** Filtro `stocksExpirated` incluye registros con `expirationDate IS NULL` cuando es TRUE. Ver §18.

#### `getStockByProductId` — Prisma findUnique

```js
prisma.stock.findUnique({ where: { productId: id } })
```

Nota: `productId` no es unique en el modelo stock (solo en la constraint compuesta). `findUnique` con un campo no-único lanza error Prisma si hay múltiples registros para el mismo producto. **⚠️ Bug R-004.**

#### `getStockAlerts` — Raw SQL con COUNT

```sql
SELECT
  COUNT(CASE WHEN s."expirationDate" < CURRENT_DATE THEN 1 END) AS "expired",
  COUNT(CASE WHEN s."quantity" < s."minimum" THEN 1 END) AS "lowStock"
FROM "stock" s
```

Retorna `{ expired: number, lowStock: number }`.

#### `createStock` — Prisma create

```js
prisma.stock.create({
  data: {
    quantity, minimum, maximum, lot, unitMeasure, expirationDate, createdOn,
    warehouse: { connect: { id } },
    product: { connect: { id } },
    userStockCreated: { connect: { id } },
  }
})
```

#### `updateStock` — Prisma update

Conecta `warehouse`, `product`, `userStockUpdated` mediante `connect`.

#### `deleteStock` — Prisma delete

Eliminación directa por `where` conditions.

---

## 8. Vista de Building Blocks — Client

### 8.1 Estructura de Archivos

```
apps/client/src/modules/stock/
├── api/
│   └── stockAPI.js                    # RTK Query (6 endpoints)
├── pages/
│   └── Stock.jsx                      # Página principal
├── components/
│   ├── StockFiltersForm.jsx           # Formulario de filtros
│   ├── StockDatatable.jsx             # Tabla de datos
│   └── StockDialog.jsx                # Dialog de creación/edición
└── utils/
    ├── schema.js                      # Zod schema (StockSchema)
    └── enums.js                       # unitMeasures array
```

### 8.2 RTK Query API (`stockAPI.js`)

```js
const stockApi = createApi({
  reducerPath: 'stockApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  }),
  tagTypes: ['Stock'],
  endpoints: (builder) => ({ ... })
})
```

**Endpoints mapeados:**

| Hook | Método | Ruta | Query/Body | Tags |
| ----- | ------ | ------- | ----------- | ---- |
| `useLazyGetAllStockQuery` | GET | `/stock` | `params` (filtros + paginación) | `providesTags: ['Stock']` |
| `useLazyGetStockByProductIdQuery` | GET | `/stock/:id` | `id` en path | `providesTags: ['Stock']` |
| `useGetStockAlertsQuery` | GET | `/stock/alerts` | — | `providesTags: ['Stock']` |
| `useCreateStockMutation` | POST | `/stock/` | `body: data` | `invalidatesTags: ['Stock']` |
| `useUpdateStockByIdMutation` | PATCH | `/stock/:id` | `{ id, data }` | `invalidatesTags: ['Stock']` |
| `useDeleteStockByIdMutation` | DELETE | `/stock/:id` | `id` en path | `invalidatesTags: ['Stock']` |

### 8.3 Página Principal (`Stock.jsx`)

Página funcional con ciclo de vida reactivo:

- **Hooks RTK Query**: `useLazyGetAllStockQuery`, `useUpdateStockByIdMutation`, `useCreateStockMutation`, `useDeleteStockByIdMutation`
- **Hooks de datos auxiliares**: `useGetAllProductsFiltersQuery` (products module), `useGetAllWarehousesFiltersQuery` (warehouse module)
- **Estados locales**: `selectedRow`, `openDialog`, `openAlertDialog`, `alertProps`, `actionDialog`, `pagination` (pageIndex/pageSize), `filters`
- **useEffect 1**: Carga inicial si `location.state?.filter` presente (navegación desde otro módulo)
- **useEffect 2**: Dispara `getAllStock` con paginación + filtros en cada cambio de `pagination` o `filters` (fuente única de verdad)
- **handleSubmitFilters**: Resetea pageIndex a 0 y actualiza filters
- **handleSubmit**: Decide entre create o update según presencia de `result.id`, muestra AlertDialog en éxito
- **handleDelete**: Confirmación en dos pasos (AlertDialog de confirmación → delete → AlertDialog de éxito)
- **Spinner**: Mientras isLoading/isFetching en cualquier operación

### 8.4 Componentes

#### StockFiltersForm

Formulario con `react-hook-form` con 4 campos:

| Campo | Tipo | Placeholder | Source |
| ----- | ---- | ----------- | ------ |
| `productId` | Select | `select_product` | `products` prop (data de `useGetAllProductsFiltersQuery`) |
| `warehouseId` | Select | `select_warehouse` | `warehouses` prop (data de `useGetAllWarehousesFiltersQuery`) |
| `lot` | Text input | `search_by_lot` | `maxLength={FIELD_LIMITS.stock.lot}` (50) |
| `unitMeasure` | Select | `select_unit_measure` | `unitMeasures` prop (PIECES, KILOGRAMS, LITERS, METERS) |

Botones: Search (submit), Add (abre dialog), Clear (resetea form).

#### StockDatatable

Tabla con `DataTable` componente genérico, 13 columnas:

| Columna | Accessor | Formato |
| --------- | ------------ | --------- |
| createdOn | `createdOn` | `format(new Date(), 'PPP')` |
| product | `productName` | `toUpperCase()` |
| price | `productPrice` | `toLocaleString('es-CO', { style: 'currency', currency: 'COP' })` |
| quantity | `quantity` | raw number |
| totalCost | `totalCost` | `toLocaleString('es-CO', { style: 'currency', currency: 'COP' })` |
| warehouse | `warehouseName` | `toUpperCase()` |
| unitMeasure | `unitMeasure` | `toUpperCase()` |
| lot | `lot` | `toUpperCase()` |
| expirationDate | `expirationDate` | `format(new Date(), 'PPP')` o null |
| expirationStatus | `expirationStatus` | `toUpperCase()` |
| createdBy | `userStockCreatedName` | `toUpperCase()` |
| updatedBy | `userStockUpdatedName` | `toUpperCase()` |
| updatedOn | `updatedOn` | `format(new Date(), 'PPP')` o null |

Row click → `handleEditDialog(row)`.

#### StockDialog

Dialog de creación/actualización con `react-hook-form` + `zodResolver(StockSchema)`.

**Modo creación:** Todos los campos editables.

**Modo edición:**
- Campos editables: productId, warehouseId, expirationDate, unitMeasure, quantity, minimum, maximum, lot
- Campos de solo lectura (condicionales con `selectedRow?.productId`): price, totalCost
- Campos de solo lectura (condicionales con `selectedRow?.createdOn`): userStockCreatedName, createdOn (calendar deshabilitado)
- Campos de solo lectura (condicionales con `selectedRow?.updatedOn`): userStockUpdatedName, updatedOn (calendar deshabilitado)
- Usa `pickDirty` para enviar solo campos modificados en PATCH
- Botón Delete visible solo en edición (`stockId` presente)

**Calendar:** DatePicker con `Popover` + `Calendar` — deshabilita fechas pasadas para `expirationDate`.

---

## 9. Vista de Runtime y Flujo de Datos

### 9.1 Flujo: Listar Stock con Filtros

```
[Usuario] → [Stock.jsx useEffect]
  → useLazyGetAllStockQuery({ page, limit, productId, warehouseId, lot, unitMeasure, ... })
  → GET /api/v1/stock?page=1&limit=20&productId=5&...
  → [verifyToken] check JWT
  → [checkRoleAuthOrPermisssion(canViewStock)] verifica rol+permiso
  → [validateQueryParams(stockFiltersSchema)] valida query params con Joi
  → [getAllStock controller]
  → [getAllStock service → getSafePagination → getAllStock DAO]
  → [raw SQL con JOINs + computed fields + filtros condicionales + paginación]
  → PostgreSQL
  → Response → [StockDatatable] renderiza 13 columnas
```

### 9.2 Flujo: Crear Stock

```
[Usuario] → [StockDialog] → react-hook-form → Zod validation
  → handleSubmit(data) → createStock(data).unwrap()
  → POST /api/v1/stock
  → [verifyToken] → [checkRoleAuthOrPermisssion(canCreateStock)]
  → [validateSchema(stockCreateSchema)] Joi
  → [createStock controller → service (adds createdBy/createdOn) → DAO]
  → [prisma.stock.create(connect product, warehouse, user)]
  → Response 201 → AlertDialog éxito → [invalidatesTags: 'Stock'] → refetch
```

### 9.3 Flujo: Alertas de Stock

```
[Stock.jsx] (no usa directamente getStockAlerts — hook exportado pero sin uso en página actual)
  → useGetStockAlertsQuery()
  → GET /api/v1/stock/alerts
  → [verifyToken] → [checkRoleAuthOrPermisssion(canViewStock)]
  → [getStockAlerts controller → service → DAO]
  → [raw SQL: COUNT(CASE WHEN expirationDate < CURRENT_DATE ...)]
  → Response: { expired: number, lowStock: number }
```

### 9.4 Mapa de Estados (State Machine)

| Estado | Trigger | Siguiente Estado |
| --------- | --------- | ----------------- |
| Idle (carga inicial) | `useEffect[2]` dispara `getAllStock` | Loading |
| Loading | Respuesta OK | Data (tabla renderizada) |
| Data | Usuario cambia filtros | Loading (resetea pageIndex a 0) |
| Data | Usuario cambia página | Loading (nueva pageIndex) |
| Data | Usuario abre dialog | Dialog (create o edit) |
| Dialog visible | Submit exitoso | Data (refetch automático vía invalidatesTags) |
| Dialog visible | Delete exitoso | Data (refetch automático) |
| Cualquiera | Error | Console.error (sin manejo visual de error) |

**⚠️ Bug R-005:** Sin manejo visual de errores en UI — errores solo se loguean a consola.

---

## 10. Modelo de Datos

### 10.1 Modelo Prisma

```prisma
model stock {
  id               Int              @id @default(autoincrement())
  quantity         Int              @default(0)
  minimum          Int              @default(0)
  maximum          Int?             @db.Integer
  lot              String?          @db.VarChar(50)
  unitMeasure      unitMeasureStock @default(PIECES)
  expirationDate   DateTime?        @db.Timestamp(3)
  product          products         @relation("stockProduct", fields: [productId], references: [id])
  productId        Int              @db.Integer
  warehouse        warehouse        @relation("stockWarehouse", fields: [warehouseId], references: [id])
  warehouseId      Int              @db.Integer
  createdOn        DateTime         @db.Timestamp(3)
  updatedOn        DateTime?        @db.Timestamp(3)
  userStockCreated users            @relation("userStockCreated", fields: [createdBy], references: [id])
  createdBy        Int              @db.Integer
  userStockUpdated users?           @relation("userStockUpdated", fields: [updatedBy], references: [id])
  updatedBy        Int?             @db.Integer

  @@unique([productId, warehouseId, lot, expirationDate], name: "unique_stock_entry")
}

enum unitMeasureStock {
  PIECES
  KILOGRAMS
  LITERS
  METERS
}
```

### 10.2 Diagrama ER

```
┌─────────────────────────┐
│         stock           │
├─────────────────────────┤
│ id (PK)                 │
│ quantity (Int, default 0)│
│ minimum (Int, default 0)│
│ maximum (Int?, nullable)│
│ lot (VarChar(50)?)      │
│ unitMeasure (enum)      │
│ expirationDate (TS?)    │
│ productId (FK) ─────────┼───→ products (id)
│ warehouseId (FK) ───────┼───→ warehouse (id)
│ createdOn (TS)          │
│ updatedOn (TS?)         │
│ createdBy (FK) ─────────┼───→ users (id)  "userStockCreated"
│ updatedBy (FK?) ────────┼───→ users (id)  "userStockUpdated"
│                         │
│ @@unique(productId,     │
│   warehouseId, lot,     │
│   expirationDate)       │
└─────────────────────────┘
```

### 10.3 Mapeo de Tipos

| Campo | Prisma | PostgreSQL | Joi | Zod Client |
| --------- | --------- | ------------ | ----- | ----------- |
| id | Int | INTEGER | — | — |
| quantity | Int | INTEGER | number().integer().min(0) | string → number().int().min(0) |
| minimum | Int | INTEGER | number().integer().min(0) | string → number().int().min(0) |
| maximum | Int? | INTEGER | number().integer().min(0).allow(null) | string → number().int().min(0) |
| lot | String?(50) | VARCHAR(50) | string().max(50).allow('') | string().max(50).optional().nullable() |
| unitMeasure | enum | "unitMeasureStock" | valid('PIECES','KILOGRAMS','LITERS','METERS') | refine(['PIECES','KILOGRAMS','LITERS','METERS']) |
| expirationDate | DateTime? | TIMESTAMP(3) | date().allow(null) | date().nullable().optional() |
| productId | Int | INTEGER | number().integer() | string → number() |
| warehouseId | Int | INTEGER | number().integer() | string → number() |
| createdOn | DateTime | TIMESTAMP(3) | — | — |
| updatedOn | DateTime? | TIMESTAMP(3) | — | — |
| createdBy | Int | INTEGER | — | — |
| updatedBy | Int? | INTEGER | — | — |

### 10.4 Índices y Constraints

| Nombre | Tipo | Columnas |
| --------- | ---- | ----------- |
| `unique_stock_entry` | UNIQUE | `(productId, warehouseId, lot, expirationDate)` |
| `stock_pkey` | PK | `(id)` |
| FK `stockProduct` | FOREIGN KEY | `productId` → `products(id)` |
| FK `stockWarehouse` | FOREIGN KEY | `warehouseId` → `warehouse(id)` |
| FK `userStockCreated` | FOREIGN KEY | `createdBy` → `users(id)` |
| FK `userStockUpdated` | FOREIGN KEY | `updatedBy` → `users(id)` |

---

## 11. Contratos de API

### 11.1 GET /api/v1/stock — Listar stock

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
| ----------- | ------ | --------- | --------------- |
| page | number | Sí | Número de página |
| limit | number | Sí | Items por página |
| productId | number | No | Filtrar por producto |
| warehouseId | number | No | Filtrar por almacén |
| lot | string | No | Búsqueda parcial por lote (ILIKE) |
| unitMeasure | enum | No | Filtrar por unidad de medida |
| stocksExpirated | boolean | No | Filtrar vencidos |
| stocksLow | boolean | No | Filtrar bajo mínimo |

**Response 200:**

```json
{
  "error": false,
  "statusCode": 200,
  "message": "Stock entries retrieved",
  "data": [
    {
      "id": 1,
      "quantity": 100,
      "minimum": 10,
      "maximum": 200,
      "lot": "LOTE-001",
      "unitMeasure": "PIECES",
      "expirationDate": "2026-12-31T00:00:00.000Z",
      "productId": 5,
      "warehouseId": 2,
      "createdOn": "2026-01-15T10:00:00.000Z",
      "updatedOn": null,
      "createdBy": 1,
      "updatedBy": null,
      "userStockCreatedName": "John Doe",
      "userStockUpdatedName": null,
      "productName": "Widget A",
      "productPrice": 25.50,
      "productCost": 15.00,
      "warehouseName": "Main Warehouse",
      "expirationStatus": "NOT EXPIRED",
      "totalCost": 2550.00
    }
  ]
}
```

### 11.2 GET /api/v1/stock/:id — Obtener por producto

**Path Parameter:** `id` (productId)

**Response 200:** Objeto único de stock para ese producto.

### 11.3 GET /api/v1/stock/alerts — Alertas

**Response 200:**

```json
{
  "error": false,
  "statusCode": 200,
  "data": {
    "expired": 5,
    "lowStock": 12
  }
}
```

### 11.4 POST /api/v1/stock — Crear

**Request Body:**

```json
{
  "productId": 5,
  "warehouseId": 2,
  "quantity": 100,
  "minimum": 10,
  "maximum": 200,
  "lot": "LOTE-001",
  "unitMeasure": "PIECES",
  "expirationDate": "2026-12-31T00:00:00.000Z"
}
```

**Response 201:**

```json
{
  "error": false,
  "statusCode": 201,
  "message": "Stock entry created successfully",
  "data": {
    "id": 1,
    "quantity": 100,
    ...
  }
}
```

### 11.5 PATCH /api/v1/stock/:id — Actualizar

**Path Parameter:** `id` (stock entry ID)

**Request Body:** (campos parciales)

```json
{
  "quantity": 150
}
```

**Response 200:**

```json
{
  "error": false,
  "statusCode": 200,
  "message": "Stock entry updated successfully",
  "data": { ... }
}
```

### 11.6 DELETE /api/v1/stock/:id — Eliminar

**Path Parameter:** `id` (stock entry ID)

**Response 200:**

```json
{
  "error": false,
  "statusCode": 200,
  "data": {
    "message": "Stock entry deleted successfully"
  }
}
```

---

## 12. Reglas de Validación y Esquemas

### 12.1 Server — Joi (`stock.joi.js`)

#### `stockFiltersSchema`

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| productId | string | `.allow('').optional()` |
| warehouseId | string | `.allow('').optional()` |
| lot | string | `.max(50).allow('').optional()` |
| unitMeasure | string | `.valid('PIECES','KILOGRAMS','LITERS','METERS').allow('').optional()` |
| stocksExpirated | boolean | `.allow('').optional()` |
| stocksLow | boolean | `.allow('').optional()` |

#### `stockCreateSchema`

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| quantity | number | `.integer().min(0).required()` |
| minimum | number | `.integer().min(0).required()` |
| maximum | number | `.integer().min(0).allow(null)` |
| lot | string | `.max(50).allow('')` |
| unitMeasure | string | `.valid('PIECES','KILOGRAMS','LITERS','METERS').required()` |
| expirationDate | date | `.allow(null)` |
| productId | number | `.integer().required()` |
| warehouseId | number | `.integer().required()` |

#### `stockUpdateSchema`

Mismos campos que create, todos `.optional()`, más `.min(1)` para evitar PATCH vacío.

### 12.2 Client — Zod (`schema.js`)

**`StockSchema`** — validación completa con transform string→number:

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| quantity | string → number | `min(1)`, transform a int, `int()`, `min(0)` |
| minimum | string → number | `min(1)`, transform a int, `int()`, `min(0)` |
| maximum | string → number | `min(1)`, transform a int, `int()`, `min(0)` |
| lot | string | `.max(50).optional().nullable()` |
| unitMeasure | string | `.min(1)`, `.refine(val => ['PIECES','KILOGRAMS','LITERS','METERS'].includes(val))` |
| expirationDate | date | `.date().nullable().optional().refine(date => !date || !isNaN(date.getTime()))` |
| productId | string → number | `.min(1)`, transform a Number |
| warehouseId | string → number | `.min(1)`, transform a Number |

**Refinements entre campos:**
- `minimum <= maximum` (error en campo `minimum`)
- `quantity <= maximum` (error en campo `quantity`)

**`passthrough()`:** Permite campos adicionales no definidos en el schema.

**⚠️ Bug R-006:** `maximum` es opcional en el schema y BD pero requerido en Zod con `min(1)`. Si maximum es null (permitido en BD), Zod falla.

### 12.3 Field Limits

| Ubicación | Campo | Límite |
| ----------- | --------- | ----- |
| `FIELD_LIMITS.stock.lot` | lot (client) | 50 caracteres |
| Joi schema | lot (server) | `max(50)` |
| Prisma schema | lot | `VarChar(50)` |

**Consistente:** Límite 50 en las 3 capas.

---

## 13. Seguridad y Autorización

### 13.1 Autenticación

- Middleware `verifyToken` aplicado globalmente en todas las rutas via `router.use(verifyToken)`
- JWT requerido en header `Authorization: Bearer <token>`

### 13.2 Permisos CRUD

| Acción | Permiso | Roles |
| --------- | ----------- | ----- |
| Ver stock | `canViewStock` | ADMIN, MANAGER, USER |
| Crear stock | `canCreateStock` | ADMIN, MANAGER, USER |
| Editar stock | `canEditStock` | ADMIN, MANAGER, USER |
| Eliminar stock | `canDeleteStock` | ADMIN, MANAGER, USER |

**Nota:** A diferencia de otros módulos (Products), aquí USER tiene permisos completos CRUD. Esto podría ser riesgoso si la intención era restringir eliminación a ADMIN/MANAGER.

### 13.3 Validación de Parámetros

- `validateQueryParams(stockFiltersSchema)` en GET `/` — sanitiza query params
- `validatePathParam` en PATCH/DELETE `/:id` — valida que `id` sea número
- `validateSchema(stockCreateSchema)` / `validateSchema(stockUpdateSchema)` — valida body

### 13.4 OWASP Consideraciones

| Riesgo | Mitigación |
| --------- | -------------- |
| SQL Injection | Uso de `Prisma.sql` tagged templates (parametriza automáticamente). Sin embargo, `ILIKE ${'%' + (lot || '') + '%'}` usa interpolación directa — ⚠️ riesgo potencial si Prisma no sanitiza en ese contexto |
| IDOR | No hay verificación de propiedad del registro — cualquier usuario autenticado puede modificar/eliminar cualquier registro de stock |
| Mass Assignment | `validateSchema` con Joi evita campos extra. Zod usa `.passthrough()` que permite campos extra aunque no los procesa |

---

## 14. Manejo de Errores

### 14.1 Patrón General

- Controller: `handleCatchErrorAsync` async wrapper — captura errores y responde con formato estándar de error
- Errores de validación Joi: manejados por middleware `validateSchema` / `validateQueryParams` / `validatePathParam`
- Errores de Prisma: NO hay manejo específico — errores como `P2025` (not found) o `P2002` (unique constraint) se propagan como 500

### 14.2 Formatos de Error

**Error de validación (400):**

```json
{
  "error": true,
  "statusCode": 400,
  "message": "\"quantity\" must be a number"
}
```

**Error de autenticación (401):**

```json
{
  "error": true,
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Error de servidor (500):**

```json
{
  "error": true,
  "statusCode": 500,
  "message": "Internal server error"
}
```

**⚠️ Bug R-007:** Sin manejo de Prisma `P2002` (unique constraint violation) — el error `unique_stock_entry` devuelve 500 en lugar de 409 Conflict.

**⚠️ Bug R-008:** Sin manejo de Prisma `P2025` (record not found) en update/delete — devuelve 500 en lugar de 404.

---

## 15. Conceptos Transversales (Cross-Cutting)

### 15.1 Paginación

- Server: `getSafePagination({ page, limit })` → `{ take, skip }`
- Client: Estado `pagination` con `pageIndex` (0-based) y `pageSize` (default 20)
- Conversión: `page = pageIndex + 1` al enviar al backend
- **⚠️ Sin COUNT total** — la respuesta raw SQL no incluye metadatos de paginación (total de registros). La paginación client-side usa `dataStock.data.total` que no es poblado.

### 15.2 i18n

Todas las etiquetas UI usan `useTranslation()` con claves como:
- `add_stock`, `edit_stock`, `search_by_lot`, `select_product`, `select_warehouse`, `select_unit_measure`
- `created_on`, `updated_on`, `expiration_date`, `expiration_status`, `total_cost`
- `zod.stock.*` — mensajes de error Zod internacionalizados

### 15.3 Auditoría

- `createdOn` / `createdBy`: Seteados en service.createStock
- `updatedOn` / `updatedBy`: Seteados en service.updateStockById
- Nombres de usuarios JOINeados en raw SQL: `userStockCreatedName`, `userStockUpdatedName`

### 15.4 Formato de Moneda

- `productPrice` y `totalCost` formateados en `es-CO` con `currency: 'COP'`
- Sin configuración regional configurable — hardcodeado a COP

---

## 16. Requisitos de Calidad

| ID | Atributo | Escenario | Métrica |
| --- | ----------- | ------------ | --------- |
| Q-01 | Rendimiento | GET `/` con JOINs en 4 tablas + computed fields | < 200ms para 10K registros |
| Q-02 | Consistencia | Unique constraint evita duplicados exactos | Zero duplicados en BD |
| Q-03 | Seguridad | Todos los endpoints requieren JWT + permiso específico | 100% de rutas protegidas |
| Q-04 | Mantenibilidad | Arquitectura 4-capas (routes→controller→service→dao) | Bajo acoplamiento |
| Q-05 | Experiencia UX | Filtros + paginación reactiva sin recarga de página | Sin page reloads |
| Q-06 | Cobertura | Sin tests unitarios ni de integración | ❌ 0% cobertura |

---

## 17. Decisiones de Diseño (ADRs)

### ADR-001: Raw SQL para listado vs Prisma ORM

| Contexto | `getAllStock` requiere JOINs en 4 tablas + computed fields (CASE WHEN, multiplicación) |
| ----------- | ------------------------------------------------------------------------------------------- |
| Decisión | Usar `prisma.$queryRaw` con `Prisma.sql` tagged template |
| Consecuencia | + Control total sobre SQL optimizado. - Pérdida de type-safety de Prisma. - Riesgo de SQL injection mitigado por parametrización |
| Alternativa | Prisma `findMany` con `include` anidado y post-procesamiento JS de computed fields |

### ADR-002: Unique Constraint Compuesta vs Simple

| Contexto | Un producto puede tener stock en múltiples almacenes con diferentes lotes |
| ----------- | ---------------------------------------------------------------------------- |
| Decisión | `@@unique([productId, warehouseId, lot, expirationDate])` |
| Consecuencia | + Flexibilidad para múltiples registros por producto. + Evita duplicados accidentales. - Complejidad en UI para manejar combinaciones |
| Alternativa | PK compuesta con los mismos campos |

### ADR-003: Computed Fields en SQL vs Aplicación

| Contexto | `expirationStatus` y `totalCost` son derivados de datos existentes |
| ----------- | --------------------------------------------------------------------- |
| Decisión | Calcular en SQL (CASE WHEN + multiplicación en SELECT) |
| Consecuencia | + Sin datos duplicados. + Cálculo siempre actualizado. - Mayor carga en BD. - No se puede indexar |
| Alternativa | Campos persistidos actualizados vía triggers o en capa de aplicación |

### ADR-004: Paginación Sin COUNT Total

| Contexto | El listado paginado no retorna metadatos de paginación (total de registros) |
| ----------- | --------------------------------------------------------------------------- |
| Decisión | No implementar COUNT separado (actual) |
| Consecuencia | - UI de paginación muestra datos incorrectos (no hay total). - El cliente no puede mostrar "página X de Y" |
| Alternativa | Agregar subquery COUNT con mismos filtros |

---

## 18. Riesgos y Deuda Técnica

### 18.1 Bugs Conocidos

| ID | Severidad | Descripción | Archivo | Línea |
| --- | --------- | ----------- | --------- | ----- |
| **R-001** | 🔴 **High** | Dos handlers GET en la misma ruta `/` (getAllStock y getStockByProductId). Express solo ejecuta el primero. `getStockByProductId` nunca se ejecuta. | `routes.js` | L78-86 vs L137-144 |
| **R-002** | 🟠 **Medium** | `getAllStock` DAO no incluye query COUNT para paginación. `total` no es poblado → UI de paginación no funciona correctamente | `dao.js` | — |
| **R-003** | 🟠 **Medium** | Filtro `stocksExpirated = true` incluye registros con `expirationDate IS NULL` (condición OR `s."expirationDate" IS NULL`) | `dao.js` | L66-68 |
| **R-004** | 🔴 **High** | `getStockByProductId` usa `prisma.stock.findUnique({ where: { productId: id } })`. `productId` no es unique (solo en constraint compuesta). Si hay múltiples registros para el mismo producto, Prisma lanza error | `dao.js` | L91-93 |
| **R-005** | 🟡 **Low** | Sin manejo visual de errores en UI — `catch (err) { console.error(...) }` silencioso | `Stock.jsx` | L136-138, L184-186, L191-192 |
| **R-006** | 🟡 **Low** | Zod schema requiere `maximum` con `min(1)` pero en BD y Joi es opcional/allow(null). Crear stock sin maximum falla en cliente | `schema.js` | L27-36 |
| **R-007** | 🟠 **Medium** | Prisma `P2002` (unique constraint violation) sin manejo — devuelve 500 en lugar de 409 Conflict | `dao.js` | — |
| **R-008** | 🟠 **Medium** | Prisma `P2025` (record not found) sin manejo — update/delete de ID inexistente devuelve 500 en lugar de 404 | `dao.js` | — |
| **R-009** | 🟡 **Low** | `totalCost` computado como `quantity * price` usa precio de venta, no costo (`cost`). Posible inconsistencia contable | `dao.js` | L39 |
| **R-010** | 🟢 **Info** | Sin unit tests ni integration tests para el módulo Stock | — | — |

### 18.2 Deuda Técnica

| ID | Deuda | Impacto | Esfuerzo estimado |
| --- | ----- | --------- | ----------------- |
| D-01 | Rutas duplicadas en `/` (R-001) | Funcional — `getStockByProductId` inalcanzable | Bajo (mover a `/:id`) |
| D-02 | Falta COUNT paginación (R-002) | UX — paginación no muestra total | Medio |
| D-03 | `findUnique` con campo no único (R-004) | Funcional — error con productos multi-stock | Bajo (cambiar a findFirst o findMany) |
| D-04 | Sin manejo de errores 404/409 | UX — errores opacos al usuario | Bajo (agregar try-catch en DAO o controller) |
| D-05 | Sin tests | QA — riesgo de regresiones | Alto |

---

## 19. Glosario

| Término | Definición |
| --------- | ------------ |
| **Stock** | Registro de existencias de un producto en un almacén específico |
| **Lote** | Identificador alfanumérico (max 50 chars) que agrupa unidades producidas/recibidas juntas |
| **Unidad de Medida** | Enum que define cómo se mide el stock: PIECES (unidades), KILOGRAMS (peso), LITERS (volumen), METERS (longitud) |
| **ExpirationStatus** | Campo computado: EXPIRED (fecha pasada), NOT EXPIRED (fecha futura), NULL (sin fecha) |
| **TotalCost** | Campo computado: `quantity * product.price` |
| **Stock Bajo (Low Stock)** | Estado donde `quantity < minimum` |
| **Stock Vencido (Expired)** | Estado donde `expirationDate < CURRENT_DATE` |
| **Alertas de Stock** | Conteo agregado de registros vencidos y con stock bajo |
| **Umbral (Threshold)** | Valores `minimum` y `maximum` que definen el rango aceptable de inventario |
| **Constraint Única Compuesta** | `@@unique([productId, warehouseId, lot, expirationDate])` — garantiza unicidad de la combinación |

---

## 20. Apéndices

### 20.1 Referencias

| Recurso | Ubicación |
| --------- | ----------- |
| Prisma Model | `apps/server/prisma/schema.prisma` (línea 367, model `stock`) |
| Server Routes | `apps/server/src/modules/stock/routes.js` |
| Server Controller | `apps/server/src/modules/stock/controller.js` |
| Server Service | `apps/server/src/modules/stock/service.js` |
| Server DAO | `apps/server/src/modules/stock/dao.js` |
| Server Joi Schemas | `apps/server/src/modules/stock/schemas/stock.joi.js` |
| Client API | `apps/client/src/modules/stock/api/stockAPI.js` |
| Client Page | `apps/client/src/modules/stock/pages/Stock.jsx` |
| Client Filters | `apps/client/src/modules/stock/components/StockFiltersForm.jsx` |
| Client Datatable | `apps/client/src/modules/stock/components/StockDatatable.jsx` |
| Client Dialog | `apps/client/src/modules/stock/components/StockDialog.jsx` |
| Client Zod Schema | `apps/client/src/modules/stock/utils/schema.js` |
| Client Enums | `apps/client/src/modules/stock/utils/enums.js` |
| Field Limits Config | `apps/client/src/config/fieldLimits.js` (línea 67: `stock: { lot: 50 }`) |
| Permissions Constants | `apps/server/src/utils/constants/enums.js` (PERMISSIONCODES.canViewStock, etc.) |

### 20.2 Endpoints Resumidos

| Método | Ruta | Permiso | Uso |
| ------ | ------- | --------- | ---- |
| GET | `/api/v1/stock` | canViewStock | Listar stock con filtros |
| GET | `/api/v1/stock/:id` | canViewStock | Obtener stock por producto (⚠️ Bug R-004) |
| GET | `/api/v1/stock/alerts` | canViewStock | Alertas (vencidos + bajo mínimo) |
| POST | `/api/v1/stock` | canCreateStock | Crear registro |
| PATCH | `/api/v1/stock/:id` | canEditStock | Actualizar registro |
| DELETE | `/api/v1/stock/:id` | canDeleteStock | Eliminar registro |

### 20.3 Hooks RTK Exportados

```js
useLazyGetAllStockQuery       // GET /stock (lazy, con parámetros)
useLazyGetStockByProductIdQuery // GET /stock/:id (lazy)
useGetStockAlertsQuery        // GET /stock/alerts (auto)
useCreateStockMutation        // POST /stock
useUpdateStockByIdMutation    // PATCH /stock/:id
useDeleteStockByIdMutation    // DELETE /stock/:id
```

### 20.4 Checklist de Verificación

| Aspecto | Estado | Notas |
| --------- | ------ | ----- |
| Server endpoints documentados | ✅ | 6 endpoints completos con OpenAPI docs |
| Client hooks documentados | ✅ | 6 hooks RTK Query |
| Componentes documentados | ✅ | 3 componentes (FiltersForm, Datatable, Dialog) |
| Validación server (Joi) | ✅ | 3 schemas |
| Validación client (Zod) | ✅ | 1 schema con refinements |
| Modelo de datos (Prisma) | ✅ | Modelo stock + enum unitMeasureStock |
| Seguridad/Auth | ✅ | verifyToken + 4 permisos CRUD |
| Filtros documentados | ✅ | 6 filtros (productId, warehouseId, lot, unitMeasure, stocksExpirated, stocksLow) |
| Bugs documentados | ✅ | 10 bugs (R-001 a R-010) |
| Tests | ❌ | Sin tests unitarios ni de integración |
