# Módulo: Purchase (Server + Client)

> Documentación técnica integral del módulo **Purchase** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre tanto el backend (`apps/server/src/modules/purchase/`) como el frontend (`apps/client/src/modules/purchase/`).
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
| **Módulo** | `purchase` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/purchase/` |
| **Path Client** | `apps/client/src/modules/purchase/` |
| **Base URL API** | `/api/v1/purchases` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial del documento integral (server + client) siguiendo arc42/C4/IEEE 1016. Se documentan 5 endpoints server, 5 hooks RTK Query client, 3 componentes client, esquemas Joi/Zod, 2 modelos Prisma (purchase + purchaseDetail). |

---

## 2. Introducción y Objetivos

### 2.1 Propósito

El módulo **Purchase** gestiona las compras a proveedores. Proporciona registro de compras con múltiples detalles (productos comprados), cálculo automático de totales basado en costo, vinculación con proveedores y seguimiento de auditoría. Estructuralmente es muy similar al módulo Sales pero orientado a abastecimiento.

Funcionalidades principales:

- **Registro de Compras**: Creación de compras con múltiples productos (detalles).
- **Cálculo Automático de Totales**: Total calculado como suma de `quantity * cost` de cada detalle.
- **Vinculación con Proveedores**: Asociación de cada compra a un proveedor (`productProviders`).
- **Gestión de Detalles**: Agregar/eliminar líneas de detalle en la UI.
- **Auto-costo**: Al seleccionar un producto, el costo se autocompleta desde el catálogo.
- **Filtros y Paginación**: Búsqueda por proveedor, rango de fechas y rango de totales.
- **Auditoría**: Trazabilidad de creador y última modificación.

### 2.2 Alcance Funcional

| ID | Función | Actor | Cubre |
| ------ | ---------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| F-001 | Listar compras con filtros y paginación | ADMIN/MANAGER | GET `/api/v1/purchases` con `checkRoleAuthOrPermisssion(canViewPurchase)` |
| F-002 | Crear compra con detalles | ADMIN/MANAGER | POST `/api/v1/purchases` con `checkRoleAuthOrPermisssion(canCreatePurchase)` |
| F-003 | Actualizar compra (datos + detalles) | ADMIN/MANAGER | PATCH `/api/v1/purchases/:id` con `checkRoleAuthOrPermisssion(canEditPurchase)` |
| F-004 | Eliminar compra | ADMIN/MANAGER | DELETE `/api/v1/purchases/:id` con `checkRoleAuthOrPermisssion(canDeletePurchase)` |
| F-005 | Eliminar detalle de compra | ADMIN/MANAGER | DELETE `/api/v1/purchases/detail/:id` con `checkRoleAuthOrPermisssion(canDeletePurchase)` |
| F-006 | Auto-costo al seleccionar producto | ADMIN/MANAGER | Cliente: `handleProductChange` asigna `product.cost` al detalle |

### 2.3 Dependencias

| Módulo | Relación | Detalle |
| --------- | ----------- | ------------------------------------------------------------------- |
| **Providers** | FK `providerId` | Cada compra pertenece a un proveedor (relación `purchaseProvider` → `productProviders`) |
| **Products** | FK `productId` en `purchaseDetail` | Cada detalle de compra es un producto (relación `purchaseDetailProduct`) |
| **Users** | FK `createdBy` / `updatedBy` | Auditoría de creación y modificación |
| **InventoryMovement** | FK `purchaseId` | Vinculación opcional con movimientos de inventario |
| **ProviderOrder** | Relación inversa | Una compra puede tener órdenes de proveedor asociadas |

---

## 3. Contexto y Alcance

### 3.1 Contexto de Negocio

El módulo Purchase captura transacciones de compra a proveedores. A diferencia de Sales (que usa precio de venta), Purchase usa el costo del producto. El precio del detalle se auto-asigna desde `product.cost` para reflejar el costo de adquisición. Es el punto de entrada del inventario en el ciclo de abastecimiento.

### 3.2 Límites del Módulo

**Incluye:**
- CRUD completo de compras con detalles anidados
- Filtros por proveedor, rango de fechas, rango de totales
- Auto-costo desde catálogo de productos
- Cálculo automático de total en UI
- Prevención de productos duplicados en una misma compra
- Paginación con metadatos correctos (`{ dataList, total }`)
- Eliminación individual de detalles

**No incluye:**
- Vinculación automática con InventoryMovement
- Workflow de aprobación de compras
- Recepción parcial de productos
- Órdenes de compra vs compras directas
- Descuentos por línea de detalle
- Historial de cambios por detalle

---

## 4. Restricciones

| ID | Restricción | Tipo |
| --- | -------------------------------------------------------------------------------- | --------- |
| R-01 | PostgreSQL como única base de datos soportada (Prisma ORM) | Técnica |
| R-02 | Paginación obligatoria en GET — `getSafePagination` requiere `limit` y `page` | Técnica |
| R-03 | `total` y `price` como `Decimal(18,2)` en BD | Datos |
| R-04 | `purchaseDetail` tiene `onDelete: Cascade` — eliminar compra elimina detalles | Datos |
| R-05 | Autenticación JWT obligatoria en todos los endpoints | Seguridad |
| R-06 | **Todos los endpoints** restringidos a ADMIN/MANAGER (USER sin acceso) | Autorización |

---

## 5. Stack Tecnológico

| Capa | Tecnología | Versión | Uso |
| -------- | ------------ | ------- | ------------------------------------------------------ |
| Server Runtime | Node.js | — | Entorno de ejecución del backend |
| Server Framework | Express.js | — | Router HTTP y middleware pipeline |
| ORM | Prisma | — | `prisma.purchase.*`, `prisma.purchaseDetail.*` |
| DB | PostgreSQL | — | Persistencia de datos |
| Validation | Joi | — | Esquemas de validación en server (`purchase.joi.js`) |
| Auth | JWT + custom middleware | — | `verifyToken`, `checkRoleAuthOrPermisssion` |
| Client Runtime | React 18 | — | UI del módulo |
| Client State | Redux Toolkit (RTK Query) | — | API calls y caching (`purchaseAPI.js`) |
| Client Forms | react-hook-form + Zod | — | Validación de formularios client-side |
| Client UI | shadcn/ui + Tailwind | — | Componentes de UI |
| Client Dates | date-fns | — | Formateo de fechas |
| Client i18n | react-i18next | — | Traducciones |

---

## 6. Arquitectura del Módulo (Overview)

### 6.1 C4 Nivel 1 (Contexto)

```
[Usuario Autenticado] --> [Purchase API /api/v1/purchases]
    |
    |--> [GET /] con filtros → PostgreSQL (Prisma findMany + count)
    |--> [POST /] Crear compra + detalles → PostgreSQL (Prisma create nested)
    |--> [PATCH /:id] Actualizar compra + detalles → PostgreSQL (Prisma update)
    |--> [DELETE /:id] Eliminar compra + detalles cascade
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
[Purchase.jsx (Page)]
    |
    |--> [PurchaseFiltersForm] → react-hook-form + Zod → 5 filtros
    |--> [PurchaseDatatable] → DataTable → 7 columnas
    |--> [PurchaseDialog] → react-hook-form + Zod → CRUD + detalles dinámicos
    |
    v
