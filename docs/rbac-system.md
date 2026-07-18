# Sistema de Roles y Permisos (RBAC)

> **Fecha:** Junio 2026
> **Propósito:** Documentar el modelo de control de acceso basado en roles y permisos del backend Express y su integración con el frontend React.
> **Archivos fuente:** `schema.prisma`, `enums.js`, `verifyRole.js`, `verifyToken.js`, rutas de módulos, `authSlice.js`, `usersApi.js`

---

## 1. Arquitectura General

El sistema maneja **dos dominios de "permisos" distintos** que NO deben confundirse:

| Dominio | Propósito | Módulo | Modelo Prisma |
|---------|-----------|--------|---------------|
| **RBAC (Control de Acceso)** | Determina qué usuarios pueden acceder a qué funciones del sistema | `users/`, `auth/` | `roles`, `permissions`, `userPermits` |
| **Permisos Laborales (Leave)** | Gestión de ausencias, licencias y permisos de empleados | `permission/` | `permission` (modelo independiente) |

Este documento cubre exclusivamente el **dominio RBAC**.

---

## 2. Modelo de Datos (Prisma)

### 2.1 Diagrama de Relaciones

```
┌──────────┐       ┌───────────┐
│  roles   │       │  users    │
│──────────│       │───────────│
│ id (PK)  │◄──┐   │ id (PK)   │
│ code     │   └───│ roleId(FK)│
│ desc     │       │ ...       │
└──────────┘       │ isAdmin?  │ ← campo legacy sin uso
                   └─────┬─────┘
                         │
                    ┌────▼─────┐       ┌──────────────┐
                    │userPermits│       │  permissions │
                    │───────────│       │──────────────│
                    │ id (PK)   │       │ id (PK)      │
                    │ userId(FK)│──────►│ code         │
                    │permId(FK) │       │ description  │
                    └───────────┘       └──────────────┘
```

### 2.2 Modelo `roles`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `Int (PK)` | Identificador numérico |
| `code` | `String(3) @unique` | Código del rol: `C01`, `C02`, `C03` |
| `description` | `String(50) @unique` | Nombre legible: `admin`, `user`, `manager` |

```prisma
model roles {
  id          Int     @id @default(autoincrement())
  code        String  @unique @db.VarChar(3)
  description String  @unique @db.VarChar(50)
  users       users[] @relation("userRoles")
}
```

### 2.3 Modelo `permissions`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `Int (PK)` | Identificador numérico |
| `code` | `String(50) @unique` | Código del permiso, ej: `canViewUser` |
| `description` | `String(100)` | Descripción legible |

```prisma
model permissions {
  id          Int           @id @default(autoincrement())
  code        String        @unique @db.VarChar(50)
  description String        @db.VarChar(100)
  userPermits userPermits[]
}
```

### 2.4 Modelo `userPermits` (Many-to-Many: usuario → permiso)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `Int (PK)` | Identificador numérico |
| `userId` | `Int (FK)` → `users.id` | Usuario al que se asigna el permiso |
| `permissionId` | `Int (FK)` → `permissions.id` | Permiso asignado |

```prisma
model userPermits {
  id           Int         @id @default(autoincrement())
  userId       Int
  permissionId Int
  users        users       @relation("userPermissions", fields: [userId], references: [id])
  permissions  permissions @relation(fields: [permissionId], references: [id])
  @@unique([userId, permissionId])
}
```

### 2.5 Relación en `users`

```prisma
model users {
  roleId  Int
  roles   roles      @relation("userRoles", fields: [roleId], references: [id])
  permits userPermits[] @relation("userPermissions")
  // ...
}
```

### 2.6 `rolePermits` (❌ Comentado — no existe en DB)

El modelo que permitiría asignar permisos directamente a roles está **comentado**:

```prisma
// model rolePermits {
//   id           Int         @id @default(autoincrement())
//   roleId       Int
//   permissionId Int
//   roles        roles       @relation(fields: [roleId], references: [id])
//   permissions  permissions @relation(fields: [permissionId], references: [id])
//   @@unique([roleId, permissionId])
// }
```

**Consecuencia:** Los permisos se asignan por usuario, no por rol. No hay herencia rol→permiso.

---

## 3. Roles y Códigos

| Rol | Código | Descripción | Comportamiento |
|-----|--------|-------------|----------------|
| **ADMIN** | `C01` | Administrador total | Bypass completo de permisos |
| **USER** | `C02` | Usuario estándar | Default al registrarse. Acceso según permisos individuales |
| **MANAGER** | `C03` | Gestión intermedia | Acceso a funciones administrativas limitadas |

**Fuente:** `apps/server/src/utils/constants/enums.js`

```javascript
export const ROLESCODES = {
  ADMIN: 'C01',
  USER: 'C02',
  MANAGER: 'C03',
};
```

### 3.1 Asignación de Rol por Defecto

En el registro (`POST /auth/signup`):

