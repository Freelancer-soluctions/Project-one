# Módulo: Sales (Server + Client)

> Documentación técnica integral del módulo **Sales** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre tanto el backend (`apps/server/src/modules/sales/`) como el frontend (`apps/client/src/modules/sales/`).
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
| **Módulo** | `sales` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/sales/` |
| **Path Client** | `apps/client/src/modules/sales/` |
| **Base URL API** | `/api/v1/sales` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial del documento integral (server + client) siguiendo arc42/C4/IEEE 1016. Se documentan 5 endpoints server, 5 hooks RTK Query client, 3 componentes client, esquemas Joi/Zod, 2 modelos Prisma (sale + saleDetail). |

---

## 2. Introducción y Objetivos

### 2.1 Propósito

El módulo **Sales** gestiona las ventas del sistema. Proporciona registro de ventas con múltiples detalles (productos vendidos), cálculo automático de totales, vinculación con clientes y seguimiento de auditoría. Cada venta puede tener múltiples líneas de detalle con producto, cantidad y precio.

Funcionalidades principales:

- **Registro de Ventas**: Creación de ventas con múltiples productos (detalles).
- **Cálculo Automático de Totales**: Total calculado como suma de `quantity * price` de cada detalle.
- **Vinculación con Clientes**: Asociación de cada venta a un cliente.
- **Gestión de Detalles**: Agregar/eliminar líneas de detalle en la UI.
- **Auto-precio**: Al seleccionar un producto, el precio se autocompleta desde el catálogo.
- **Filtros y Paginación**: Búsqueda por cliente, rango de fechas y rango de totales.
- **Auditoría**: Trazabilidad de creador y última modificación.

### 2.2 Alcance Funcional

| ID | Función | Actor | Cubre |
| ------ | ---------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| F-001 | Listar ventas con filtros y paginación | Autenticado | GET `/api/v1/sales` con `checkRoleAuthOrPermisssion(canViewSale)` |
| F-002 | Crear venta con detalles | Autenticado | POST `/api/v1/sales` con `checkRoleAuthOrPermisssion(canCreateSale)` |
| F-003 | Actualizar venta (datos + detalles) | Autenticado | PATCH `/api/v1/sales/:id` con `checkRoleAuthOrPermisssion(canEditSale)` |
| F-004 | Eliminar venta | ADMIN/MANAGER | DELETE `/api/v1/sales/:id` con `checkRoleAuthOrPermisssion(canDeleteSale)` |
| F-005 | Eliminar detalle de venta | ADMIN/MANAGER | DELETE `/api/v1/sales/detail/:id` con `checkRoleAuthOrPermisssion(canDeleteSale)` |
| F-006 | Autocompletar precio al seleccionar producto | Autenticado | Cliente: `handleProductChange` en `SalesDialog` |
| F-007 | Calcular total automáticamente | Autenticado | Cliente: `calculateTotal` reduce sobre detalles |
| F-008 | Prevenir producto duplicado en detalles | Autenticado | Cliente: validación con `toast` si producto ya existe |

### 2.3 Dependencias

| Módulo | Relación | Detalle |
| --------- | ----------- | ------------------------------------------------------------------- |
| **Clients** | FK `clientId` | Cada venta pertenece a un cliente (relación `saleClient`) |
| **Products** | FK `productId` en `saleDetail` | Cada detalle de venta es un producto (relación `saleDetailProduct`) |
| **Users** | FK `createdBy` / `updatedBy` | Auditoría de creación y modificación |
| **InventoryMovement** | FK `saleId` | Vinculación opcional con movimientos de inventario |
| **ClientOrder** | Relación inversa | Una venta puede tener órdenes de cliente asociadas |

---

## 3. Contexto y Alcance

### 3.1 Contexto de Negocio

El módulo Sales captura transacciones de venta. A diferencia de módulos como InventoryMovement (que registra movimientos), Sales es el registro contable/comercial de la transacción con el cliente. Incluye el detalle de productos vendidos, el precio de venta (que puede diferir del precio actual del producto) y el total calculado.

### 3.2 Límites del Módulo

**Incluye:**
- CRUD completo de ventas con detalles anidados
- Filtros por cliente, rango de fechas, rango de totales
- Auto-precio desde catálogo de productos en UI
- Cálculo automático de total en UI
- Prevención de productos duplicados en una misma venta
- Eliminación individual de detalles de venta

**No incluye:**
- Vinculación automática con InventoryMovement (el movimiento de salida se crea aparte)
- Facturación o generación de documentos fiscales
- Cálculo de impuestos
- Múltiples métodos de pago o cuotas
- Descuentos por línea de detalle (solo descuento global)
- Historial de cambios por detalle

---

## 4. Restricciones

| ID | Restricción | Tipo |
| --- | -------------------------------------------------------------------------------- | --------- |
| R-01 | PostgreSQL como única base de datos soportada (Prisma ORM) | Técnica |
| R-02 | Paginación obligatoria en GET — `getSafePagination` requiere `limit` y `page` | Técnica |
| R-03 | `total` y `price` como `Decimal(18,2)` en BD | Datos |
| R-04 | `saleDetail` tiene `onDelete: Cascade` — eliminar venta elimina detalles automáticamente | Datos |
| R-05 | Autenticación JWT obligatoria en todos los endpoints | Seguridad |
| R-06 | DELETE endpoints restringidos a ADMIN/MANAGER (USER no puede eliminar) | Autorización |

---

## 5. Stack Tecnológico

| Capa | Tecnología | Versión | Uso |
| -------- | ------------ | ------- | ------------------------------------------------------ |
| Server Runtime | Node.js | — | Entorno de ejecución del backend |
| Server Framework | Express.js | — | Router HTTP y middleware pipeline |
| ORM | Prisma | — | `prisma.sale.*`, `prisma.saleDetail.*` |
| DB | PostgreSQL | — | Persistencia de datos |
| Validation | Joi | — | Esquemas de validación en server (`sales.joi.js`) |
| Auth | JWT + custom middleware | — | `verifyToken`, `checkRoleAuthOrPermisssion` |
| Client Runtime | React 18 | — | UI del módulo |
| Client State | Redux Toolkit (RTK Query) | — | API calls y caching (`salesAPI.js`) |
| Client Forms | react-hook-form + Zod | — | Validación de formularios client-side |
| Client UI | shadcn/ui + Tailwind | — | Componentes de UI |
| Client Dates | date-fns | — | Formateo de fechas |
| Client i18n | react-i18next | — | Traducciones |

---

## 6. Arquitectura del Módulo (Overview)

### 6.1 C4 Nivel 1 (Contexto)

```
[Usuario Autenticado] --> [Sales API /api/v1/sales]
    |
    |--> [GET /] con filtros → PostgreSQL (Prisma findMany + include)
    |--> [POST /] Crear venta + detalles → PostgreSQL (Prisma create nested)
    |--> [PATCH /:id] Actualizar venta + detalles → PostgreSQL (Prisma update)
    |--> [DELETE /:id] Eliminar venta + detalles cascade
    |--> [DELETE /detail/:id] Eliminar detalle individual
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
[Sales.jsx (Page)]
    |
    |--> [SalesFiltersForm] → react-hook-form + Zod → 5 filtros
    |--> [SalesDatatable] → DataTable → 7 columnas
    |--> [SalesDialog] → react-hook-form + Zod → CRUD + detalles dinámicos
    |
    v