[purchaseAPI.js (RTK Query)]
    |
    v
[Purchase API /api/v1/purchases]
```

---

## 7. Vista de Building Blocks — Server

### 7.1 Estructura de Archivos

```
apps/server/src/modules/purchase/
├── routes.js              # Definición de rutas + middleware + OpenAPI docs
├── controller.js          # Handlers HTTP (5 funciones exportadas)
├── service.js             # Lógica de negocio (5 funciones exportadas)
├── dao.js                 # Acceso a datos (Prisma ORM)
└── schemas/
    └── purchase.joi.js    # Esquemas de validación Joi (3 schemas)
```

### 7.2 Capa de Rutas (`routes.js`)

**Middleware global:** `router.use(verifyToken)` — todas las rutas requieren JWT.

| Método | Ruta | Middleware Adicional | Handler | Permiso |
| ------ | ------- | ------------------------------- | --------------- | --------------- |
| GET | `/` | `checkRoleAuthOrPermisssion(canViewPurchase)`, `validateQueryParams(purchaseFiltersSchema)` | `getAllPurchases` | canViewPurchase |
| POST | `/` | `checkRoleAuthOrPermisssion(canCreatePurchase)`, `validateSchema(purchaseCreateSchema)` | `createPurchase` | canCreatePurchase |
| PATCH | `/:id` | `checkRoleAuthOrPermisssion(canEditPurchase)`, `validatePathParam`, `validateSchema(purchaseUpdateSchema)` | `patchPurchaseById` | canEditPurchase |
| DELETE | `/:id` | `checkRoleAuthOrPermisssion(canDeletePurchase)`, `validatePathParam` | `deletePurchaseById` | canDeletePurchase |
| DELETE | `/:id` (duplicado) | `checkRoleAuthOrPermisssion(canDeletePurchase)`, `validatePathParam` | `deletePurchaseById` | canDeletePurchase |
| DELETE | `/detail/:id` | `checkRoleAuthOrPermisssion(canDeletePurchase)`, `validatePathParam` | `deletePurchaseDetailById` | canDeletePurchase |

**Roles permitidos:** ADMIN, MANAGER (USER sin acceso a ningún endpoint).

**⚠️ Bug R-001:** Ruta DELETE `/:id` duplicada (líneas 225-233 y 259-267) — Express solo ejecuta la primera. La segunda es código muerto.

**⚠️ Bug R-002:** OpenAPI docs con base path `/v1/purchases` sin prefijo `/api`.

### 7.3 Capa de Controlador (`controller.js`)

5 funciones exportadas, todas envueltas en `handleCatchErrorAsync`:

| Función | Parámetros | Respuesta |
| ----------- | ---------- | --------- |
| `getAllPurchases` | `req.safeQuery` | `globalResponse(res, 200, purchases)` |
| `createPurchase` | `req.body` + `req.user.id` | `globalResponse(res, 201, purchase)` |
| `patchPurchaseById` | `req.params.id`, `req.body` + `req.user.id` | `globalResponse(res, 200, purchase)` |
| `deletePurchaseById` | `req.params.id` | `globalResponse(res, 200, ...)` |
| `deletePurchaseDetailById` | `req.params.id` | `globalResponse(res, 200, ...)` |

**⚠️ Bug R-003:** Usa `req.user.id` en lugar de `req.userId` (como otros módulos). Puede funcionar o no según cómo el middleware JWT configure `req.user`.

### 7.4 Capa de Servicio (`service.js`)

Delegación directa a DAO sin transformación de datos (a diferencia de Sales que convierte tipos):

- **`getAllPurchases`**: Extrae paginación vía `getSafePagination`, delega a DAO
- **`createPurchase`**: Delegación directa a DAO (sin agregar `createdOn`)
- **`patchPurchaseById`**: Delegación directa a DAO
- **`deletePurchaseById`**: Delegación directa a DAO
- **`deletePurchaseDetailById`**: Delegación directa a DAO

**⚠️ Bug R-004:** `createPurchase` service no setea `createdOn: new Date()` — el campo NOT NULL en BD puede causar error.

### 7.5 Capa de Acceso a Datos (`dao.js`)

**Prisma ORM** exclusivamente.

#### `getAllPurchases` — Prisma findMany + count

```js
prisma.purchase.findMany({
  where: {
    ...(providerId && { providerId }),
    ...(startDate && { createdOn: { gte: startDate } }),
    ...(endDate && { createdOn: { lte: endDate } }),
    ...(minTotal && { total: { gte: minTotal } }),
    ...(maxTotal && { total: { lte: maxTotal } }),
  },
  include: {
    provider: true,
    details: { include: { product: true } },
  },
  orderBy: { createdOn: 'desc' },
  take,
  skip,
});

