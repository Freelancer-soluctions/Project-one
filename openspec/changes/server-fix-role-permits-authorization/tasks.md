# Tasks

> Gate de producto BLOQUEANTE antes de merge. Gates técnicos por commit: type-check/lint/test:unit/depcruise.

## 1. Producto e inventario (BLOQUEANTE para merge)

- [ ] 1.1 **Sign-off de producto**: consultar la matriz `userPermits`×`permissions`×`users` real (query SQL de producción o export) y confirmar: "los usuarios con estos permisos DEBEN acceder a estas rutas". Sin este sign-off, el change NO se mergea (se queda implementado-en-rama con tests verdes).
  - **Estado 2026-10-20:** PENDIENTE — requiere acceso a la BD de producción y al owner de producto. El fix está implementado y verificado localmente; el merge queda bloqueado por este punto.
  - **Insumo listo:** `sign-off-matrix.sql` (en este change) trae las 3 consultas que producen la evidencia a firmar: matriz usuario × permiso, usuarios sin permisos (mide si el fix es no-op en runtime) y permisos huérfanos (rutas que seguirán en 403). Pegar la salida aquí y obtener el sí/no del owner.
- [x] 1.2 Inventario de rutas afectadas (tabla abajo): grep `checkRoleAuthOrPermisssion` + `permissions: [` sobre los archivos de rutas → módulo / ruta / método / roles / permissions / estado-hoy (403) / estado-post-fix. Marco de comparación para validación post-despliegue.

### 1.2 Inventario medido (2026-10-20)

Fuente: extracción programática (AST-lite sobre `router.<method>('...')` + `checkRoleAuthOrPermisssion({...})`) de `src/modules/**/*routes.ts`, contrastada con `grep -c` por archivo (0 archivos con discrepancia salvo `notes`, ver nota). Prefijos de montaje leídos de `src/routes/v1/index.ts`.

| Métrica                                                   | Valor                                     |
| --------------------------------------------------------- | ----------------------------------------- |
| Archivos de rutas con el guard                            | **21** (20 con `permissions`, 1 solo-rol) |
| Sitios de montaje (`checkRoleAuthOrPermisssion(...)`)     | **103**                                   |
| Sitios con `permissions` no vacío (protegidos por el fix) | **102**                                   |
| Sitios solo-rol (camino 2, NO afectados)                  | 1 (`notes`, `router.use` global)          |

**Estados (aplican a las 102 filas de la tabla):**

- **Hoy (pre-fix), no-ADMIN:** `403 Insufficient permissions for this operation` en **todos** los casos — `rolePermissions` sale del `rolePermits` inexistente, así que el permiso asignado en BD nunca se consulta. No depende de roles ni de datos: es determinista.
- **Post-fix, no-ADMIN:** `next()` si el usuario tiene **alguna** de las `permissions` exigidas en `userPermits`; `403` si no tiene ninguna (o no tiene filas).
- **ADMIN (C01):** `next()` en ambos estados (short-circuit del camino 1, sin evaluar permisos) — no es un delta del fix.
- Las rutas de `notes` (sin `permissions`) ya funcionaban para los roles permitidos y siguen igual.