[salesAPI.js (RTK Query)]
    |
    v
[Sales API /api/v1/sales]
```

---

## 7. Vista de Building Blocks — Server

### 7.1 Estructura de Archivos

```
apps/server/src/modules/sales/
├── routes.js              # Definición de rutas + middleware + Swagger docs
├── controller.js          # Handlers HTTP (5 funciones exportadas)
├── service.js             # Lógica de negocio (5 funciones exportadas)
├── dao.js                 # Acceso a datos (Prisma ORM)
└── schemas/
    └── sales.joi.js       # Esquemas de validación Joi (3 schemas)
```

### 7.2 Capa de Rutas (`routes.js`)

**Middleware global:** `router.use(verifyToken)` — todas las rutas requieren JWT.

| Método | Ruta | Middleware Adicional | Handler | Permiso |
| ------ | ------- | ------------------------------- | --------------- | --------------- |
| GET | `/` | `checkRoleAuthOrPermisssion(canViewSale)`, `validateQueryParams(saleFiltersSchema)` | `getAllSales` | canViewSale |
| POST | `/` | `checkRoleAuthOrPermisssion(canCreateSale)`, `validateSchema(saleCreateSchema)` | `createSale` | canCreateSale |
| PATCH | `/:id` | `checkRoleAuthOrPermisssion(canEditSale)`, `validatePathParam`, `validateSchema(saleUpdateSchema)` | `patchSaleById` | canEditSale |
| DELETE | `/:id` | `checkRoleAuthOrPermisssion(canDeleteSale)`, `validatePathParam` | `deleteSaleById` | canDeleteSale |
| DELETE | `/detail/:id` | `checkRoleAuthOrPermisssion(canDeleteSale)`, `validatePathParam` | `deleteSaleDetailById` | canDeleteSale |

**Roles permitidos:**
- GET/POST/PATCH: ADMIN, MANAGER, USER
- DELETE (both): ADMIN, MANAGER

**⚠️ Bug R-001:** Ruta DELETE `/detail/:id` debería ser `/:id/detail` (sin prefijo vacío) para consistencia REST. Anidar bajo `/sales/detail/:id` es confuso vs `/:id/detail/:detailId`.

**Swagger docs:** Usa `@swagger` en vez de `@openapi` — inconsistente con otros módulos (Stock usa `@openapi`). Además, la base path en Swagger es `/v1/sales` sin prefijo `/api`.

### 7.3 Capa de Controlador (`controller.js`)

5 funciones exportadas, todas envueltas en `handleCatchErrorAsync`:

| Función | Parámetros | Respuesta |
| ----------- | ---------- | --------- |
| `getAllSales` | `req.safeQuery` (clientId, fromDate, toDate, minTotal, maxTotal, page, limit) | `globalResponse(res, 200, sales)` |
| `createSale` | `req.body` + `req.userId` (agregado como `createdBy`) | `globalResponse(res, 201, sale)` |
| `patchSaleById` | `req.params.id`, `req.body` + `req.userId` (agregado como `updatedBy`) | `globalResponse(res, 200, sale)` |
| `deleteSaleById` | `req.params.id` | `globalResponse(res, 200, ...)` |
| `deleteSaleDetailById` | `req.params.id` | `globalResponse(res, 200, ...)` |

**Nota:** Este módulo maneja correctamente `createdBy`/`updatedBy` desde `req.userId` — a diferencia de InventoryMovement.

### 7.4 Capa de Servicio (`service.js`)

5 funciones exportadas con transformación de datos:

- **`getAllSales`**: Convierte `clientId` a Number, extrae paginación vía `getSafePagination`, delega a DAO.
- **`createSale`**: Convierte `clientId`, `total`, `createdBy` a Number; setea `createdOn: new Date()`. No transforma `details` array.
- **`patchSaleById`**: Convierte campos opcionales solo si están definidos; elimina claves `undefined` del objeto. Setea `updatedOn: new Date()`.
- **`deleteSaleById`**: Convierte id a Number, delega a DAO.
- **`deleteSaleDetailById`**: Convierte id a Number, delega a DAO.

### 7.5 Capa de Acceso a Datos (`dao.js`)

**Prisma ORM** exclusivamente.

#### `getAllSales` — Prisma findMany

```js
prisma.sale.findMany({
  where: {
    ...(clientId && { clientId }),
    ...(fromDate && { createdOn: { gte: fromDate } }),
    ...(toDate && { createdOn: { lte: toDate } }),
    ...(minTotal && { total: { gte: minTotal } }),
    ...(maxTotal && { total: { lte: maxTotal } }),
  },
  include: {
    client: true,
    saleDetail: true,
    userSaleCreated: { select: { name: true } },
    userSaleUpdated: { select: { name: true } },
  },
  orderBy: { createdOn: 'desc' },
  take,
  skip,
});
```

**⚠️ Bug R-002:** Sin COUNT separado — no retorna metadatos de paginación. El DAO retorna solo el array `sales`, no `{ dataList, total }`.

**⚠️ Bug R-003:** Filtros `fromDate`/`toDate` en DAO esperan nombres de campo del Joi (`fromDate`, `toDate`), pero el cliente envía `fDate`/`tDate` — los filtros de fecha nunca funcionan.

#### `createSale` — Prisma nested create

```js
prisma.sale.create({
  data: {
    createdOn,
    total,
    saleDetail: { create: details.map(d => ({
      product: { connect: { id } },
      quantity,
      price,
    }))},
    userSaleCreated: { connect: { id } },
    client: { connect: { id } },
  },
});
```

#### `patchSaleById` — Prisma update con reemplazo de detalles

```js
// Si details está presente:
await prisma.saleDetail.deleteMany({ where: { saleId: id } });
updateData.saleDetail = { create: details.map(...) };
// Luego:
prisma.sale.update({ where: { id }, data: updateData });
```

**⚠️ Bug R-004:** PATCH elimina y recrea todos los detalles si `details` está presente en el body — incluso si solo se modificó un campo de la venta (como `total` o `clientId`). Esto puede causar pérdida de datos si concurrencia.

#### `deleteSaleById` — Prisma delete con cascade

```js
await prisma.saleDetail.deleteMany({ where: { saleId: id } }); // redundante con Cascade
prisma.sale.delete({ where: { id } });
```

#### `deleteSaleDetailById` — Prisma delete

```js
prisma.saleDetail.delete({ where: { id } });
```

---

## 8. Vista de Building Blocks — Client

### 8.1 Estructura de Archivos

```
apps/client/src/modules/sales/
├── api/
│   └── salesAPI.js                    # RTK Query (5 endpoints)
├── pages/
│   └── Sales.jsx                      # Página principal
├── components/
│   ├── SalesFiltersForm.jsx           # Formulario de filtros (5 campos)
│   ├── SalesDatatable.jsx             # Tabla de datos (7 columnas)
│   └── SalesDialog.jsx                # Dialog de creación/edición con detalles dinámicos
└── utils/
    └── schema.js                      # Zod schemas (SaleSchema + SalesFiltersSchema)
