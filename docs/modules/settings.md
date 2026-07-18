# Módulo: Settings + SettingsProductCategories (Server + Client)

> Documentación técnica integral del módulo **Settings** siguiendo un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.
> Cubre backend (`apps/server/src/modules/settings/`) y frontend (`apps/client/src/modules/settings/`).
> Incluye **SettingsProductCategories** como sub-recurso dentro del mismo módulo server.
>
> **Audiencia:** Arquitectos, Tech Leads, desarrolladores backend/frontend, revisores, QA.

---

## 1. Metadatos del Documento e Historial de Revisiones

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `settings` |
| **Estado** | Released / Implementado |
| **Versión** | `1.0.0` |
| **Owner** | Backend Guild — Express Track |
| **Path Server** | `apps/server/src/modules/settings/` |
| **Path Client** | `apps/client/src/modules/settings/` |
| **Base URL API** | `/api/v1/settings` |
| **Estándar** | arc42 + C4 (L1/L2) + IEEE 1016 |
| **Audiencia** | Engineers, Architects, QA |

### Historial

| Versión | Fecha | Autor | Cambios |
| ------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-11 | Docs Bot | Creación inicial. 7 endpoints (2 sub-recursos), 1 modelo Prisma settings + 1 productCategories. |

---

## 2. Introducción y Objetivos

Gestiona preferencias de usuario y catálogo de categorías de producto.

**Settings**: Preferencias de idioma (`es`/`en`) y visualización (display de módulos: Events, Notes, News, Profile, Language, Reports, Payroll, Stock). Upsert por userId.

**ProductCategories**: CRUD de catálogo de categorías con code (3 chars) y description (50 chars).

---

## 3. Contexto y Alcance

```
[User / Admin / Manager]
      |
[Settings Module] <--Upsert/CRUD--> [/api/v1/settings]
      |
      |-- /language     → POST (upsert language)
      |-- /display      → POST (upsert display)
      |-- /:id          → GET, PATCH
      |-- /product/categories → GET, POST, PATCH/:id, DELETE/:id
```

---

## 4. Restricciones

| ID | Restricción |
| -- | ------------------------------------------------------------ |
| C-01 | PostgreSQL + Prisma ORM |
| C-02 | Express.js + React (axiosPrivate directo, sin RTK Query) |
| C-03 | JWT + `verifyToken` global (sin middleware en algunos endpoints) |
| C-04 | Language: `es` o `en` (VarChar(2)) |
| C-05 | Display: 8 booleanos independientes en DB, agrupados como objeto en API |
| C-06 | ProductCategory code: unique VarChar(3), max 3 chars |
| C-07 | ProductCategory description: unique VarChar(50) |

---

## 5. Stack

Express, Prisma, PostgreSQL, React, axios, Joi, react-hook-form.

---

## 6. Arquitectura del Módulo