| Módulo                | Ruta (método + path montado)                                                 | Roles permitidos                       | Permisos exigidos              |
| --------------------- | ---------------------------------------------------------------------------- | -------------------------------------- | ------------------------------ |
| attendance            | `GET /api/v1/attendance`                                                     | ADMIN (C01), MANAGER (C03), USER (C02) | canViewAttendance              |
| attendance            | `POST /api/v1/attendance`                                                    | ADMIN (C01), MANAGER (C03)             | canCreateAttendance            |
| attendance            | `DELETE /api/v1/attendance/:id`                                              | ADMIN (C01), MANAGER (C03)             | canDeleteAttendance            |
| attendance            | `PATCH /api/v1/attendance/:id`                                               | ADMIN (C01), MANAGER (C03)             | canEditAttendance              |
| clients               | `GET /api/v1/clients`                                                        | ADMIN (C01), MANAGER (C03), USER (C02) | canViewClient                  |
| clients               | `GET /api/v1/clients/clientsFilters`                                         | ADMIN (C01), MANAGER (C03), USER (C02) | canViewClient                  |
| clients               | `POST /api/v1/clients`                                                       | ADMIN (C01), MANAGER (C03)             | canCreateClient                |
| clients               | `PATCH /api/v1/clients/:id`                                                  | ADMIN (C01), MANAGER (C03)             | canEditClient                  |
| clients               | `DELETE /api/v1/clients/:id`                                                 | ADMIN (C01), MANAGER (C03)             | canDeleteClient                |
| employees             | `GET /api/v1/employees`                                                      | ADMIN (C01), MANAGER (C03)             | canViewEmployee                |
| employees             | `GET /api/v1/employees/employeeFilters`                                      | ADMIN (C01), MANAGER (C03)             | canViewEmployee                |
| employees             | `POST /api/v1/employees`                                                     | ADMIN (C01), MANAGER (C03)             | canCreateEmployee              |
| employees             | `PATCH /api/v1/employees/:id`                                                | ADMIN (C01), MANAGER (C03)             | canEditEmployee                |
| employees             | `DELETE /api/v1/employees/:id`                                               | ADMIN (C01), MANAGER (C03)             | canDeleteEmployee              |
| events                | `POST /api/v1/events/attendee/register`                                      | ADMIN (C01), MANAGER (C03), USER (C02) | canRegisterForEvent            |
| events                | `DELETE /api/v1/events/attendee/register`                                    | ADMIN (C01), MANAGER (C03), USER (C02) | canCancelRegistration          |
| events                | `GET /api/v1/events/attendee/attendees`                                      | ADMIN (C01), MANAGER (C03)             | canViewAttendees               |
| events                | `PATCH /api/v1/events/attendee/attendees/:attendeeId`                        | ADMIN (C01), MANAGER (C03)             | canManageAttendees             |
| events                | `POST /api/v1/events`                                                        | ADMIN (C01), MANAGER (C03), USER (C02) | canCreateEvents                |
| events                | `GET /api/v1/events/eventTypes`                                              | ADMIN (C01), MANAGER (C03), USER (C02) | canViewEvents                  |
| events                | `GET /api/v1/events`                                                         | ADMIN (C01), MANAGER (C03), USER (C02) | canViewEvents                  |
| events                | `PATCH /api/v1/events/:id`                                                   | ADMIN (C01), MANAGER (C03), USER (C02) | canEditEvents                  |
| events                | `DELETE /api/v1/events/:id`                                                  | ADMIN (C01), MANAGER (C03), USER (C02) | canDeleteEvents                |
| expenses              | `GET /api/v1/expenses`                                                       | ADMIN (C01), MANAGER (C03)             | canViewExpense                 |
| expenses              | `POST /api/v1/expenses`                                                      | ADMIN (C01), MANAGER (C03)             | canCreateExpense               |
| expenses              | `DELETE /api/v1/expenses/:id`                                                | ADMIN (C01), MANAGER (C03)             | canDeleteExpense               |
| expenses              | `PATCH /api/v1/expenses/:id`                                                 | ADMIN (C01), MANAGER (C03)             | canEditExpense                 |
| inventoryMovement     | `GET /api/v1/inventory-movement`                                             | ADMIN (C01), MANAGER (C03), USER (C02) | canViewInventory               |
| inventoryMovement     | `POST /api/v1/inventory-movement`                                            | ADMIN (C01), MANAGER (C03)             | canCreateInventory             |
| inventoryMovement     | `PATCH /api/v1/inventory-movement/:id`                                       | ADMIN (C01), MANAGER (C03)             | canEditInventory               |
| inventoryMovement     | `DELETE /api/v1/inventory-movement/:id`                                      | ADMIN (C01), MANAGER (C03)             | canDeleteInventory             |
| news                  | `GET /api/v1/news`                                                           | ADMIN (C01), MANAGER (C03), USER (C02) | canViewNews                    |
| news                  | `GET /api/v1/news/status`                                                    | ADMIN (C01), MANAGER (C03), USER (C02) | canViewNews                    |
| news                  | `POST /api/v1/news`                                                          | ADMIN (C01), MANAGER (C03), USER (C02) | canCreateNews                  |
| news                  | `PATCH /api/v1/news/:id`                                                     | ADMIN (C01), MANAGER (C03), USER (C02) | canEditNews                    |
| news                  | `DELETE /api/v1/news/:id`                                                    | ADMIN (C01), MANAGER (C03), USER (C02) | canDeleteNews                  |
| payroll               | `GET /api/v1/payroll`                                                        | ADMIN (C01), MANAGER (C03)             | canViewPayroll                 |
| payroll               | `POST /api/v1/payroll`                                                       | ADMIN (C01), MANAGER (C03)             | canCreatePayroll               |
| payroll               | `DELETE /api/v1/payroll/:id`                                                 | ADMIN (C01), MANAGER (C03)             | canDeletePayroll               |
| payroll               | `PATCH /api/v1/payroll/:id`                                                  | ADMIN (C01), MANAGER (C03)             | canEditPayroll                 |
| performanceEvaluation | `GET /api/v1/performance-evaluation`                                         | ADMIN (C01), MANAGER (C03)             | canViewPerformanceEvaluations  |
| performanceEvaluation | `POST /api/v1/performance-evaluation`                                        | ADMIN (C01), MANAGER (C03)             | canCreateEvaluatePerformance   |
| performanceEvaluation | `PATCH /api/v1/performance-evaluation/:id`                                   | ADMIN (C01), MANAGER (C03)             | canEditEvaluatePerformance     |
| performanceEvaluation | `DELETE /api/v1/performance-evaluation/:id`                                  | ADMIN (C01), MANAGER (C03)             | canDeleteEvaluationPerformance |
| permission            | `GET /api/v1/permission`                                                     | ADMIN (C01), MANAGER (C03), USER (C02) | canViewPermission              |
| permission            | `POST /api/v1/permission`                                                    | ADMIN (C01), MANAGER (C03), USER (C02) | canCreatePermission            |
| permission            | `PATCH /api/v1/permission/:id`                                               | ADMIN (C01), MANAGER (C03), USER (C02) | canEditPermission              |
| permission            | `DELETE /api/v1/permission/:id`                                              | ADMIN (C01), MANAGER (C03), USER (C02) | canDeletePermission            |
| products              | `GET /api/v1/products`                                                       | ADMIN (C01), MANAGER (C03), USER (C02) | canViewProduct                 |
| products              | `GET /api/v1/products` (handler duplicado: el segundo no se alcanza)         | ADMIN (C01), MANAGER (C03), USER (C02) | canViewProduct                 |
| products              | `GET /api/v1/products/status`                                                | ADMIN (C01), MANAGER (C03), USER (C02) | canViewProduct                 |
| products              | `GET /api/v1/products/category`                                              | ADMIN (C01), MANAGER (C03), USER (C02) | canViewProduct                 |
| products              | `POST /api/v1/products`                                                      | ADMIN (C01), MANAGER (C03)             | canCreateProduct               |
| products              | `PATCH /api/v1/products/:id`                                                 | ADMIN (C01), MANAGER (C03)             | canEditProduct                 |
| products              | `DELETE /api/v1/products/:id`                                                | ADMIN (C01), MANAGER (C03)             | canDeleteProduct               |
| products              | `GET /api/v1/products/attributes/:id`                                        | ADMIN (C01), MANAGER (C03), USER (C02) | canViewProduct                 |
| products              | `POST /api/v1/products/attributes/`                                          | ADMIN (C01), MANAGER (C03)             | canCreateProduct               |
| products              | `DELETE /api/v1/products/attributes/:id`                                     | ADMIN (C01), MANAGER (C03)             | canDeleteProduct               |
| providers             | `GET /api/v1/providers`                                                      | ADMIN (C01), MANAGER (C03), USER (C02) | canViewProvider                |
| providers             | `GET /api/v1/providers/providerFilters`                                      | ADMIN (C01), MANAGER (C03), USER (C02) | canViewProvider                |
| providers             | `POST /api/v1/providers`                                                     | ADMIN (C01), MANAGER (C03)             | canCreateProvider              |
| providers             | `PATCH /api/v1/providers/:id`                                                | ADMIN (C01), MANAGER (C03)             | canEditProvider                |
| providers             | `DELETE /api/v1/providers/:id`                                               | ADMIN (C01), MANAGER (C03)             | canDeleteProvider              |
| purchase              | `GET /api/v1/purchases`                                                      | ADMIN (C01), MANAGER (C03)             | canViewPurchase                |
| purchase              | `POST /api/v1/purchases`                                                     | ADMIN (C01), MANAGER (C03)             | canCreatePurchase              |
| purchase              | `PATCH /api/v1/purchases/:id`                                                | ADMIN (C01), MANAGER (C03)             | canEditPurchase                |
| purchase              | `DELETE /api/v1/purchases/:id`                                               | ADMIN (C01), MANAGER (C03)             | canDeletePurchase              |
| purchase              | `DELETE /api/v1/purchases/:id` (handler duplicado: el segundo no se alcanza) | ADMIN (C01), MANAGER (C03)             | canDeletePurchase              |
| purchase              | `DELETE /api/v1/purchasesdetail/:id`                                         | ADMIN (C01), MANAGER (C03)             | canDeletePurchase              |
| sales                 | `GET /api/v1/sales`                                                          | ADMIN (C01), MANAGER (C03), USER (C02) | canViewSale                    |
| sales                 | `POST /api/v1/sales`                                                         | ADMIN (C01), MANAGER (C03), USER (C02) | canCreateSale                  |
| sales                 | `PATCH /api/v1/sales/:id`                                                    | ADMIN (C01), MANAGER (C03), USER (C02) | canEditSale                    |
| sales                 | `DELETE /api/v1/sales/:id`                                                   | ADMIN (C01), MANAGER (C03)             | canDeleteSale                  |
| sales                 | `DELETE /api/v1/salesdetail/:id`                                             | ADMIN (C01), MANAGER (C03)             | canDeleteSale                  |
| settings              | `GET /api/v1/settings/product/categories`                                    | ADMIN (C01), MANAGER (C03), USER (C02) | canViewCategory                |
| settings              | `POST /api/v1/settings/product/categories`                                   | ADMIN (C01), MANAGER (C03)             | canCreateCategory              |
| settings              | `PATCH /api/v1/settings/product/categories/:id`                              | ADMIN (C01), MANAGER (C03)             | canEditCategory                |
| settings              | `DELETE /api/v1/settings/product/categories/:id`                             | ADMIN (C01), MANAGER (C03)             | canDeleteCategory              |
| stock                 | `GET /api/v1/stock`                                                          | ADMIN (C01), MANAGER (C03), USER (C02) | canViewStock                   |
| stock                 | `GET /api/v1/stock` (handler duplicado: el segundo no se alcanza)            | ADMIN (C01), MANAGER (C03), USER (C02) | canViewStock                   |
| stock                 | `GET /api/v1/stock/alerts`                                                   | ADMIN (C01), MANAGER (C03), USER (C02) | canViewStock                   |
| stock                 | `POST /api/v1/stock`                                                         | ADMIN (C01), MANAGER (C03), USER (C02) | canCreateStock                 |
| stock                 | `PATCH /api/v1/stock/:id`                                                    | ADMIN (C01), MANAGER (C03), USER (C02) | canEditStock                   |
| stock                 | `DELETE /api/v1/stock/:id`                                                   | ADMIN (C01), MANAGER (C03), USER (C02) | canDeleteStock                 |
| users                 | `GET /api/v1/users`                                                          | ADMIN (C01), MANAGER (C03)             | canViewUser                    |
| users                 | `GET /api/v1/users/permits`                                                  | ADMIN (C01), MANAGER (C03)             | canViewUser                    |
| users                 | `POST /api/v1/users`                                                         | ADMIN (C01), MANAGER (C03)             | canCreateUser                  |
| users                 | `PATCH /api/v1/users/:id`                                                    | ADMIN (C01), MANAGER (C03)             | canEditUser                    |
| users                 | `DELETE /api/v1/users/:id`                                                   | ADMIN (C01), MANAGER (C03)             | canDeleteUser                  |
| users                 | `DELETE /api/v1/users/:id` (handler duplicado: el segundo no se alcanza)     | ADMIN (C01), MANAGER (C03)             | canDeleteUser                  |
| users                 | `GET /api/v1/users/status`                                                   | ADMIN (C01), MANAGER (C03)             | canViewUser                    |
| users                 | `GET /api/v1/users/roles`                                                    | ADMIN (C01), MANAGER (C03)             | canViewUser                    |
| users                 | `GET /api/v1/users/by-status/`                                               | ADMIN (C01), MANAGER (C03)             | canViewUser                    |
| vacation              | `GET /api/v1/vacation`                                                       | ADMIN (C01), MANAGER (C03), USER (C02) | canViewVacations               |
| vacation              | `POST /api/v1/vacation`                                                      | ADMIN (C01), MANAGER (C03), USER (C02) | canRequestVacation             |
| vacation              | `DELETE /api/v1/vacation/:id`                                                | ADMIN (C01), MANAGER (C03), USER (C02) | canDeleteVacation              |
| vacation              | `PATCH /api/v1/vacation/:id`                                                 | ADMIN (C01), MANAGER (C03), USER (C02) | canEditRequestVacation         |
| warehouse             | `GET /api/v1/warehouse`                                                      | ADMIN (C01), MANAGER (C03), USER (C02) | canViewWarehouse               |
| warehouse             | `GET /api/v1/warehouse/warehouseFilters`                                     | ADMIN (C01), MANAGER (C03), USER (C02) | canViewWarehouse               |
| warehouse             | `POST /api/v1/warehouse`                                                     | ADMIN (C01), MANAGER (C03), USER (C02) | canCreateWarehouse             |
| warehouse             | `PATCH /api/v1/warehouse/:id`                                                | ADMIN (C01), MANAGER (C03), USER (C02) | canEditWarehouse               |
| warehouse             | `DELETE /api/v1/warehouse/:id`                                               | ADMIN (C01), MANAGER (C03), USER (C02) | canDeleteWarehouse             |

