# Módulo: SettingsProductCategories (Client only)

> Documentación técnica del módulo **SettingsProductCategories**. arc42 / C4 / IEEE 1016.
> Client: `apps/client/src/modules/settingsProductCategories/`. No tiene servidor propio — endpoints servidos por módulo `settings`.

---

## 1. Metadatos

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `settingsProductCategories` |
| **Estado** | Released |
| **Path Client** | `apps/client/src/modules/settingsProductCategories/` |
| **Path Server** | N/A (endpoints via `/api/v1/settings/product/categories`) |
| **Base URL API** | `/api/v1/settings/product/categories` |

---

## 2. Introducción y Objetivos

Gestión de categorías de producto desde la configuración del sistema. CRUD con código (3 chars) y descripción.

Funcionalidades:
- Listar categorías con filtros por código/descripción y paginación
- Crear, editar, eliminar categorías de producto
- Código de 3 caracteres (único)
- Vista dual: lista (DataTable) / formulario (Card)

---

## 3. Contexto y Alcance

```
[Admin / Manager]
      |
[SettingsProductCategories Module] <--CRUD--> [/api/v1/settings/product/categories]
      |                                        (servido por módulo settings server)
      |-- Sin dependencias externas
```

**In-Scope**: CRUD categorías de producto, filtros, paginación.

**Out-of-Scope**: Jerarquía de categorías, atributos por categoría, mapping a productos.

---

## 4. Restricciones

| ID | Restricción |
| -- | ----------- |
| C-01 | Client-only module (sin server module propio) |
| C-02 | Express.js + React + RTK Query |
| C-03 | `code` max 3 chars (único) |
| C-04 | `description` con field limits desde config |

---

## 5. Stack Tecnológico

React, RTK Query, Zod, react-hook-form, shadcn/ui, date-fns, react-i18next.

---

## 6. Arquitectura del Módulo

```
apps/client/src/modules/settingsProductCategories/
├── api/SettingsProductCategoriesAPI.js     # RTK Query (4 endpoints)
├── components/
│   ├── SettingsProductCategoriesDatatable.jsx
│   ├── SettingsProductCategoriesFiltersForm.jsx
│   ├── SettingsProductsCategoryForm.jsx      # Form contenedor (tabs)
│   ├── SettingsProductCategoriesBasicInfo.jsx # Card form (usado)
│   ├── SettingsProductCategoriesDialog.jsx    # Modal form (no usado)
│   └── index.js
├── page/SettingsProductCategories.jsx
└── utils/
    ├── schema.js
    └── index.js
```

---

## 7. Building Blocks — Server

Módulo client-only. Endpoints servidos por módulo `settings` server:

| Método | Ruta | Propósito |
| ------ | ---- | --------- |
| GET | `/settings/product/categories` | Listar con filtros |
| POST | `/settings/product/categories/` | Crear |
| PATCH | `/settings/product/categories/:id` | Editar |
| DELETE | `/settings/product/categories/:id` | Eliminar |

---

## 8. Building Blocks — Client

### RTK Query

| Endpoint | Ruta | Método |
| -------- | ---- | ------ |
| `getAllCategories` | `/settings/product/categories` (params) | GET |
| `createCategory` | `/settings/product/categories/` | POST |
| `updateCategoryById` | `/settings/product/categories/:id` | PATCH |
| `deleteCategoryById` | `/settings/product/categories/:id` | DELETE |

Tag: `'SettingsProductCategories'`. Lazy query con paginación reactiva.

### Page

**SettingsProductCategories.jsx**: Dual view — lista (DataTable) o formulario (BasicInfo). Estados: `showForm`, `selectedRow`, `pagination`, `filters`. `useEffect` único fuente de verdad para API.

### Components

**SettingsProductCategoriesDatatable**: Columnas — code, description, createdOn (PPP), updatedOn.

**SettingsProductCategoriesFiltersForm**: Filtros description, code. Search/Add/Clear buttons.

**SettingsProductsCategoryForm**: Contenedor tabbed (1 tab: Basic Information). Orquesta create/update/delete.

**SettingsProductCategoriesBasicInfo**: Card form con code (Input max3) + description (Textarea). `zodResolver` + `pickDirty` para PATCH.

**SettingsProductCategoriesDialog**: Modal alternativo con name + status + description. **No usado en page actual** (posible legacy).

### Utils

**schema.js (Zod)**:
```js
SettingsProductCategoriesSchema:
  description: z.string().min(1)
  code: z.string().min(1).max(3)
  .passthrough()
```

---

## 9. Modelo de Datos

### `product_categories` (vía módulo settings)

| Columna | Tipo | Constraints |
| ------- | ---- | ----------- |
| `id` | `Int` | PK |
| `code` | `String` | UNIQUE `VarChar(3)` |
| `description` | `String` | |

---

## 10. Contratos de API

### GET /api/v1/settings/product/categories
Query: `page`, `limit`, `description`, `code`.
Response 200: `{ dataList: [...], total: N }`.

### POST /api/v1/settings/product/categories/
Body: `{ code, description }`.
Response 201: category object.

### PATCH /api/v1/settings/product/categories/:id
Body: parcial. Response 200: category object.

### DELETE /api/v1/settings/product/categories/:id
Response 200: `{ message }`.

---

## 11. Validación

### Zod (Client)

```js
SettingsProductCategoriesSchema:
  description: z.string().min(1)
  code: z.string().min(1).max(3)
```

---

## 12. Seguridad

- Autenticación vía módulo settings server (verifyToken)
- Roles: ADMIN, MANAGER (consistente con módulo settings)

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ----------- | --------- |
| R-01 | **Dialog no usado**: `SettingsProductCategoriesDialog` existe pero no está conectado al page flow. Posible dead code o refactor incompleto. | MEDIUM |
| R-02 | **Dual form implementations**: BasicInfo (Card) y Dialog (Modal) con schemas ligeramente diferentes (Dialog tiene `name` y `status`). | MEDIUM |
| R-03 | **Sin tests**: 0% cobertura. | HIGH |

---

## 14. Glosario

| Término | Definición |
| ------- | ---------- |
| **product_categories** | Catálogo de categorías de producto con code (3 chars) único |

---

## 15. Apéndices

### Archivos

```
CLIENT: api/SettingsProductCategoriesAPI.js, page/SettingsProductCategories.jsx,
        5 components, utils/schema.js
```