const total = prisma.purchase.count({ where });
return { dataList: purchases, total };
```

**Paginación correcta** con COUNT separado — a diferencia de Sales.

**⚠️ Bug R-005:** Filtros `startDate`/`endDate` en DAO esperan nombres del Joi, pero el cliente envía `fDate`/`tDate`. Filtros de fecha inoperantes.

#### `createPurchase` — Prisma nested create

```js
prisma.purchase.create({
  data: { ...purchaseData, details: { create: details } },
  include: { provider: true, details: { include: { product: true } } },
});
```

#### `patchPurchaseById` — Prisma update con reemplazo de detalles

```js
// Update purchase fields
prisma.purchase.update({ where: { id }, data: updateData });

// If details present: delete all + recreate
prisma.purchaseDetail.deleteMany({ where: { purchaseId: id } });
if (details.length > 0) {
  prisma.purchase.update({ where: { id }, data: { details: { create: details } } });
}

// Return with includes
prisma.purchase.findUnique({ where: { id }, include: ... });
```

**⚠️ Bug R-006:** PATCH elimina y recrea todos los detalles si `details` está presente — mismo riesgo que Sales.

#### `deletePurchaseById` — Prisma delete con cascade

```js
await prisma.purchaseDetail.deleteMany({ where: { purchaseId: id } });
prisma.purchase.delete({ where: { id } });
```

**⚠️** Redundante con `onDelete: Cascade` en el modelo.

#### `deletePurchaseDetailById` — Prisma delete

```js
prisma.purchaseDetail.delete({ where: { id } });
```

---

## 8. Vista de Building Blocks — Client

### 8.1 Estructura de Archivos

```
apps/client/src/modules/purchase/
├── api/
│   └── purchaseAPI.js                  # RTK Query (5 endpoints)
├── pages/
│   └── Purchase.jsx                    # Página principal
├── components/
│   ├── PurchaseFiltersForm.jsx          # Formulario de filtros (5 campos)
│   ├── PurchaseDatatable.jsx            # Tabla de datos (7 columnas)
│   └── PurchaseDialog.jsx               # Dialog con detalles dinámicos
└── utils/
    └── schema.js                        # Zod schemas (PurchaseSchema + PurchaseFiltersSchema)