**Nota (`notes`):** `router.use(checkRoleAuthOrPermisssion({ allowedRoles: [ADMIN, MANAGER, USER] }))` — único montaje sin `permissions`, ejercita el camino 2 (sin permisos exigidos) y por tanto no cambia de comportamiento con el fix. No figura en la tabla de 102.

**Observaciones del inventario (pre-existentes, fuera de alcance):**

- **4 handlers duplicados** (mismo módulo + método + path declarados dos veces, el segundo inalcanzable por Express): `products GET /`, `stock GET /`, `purchase DELETE /:id`, `users DELETE /:id`. Marcados en la tabla; ninguno cambia con este fix.
- `purchase`/`sales` declaran el path literal `detail/:id` (sin `/` inicial) y **Express no las registra**: verificado contra la app real, `DELETE /api/v1/purchasesdetail/:id` y `DELETE /api/v1/salesdetail/:id` responden **404** (no alcanzan el guard). Son inalcanzables → no pueden filtrar acceso; el barrido de 3.2 las lista como excepción explícita.

## 2. Fix + tests

- [x] 2.1 `verifyRole.ts` camino 3: `user.rolePermits` → `user.permits` + alinear el tipado al include real del DAO (elimina el cast `as unknown as`). El tipo `UserWithRoleAndPermits` ya declara `permits: { include: { permissions: true } }`, así que `user.permits?.map((permit) => permit.permissions.code) ?? []` tipa sin cast.
- [x] 2.2 Tests de regresión en `verifyRole.unit.test.ts`: non-ADMIN con permiso requerido → next() + `req.userRole` asignado; un permiso requerido entre varios asignados → next(); con permisos pero ninguno requerido → 403; sin `permits` (`[]`) → 403; `permits` `undefined` → 403; ADMIN intacto. Suite: **16 tests verdes** (12 previos + 4 nuevos).
- [x] 2.3 Grep de mocks que repliquen `rolePermits`: **0 en tests**. Los únicos restos son `prisma/schema.prisma` (modelo `rolePermits` comentado), migraciones históricas, `docs/rbac-system.md` (actualizado: el bug figura como corregido) y el archive de `server-ts-latent-defects` (follow-up cerrado en 4.2). Ningún mock de integration replicaba el camino 3.
- [x] 2.4 Gates: `type-check` EXIT 0 · `eslint --max-warnings 0` EXIT 0 · `test:unit` **201/201 en 23 archivos** (197 previos + 4 nuevos; el mínimo 178 del change queda superado) · `test:integration` **62/62 en 6 archivos** (57 previos + 5 nuevos) · `depcruise:server` 0 errores (7 warnings `no-orphans` preexistentes) · `prettier --check` limpio.

