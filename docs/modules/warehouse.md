# Módulo: Warehouse (Server + Client)

> Documentación técnica integral del módulo **Warehouse** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre tanto el backend (`apps/server/src/modules/warehouse/`) como el frontend (`apps/client/src/modules/warehouse/`).
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
| **Módulo** | `warehouse` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/warehouse/` |
| **Path Client** | `apps/client/src/modules/warehouse/` |
| **Base URL API** | `/api/v1/warehouse` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA, Security Reviewers |

### Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial del documento integral (server + client) siguiendo arc42/C4/IEEE 1016. Se documentan 5 endpoints server, 5 hooks RTK Query, 3 componentes client, esquemas Joi/Zod, 1 modelo Prisma (warehouse). |

---

## 2. Introducción y Objetivos

### 2.1 Propósito

El módulo **Warehouse** gestiona los almacenes del sistema. Proporciona operaciones CRUD para registrar, consultar, actualizar y eliminar almacenes. Cada almacén mantiene stock, movimientos de inventario y un estado operativo (ACTIVE, INACTIVE, MAINTENANCE).

Funcionalidades principales:

- **Registro de Almacenes**: Creación con nombre, descripción, dirección y estado.
- **Estados Operativos**: ACTIVE, INACTIVE, MAINTENANCE.
- **Catálogo para UI**: Listado completo para componentes de filtro.
- **Búsqueda y Filtrado**: Filtrado por nombre y estado con paginación server-side.

---

## 3. Contexto y Alcance

```
[Usuario Admin/Manager/User]
       |
[Warehouse Module] --CRUD--> [/api/v1/warehouse]
       |
       |-- 1:N --> [stock]
       |-- 1:N --> [inventoryMovement]
```

---

## 4. Restricciones

| ID | Restricción |
| -- | ------------------------------------------------------------ |
| C-01 | PostgreSQL + Prisma ORM |
| C-02 | Express.js + React + RTK Query |
| C-03 | JWT + `verifyToken` obligatorio |
| C-04 | Estado tipado por enum `warehouseStatus` (ACTIVE, INACTIVE, MAINTENANCE) |

---

## 5. Stack Tecnológico

Estándar: Express, Prisma, PostgreSQL, React, RTK Query, Joi, Zod, react-hook-form.

---

## 6. Arquitectura del Módulo (Overview)

```
apps/server/src/modules/warehouse/
├── routes.js           # 5 rutas, OpenAPI inline
├── controller.js       # 5 handlers
├── service.js          # 5 métodos (negocio)
├── dao.js              # Prisma ORM puro (sin raw SQL)
└── schemas/warehouse.joi.js

apps/client/src/modules/warehouse/
├── api/warehouseAPI.js       # RTK Query
├── components/               # Datatable, Dialog, FiltersForm
├── pages/Warehouse.jsx
└── utils/                    # schema.js, enums.js
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Middleware | Handler |
| ------ | ---------------------- | ------------------------------------------------------------ | ------------------- |
| GET | `/` | `canViewWarehouse`, `validateQueryParams(warehouseFiltersSchema)` | `getAllWarehouses` |
| GET | `/warehouseFilters` | `canViewWarehouse` | `getAllWarehousesFilters` |
| POST | `/` | `canCreateWarehouse`, `validateSchema(warehouseCreateSchema)` | `createWarehouse` |
| PATCH | `/:id` | `canEditWarehouse`, `validatePathParam`, `validateSchema(warehouseUpdateSchema)` | `patchWarehouseById` |
| DELETE | `/:id` | `canDeleteWarehouse`, `validatePathParam` | `deleteWarehouseById` |

Roles: ADMIN, MANAGER, USER en todos los endpoints.

### Controller

| Función | Respuesta |
| ---------------- | ----------------------------------- |
| `getAllWarehouses` | 200 + `{ dataList, total }` |
| `getAllWarehousesFilters` | 200 + `Array<warehouse>` |
| `createWarehouse` | 201 + `{ message: 'Warehouse created successfully' }` |
| `patchWarehouseById` | 200 + `{ message: 'Warehouse partially updated successfully' }` |
| `deleteWarehouseById` | 200 + `{ message: 'Warehouse deleted successfully' }` |

### Service

- `getAllWarehouses`: `getSafePagination`, delega a DAO con `(name, status, take, skip)`.
- `createWarehouse`: Agrega `createdOn: new Date()`.
- `patchWarehouseById`: Agrega `updatedOn: new Date()`.
- `deleteWarehouse`: `deleteWarehouseDao({ id: Number(id) })`.

### DAO

- `getAllWarehouses`: Prisma ORM `findMany` con `where: { name: { contains, mode: 'insensitive' }, status }`, `orderBy: { name: 'asc' }`. `count` para total.
- `getAllWarehousesFilters`: `prisma.warehouse.findMany()`.
- `createWarehouse`: `prisma.warehouse.create({ data })`.
- `patchWarehouseById`: `prisma.warehouse.update({ where: { id }, data })`.
- `deleteWarehouse`: `prisma.warehouse.delete({ where })`.

---

## 8. Building Blocks — Client