```

### 8.2 RTK Query API (`salesAPI.js`)

```js
const salesApi = createApi({
  reducerPath: 'salesApi',
  baseQuery: axiosPrivateBaseQuery({ baseUrl: '...' }),
  tagTypes: ['Sales'],
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: (builder) => ({ ... })
})
```

**Endpoints mapeados:**

| Hook | Método | Ruta | Query/Body | Tags |
| ----- | ------ | ------- | ----------- | ---- |
| `useLazyGetAllSalesQuery` | GET | `/sales` | `params` | `providesTags: ['Sales']` |
| `useCreateSaleMutation` | POST | `/sales/` | `body: data` | `invalidatesTags: ['Sales']` |
| `useUpdateSaleByIdMutation` | PATCH | `/sales/:id` | `{ id, data }` | `invalidatesTags: ['Sales']` |
| `useDeleteSaleByIdMutation` | DELETE | `/sales/:id` | `id` | `invalidatesTags: ['Sales']` |
| `useDeleteSaleDetailByIdMutation` | DELETE | `/sales/detail/:id` | `id` | `invalidatesTags: ['Sales']` |

### 8.3 Página Principal (`Sales.jsx`)

Mismo patrón reactivo que módulos anteriores, con gestión de detalles:

- **Hooks RTK Query**: 5 hooks (incluye `useDeleteSaleDetailByIdMutation`)
- **Hooks de datos auxiliares**: `useGetAllClientsFiltersQuery`, `useGetAllProductsFiltersQuery`
- **Estado `details`**: Array de `{ productId, quantity, price }` manejado localmente
- **useEffect**: Dispara `getAllSales` con paginación + filtros
- **handleEditDetail(index, field, value)**: Actualiza un detalle específico en el array
- **handleRemoveDetail(index, item)**: Elimina detalle (si tiene `id`, llama API DELETE primero)
- **handleAddDetail()**: Agrega detalle vacío al array
- **handleSubmit**: Create o update según presencia de `result.id`

### 8.4 Componentes

#### SalesFiltersForm

Formulario con `react-hook-form` + `zodResolver(SalesFiltersSchema)`, 5 campos:

| Campo | Tipo | Placeholder | Notas |
| ----- | ---- | ----------- | ----- |
| `clientId` | Select | `select_client` | shadcn SelectTrigger/SelectContent |
| `fromDate` | DatePicker | `from_date` | Calendar Popover |
| `toDate` | DatePicker | `to_date` | Calendar Popover |
| `minTotal` | Input number | `min_total_placeholder` | step="0.01", min="0" |
| `maxTotal` | Input number | `max_total_placeholder` | step="0.01", min="0" |

**Submit transform:** Convierte `fromDate`/`toDate` a ISO string (`formatISO`) y los envía como `fDate`/`tDate`.

**⚠️ Bug R-005:** Cliente envía `fDate`/`tDate` pero Joi espera `fromDate`/`toDate` y DAO usa `fromDate`/`toDate`. Filtros de fecha nunca funcionan.

#### SalesDatatable

Tabla con `DataTable` genérico, 7 columnas:

| Columna | Accessor | Formato |
| --------- | ------------ | --------- |
| client | `client.name` | `toUpperCase()` |
| total | `total` | COP currency (`toLocaleString('es-CO')`) |
| products | `saleDetail` | `length || 0` (cuenta de items) |
| createdOn | `createdOn` | `format(new Date(), 'PPP')` |
| createdBy | `userSaleCreated.name` | `toUpperCase()` |
| updatedOn | `updatedOn` | `format(new Date(), 'PPP')` o null |
| updatedBy | `userSaleUpdated.name` | `toUpperCase()` |

Paginación: `totalRows={total}` pero **el DAO no retorna `total`** — `dataList` y `total` no están en la respuesta (Bug R-002).

#### SalesDialog

Dialog complejo con creación de venta + detalles dinámicos.

**Campos del encabezado:**
- `clientId`: Select (shadcn)
- `total`: Input deshabilitado (auto-calculado)
- Auditoría (solo edición): `userSaleCreatedName` (disabled), `createdOn` (disabled date input), `userSaleUpdatedName` (disabled), `updatedOn` (disabled date input)

**Detalles dinámicos:**
- Cada línea: `productId` (Select), `quantity` (Input number), `price` (Input deshabilitado, auto-asignado)
- **auto-precio**: `handleProductChange(index, value)` busca el producto en `products` y asigna su `price` al detalle
- **prevención duplicados**: Si el producto ya existe en otro detalle, muestra `toast` destructivo
- **cálculo de total**: `calculateTotal()` reduce `details` sumando `price * quantity`, actualiza campo `total`
- Botón trash para eliminar detalle (solo si `details.length > 1`)
- Botón `add_detail` para agregar línea
- Separator visual entre header y detalles

**Footer:** Cancel, Add Detail, Delete (solo edición), Save/Update.

---

## 9. Vista de Runtime y Flujo de Datos

### 9.1 Flujo: Listar Ventas

```
[Usuario] → [Sales.jsx useEffect]
  → useLazyGetAllSalesQuery({ page, limit, clientId, fDate, tDate, minTotal, maxTotal })
  → GET /api/v1/sales?page=1&limit=20&clientId=5
  → [verifyToken] → [checkRoleAuthOrPermisssion(canViewSale)]
  → [validateQueryParams(saleFiltersSchema)] (fDate/tDate no matchean fromDate/toDate)
  → [getAllSales controller → service → DAO]
  → [prisma.sale.findMany + include] (sin COUNT)
  → Response: [{ id, client, saleDetail, userSaleCreated, ... }]
  → [SalesDatatable] renderiza 7 columnas
