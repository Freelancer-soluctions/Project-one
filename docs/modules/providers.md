# Módulo: Providers (Server + Client)

> Documentación técnica integral del módulo **Providers** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre tanto el backend (`apps/server/src/modules/providers/`) como el frontend (`apps/client/src/modules/providers/`).
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
| **Módulo** | `providers` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/providers/` |
| **Path Client** | `apps/client/src/modules/providers/` |
| **Base URL API** | `/api/v1/providers` |
| **Nombre BD** | `productProviders` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial del documento integral (server + client) siguiendo arc42/C4/IEEE 1016. Se documentan 5 endpoints server, 5 hooks RTK Query client, 3 componentes client, esquemas Joi/Zod, 1 modelo Prisma (productProviders). |

---

## 2. Introducción y Objetivos

### 2.1 Propósito

El módulo **Providers** gestiona el catálogo de proveedores del sistema. Proporciona operaciones CRUD completas con código único de 3 caracteres, información de contacto y estado activo/inactivo. Cada proveedor puede tener asociados productos (`products`), compras (`purchase`) y órdenes a proveedor (`providerOrder`).

Funcionalidades principales:

- **Registro de Proveedores**: Creación con código único, nombre, datos de contacto y dirección.
- **Código Único**: Cada proveedor tiene un código alfanumérico de 3 caracteres.
- **Estado Activo/Inactivo**: Control de disponibilidad del proveedor.
- **Catálogo para UI**: Listado completo para componentes de filtro.
- **Búsqueda y Filtrado**: Filtrado por nombre y estado con paginación server-side.
- **Auditoría**: Trazabilidad de creador y última modificación.

### 2.2 Alcance Funcional

| ID | Función | Actor | Cubre |
| ------ | ---------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| F-001 | Listar proveedores con filtros y paginación | ADMIN/MANAGER/USER | GET `/api/v1/providers` con `checkRoleAuthOrPermisssion(canViewProvider)` |
| F-002 | Obtener todos los proveedores (para filtros UI) | ADMIN/MANAGER/USER | GET `/api/v1/providers/providerFilters` con `checkRoleAuthOrPermisssion(canViewProvider)` |
| F-003 | Crear proveedor nuevo | ADMIN/MANAGER | POST `/api/v1/providers` con `checkRoleAuthOrPermisssion(canCreateProvider)` |
| F-004 | Actualizar proveedor | ADMIN/MANAGER | PATCH `/api/v1/providers/:id` con `checkRoleAuthOrPermisssion(canEditProvider)` |
| F-005 | Eliminar proveedor | ADMIN/MANAGER | DELETE `/api/v1/providers/:id` con `checkRoleAuthOrPermisssion(canDeleteProvider)` |

### 2.3 Alcance No Funcional

| ID | Requisito | Tipo |
| ------ | ------------------------------------------------------------ | --------- |
| Q-001 | Respuesta < 500ms para listados paginados con ≤ 1K registros | Performance |
| Q-002 | Unicidad de código (3 chars), nombre y email de contacto | Integridad |
| Q-003 | Timestamps de auditoría precisos y automáticos | Auditabilidad |

---

## 3. Contexto y Alcance

### 3.1 Diagrama de Contexto (C4 Nivel 1)

```
[Usuario Admin/Manager/User]
       |
       v
[Providers Module] --GET/POST/PATCH/DELETE--> [/api/v1/providers]
       |
       |-- [productProviders (PostgreSQL)]
       |-- 1:N --> [products]
       |-- 1:N --> [purchase]
       |-- 1:N --> [providerOrder]