```

### 8.2 RTK Query API (`purchaseAPI.js`)

```js
const purchaseApi = createApi({
  reducerPath: 'purchaseApi',
  baseQuery: axiosPrivateBaseQuery({ baseUrl: '...' }),
  tagTypes: ['Purchases'],
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({ ... })
})
```

**Endpoints mapeados:**

| Hook | Método | Ruta | Query/Body | Tags |
| ----- | ------ | ------- | ----------- | ---- |
| `useLazyGetAllPurchasesQuery` | GET | `/purchases` | `params` | `providesTags: ['Purchases']` |
| `useCreatePurchaseMutation` | POST | `/purchases/` | `body: data` | `invalidatesTags: ['Purchases']` |
| `useUpdatePurchaseByIdMutation` | PATCH | `/purchases/:id` | `{ id, data }` | `invalidatesTags: ['Purchases']` |
| `useDeletePurchaseByIdMutation` | DELETE | `/purchases/:id` | `id` | `invalidatesTags: ['Purchases']` |
| `useDeletePurchaseDetailByIdMutation` | DELETE | `/purchases/detail/:id` | `id` | `invalidatesTags: ['Purchases']` |

### 8.3 Página Principal (`Purchase.jsx`)

Estructuralmente idéntica a Sales.jsx con las diferencias:
- Usa `useGetAllProvidersFiltersQuery` en lugar de `useGetAllClientsFiltersQuery`
- Usa `dataPurchases` en lugar de `dataSales`
- Detalles con `productId`, `quantity`, `price` (donde price = cost del producto)

### 8.4 Componentes

#### PurchaseFiltersForm

Mismo patrón que SalesFiltersForm:

| Campo | Tipo | Placeholder |
| ----- | ---- | ----------- |
| `providerId` | Select | `select_provider` |
| `fromDate` | DatePicker | `from_date` |
| `toDate` | DatePicker | `to_date` |
| `minTotal` | Input number | `min_total_placeholder` |
| `maxTotal` | Input number | `max_total_placeholder` |

**Submit transform:** Convierte `fromDate`/`toDate` a ISO string y envía como `fDate`/`tDate`.

**⚠️ Bug R-005:** Mismo problema que Sales — envía `fDate`/`tDate` pero Joi/DAO esperan `startDate`/`endDate`.

#### PurchaseDatatable

7 columnas, mismo patrón que SalesDatatable:

| Columna | Accessor | Formato |
| --------- | ------------ | --------- |
| provider | `provider.name` | `toUpperCase()` |
| total | `total` | COP currency |
| products | `purchaseDetail` | `length \|\| 0` |
| createdOn | `createdOn` | `format(new Date(), 'PPP')` |
| createdBy | `userPurchaseCreated.name` | `toUpperCase()` |
| updatedOn | `updatedOn` | `format(new Date(), 'PPP')` o null |
| updatedBy | `userPurchaseUpdated.name` | `toUpperCase()` |

Paginación funcional: `totalRows={total}` (DAO retorna `{ dataList, total }` correctamente).

#### PurchaseDialog

Estructuralmente idéntico a SalesDialog con diferencias clave:

| Aspecto | Sales | Purchase |
| --------- | ----- | --------- |
| Auto-precio | `selectedProduct.price` | `selectedProduct.cost` |
| Título icono | `LuShoppingCart` | `LuShoppingCart` |
| Provider/cliente label | `clients` prop | `providers` prop |
| User field names | `userSaleCreated` / `userSaleUpdated` | `userPurchaseCreated` / `userPurchaseUpdated` |

---

## 9. Vista de Runtime y Flujo de Datos

### 9.1 Flujo: Listar Compras

```
[Usuario] → [Purchase.jsx useEffect]
  → useLazyGetAllPurchasesQuery({ page, limit, providerId, fDate, tDate, ... })
  → GET /api/v1/purchases?page=1&limit=20&providerId=5
  → [verifyToken] → [checkRoleAuthOrPermisssion(canViewPurchase)]
  → [validateQueryParams(purchaseFiltersSchema)] (fDate/tDate no matchean startDate/endDate)
  → [getAllPurchases controller → service → DAO]
  → [prisma.purchase.findMany + count] (paginación correcta)
  → Response: { dataList: [...], total: N } → [PurchaseDatatable]