```

### 9.2 Flujo: Crear Venta con Detalles

```
[Usuario] → [SalesDialog] → selecciona cliente, agrega productos
  → [handleProductChange] auto-asigna precio del catálogo
  → [calculateTotal] suma price*quantity → campo total deshabilitado
  → handleSubmit(data) → createSale(data).unwrap()
  → POST /api/v1/sales
  → [verifyToken] → [checkRoleAuthOrPermisssion(canCreateSale)]
  → [validateSchema(saleCreateSchema)] Joi
  → [createSale controller → service (adds createdBy/createdOn) → DAO]
  → [prisma.sale.create nested: saleDetail.create + connect product/client/user]
  → Response 201 → AlertDialog éxito → refetch
```

### 9.3 Flujo: Actualizar Venta (PATCH)

```
[Usuario] → [SalesDialog] modifica datos
  → [pickDirty] extrae solo campos modificados
  → updateSaleById({ id, data: changes }).unwrap()
  → PATCH /api/v1/sales/:id
  → [verifyToken] → [checkRoleAuthOrPermisssion(canEditSale)]
  → [validateSchema(saleUpdateSchema)] Joi
  → [patchSaleById controller → service → DAO]
  → [SI details presente: deleteMany + createMany] (reemplazo completo)
  → [prisma.sale.update]
  → Response 200 → refetch