```javascript
// apps/server/src/modules/auth/service.js
const role = await getUserRoleByCode(ROLESCODES.USER);
user.roleId = role?.id;
```

Para cambiar el rol, ADMIN o MANAGER usa `PATCH /users/:id`.

---

## 4. Permisos

### 4.1 Categorías de Permisos

Los códigos se definen en `PERMISSIONCODES` en `apps/server/src/utils/constants/enums.js`. ~65 códigos activos, ~8 comentados como "futuro".

| Categoría | Códigos |
|-----------|---------|
| News | canViewNews, canCreateNews, canEditNews, canDeleteNews |
| Categories | canViewCategory, canCreateCategory, canEditCategory, canDeleteCategory |
| Events | canViewEvents, canCreateEvents, canEditEvents, canDeleteEvents |
| Products | canViewProduct, canCreateProduct, canEditProduct, canDeleteProduct |
| Providers | canViewProvider, canCreateProvider, canEditProvider, canDeleteProvider |
| Warehouses | canViewWarehouse, canCreatedWarehouse, canEditWarehouse, canDeleteWarehouse |
| Stock | canViewStock, canCreateStock, canEditStock, canDeletStock |
| Inventory | canViewInventory, canCreateInventory, canEditInventory, canDeleteInventory |
| Sales | canViewSale, canCreateSale, canEditSale, canDeleteSale |
| Clients | canViewClient, canCreateClient, canEditClient, canDeleteClient |
| Purchases | canViewPurchase, canCreatePurchase, canEditPurchase, canDeletePurchase |
| Employees | canViewEmployee, canCreateEmployee, canEditEmployee, canDeleteEmployee |
| Attendance | canViewAttendance, canCreateAttendance, canEditAttendance, canDeleteAttendance |
| Payroll | canViewPayroll, canCreatePayroll, canEditPayroll, canDeletePayroll |
| Vacations | canViewVacations, canRequestVacation, canEditRequestVacation, canDeleteVacation |
| Permission (leave) | canViewPermission, canCreatePermission, canEditPermission, canDeletePermission |
| Users | canViewUser, canCreateUser, canEditUser, canDeleteUser |
| Expenses | canViewExpense, canCreateExpense, canEditExpense, canDeleteExpense |
| Performance | canViewPerformanceEvaluations, canEvaluatePerformance, canCreateEvaluatePerformance, canEditEvaluatePerformance, canDeleteEvaluationPerformance |

### 4.2 Permisos Comentados ("Futuro")

```javascript
// canViewSettings, canEditSettings
// canViewDashboard
// canCreateClientOrder, canEditClientOrder, canViewClientOrder
// canCreateProviderOrder, canEditProviderOrder, canViewProviderOrder
// canViewReports
```

---

## 5. Flujo de Autorización (Server-Side)

### 5.1 Vista General

```
POST /auth/signup  →  roleId = C02 (USER)
POST /auth/signin  →  JWT { id, rol }

     Request
        │
        ▼
  verifyToken (JWT → req.userId)
        │
        ▼
  checkRoleAuthOrPermisssion
        │
        ├── user.roles.code === C01 → ✅ PASS
        ├── allowedRoles vacío o no incluye rol → ❌ 403
        ├── permissions vacío → ✅ PASS (solo role check)
        ├── user tiene permiso → ✅ PASS
        └── no tiene permiso → ❌ 403
        │
        ▼
     Handler
```

### 5.2 Middleware: `verifyToken`

**Archivo:** `apps/server/src/middleware/verifyToken.js`

1. Extrae Bearer token del header `Authorization`
2. `jwt.verify(token, SECRETKEY, { algorithms: ['HS256'] })`
3. Establece `req.userId = decoded.id`

### 5.3 Middleware: `checkRoleAuthOrPermisssion`

**Archivo:** `apps/server/src/middleware/verifyRole.js`

```javascript
export const checkRoleAuthOrPermisssion = (options) => async (req, res, next) => {
  const user = await getUserRoleByUserId(req.userId);
  // → user.roles.code, user.permits[].permissions.code

  if (user.roles.code === ROLESCODES.ADMIN) return next(); // bypass

  if (options.allowedRoles?.length && !options.allowedRoles.includes(user.roles.code)) {
    return res.status(403).json({ message: 'No tienes permisos' });
  }

  if (!options.permissions?.length) return next(); // solo role check

  // ⚠️ BUG: user.rolePermits no existe. Debería ser user.permits
  const userPermitCodes = user.rolePermits?.map((rp) => rp.permissions.code) || [];

  const hasPermission = options.permissions.some((p) => userPermitCodes.includes(p));
  if (!hasPermission) return res.status(403).json({ message: 'No tienes permisos' });
  next();
};
```

### ⚠️ Bug Conocido

En `verifyRole.js` línea ~109:

```javascript
// ACTUAL (ROTO):
const rolePermissions = user.rolePermits?.map((rp) => rp.permissions.code) || [];

// DEBERÍA SER:
const rolePermissions = user.permits?.map((rp) => rp.permissions.code) || [];
```

La propiedad `user.permits` es la que existe en la relación de Prisma. `user.rolePermits` apunta a un modelo que no existe en la DB. Esto causa que **el chequeo de permisos individuales siempre falle** para usuarios no-admin.

---

## 6. Aplicación por Módulo

| Módulo | Roles Permitidos | Permisos Requeridos |
|--------|-----------------|---------------------|
| Users | ADMIN, MANAGER | canViewUser, canCreateUser, canEditUser, canDeleteUser |
| Events | ADMIN, MANAGER, USER | canViewEvents, canCreateEvents, canEditEvents, canDeleteEvents |
| Notes | ADMIN, MANAGER, USER | *(ninguno — solo role check)* |
| Permission (leave) | ADMIN, MANAGER, USER | canViewPermission, canCreatePermission, canEditPermission, canDeletePermission |
| Auth | Público | *(sin middleware)* |

### Patrones de uso en rutas

**Patrón A — Rol + Permiso (mayoría de módulos):**
```javascript
router.get('/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canViewEvents],
  }),
  controller.handler
);
```

**Patrón B — Solo rol (módulo notes):**
```javascript
router.use(verifyToken);
router.use(checkRoleAuthOrPermisssion({
  allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
}));
```

---

## 7. Client-Side (Frontend)

### 7.1 Lo que existe

| Archivo | Propósito |
|---------|-----------|
| `apps/client/src/modules/auth/slice/authSlice.js` | Redux: user, isAuth, accessToken |
| `apps/client/src/modules/auth/api/authAPI.js` | SignIn, SignUp, RefreshToken |
| `apps/client/src/modules/users/api/usersApi.js` | RTK Query: getAllUsersRol, getAllUserPermits, CRUD |

### 7.2 Lo que falta

| Componente/Hook | Propósito |
|----------------|-----------|
| `usePermission(code)` | Verificar si usuario tiene permiso específico |
| `useRole()` | Obtener rol del usuario actual |
| `useCan(permissionCode)` | Generic permission check |
| `PermissionGate` | Render condicional basado en permisos |
| `RoleGuard` | Proteger rutas en frontend |

Actualmente el control de acceso es **100% server-side**. El frontend solo sabe si el usuario está autenticado (`isAuth`), no qué puede hacer.

---

## 8. Inconsistencias y Deuda Técnica

1. **Bug: `user.rolePermits`** → Debe ser `user.permits` en `verifyRole.js` línea ~109. El chequeo de permisos individuales no funciona para no-admin.
2. **Ruta DELETE duplicada** en `users/routes.js` — definida dos veces, causa conflictos en Express.
3. **`rolePermits` comentado** — No hay herencia rol→permiso. Cada permiso debe asignarse por usuario.
4. **Notes sin permisos granulares** — El módulo notes solo usa role check. Cualquier USER puede hacer todo.
5. **`users.isAdmin` legacy** — Campo booleano sin uso. El RBAC usa `roles.code`.
6. **Códigos de permiso sin usar** — Settings, Dashboard, Orders, Reports existen en `enums.js` pero no se aplican en ninguna ruta.

---

## 9. Archivos Relevantes

### Server

| Archivo | Rol |
|---------|-----|
| `apps/server/prisma/schema.prisma` | Modelos de datos (roles, permissions, userPermits) |
| `apps/server/src/utils/constants/enums.js` | Constantes ROLESCODES, PERMISSIONCODES |
| `apps/server/src/middleware/verifyToken.js` | JWT verification |
| `apps/server/src/middleware/verifyRole.js` | checkRoleAuthOrPermisssion |
| `apps/server/src/middleware/index.js` | Re-exporta middleware |
| `apps/server/src/modules/users/dao.js` | getUserRoleByUserId (carga usuario + roles + permisos) |
| `apps/server/src/modules/users/service.js` | Wrapper de DAO |
| `apps/server/src/modules/users/controller.js` | CRUD usuarios + roles + permisos |
| `apps/server/src/modules/users/routes.js` | Rutas con RBAC |
| `apps/server/src/modules/auth/dao.js` | signIn incluye roles relation |
| `apps/server/src/modules/auth/service.js` | signUp asigna USER default; signIn retorna role |
| `apps/server/src/modules/auth/routes.js` | Rutas públicas de auth |
| `apps/server/src/routes/v1/index.js` | Ensambla rutas de todos los módulos |

### Client

| Archivo | Rol |
|---------|-----|
| `apps/client/src/modules/auth/slice/authSlice.js` | Redux store: user, isAuth, accessToken |
| `apps/client/src/modules/auth/api/authAPI.js` | Llamadas a /auth endpoints |
| `apps/client/src/modules/users/api/usersApi.js` | RTK Query: roles, permits, CRUD users |