```

### 3.2 Límites del Sistema

- **Incluido**: CRUD de proveedores, paginación, filtros, auditoría, control de roles/permisos.
- **No incluido**: Importación masiva, historial de cambios, catálogo de productos por proveedor.
- **Dependencias externas**: Tabla `users` (FK createdBy/updatedBy).
- **Dependencias internas**: `products` (1:N), `purchase` (1:N), `providerOrder` (1:N).

---

## 4. Restricciones

| ID | Restricción | Motivo |
| -- | ------------------------------------------------------------ | --------------------------------------------------- |
| C-01 | PostgreSQL como BD relacional | Stack definido (Prisma ORM) |
| C-02 | Express.js para la capa HTTP | Stack backend establecido |
| C-03 | React + RTK Query para el frontend | Stack frontend definido |
| C-04 | Autenticación vía JWT + middleware `verifyToken` | Seguridad corporativa |
| C-05 | Código único de 3 caracteres (`code`) | Identificador corto de proveedor |
| C-06 | Nombre de proveedor único | Integridad de datos |
| C-07 | Email de contacto único | Integridad de datos |

---

## 5. Stack Tecnológico

| Componente | Tecnología | Versión |
| ---------- | --------------------------------------------- | ------- |
| ORM | Prisma (`@prisma/client`) | ~6.x |
| Base de datos | PostgreSQL (via schema.prisma) | ~16.x |
| Validación server | Joi (schema propio en `schemas/providers.joi.js`) | ~17.x |
| Validación client | Zod + hookform/resolvers | ~3.x |
| HTTP Server | Express.js | ~4.x |
| API Client | RTK Query (Redux Toolkit) | ~2.x |
| UI Framework | React + shadcn/ui | ~18.x |
| Formularios | react-hook-form | ~7.x |

---

## 6. Arquitectura del Módulo (Overview)

### 6.1 Estructura de Directorios

```
apps/server/src/modules/providers/
├── routes.js                       # Router de Express (5 rutas, OpenAPI inline)
├── controller.js                   # Handlers HTTP (5 endpoints)
├── service.js                      # Lógica de negocio (5 métodos)
├── dao.js                          # Acceso a datos (raw SQL GET + Prisma CUD)
└── schemas/
    └── providers.joi.js            # Esquemas Joi (filters, create, update)
```

```
apps/client/src/modules/providers/
├── api/
│   └── providersAPI.js             # RTK Query (5 endpoints)
├── components/
│   ├── ProvidersDatatable.jsx      # Tabla de datos
│   ├── ProvidersDialog.jsx         # Diálogo crear/editar
│   ├── ProvidersFiltersForm.jsx    # Formulario de filtros
│   └── index.js                    # Barrel export
├── pages/
│   └── Providers.jsx               # Página principal
└── utils/
    ├── schema.js                   # Esquemas Zod
    ├── enums.js                    # Constantes (códigos, estados)
    └── index.js                    # Barrel (vacío)
```

### 6.2 Patrón Arquitectónico

```
Controller → Service → DAO → Prisma Client → PostgreSQL
     ^
     |
  Middleware (verifyToken, checkRoleAuthOrPermission, validateQueryParams/validateSchema/validatePathParam)