```

### 9.2 Flujo: Crear Compra

```
[Usuario] → [PurchaseDialog] → selecciona proveedor, agrega productos
  → [handleProductChange] auto-asigna product.cost al detalle
  → [calculateTotal] suma cost*quantity → campo total deshabilitado
  → handleSubmit(data) → createPurchase(data).unwrap()
  → POST /api/v1/purchases
  → [verifyToken] → [checkRoleAuthOrPermisssion(canCreatePurchase)]
  → [validateSchema(purchaseCreateSchema)] Joi
  → [createPurchase controller → service → DAO]
  → [prisma.purchase.create nested] (sin createdOn — Bug R-004)
  → Response 201 → refetch
```

### 9.3 Mapa de Estados (State Machine)

Mismo patrón que Sales: Idle → Loading → Data → Dialog (create/edit) → refetch.

---

## 10. Modelo de Datos

### 10.1 Modelos Prisma

```prisma
model purchase {
  id                  Int                 @id @default(autoincrement())
  providerId          Int                 @db.Integer
  total               Decimal             @db.Decimal(18, 2)
  createdOn           DateTime            @db.Timestamp(3)
  updatedOn           DateTime?           @db.Timestamp(3)
  purchaseDetail      purchaseDetail[]    @relation("purchaseDetail")
  provider            productProviders    @relation("purchaseProvider", fields: [providerId], references: [id])
  userPurchaseCreated users               @relation("userPurchaseCreated", fields: [createdBy], references: [id])
  createdBy           Int                 @db.Integer
  userPurchaseUpdated users?              @relation("userPurchaseUpdated", fields: [updatedBy], references: [id])
  updatedBy           Int?                @db.Integer
  inventoryMovement   inventoryMovement[] @relation("inventoryMovementPurchase")
  providerOrder       providerOrder[]
}

model purchaseDetail {
  id         Int      @id @default(autoincrement())
  purchaseId Int
  productId  Int
  quantity   Int
  price      Decimal  @db.Decimal(18, 2)
  purchase   purchase @relation("purchaseDetail", fields: [purchaseId], references: [id], onDelete: Cascade)
  product    products @relation("purchaseDetailProduct", fields: [productId], references: [id])
}
```

### 10.2 Diagrama ER

```
┌─────────────────────────┐
│        purchase         │
├─────────────────────────┤
│ id (PK)                 │
│ providerId (FK) ────────┼───→ productProviders (id)
│ total (Decimal(18,2))   │
│ createdOn (TS)          │
│ updatedOn (TS?)         │
│ createdBy (FK) ─────────┼───→ users (id) "userPurchaseCreated"
│ updatedBy (FK?) ────────┼───→ users (id) "userPurchaseUpdated"
│                         │
│ 1│┐                    │
└──┼──────────────────────┘
   │
   │ 1:N
   │