### 2.5 Contra-prueba (los tests fallan con el código pre-fix)

Se revirtió temporalmente **solo** el acceso (`user.permits` → `(user as unknown as …).rolePermits`, conservando el resto) y se ejecutó la suite:

```
FAIL … > camino 3 (permiso concedido): asigna req.userRole junto al permiso válido
FAIL … > camino 3: concede con UN permiso requerido entre varios asignados
Tests  2 failed | 14 passed (16)
```

Con el código pre-fix esos 2 casos reciben 403 (donde se espera `next()`): son los que capturan el defecto. Los 3 tests fail-closed del camino 3 pasan en **ambos** estados a propósito (el 403 con `rolePermits` era un falso fail-closed), así que el par grant/deny es lo que fija el contrato. Restaurado el fix desde copia y re-ejecutada la suite: **16/16**.

## 3. Validación de autorización (post-fix, pre-merge)

- [x] 3.1 Smoke de autorización integration: un USER con `canViewEvents` en su userPermit accede a `GET /events` (hoy 403) — evidencia registrada aquí.
  - **Evidencia 2026-10-20:** `tests/integration/authorization/permission-grant-path.integration.test.ts` (3 tests, **BD real, sin mocks**): `verifyToken` real (JWT HS256 firmado con `SECRETKEY`, `iss: mi-api`, `aud: mi-front`) → `checkRoleAuthOrPermisssion` → DAO real (`permits.include.permissions`) → `GET /api/v1/events`.
  - `USER (C02) con canViewEvents` → **200** (`success: true`). `USER (C02) sin el permiso` → **403** `Insufficient permissions for this operation`. `ADMIN (C01)` sin userPermits → **200** (short-circuit).
  - **Contra-prueba:** con el acceso pre-fix restaurado temporalmente, el test de concesión falla con `expected 403 to be 200` (1 failed | 2 passed) — el smoke reproduce el defecto real, no solo el contrato. Restaurado: 3/3 y suite completa `test:integration` 60/60.
  - Los usuarios se reutilizan del seed (`admin@gmail.com`, `user2@gmail.com`); el `afterAll` revoca los `userPermits` creados para no contaminar el resto de la suite.