```

---

## 7. Vista de Building Blocks — Server

### 7.1 Router (`routes.js`)

| Método | Ruta | Middleware | Handler |
| ---------------- | ---------------------- | ------------------------------------------------------------ | ------------------------- |
| GET | `/` | `checkRoleAuthOrPermisssion(canViewProvider)`, `validateQueryParams(ProvidersFilters)` | `getAllProviders` |
| GET | `/providerFilters` | `checkRoleAuthOrPermisssion(canViewProvider)` | `getAllProvidersFilters` |
| POST | `/` | `checkRoleAuthOrPermisssion(canCreateProvider)`, `validateSchema(Providers)` | `createProvider` |
| PATCH | `/:id` | `checkRoleAuthOrPermisssion(canEditProvider)`, `validatePathParam`, `validateSchema(ProvidersUpdateSchema)` | `patchProviderById` |
| DELETE | `/:id` | `checkRoleAuthOrPermisssion(canDeleteProvider)`, `validatePathParam` | `deleteProviderById` |

- **Roles**: ADMIN, MANAGER, USER para lectura; ADMIN, MANAGER para escritura/eliminación.
- **Permisos**: `canViewProvider`, `canCreateProvider`, `canEditProvider`, `canDeleteProvider`.
- **OpenAPI docs**: Documentación inline para GET, POST, PATCH, DELETE.
- **Nota**: DELETE OpenAPI usa path `/api/v1/provider/{id}` (singular), inconsistente con la ruta real `/providers/{id}`.

### 7.2 Controller (`controller.js`)

| Función | Ruta | Request | Response | Auditoría |
| --------------------- | ---------------------- | ------------------------------ | --------------------- | ----------------------------- |
| `getAllProviders` | GET / | `req.safeQuery` (page, limit, name, status) | 200 + `{ dataList, total }` | No |
| `getAllProvidersFilters` | GET /providerFilters | (ninguno) | 200 + `Array<productProviders>` | No |
| `createProvider` | POST / | `req.body` + `req.userId` | 201 + `{ message }` | `createdBy: req.userId` |
| `patchProviderById` | PATCH /:id | `req.params.id` + `req.body` + `req.userId` | 200 + `{ message }` | `updatedBy: req.userId` |
| `deleteProviderById` | DELETE /:id | `req.params.id` | 200 + `{ message }` | No |

**Nota**: `createProvider` y `patchProviderById` retornan solo `{ message }`, no el objeto creado/actualizado (inconsistente con otros módulos).

### 7.3 Service (`service.js`)

| Función | Parámetros | Validación | Llama |
| --------------------- | ---------------------- | -------------------------------------------------- | ------------------------------- |
| `getAllProviders` | `{ name, status, limit, page }` | `getSafePagination` — lanza error si `!take \|\| take <= 0` | `productsDao.getAllProviders(name, status, take, skip)` |
| `getAllProvidersFilters` | — | Ninguna | `productsDao.getAllProvidersFilters()` |
| `createProvider` | `userId, data` | Conversión de tipos (String, Boolean) | `productsDao.createProvider(newProvider)` |
| `updateById` | `userId, id, data` | `Number(id)`, conversión de tipos | `productsDao.updateRow(provider, { id: rowId })` |
| `deleteById` | `id` | `Number(id)` | `productsDao.deleteRow({ id: rowId })` |

**Nota**: El service importa DAO como `productsDao` (nombre confuso, sugiere que pertenece a products).

### 7.4 DAO (`dao.js`)

#### getAllProviders (raw SQL + Prisma COUNT)

```sql
SELECT p.*,
       CASE WHEN p."status" = TRUE THEN 'ACTIVE' ELSE 'INACTIVE' END AS "statusText",
       u.name AS "userProvidersCreatedName",
       uu.name AS "userProvidersUpdatedName"