┌──┼──────────────────────┐
│  ││   purchaseDetail    │
├──┼──────────────────────┤
│  └── purchaseId (FK)    │
│      productId (FK) ──────── products (id)
│      quantity (Int)     │
│      price (Decimal(18,2))│
└─────────────────────────┘
```

### 10.3 Mapeo de Tipos

| Campo | Prisma | PostgreSQL | Joi | Zod Client |
| --------- | --------- | ------------ | ----- | ----------- |
| id | Int | INTEGER | — | — |
| providerId | Int | INTEGER | number().integer() | string().min(1) |
| total | Decimal | DECIMAL(18,2) | number().min(0) | string → number().int() |
| productId | Int | INTEGER | number().integer() | string().min(1) |
| quantity | Int | INTEGER | number().integer().min(1) | string → number().int().min(1) |
| price | Decimal | DECIMAL(18,2) | number().min(0) | string → number().int().min(0) |

**⚠️ Bug R-007:** Zod schema usa `.int()` para `total` y `price` pero en BD son `Decimal(18,2)` — pérdida de decimales.

### 10.4 Índices y Constraints

| Nombre | Tipo | Columnas |
| --------- | ---- | ----------- |
| PK | PRIMARY KEY | `(id)` — purchase |
| FK | FOREIGN KEY | `providerId` → `productProviders(id)` |
| FK | FOREIGN KEY | `createdBy` → `users(id)` |
| FK | FOREIGN KEY | `updatedBy` → `users(id)` |
| PK | PRIMARY KEY | `(id)` — purchaseDetail |
| FK | FOREIGN KEY | `purchaseId` → `purchase(id)` ON DELETE CASCADE |
| FK | FOREIGN KEY | `productId` → `products(id)` |

---

## 11. Contratos de API

### 11.1 GET /api/v1/purchases — Listar compras

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
| ----------- | ------ | --------- | --------------- |
| page | number | Sí | Número de página |
| limit | number | Sí | Items por página |
| providerId | number | No | Filtrar por proveedor |
| startDate | ISO date | No | Fecha inicio (createdOn gte) |
| endDate | ISO date | No | Fecha fin (createdOn lte) |
| minTotal | number | No | Total mínimo |
| maxTotal | number | No | Total máximo |

**Response 200:**

```json
{
  "error": false,
  "statusCode": 200,
  "data": {
    "dataList": [
      {
        "id": 1,
        "providerId": 3,
        "total": 500000.00,
        "createdOn": "2026-01-15T10:00:00.000Z",
        "updatedOn": null,
        "provider": { "id": 3, "name": "Provider A" },
        "purchaseDetail": [
          { "id": 1, "productId": 10, "quantity": 10, "price": 25000.00, "product": { ... } }
        ],
        "userPurchaseCreated": { "name": "John Doe" },
        "userPurchaseUpdated": null
      }
    ],
    "total": 1
  }
}
```

### 11.2 POST /api/v1/purchases — Crear compra

**Request Body:**

```json
{
  "providerId": 3,
  "details": [
    { "productId": 10, "quantity": 10, "price": 25000 }
  ]
}
```

### 11.3 PATCH /api/v1/purchases/:id — Actualizar

**Request Body:** (parcial)

```json
{
  "details": [
    { "productId": 10, "quantity": 15, "price": 25000 }
  ]
}
```

### 11.4 DELETE /api/v1/purchases/:id — Eliminar compra

**Response 200:** `{ "message": "Purchase deleted successfully" }`

### 11.5 DELETE /api/v1/purchases/detail/:id — Eliminar detalle

**Response 200:** `{ "message": "Purchase detail deleted successfully" }`

---

## 12. Reglas de Validación y Esquemas

### 12.1 Server — Joi (`purchase.joi.js`)

#### `purchaseFiltersSchema`

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| providerId | number | `.integer().optional()` |
| startDate | date | `.iso().optional()` |
| endDate | date | `.iso().optional()` |
| minTotal | number | `.min(0).optional()` |
| maxTotal | number | `.min(0).optional()` |
| limit | number | `.integer()` |
| page | number | `.integer()` |

#### `purchaseCreateSchema`

| Campo | Tipo | Reglas |
| --------- | ------ | --------- |
| providerId | number | `.integer().required()` |
| total | number | `.min(0).required()` |
| details | array | `.required().min(1)` |
| details[].productId | number | `.integer().required()` |
| details[].quantity | number | `.integer().min(1).required()` |
| details[].price | number | `.min(0).required()` |

#### `purchaseUpdateSchema`

Mismos campos, todos `.optional()`.

### 12.2 Client — Zod (`schema.js`)

**`PurchaseSchema`:** Idéntico a SalesSchema (solo cambia prefijo i18n `zod.purchase.*`).

```ts
providerId: z.string().min(1)
total: z.string().min(1).transform(Number).pipe(z.number().int().min(0))
details: z.array(z.object({
  productId: z.string().min(1),
  quantity: z.string().min(1).transform(Number).pipe(z.number().int().min(1)),
  price: z.string().min(1).transform(Number).pipe(z.number().int().min(0)),
}))
```

**`PurchaseFiltersSchema`:** Idéntico a SalesFiltersSchema.

### 12.3 Field Limits

Sin límites específicos para Purchase (los mismos que Sales: `Decimal(18,2)` en BD).

---

## 13. Seguridad y Autorización

### 13.1 Autenticación

- Middleware `verifyToken` global via `router.use(verifyToken)`

### 13.2 Permisos CRUD

| Acción | Permiso | Roles |
| --------- | ----------- | ----- |
| Ver compras | `canViewPurchase` | ADMIN, MANAGER |
| Crear compra | `canCreatePurchase` | ADMIN, MANAGER |
| Editar compra | `canEditPurchase` | ADMIN, MANAGER |
| Eliminar compra | `canDeletePurchase` | ADMIN, MANAGER |

**Diferencia clave con Sales:** USER no tiene acceso a ningún endpoint de Purchase.

### 13.3 OWASP Consideraciones

Mismos riesgos que Sales (IDOR, mass assignment mitigado por Joi).

---

## 14. Manejo de Errores

### 14.1 Patrón General

- `handleCatchErrorAsync` en controller
- Errores Joi manejados por middleware
- Errores Prisma sin manejo específico

**⚠️ Bug R-008:** Sin manejo de Prisma `P2025` (not found) — devuelve 500 en lugar de 404.

---

## 15. Conceptos Transversales (Cross-Cutting)

### 15.1 Paginación

- DAO: `findMany` + `count` con mismos filtros → `{ dataList, total }` ✅
- Client: `totalRows={total}` funcional a diferencia de Sales

### 15.2 i18n

Claves como `add_purchase`, `edit_purchase`, `zod.purchase.*`, `provider`, `select_provider`.

### 15.3 Auditoría

- `createdBy` seteado en controller (`req.user.id`), pero `createdOn` NO se setea en service (Bug R-004)
- `updatedBy` seteado en controller, `updatedOn` NO se setea en service
- Nombres de usuarios incluidos vía `include`

### 15.4 Costo vs Precio

Purchase usa `product.cost` (costo de adquisición) mientras Sales usa `product.price` (precio de venta). Esto es correcto del punto de vista de negocio.

---

## 16. Requisitos de Calidad

| ID | Atributo | Escenario | Métrica |
| --- | ----------- | ------------ | --------- |
| Q-01 | Rendimiento | GET con findMany + count | < 200ms para 10K |
| Q-02 | Consistencia | Costo congelado en detalle al momento de compra | No cambia post-compra |
| Q-03 | Seguridad | Todos los endpoints solo ADMIN/MANAGER | USER sin acceso |
| Q-04 | Cobertura | Sin tests | ❌ 0% |

---

## 17. Decisiones de Diseño (ADRs)

### ADR-001: Purchase como Gemelo de Sales

| Contexto | Purchase y Sales tienen estructura casi idéntica |
| ----------- | ------------------------------------------------ |
| Decisión | Mantener módulos separados pero con misma arquitectura |
| Consecuencia | + Código familiar entre módulos. - Duplicación de lógica. Riesgo de drift (bugs corregidos en uno no se replican en el otro) |

### ADR-002: Costo vs Precio en Auto-asignación

| Contexto | Purchase asigna `product.cost` al detalle, Sales asigna `product.price` |
| ----------- | ----------------------------------------------------------------------- |
| Decisión | Cada módulo usa su campo de negocio correspondiente |
| Consecuencia | + Precisión contable. Purchase usa costo de adquisición, Sales usa precio de venta |

### ADR-003: Servicio Sin Transformación

| Contexto | Purchase service no convierte tipos ni setea timestamps (a diferencia de Sales) |
| ----------- | ------------------------------------------------------------------------------- |
| Decisión | Delegar todo al DAO (actual) |
| Consecuencia | - `createdOn` no se setea (Bug R-004). - Inconsistencia con Sales que sí transforma |

---

## 18. Riesgos y Deuda Técnica

### 18.1 Bugs Conocidos

| ID | Severidad | Descripción | Archivo | Línea |
| --- | --------- | ----------- | --------- | ----- |
| **R-001** | 🟢 **Info** | Ruta DELETE `/:id` duplicada (2 handlers). Express solo ejecuta el primero. | `routes.js` | L225-233, L259-267 |
| **R-002** | 🟢 **Info** | OpenAPI docs con base path `/v1/purchases` sin prefijo `/api` | `routes.js` | L29 |
| **R-003** | 🟠 **Medium** | Controller usa `req.user.id` en vez de `req.userId` — posible error si middleware usa `userId` | `controller.js` | L47, L102 |
| **R-004** | 🟠 **Medium** | Service `createPurchase` no setea `createdOn: new Date()` — campo NOT NULL en BD → posible error | `service.js` | L46-48 |
| **R-005** | 🟡 **Low** | Cliente envía `fDate`/`tDate` pero Joi/DAO esperan `startDate`/`endDate`. Filtros de fecha inoperantes. | `PurchaseFiltersForm.jsx` vs `purchase.joi.js` | L54-57 vs L35-36 |
| **R-006** | 🟠 **Medium** | PATCH con `details` elimina y recrea TODOS los detalles — posible pérdida de datos | `dao.js` | L106-123 |
| **R-007** | 🟡 **Low** | Zod schema usa `.int()` para `total` y `price` — pérdida de decimales (BD es Decimal(18,2)) | `schema.js` | L16, L41 |
| **R-008** | 🟠 **Medium** | Sin manejo de Prisma `P2025` (not found) — devuelve 500 en lugar de 404 | `dao.js` | — |
| **R-009** | 🟢 **Info** | Sin tests unitarios ni de integración | — | — |

### 18.2 Deuda Técnica

| ID | Deuda | Impacto | Esfuerzo estimado |
| --- | ----- | --------- | ----------------- |
| D-01 | `req.user.id` vs `req.userId` (R-003) | Funcional — posible 401 | Bajo (unificar) |
| D-02 | Sin `createdOn` en create (R-004) | Funcional — error BD | Bajo (agregar en service) |
| D-03 | Filtros de fecha rotos (R-005) | Funcional — filtros no funcionan | Bajo (alias nombres) |
| D-04 | Duplicación con Sales module | Mantenibilidad — bugs se replican | Alto (refactor compartido) |

---

## 19. Glosario

| Término | Definición |
| --------- | ------------ |
| **Compra (Purchase)** | Transacción de abastecimiento con un proveedor |
| **Detalle de Compra (PurchaseDetail)** | Línea individual: producto + cantidad + costo |
| **Costo (Cost)** | Precio de adquisición del producto (de `products.cost`) |
| **Proveedor (Provider)** | Entidad `productProviders` que suministra productos |

---

## 20. Apéndices

### 20.1 Referencias

| Recurso | Ubicación |
| --------- | ----------- |
| Prisma Models | `apps/server/prisma/schema.prisma` (línea 426 model `purchase`, línea 442 model `purchaseDetail`) |
| Server Routes | `apps/server/src/modules/purchase/routes.js` |
| Server Controller | `apps/server/src/modules/purchase/controller.js` |
| Server Service | `apps/server/src/modules/purchase/service.js` |
| Server DAO | `apps/server/src/modules/purchase/dao.js` |
| Server Joi Schemas | `apps/server/src/modules/purchase/schemas/purchase.joi.js` |
| Client API | `apps/client/src/modules/purchase/api/purchaseAPI.js` |
| Client Page | `apps/client/src/modules/purchase/pages/Purchase.jsx` |
| Client Filters | `apps/client/src/modules/purchase/components/PurchaseFiltersForm.jsx` |
| Client Datatable | `apps/client/src/modules/purchase/components/PurchaseDatatable.jsx` |
| Client Dialog | `apps/client/src/modules/purchase/components/PurchaseDialog.jsx` |
| Client Zod Schema | `apps/client/src/modules/purchase/utils/schema.js` |
| Permissions Constants | `apps/server/src/utils/constants/enums.js` |

### 20.2 Endpoints Resumidos

| Método | Ruta | Permiso | Roles | Uso |
| ------ | ------- | --------- | ----- | ---- |
| GET | `/api/v1/purchases` | canViewPurchase | ADMIN, MANAGER | Listar compras |
| POST | `/api/v1/purchases` | canCreatePurchase | ADMIN, MANAGER | Crear compra |
| PATCH | `/api/v1/purchases/:id` | canEditPurchase | ADMIN, MANAGER | Actualizar compra |
| DELETE | `/api/v1/purchases/:id` | canDeletePurchase | ADMIN, MANAGER | Eliminar compra |
| DELETE | `/api/v1/purchases/detail/:id` | canDeletePurchase | ADMIN, MANAGER | Eliminar detalle |

### 20.3 Hooks RTK Exportados

```js
useLazyGetAllPurchasesQuery           // GET /purchases (con params)
useCreatePurchaseMutation             // POST /purchases/
useUpdatePurchaseByIdMutation         // PATCH /purchases/:id
useDeletePurchaseByIdMutation         // DELETE /purchases/:id
useDeletePurchaseDetailByIdMutation   // DELETE /purchases/detail/:id
```

### 20.4 Comparativa Sales vs Purchase

| Aspecto | Sales | Purchase |
| --------- | ----- | --------- |
| Roles USER | GET, POST, PATCH | ❌ Sin acceso |
| Auto-asignación precio | `product.price` | `product.cost` |
| Paginación COUNT | ❌ Sin COUNT | ✅ Con COUNT |
| `createdOn` set | ✅ (service) | ❌ No setea |
| Auth object | `req.userId` | `req.user.id` |
| Ruta DET duplicada | ❌ No | ✅ Sí (R-001) |
| Entidad foránea | `clients` | `productProviders` |
| OpenAPI decorator | `@swagger` | `@openapi` |
| Filtros fecha en Joi | `fromDate`/`toDate` | `startDate`/`endDate` |

### 20.5 Checklist de Verificación

| Aspecto | Estado | Notas |
| --------- | ------ | ----- |
| Server endpoints documentados | ✅ | 5 endpoints |
| Client hooks documentados | ✅ | 5 hooks RTK Query |
| Componentes documentados | ✅ | 3 componentes |
| Validación server (Joi) | ✅ | 3 schemas |
| Validación client (Zod) | ✅ | 2 schemas |
| Modelo de datos (Prisma) | ✅ | 2 modelos |
| Seguridad/Auth | ✅ | verifyToken + 4 permisos CRUD |
| Filtros documentados | ✅ | 5 filtros |
| Bugs documentados | ✅ | 9 bugs (R-001 a R-009) |
| Tests | ❌ | Sin tests |