- [ ] 3.2 Verificar que ningún endpoint que DEBÍA seguir cerrado para no-ADMINs queda abierto (cruce del inventario 1.2 con la matriz 1.1).
  - **Mitad "nada queda abierto": LISTA y automatizada.** `tests/integration/authorization/permission-guard-inventory.integration.test.ts` descubre las rutas en el código (mismo criterio que 1.2), las pide todas con un **USER (C02) sin ningún `userPermit`** contra la app y el DAO reales, y exige 403 (`Role not authorized…` o `Insufficient permissions…`) en **98 endpoints** (102 montajes − 4 handlers duplicados). Excepciones explícitas: los 2 `DELETE …detail/:id` que Express no registra → 404.
  - **No vacuo (mutación):** quitando temporalmente el bloque de 403 del middleware, el barrido reporta **44 rutas abiertas** y falla; restaurado → verde. Si una ruta nueva se abre por accidente, el test la delata sola (la lista se descubre en runtime).
  - **Pendiente (bloqueado por 1.1):** el otro lado del cruce — que cada ruta conceda acceso **exactamente** a los roles/permisos que declara la matriz de producción. Sin esa matriz no hay oráculo contra el que comparar.

## 4. Cierre

- [x] 4.1 `openspec validate server-fix-role-permits-authorization --strict` → PASS + nota en `docs/CONTEXT-CICD.md` (follow-up 4.3 de latent-defects cerrado).
- [x] 4.2 Cerrar el follow-up 4.3 en el archive de latent-defects (anotar el hash del fix). Anotado en `openspec/changes/archive/2026-10-20-server-ts-latent-defects/tasks.md` 4.3, referenciando este change; el hash se añade al commitear (el repo exige firma SSH + DCO y aún no hay commit).