```

### 9.4 Mapa de Estados (State Machine)

Mismo patrón que Stock/InventoryMovement: Idle → Loading → Data → Dialog (create/edit) → refetch.

---

## 10. Modelo de Datos

### 10.1 Modelos Prisma

```prisma
model sale {
  id                Int                 @id @default(autoincrement())
  clientId          Int                 @db.Integer
  client            clients             @relation("saleClient", fields: [clientId], references: [id])
  total             Decimal             @db.Decimal(18, 2)
  createdOn         DateTime            @db.Timestamp(3)
  updatedOn         DateTime?           @db.Timestamp(3)
  saleDetail        saleDetail[]        @relation("saleDetail")
  inventoryMovement inventoryMovement[] @relation("inventoryMovementSale")
  userSaleCreated   users               @relation("userSaleCreated", fields: [createdBy], references: [id])
  createdBy         Int                 @db.Integer
  userSaleUpdated   users?              @relation("userSaleUpdated", fields: [updatedBy], references: [id])
  updatedBy         Int?                @db.Integer
  clientOrder       clientOrder[]
}

model saleDetail {
  id        Int      @id @default(autoincrement())
  saleId    Int      @db.Integer
  productId Int      @db.Integer
  quantity  Int      @db.Integer
  price     Decimal  @db.Decimal(18, 2)
  sale      sale     @relation("saleDetail", fields: [saleId], references: [id], onDelete: Cascade)
  product   products @relation("saleDetailProduct", fields: [productId], references: [id])
}
```

### 10.2 Diagrama ER

```
┌─────────────────────┐
│        sale         │
├─────────────────────┤
│ id (PK)             │
│ clientId (FK) ──────┼───→ clients (id)
│ total (Decimal(18,2))│
│ createdOn (TS)      │
│ updatedOn (TS?)     │
│ createdBy (FK) ─────┼───→ users (id) "userSaleCreated"
│ updatedBy (FK?) ────┼───→ users (id) "userSaleUpdated"
│                     │
│ 1│┐                │
└──┼──────────────────┘
   │
   │ 1:N
   │