FROM "productProviders" p
LEFT JOIN "users" u ON p."createdBy" = u.id
LEFT JOIN "users" uu ON p."updatedBy" = uu.id
WHERE p."name" ILIKE '%name%' AND p."status" = true::boolean
ORDER BY p."createdOn" DESC
LIMIT ? OFFSET ?
```

- **Filtros**: `name` (ILIKE con `%`), `status` (boolean).
- **Total**: `prisma.productProviders.count({ where })`.

#### getAllProvidersFilters (Prisma ORM)

```js
prisma.productProviders.findMany(); // Sin filtros, sin paginación
```

#### createProvider (Prisma ORM)

```js
prisma.productProviders.create({
  data: { code, name, status, contactName, contactEmail, contactPhone, address, createdOn,
    userProvidersCreated: { connect: { id: createdBy } }
  }
});
```

#### updateRow (Prisma ORM)

```js
prisma.productProviders.update({
  where,  // { id }
  data: { code, name, status, contactName, contactEmail, contactPhone, address, updatedOn,
    userProvidersUpdated: { connect: { id: updatedBy } }
  }
});
```

#### deleteRow (Generic)

```js
prismaService.deleteRow(tableName, where);
// tableName = TABLESNAMES.PROVIDERS = 'productProviders'
```

---

## 8. Vista de Building Blocks — Client

### 8.1 RTK Query API (`providersAPI.js`)

| Endpoint | Hook | Método | Ruta | Tags |
| ---------------------- | ------------------------------------------- | ------ | ------------------------------- | ------------ |
| `getAllProviders` | `useLazyGetAllProvidersQuery` / `useGetAllProvidersQuery` | GET | `/providers` (params) | `['Providers']` |
| `getAllProvidersFilters` | `useGetAllProvidersFiltersQuery` | GET | `/providers/providerFilters` (params) | `['Providers']` |
| `createProvider` | `useCreateProviderMutation` | POST | `/providers/` | `['Providers']` |
| `updateProviderById` | `useUpdateProviderByIdMutation` | PATCH | `/providers/${id}` | `['Providers']` |
| `deleteProviderById` | `useDeleteProviderByIdMutation` | DELETE | `/providers/${id}` | `['Providers']` |

### 8.2 Page (`Providers.jsx`)

- `useEffect` reactivo para refetch en cambios de paginación/filtros.
- `pagination`: `{ pageIndex: 0, pageSize: 20 }`.
- `handleSubmitFilters`: reset a page 0 + actualiza filters.
- `dataStatus` del utils/enums.js para estados ACTIVE/INACTIVE.

### 8.3 Components

**ProvidersDatatable**: Columnas: `code`, `name`, `statusText`, `contactName`, `contactEmail`, `contactPhone`, `address`, `createdOn`, `updatedOn`.

**ProvidersDialog**: Campos: `code` (3 chars), `name`, `status` (toggle), `contactName`, `contactEmail`, `contactPhone`, `address`. Usa `dataStatus` para selector de estado.

**ProvidersFiltersForm**: Campos: `name`, `status` (selector con `dataStatus`).

### 8.4 Utils

**schema.js**:
```js
export const ProvidersDialogSchema = z.object({
  name: z.string().min(1, { message: '...' }),
  status: z.boolean({ message: '...' }),
}).passthrough();
```

**enums.js**:
```js
export const ProvidersCodes = { C01: 'C01', ..., C09: 'C09' };
export const dataStatus = [
  { value: true, description: 'ACTIVE' },
  { value: false, description: 'INACTIVE' },
];
```

---

## 9. Vista de Runtime y Flujo de Datos

*(Omitido por compacidad — sigue el mismo patrón CRUD con useEffect/reactivo de los otros módulos)*

---

## 10. Modelo de Datos

### 10.1 Entidad `productProviders`

| Columna | Tipo | Constraints | Descripción |
| -------------- | ------------ | ----------------------------------- | --------------------------------- |
| `id` | `Int` | PK, autoincrement | Identificador único |
| `code` | `String` | **UNIQUE**, `@db.VarChar(3)` | Código corto del proveedor |
| `name` | `String` | **UNIQUE**, `@db.VarChar(100)` | Nombre del proveedor |
| `createdOn` | `DateTime` | NOT NULL, `@db.Timestamp(3)` | Fecha de creación |
| `createdBy` | `Int` | FK → `users.id`, NOT NULL | Usuario creador |
| `updatedBy` | `Int?` | FK → `users.id`, nullable | Usuario última modificación |
| `updatedOn` | `DateTime?` | nullable, `@db.Timestamp(3)` | Fecha de última modificación |
| `status` | `Boolean` | DEFAULT `true` | Estado activo/inactivo |
| `contactName` | `String?` | nullable, `@db.VarChar(60)` | Nombre de contacto |
| `contactEmail` | `String?` | **UNIQUE**, `@db.VarChar(80)` | Email de contacto |
| `contactPhone` | `String?` | nullable, `@db.VarChar(15)` | Teléfono de contacto |
| `address` | `String?` | nullable, `@db.VarChar(120)` | Dirección |

### 10.2 Relaciones

```
productProviders 1──N products
productProviders 1──N purchase
productProviders 1──N providerOrder
productProviders N──1 users (createdBy)
productProviders N──1 users? (updatedBy)
```

---

## 11. Contratos de API

### 11.1 GET /api/v1/providers

**Query**: `page`, `limit`, `name`, `status` (boolean).

**Response 200**: `{ dataList: [...], total: N }` — incluye `statusText`, `userProvidersCreatedName`, `userProvidersUpdatedName`.

### 11.2 GET /api/v1/providers/providerFilters

**Response 200**: Array de `productProviders` sin paginación.

### 11.3 POST /api/v1/providers

**Body**: `{ code, name, status, contactName?, contactEmail?, contactPhone?, address? }`.

**Response 201**: `{ message: 'Item created successfully' }`.

### 11.4 PATCH /api/v1/providers/:id

**Body**: (campos parciales) `{ code?, name?, status?, contactName?, contactEmail?, contactPhone?, address? }`.

**Response 200**: `{ message: 'Item updated successfully' }`.

### 11.5 DELETE /api/v1/providers/:id

**Response 200**: `{ message: 'Item deleted successfully' }`.

---

## 12. Reglas de Validación y Esquemas

### 12.1 Joi (Server)

```js
ProvidersFilters:     name (max 80), status (boolean), limit, page
Providers (create):   code (max 3, required), name (max 100, required), status (boolean, required),
                      contactName (max 60, nullable), contactEmail (max 80, nullable),
                      contactPhone (max 15, nullable), address (max 120, nullable)