### RTK Query

| Endpoint | Ruta | Método |
| ---------------------- | ------------------------------ | ------ |
| `getAllWarehouses` | `/warehouse` (params) | GET |
| `getAllWarehousesFilters` | `/warehouse/warehouseFilters` | GET |
| `createWarehouse` | `/warehouse/` | POST |
| `updateWarehouseById` | `/warehouse/${id}` | PATCH |
| `deleteWarehouseById` | `/warehouse/${id}` | DELETE |

Tag: `'Warehouses'`, cache: 5 min.

### Page

- `useEffect` reactivo para refetch en paginación/filtros.
- `pagination`: `{ pageIndex: 0, pageSize: 20 }`.

### Components

**WarehouseDatatable**: `name`, `status`, `description`, `createdOn`, `updatedOn`. Paginación.

**WarehouseDialog**: Campos `name`, `status` (Select con `dataStatus` enum), `description`, `address`. Audit fields con Popover/Calendar deshabilitado. `pickDirty` para PATCH.

**WarehouseFiltersForm**: `name`, `status` (Select con `dataStatus`).

### Utils

**schema.js**:
```js
WarehouseSchema: name (min 1), status (min 1).passthrough()
```

**enums.js**:
```js
dataStatus = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' },
  { value: 'MAINTENANCE', label: 'MAINTENANCE' },
];
```

---

## 9. Modelo de Datos

### Entidad `warehouse`

| Columna | Tipo | Constraints |
| ----------- | ------------ | ------------------------------ |
| `id` | `Int` | PK, autoincrement |
| `name` | `String` | NOT NULL, `@db.VarChar(50)` |
| `description` | `String?` | nullable, `@db.VarChar(120)` |
| `address` | `String?` | nullable, `@db.VarChar(120)` |
| `status` | `warehouseStatus` | DEFAULT `ACTIVE` |
| `createdOn` | `DateTime` | NOT NULL |
| `updatedOn` | `DateTime?` | nullable |

### Enum `warehouseStatus`:
```prisma
ACTIVE, INACTIVE, MAINTENANCE
```

### Relaciones:
```
warehouse 1:N stock, 1:N inventoryMovement
```

---

## 10. Contratos de API

### GET /api/v1/warehouse
Query: `name`, `status` (ACTIVE/INACTIVE/MAINTENANCE), `page`, `limit`.
Response: `{ dataList: [...], total: N }`.

### GET /api/v1/warehouse/warehouseFilters
Response: Array de warehouses sin paginación.

### POST /api/v1/warehouse
Body: `{ name (required), description, address, status (required) }`.
Response 201: `{ message }`.

### PATCH /api/v1/warehouse/:id
Body: `{ name?, description?, address?, status? }` (min 1 field).
Response 200: `{ message }`.

### DELETE /api/v1/warehouse/:id
Response 200: `{ message }`.

---

## 11. Validación

### Joi (Server)

```js
warehouseFiltersSchema: name (max 50), status (ACTIVE|INACTIVE|MAINTENANCE), limit, page
warehouseCreateSchema: name (max 50, req), description (max 120), address (max 120), status (req, enum)
warehouseUpdateSchema: name, description, address, status (todos opcionales, min 1)
```

### Zod (Client)

```js
WarehouseSchema: name (min 1), status (min 1).passthrough()
```

---

## 12. Seguridad

- `verifyToken` global.
- `checkRoleAuthOrPermisssion` con permisos: `canViewWarehouse`, `canCreateWarehouse`, `canEditWarehouse`, `canDeleteWarehouse`.
- Roles: ADMIN, MANAGER, USER.

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ------------------------------------------------------------ | --------- |
| R-001 | **DAO status filter bug**: `if (status)` trata string vacío "" como falsy → ignora filtro. | LOW |
| R-002 | **Sin auditoría en DAO**: warehouse no tiene createdBy/updatedBy (solo timestamps). | MEDIUM |
| R-003 | **Controller no retorna objeto**: create/patch/delete retornan solo `{ message }`. | MEDIUM |
| R-004 | **Zod no valida description/address**: Solo name y status validados. | LOW |
| R-005 | **Sin manejo de errores Prisma**: P2025, P2003 no capturados. | HIGH |
| R-006 | **Sin tests**: 0% cobertura. | HIGH |

---

## 14. Glosario

| Término | Definición |
| --------- | --------------------------------------------------------------------------- |
| **warehouseStatus** | Enum Prisma con estados: ACTIVE, INACTIVE, MAINTENANCE. |
| **warehouseFilters** | Endpoint separado que retorna todos los almacenes para dropdowns UI. |

---

## 15. Apéndices

### Archivos

```
SERVER: routes.js (270), controller.js (90), service.js (83), dao.js (130), schemas/warehouse.joi.js (22)
CLIENT: api/warehouseAPI.js (74), pages/Warehouse.jsx, + 3 components, utils/schema.js, utils/enums.js
```

### Middleware Stack

`verifyToken` → `checkRoleAuthOrPermisssion` → `validateQueryParams/validateSchema/validatePathParam` → Controller → Service → DAO