┌──┼──────────────────┐
│  ││   saleDetail    │
├──┼──────────────────┤
│  └── saleId (FK)    │
│      productId (FK) ──── products (id)
│      quantity (Int) │
│      price (Dec(18,2))│
└─────────────────────┘
```

### 10.3 Mapeo de Tipos

| Campo | Prisma | PostgreSQL | Joi | Zod Client |
| --------- | --------- | ------------ | ----- | ----------- |
| id | Int | INTEGER | — | — |
| clientId | Int | INTEGER | number() | string().min(1) |
| total | Decimal | DECIMAL(18,2) | number().min(0) | string → number().int() |
| productId | Int | INTEGER | number() | string().min(1) |
| quantity | Int | INTEGER | number().min(1) | string → number().int().min(1) |
| price | Decimal | DECIMAL(18,2) | number().min(0) | string → number().int().min(0) |

**⚠️ Bug R-006:** Zod schema transforma `total` y `price` con `.int()` pero en BD son `Decimal(18,2)` — pérdida de decimales.

### 10.4 Índices y Constraints

| Nombre | Tipo | Columnas |
| --------- | ---- | ----------- |
| PK | PRIMARY KEY | `(id)` — sale |
| FK | FOREIGN KEY | `clientId` → `clients(id)` |
| FK | FOREIGN KEY | `createdBy` → `users(id)` |
| FK | FOREIGN KEY | `updatedBy` → `users(id)` |
| PK | PRIMARY KEY | `(id)` — saleDetail |
| FK | FOREIGN KEY | `saleId` → `sale(id)` ON DELETE CASCADE |
| FK | FOREIGN KEY | `productId` → `products(id)` |

---

## 11. Contratos de API

### 11.1 GET /api/v1/sales — Listar ventas

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
| ----------- | ------ | --------- | --------------- |
| page | number | Sí | Número de página |
| limit | number | Sí | Items por página |
| clientId | number | No | Filtrar por cliente |
| fromDate | ISO date | No | Fecha inicio (en BD: createdOn gte) |
| toDate | ISO date | No | Fecha fin (en BD: createdOn lte) |
| minTotal | number | No | Total mínimo |
| maxTotal | number | No | Total máximo |

**Response 200:**

```json
{
  "error": false,
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "clientId": 5,
      "total": 150000.00,
      "createdOn": "2026-01-15T10:00:00.000Z",
      "updatedOn": null,
      "client": { "id": 5, "name": "Client A" },
      "saleDetail": [
        { "id": 1, "productId": 10, "quantity": 2, "price": 50000.00 },
        { "id": 2, "productId": 11, "quantity": 1, "price": 50000.00 }
      ],
      "userSaleCreated": { "name": "John Doe" },
      "userSaleUpdated": null
    }
  ]
}
```

### 11.2 POST /api/v1/sales — Crear venta

**Request Body:**

```json
{
  "clientId": 5,
  "details": [
    { "productId": 10, "quantity": 2, "price": 50000 },
    { "productId": 11, "quantity": 1, "price": 50000 }
  ]
}
```

**Nota:** `total` no es requerido en el body — el cliente lo calcula pero el server confía en el valor enviado (no recalcula).

**Response 201:** Objeto sale creado con detalles.

### 11.3 PATCH /api/v1/sales/:id — Actualizar venta

**Request Body:** (campos parciales)

```json
{
  "details": [
    { "productId": 10, "quantity": 3, "price": 50000 }
  ]
}
```

**⚠️ Bug R-004:** Si se envía `details`, se eliminan TODOS los existentes y se recrean.

### 11.4 DELETE /api/v1/sales/:id — Eliminar venta

**Response 200:**

```json
{
  "error": false,
  "statusCode": 200,
  "data": {
    "message": "Sale deleted successfully"
  }
}
```

### 11.5 DELETE /api/v1/sales/detail/:id — Eliminar detalle

**Response 200:** (mensaje idéntico al de venta — Bug R-007)

```json
{
  "error": false,
  "statusCode": 200,
  "data": {
    "message": "Sale deleted successfully"
  }
}
```

**⚠️ Bug R-007:** Mensaje de éxito incorrecto — dice "Sale deleted" en vez de "Sale detail deleted".

---

## 12. Reglas de Validación y Esquemas

### 12.1 Server — Joi (`sales.joi.js`)

#### `saleFiltersSchema`

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| clientId | number | `.integer().optional().allow('')` |
| fromDate | date | `.iso().optional().allow('')` |
| toDate | date | `.iso().optional().allow('')` |
| minTotal | number | `.min(0).optional().allow('')` |
| maxTotal | number | `.min(0).optional().allow('')` |

#### `saleCreateSchema`

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| clientId | number | `.integer().required()` |
| total | number | `.min(0).required()` |
| details | array | `.required().min(1)` |
| details[].productId | number | `.integer().required()` |
| details[].quantity | number | `.integer().min(1).required()` |
| details[].price | number | `.min(0).required()` |

#### `saleUpdateSchema`

Mismos campos, todos `.optional()`. `details[].productId` también opcional.

### 12.2 Client — Zod (`schema.js`)

**`SaleSchema`:**

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| clientId | string | `.min(1)` |
| total | string → number(int) | `.min(1)`, transform, `.int().min(0)` |
| details | array | array de objetos |
| details[].productId | string | `.min(1)` |
| details[].quantity | string → number(int) | `.min(1)`, transform, `.int().min(1)` |
| details[].price | string → number(int) | `.min(1)`, transform, `.int().min(0)` |

**`SalesFiltersSchema`:**

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| clientId | string | `.optional()` |
| fromDate | z.union(date, string) | `.optional()` |
| toDate | z.union(date, string) | `.optional()` |
| minTotal | string | `.optional()` |
| maxTotal | string | `.optional()` |

**Refinements:** `fromDate <= toDate`, `minTotal <= maxTotal`.

### 12.3 Field Limits

No hay `FIELD_LIMITS` específicos para Sales. Los campos `total` y `price` usan `Decimal(18,2)` en BD sin límite en Joi/Zod más allá de `min(0)`.

---

## 13. Seguridad y Autorización

### 13.1 Autenticación

- Middleware `verifyToken` global via `router.use(verifyToken)`

### 13.2 Permisos CRUD

| Acción | Permiso | Roles |
| --------- | ----------- | ----- |
| Ver ventas | `canViewSale` | ADMIN, MANAGER, USER |
| Crear venta | `canCreateSale` | ADMIN, MANAGER, USER |
| Editar venta | `canEditSale` | ADMIN, MANAGER, USER |
| Eliminar venta | `canDeleteSale` | ADMIN, MANAGER |
| Eliminar detalle | `canDeleteSale` | ADMIN, MANAGER |

### 13.3 OWASP Consideraciones

| Riesgo | Mitigación |
| --------- | -------------- |
| SQL Injection | Prisma ORM parametriza automáticamente |
| IDOR | Sin verificación de propiedad — cualquier usuario con permiso puede modificar/eliminar cualquier venta |
| Mass Assignment | Joi evita campos extra. Zod `.passthrough()` permite campos extra pero no afecta al backend |

---

## 14. Manejo de Errores

### 14.1 Patrón General

- `handleCatchErrorAsync` en controller
- Errores Joi manejados por middleware
- Errores Prisma sin manejo específico

### 14.2 Errores No Manejados

**⚠️ Bug R-008:** Sin manejo de Prisma `P2025` (record not found) en update/delete — devuelve 500 en lugar de 404.

**⚠️ Bug R-009:** Sin manejo de `onDelete: Cascade` conflicto — si el detalle tiene relaciones hijas, el delete puede fallar.

---

## 15. Conceptos Transversales (Cross-Cutting)

### 15.1 Paginación

- Server: `getSafePagination({ page, limit })` → `{ take, skip }`
- DAO: `findMany` con `take`/`skip` — **sin COUNT separado** (Bug R-002)
- Client: `pagination` con `pageIndex` 0-based, `pageSize` 20
- UI: `totalRows={total}` pero `dataSales.data` no contiene `total` — paginación no muestra total correcto

### 15.2 i18n

Claves como `add_sale`, `edit_sale`, `from_date`, `to_date`, `min_total`, `max_total`, `add_detail`, `product_already_exists`, `zod.sales.*`.

### 15.3 Auditoría

- `createdBy`/`createdOn`: Seteados correctamente en `createSale` service
- `updatedBy`/`updatedOn`: Seteados correctamente en `patchSaleById` service
- Nombres de usuarios incluidos vía `include: { userSaleCreated: { select: { name } }, userSaleUpdated: { select: { name } } }`

### 15.4 Formato de Moneda

- `total` formateado en `es-CO` con `currency: 'COP'`
- `price` en detalles usa Decimal(18,2) en BD sin formato específico en UI

### 15.5 `keepUnusedDataFor: 300`

RTK Query mantiene datos en caché por 5 minutos después de que el componente se desmonta — reduce llamadas API.

---

## 16. Requisitos de Calidad

| ID | Atributo | Escenario | Métrica |
| --- | ----------- | ------------ | --------- |
| Q-01 | Rendimiento | GET con `findMany` + includes anidados | < 200ms para 10K registros |
| Q-02 | Consistencia | Precios congelados en saleDetail al momento de venta | Precio no cambia post-venta |
| Q-03 | UX | Auto-cálculo de total + auto-precio desde catálogo | Sin carga manual |
| Q-04 | Seguridad | DELETE restringido a ADMIN/MANAGER | USER no puede eliminar |
| Q-05 | Cobertura | Sin tests unitarios ni de integración | ❌ 0% cobertura |

---

## 17. Decisiones de Diseño (ADRs)

### ADR-001: Precio Congelado en Detalle vs Precio Vivo

| Contexto | El precio del producto puede cambiar después de la venta |
| ----------- | --------------------------------------------------------- |
| Decisión | Almacenar `price` en `saleDetail` (copia al momento de crear/editar la venta) |
| Consecuencia | + Histórico de precio de venta preservado. - Precio no se actualiza automáticamente si cambia el catálogo |

### ADR-002: Reemplazo Completo de Detalles en PATCH

| Contexto | Actualizar una venta puede requerir cambiar productos, cantidades y precios |
| ----------- | --------------------------------------------------------------------------- |
| Decisión | Si `details` está presente en PATCH, eliminar todos los existentes y recrearlos |
| Consecuencia | + Simplicidad lógica. - Pérdida de IDs de detalles originales. - Riesgo de concurrencia |
| Alternativa | Actualización diferencial (solo cambios) |

### ADR-003: Total Enviado por Cliente vs Recalculado en Servidor

| Contexto | El cliente calcula el total automáticamente |
| ----------- | -------------------------------------------- |
| Decisión | El servidor acepta el `total` enviado sin recalcular |
| Consecuencia | + Simplicidad. - Riesgo de inconsistencia si cliente envía total incorrecto (o deja que Zod lo calcule como entero — Bug R-006) |
| Alternativa | Recalcular total en servidor sumando `price * quantity` de detalles |

### ADR-004: Sin COUNT en Listado

| Contexto | GET /sales no retorna metadatos de paginación |
| ----------- | ---------------------------------------------- |
| Decisión | No implementar COUNT (actual) |
| Consecuencia | - UI no puede mostrar número total de páginas/registros |
| Alternativa | Agregar `prisma.sale.count()` con mismos filtros |

---

## 18. Riesgos y Deuda Técnica

### 18.1 Bugs Conocidos

| ID | Severidad | Descripción | Archivo | Línea |
| --- | --------- | ----------- | --------- | ----- |
| **R-001** | 🟢 **Info** | Ruta DELETE `/detail/:id` con estructura inconsistente (debería ser `/:id/detail/:detailId`) | `routes.js` | L240-248 |
| **R-002** | 🟠 **Medium** | DAO getAllSales sin COUNT — `data` es array plano sin metadatos de paginación. UI no muestra total correcto. | `dao.js` | L16-49 |
| **R-003** | 🟠 **Medium** | Cliente envía `fDate`/`tDate` pero Joi/DAO esperan `fromDate`/`toDate`. Filtros de fecha inoperantes. | `SalesFiltersForm.jsx` vs `sales.joi.js` | L47-50 vs L5-6 |
| **R-004** | 🟠 **Medium** | PATCH con `details` elimina y recrea TODOS los detalles (deleteMany + createMany) — posible pérdida de datos | `dao.js` | L108-122 |
| **R-005** | 🟡 **Low** | Nombres de filtros inconsistentes: `fDate`/`tDate` en cliente vs `fromDate`/`toDate` en server | `SalesFiltersForm.jsx` | L47-50 |
| **R-006** | 🟡 **Low** | Zod schema usa `.int()` para `total` y `price` pero en BD son `Decimal(18,2)` — pérdida de decimales | `schema.js` | L16, L41 |
| **R-007** | 🟢 **Info** | `deleteSaleDetailById` retorna mensaje "Sale deleted successfully" en vez de "Sale detail deleted" | `controller.js` | L100 |
| **R-008** | 🟠 **Medium** | Sin manejo de Prisma `P2025` (not found) en update/delete — devuelve 500 en lugar de 404 | `dao.js` | — |
| **R-009** | 🟢 **Info** | Sin tests unitarios ni de integración | — | — |

### 18.2 Deuda Técnica

| ID | Deuda | Impacto | Esfuerzo estimado |
| --- | ----- | --------- | ----------------- |
| D-01 | Sin COUNT en paginación (R-002) | UX — paginación sin total correcto | Medio |
| D-02 | Filtros de fecha rotos (R-003) | Funcional — filtros de fecha no funcionan | Bajo (alias nombres) |
| D-03 | Reemplazo total de detalles en PATCH (R-004) | Funcional — riesgo con concurrencia | Alto |
| D-04 | Zod `.int()` en total/price (R-006) | Datos — pérdida de precisión decimal | Bajo (cambiar a `.number()`) |
| D-05 | `@swagger` vs `@openapi` inconsistente | Docs — Swagger docs parciales | Bajo |
| D-06 | Mensaje de error incorrecto en deleteDetail (R-007) | UX — mensaje engañoso | Bajo |
| D-07 | Sin tests | QA — riesgo de regresiones | Alto |

---

## 19. Glosario

| Término | Definición |
| --------- | ------------ |
| **Venta (Sale)** | Transacción comercial con un cliente que incluye uno o más productos |
| **Detalle de Venta (SaleDetail)** | Línea individual de una venta: producto + cantidad + precio |
| **Total** | Suma de `price * quantity` de todos los detalles |
| **Auto-precio** | Comportamiento UI que asigna automáticamente el precio del catálogo al seleccionar un producto |

---

## 20. Apéndices

### 20.1 Referencias

| Recurso | Ubicación |
| --------- | ----------- |
| Prisma Models | `apps/server/prisma/schema.prisma` (línea 453 model `sale`, línea 485 model `saleDetail`) |
| Server Routes | `apps/server/src/modules/sales/routes.js` |
| Server Controller | `apps/server/src/modules/sales/controller.js` |
| Server Service | `apps/server/src/modules/sales/service.js` |
| Server DAO | `apps/server/src/modules/sales/dao.js` |
| Server Joi Schemas | `apps/server/src/modules/sales/schemas/sales.joi.js` |
| Client API | `apps/client/src/modules/sales/api/salesAPI.js` |
| Client Page | `apps/client/src/modules/sales/pages/Sales.jsx` |
| Client Filters | `apps/client/src/modules/sales/components/SalesFiltersForm.jsx` |
| Client Datatable | `apps/client/src/modules/sales/components/SalesDatatable.jsx` |
| Client Dialog | `apps/client/src/modules/sales/components/SalesDialog.jsx` |
| Client Zod Schema | `apps/client/src/modules/sales/utils/schema.js` |
| Permissions Constants | `apps/server/src/utils/constants/enums.js` (PERMISSIONCODES.canViewSale, etc.) |

### 20.2 Endpoints Resumidos

| Método | Ruta | Permiso | Roles | Uso |
| ------ | ------- | --------- | ----- | ---- |
| GET | `/api/v1/sales` | canViewSale | ADMIN, MANAGER, USER | Listar ventas |
| POST | `/api/v1/sales` | canCreateSale | ADMIN, MANAGER, USER | Crear venta |
| PATCH | `/api/v1/sales/:id` | canEditSale | ADMIN, MANAGER, USER | Actualizar venta |
| DELETE | `/api/v1/sales/:id` | canDeleteSale | ADMIN, MANAGER | Eliminar venta |
| DELETE | `/api/v1/sales/detail/:id` | canDeleteSale | ADMIN, MANAGER | Eliminar detalle |

### 20.3 Hooks RTK Exportados

```js
useLazyGetAllSalesQuery           // GET /sales (con params)
useCreateSaleMutation             // POST /sales/
useUpdateSaleByIdMutation         // PATCH /sales/:id
useDeleteSaleByIdMutation         // DELETE /sales/:id
useDeleteSaleDetailByIdMutation   // DELETE /sales/detail/:id
```

### 20.4 Diferencias con Stock/InventoryMovement

| Aspecto | Sales | InventoryMovement |
| --------- | ----- | ------------------- |
| Auditoría | ✅ createdBy/updatedBy correctos | ❌ No seteados |
| Paginación | ❌ Sin COUNT | ✅ Con COUNT |
| Detalles anidados | ✅ saleDetail (1:N) | ❌ Sin detalles |
| Auto-precio | ✅ Desde catálogo | N/A |
| Precio congelado | ✅ En detalle | N/A |
| Decimales | ✅ Decimal(18,2) | ❌ Integer |
| Roles USER en DELETE | ❌ No permite | ❌ No permite |

### 20.5 Checklist de Verificación

| Aspecto | Estado | Notas |
| --------- | ------ | ----- |
| Server endpoints documentados | ✅ | 5 endpoints |
| Client hooks documentados | ✅ | 5 hooks RTK Query |
| Componentes documentados | ✅ | 3 componentes (FiltersForm, Datatable, Dialog con detalles dinámicos) |
| Validación server (Joi) | ✅ | 3 schemas |
| Validación client (Zod) | ✅ | 2 schemas (SaleSchema + SalesFiltersSchema) |
| Modelo de datos (Prisma) | ✅ | 2 modelos (sale + saleDetail) |
| Seguridad/Auth | ✅ | verifyToken + 4 permisos CRUD |
| Filtros documentados | ✅ | 5 filtros (clientId, fromDate, toDate, minTotal, maxTotal) |
| Bugs documentados | ✅ | 9 bugs (R-001 a R-009) |
| Tests | ❌ | Sin tests |