```
apps/server/src/modules/settings/
├── routes.js                # 7 rutas, OpenAPI inline
├── controller.js            # 7 handlers
├── service.js               # 8 métodos
├── dao.js                   # Prisma ORM puro (sin raw SQL)
└── schemas/settings.joi.js  # 8 schemas

apps/client/src/modules/settings/
├── api/settingsAPI.js        # axiosPrivate directo (NO RTK Query)
├── hooks/                    # Custom hooks para settings
├── pages/                    # Páginas de configuración
├── components/               # Componentes UI
└── slice/                    # Redux slice
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Middleware | Handler |
| ------ | ------------------------------------ | ------------------------------------------------------------ | ----------------------------------- |
| GET | `/:id` | `validatePathParam` | `getSettingsById` |
| POST | `/language/` | `validateSchema(SettingsLanguage)` | `createOrUpdateSettingsLanguage` |
| POST | `/display/` | `validateSchema(SettingsDisplay)` | `createOrUpdateSettingsDisplay` |
| GET | `/product/categories` | `canViewCategory`, `validateQueryParams(filters)` | `getAllProductCategories` |
| POST | `/product/categories` | `canCreateCategory`, `validateSchema(create)` | `createProductCategory` |
| PATCH | `/product/categories/:id` | `canEditCategory`, `validatePathParam`, `validateSchema(update)` | `updateProductCategoryById` |
| DELETE | `/product/categories/:id` | `canDeleteCategory`, `validatePathParam` | `deleteProductCategoryById` |
| PATCH | `/:id` | `validatePathParam`, `validateSchema(SettingsUpdate)` | `patchSettingsById` |

Roles: Settings/language/display GET/PATCH sin middleware de roles (solo verifyToken). SettingsProductCategories: ADMIN/MANAGER/USER (view), ADMIN/MANAGER (create/edit/delete).

### Controller

- `getSettingsById(id)` → `globalResponse(res, 200, settings)`
- `createOrUpdateSettingsLanguage({ language, id? }, userId)` → `globalResponse(res, 200, settings)`
- `createOrUpdateSettingsDisplay({ id?, displayOptions }, userId)` → `globalResponse(res, 200, settings)`
- `getAllProductCategories(safeQuery)` → `globalResponse(res, 200, data)`
- `createProductCategory(body)` → `globalResponse(res, 201, { message })`
- `updateProductCategoryById(id, body)` → `globalResponse(res, 200, { message })`
- `deleteProductCategoryById(id)` → `globalResponse(res, 200, { message })`
- `patchSettingsById(id, updateData)` → valida que al menos 1 field presente, `globalResponse(res, 200, result)`

### Service

**Settings**: Upsert pattern — si `id` existe, update con `updatedOn`; si no, create con `createdOn` + userId relation.

**ProductCategories**: CRUD estándar con `getSafePagination` (requiere paginación).

### DAO

**Settings**: `prisma.settings.findFirst({ where: { userId } })`, `prisma.settings.update/create` con `userSettingCreated: { connect: { id: userId } }`.

**ProductCategories**: `prisma.productCategories.findMany({ where: { description: { contains }, code: { contains } }, orderBy: { code: 'asc' } })`, count, create, update, delete.

---

## 8. Building Blocks — Client

### API (axiosPrivate directo, NO RTK Query)

- `GetSettingsByUserIdFetch(userId)` → GET `/settings/${userId}`
- `SaveLanguage(data)` → POST `/settings/language/`
- `SaveDisplaySettings(data)` → POST `/settings/display/`
- `PatchSettingsById({ id, data })` → PATCH `/settings/${id}`

Redux slice + custom hooks para estado global de settings.

---

## 9. Modelo de Datos

### Entidad `settings`

| Columna | Tipo | Constraints |
| ---------------- | ------------ | ------------------------------ |
| `id` | `Int` | PK, autoincrement |
| `displayEvents` | `Boolean?` | DEFAULT false |
| `displayNotes` | `Boolean?` | DEFAULT false |
| `displayNews` | `Boolean?` | DEFAULT false |
| `displayProfile` | `Boolean?` | DEFAULT false |
| `displayLanguage` | `Boolean?` | DEFAULT false |
| `displayReports` | `Boolean?` | DEFAULT false |
| `displayPayroll` | `Boolean?` | DEFAULT false |
| `displayStock` | `Boolean?` | DEFAULT false |
| `language` | `String?` | `@db.VarChar(2)` — 'es'/'en' |
| `userId` | `Int` | FK → users.id, UNIQUE (uno por user) |
| `createdOn` | `DateTime` | `@db.Timestamp(3)` |
| `updatedOn` | `DateTime?` | `@db.Timestamp(3)` |

### Entidad `productCategories`

| Columna | Tipo | Constraints |
| ----------- | ------------ | ------------------------------ |
| `id` | `Int` | PK, autoincrement |
| `code` | `String` | UNIQUE, `@db.VarChar(3)` |
| `description` | `String` | UNIQUE, `@db.VarChar(50)` |
| `createdOn` | `DateTime` | `@db.Timestamp(3)` |
| `updatedOn` | `DateTime?` | `@db.Timestamp(3)` |

Relación: `productCategories 1:N products`.

---

## 10. Contratos de API

### GET /api/v1/settings/:id
Response 200: settings object.

### POST /api/v1/settings/language/
Body: `{ id?, language: 'es'|'en' }`.
Response 200: settings object.

### POST /api/v1/settings/display/
Body: `{ id?, displayOptions: { displayEvents, displayNotes, ... } }`.
Response 200: settings object.

### PATCH /api/v1/settings/:id
Body: `{ language?, displayOptions? }`.
Response 200: settings object.

### GET /api/v1/settings/product/categories
Query: `description`, `code`, `page`, `limit`.
Response: `{ dataList, total }`.

### POST /api/v1/settings/product/categories
Body: `{ code (max3), description (max50) }`.
Response 201: `{ message }`.

### PATCH /api/v1/settings/product/categories/:id
Body: `{ code?, description? }`.
Response 200: `{ message }`.

### DELETE /api/v1/settings/product/categories/:id
Response 200: `{ message }`.

---

## 11. Validación

### Joi (Server)

```js
SettingsLanguage: { id? (int), language ('es'|'en' req) }
SettingsDisplay: { id? (int), displayOptions: { 8 booleans req } }
SettingsProductCategoryCreate: { code (max3 req), description (max50 req) }
SettingsProductCategoryFilters: { description (max50), code (max3), limit, page }
SettingsProductCategoryUpdateSchema: { description, code (max3 min1) }
SettingsUpdate: { language?, displayOptions? (8 booleans opt) }
```

---

## 12. Seguridad

- `verifyToken` global.
- Settings/language/display: sin checkRoleAuth — solo verifyToken.
- ProductCategories: canViewCategory (ADMIN/MANAGER/USER), canCreateCategory (ADMIN/MANAGER), canEditCategory, canDeleteCategory.

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ------------------------------------------------------------ | --------- |
| R-001 | **Settings GET sin middleware de roles**: Solo verifyToken, cualquiera puede leer settings de cualquier userId. | MEDIUM |
| R-002 | **Controller createProductCategory sin req.userId**: No audita createdBy ni conecta con user. | MEDIUM |
| R-003 | **Sin tests**: 0% cobertura. | HIGH |
| R-004 | **Sin manejo Prisma errors**: P2002 (unique code/description), P2025 no capturados. | HIGH |

---

## 14. Glosario

| Término | Definición |
| --------- | --------------------------------------------------------------------------- |
| **displayOptions** | Objeto API con 8 booleanos que se mapea a columnas individuales en DB. |
| **productCategories** | Catálogo de categorías de producto con code (3 chars) y description. |
| **SettingsLanguage** | Preferencia de idioma 'es' o 'en'. |

---

## 15. Apéndices

### Archivos

```
SERVER: routes.js (488), controller.js (168), service.js (158), dao.js (201), schemas/settings.joi.js (84)
CLIENT: api/settingsAPI.js (21), hooks/, pages/, components/, slice/
```

### DB Column Mapping (Display → DB)

```
API: { displayOptions: { displayEvents, displayNotes, displayNews, displayProfile, displayLanguage, displayReports, displayPayroll, displayStock } }
DB:  settings.displayEvents, settings.displayNotes, ... (8 columns boolean)
```

### Middleware Stack

Settings: `verifyToken` → `validatePathParam`/`validateSchema` → Controller → Service → DAO
ProductCategories: + `checkRoleAuthOrPermisssion`