ProvidersUpdateSchema: (min 1 field) code, name, status, contactName, contactEmail, contactPhone, address
```

### 12.2 Zod (Client)

```js
ProvidersDialogSchema: name (string min 1), status (boolean required).passthrough()
```

**Nota**: Zod no valida `code`, `contactName`, `contactEmail`, `contactPhone`, `address` — solo `name` y `status`.

### 12.3 Discrepancias

| Campo | Joi (server) | Zod (client) | Impacto |
| --------- | ---------------------------- | ------------------ | ----------- |
| `code` | `string().max(3).required()` | No validado | Sin validación client-side |
| `name` | `string().max(100).required()` | `string().min(1)` | Sin maxLength en Zod |
| `contactEmail` | `string().max(80).nullable()` | No validado | Sin validación client-side |

---

## 13. Seguridad y Autorización

### 13.1 Autenticación

- `verifyToken` global en router (JWT obligatorio).

### 13.2 Autorización

| Endpoint | Roles | Permiso |
| ---------------- | --------------------------- | -------------------- |
| GET / | ADMIN, MANAGER, USER | `canViewProvider` |
| GET /providerFilters | ADMIN, MANAGER, USER | `canViewProvider` |
| POST / | ADMIN, MANAGER | `canCreateProvider` |
| PATCH /:id | ADMIN, MANAGER | `canEditProvider` |
| DELETE /:id | ADMIN, MANAGER | `canDeleteProvider` |

---

## 14. Manejo de Errores

| Error | Causa | Impacto |
| --------- | ------------------------------------------------------------- | ---------------------------------------- |
| P2002 | Código, nombre o email duplicado | Unique constraint violation → 500 |
| P2025 | DELETE/UPDATE de ID inexistente | Prisma error → 500 |
| P2003 | DELETE con relaciones hijas | Violación FK → 500 |
| Paginación | Sin `take` | `'Pagination is required'` → 500 |

---

## 15. Conceptos Transversales (Cross-Cutting)

- **Auditoría**: `createdBy`/`updatedBy` + `createdOn`/`updatedOn`.
- **Paginación**: `getSafePagination` + `useEffect` reactivo.
- **i18n**: `react-i18next` con claves como `providers`, `add_provider`, etc.
- **Cache**: RTK Query tag `'Providers'`, 5 min keepUnusedDataFor.
- **Generic DAO**: `prismaService.deleteRow` wrapper genérico para delete.

---

## 16. Requisitos de Calidad

- **Rendimiento**: < 500ms para listados paginados.
- **Cobertura de tests**: 0%.
- **Seguridad**: JWT + roles + permisos.

---

## 17. Decisiones de Diseño (ADRs)

### ADR-001: Tabla `productProviders` (no `providers`)

- **Contexto**: El módulo de proveedores usa la tabla `productProviders`, que combina proveedor con su relación a productos.
- **Decisión**: Mantener nombre existente por compatibilidad con relaciones heredadas.
- **Consecuencia**: Nombre confuso — sugiere una relación N:M producto-proveedor, no un catálogo de proveedores.

### ADR-002: Generic DAO wrapper (`prismaService.deleteRow`)

- **Contexto**: El delete usa una función genérica `prismaService.deleteRow` con nombre de tabla desde constantes.
- **Decisión**: Reutilizar DAO genérico para operaciones estándar.
- **Consecuencia**: Menos código duplicado pero menor visibilidad de la lógica de eliminación.

### ADR-003: Controller retorna `{ message }` en lugar del objeto

- **Contexto**: `createProvider` y `patchProviderById` retornan solo `{ message }`, no el objeto creado/actualizado.
- **Decisión**: Patrón minimalista de respuesta.
- **Consecuencia**: Inconsistente con otros módulos que retornan el objeto completo.

---

## 18. Riesgos y Deuda Técnica

### Bugs

| ID | Descripción | Severidad | Archivo |
| -- | ------------------------------------------------------------ | --------- | ------------------------------------------------- |
| R-001 | **Import name confuso**: Service importa DAO como `productsDao` en vez de `providersDao`. | LOW | `apps/server/src/modules/providers/service.js` |
| R-002 | **OpenAPI path incorrecto**: DELETE documenta `/api/v1/provider/{id}` (singular), ruta real es `/providers/{id}`. | LOW | `apps/server/src/modules/providers/routes.js` |
| R-003 | **Controller no retorna objeto creado**: create/update retornan `{ message }` no el registro. | MEDIUM | `apps/server/src/modules/providers/controller.js` |
| R-004 | **Zod no valida `code`**: Zod schema omite validación del campo `code`. | MEDIUM | `apps/client/src/modules/providers/utils/schema.js` |
| R-005 | **Sin manejo de errores Prisma unique**: Código/nombre/email duplicados causan 500. | HIGH | `apps/server/src/modules/providers/dao.js` |
| R-006 | **Sin tests**. | HIGH | — |

---

## 19. Glosario

| Término | Definición |
| --------- | --------------------------------------------------------------------------- |
| **productProviders** | Tabla PostgreSQL que almacena el catálogo de proveedores (nombre histórico). |
| **code** | Código alfanumérico único de 3 caracteres para identificar al proveedor. |
| **statusText** | Campo virtual generado en GET: `'ACTIVE'` o `'INACTIVE'`. |

---

## 20. Apéndices

### 20.1 Archivos

```
SERVER: routes.js (264), controller.js (98), service.js (97), dao.js (160), schemas/providers.joi.js (28)
CLIENT: api/providersAPI.js (66), pages/Providers.jsx (218), + 3 components, utils/schema.js, utils/enums.js
```

### 20.2 Enums Cliente

```js
ProvidersCodes = { C01..C09 }
dataStatus = [{ value: true, description: 'ACTIVE' }, { value: false, description: 'INACTIVE' }]
```

### 20.3 Stack Middlewares

`verifyToken` → `checkRoleAuthOrPermisssion` → `validateQueryParams/validateSchema/validatePathParam` → Controller → Service → DAO
