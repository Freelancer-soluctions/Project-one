# server-fix-role-permits-authorization

Fix de autorización descubierto como follow-up 4.3 del change `server-ts-latent-defects` (archivado 2026-10-20). **Requiere decisión de producto antes de implementar** — el fix cambia autorización en runtime.

**El defecto:** `checkRoleAuthOrPermisssion` lee `user.rolePermits` (propiedad inexistente) pero el DAO (`users/dao.getUserRoleByUserId`) devuelve `permits` (relación `userPermits → permissions`, schema confirmado) → `rolePermissions = []` siempre → `hasSomePermission` siempre `false` → **todo no-ADMIN recibe 403 "Insufficient permissions"** en rutas que exigen permisos.

**Alcance medido (2026-10-20, verificado por @planner):** `checkRoleAuthOrPermisssion` en **21 archivos de rutas**; **103 call sites** de los cuales **102 exigen `permissions: [...]`** (solo `notes/routes.ts` L24 es role-only). Concentración: products 10, users 9, stock/purchase 6, clients/employees/events/news/providers/sales/warehouse 5. Allowlist ADMIN-only: **0** → los 103 admiten USER/MANAGER. El camino 3 (permiso concedido) es camino-muerto hoy.

**Nota de seguridad:** el bug es fail-CLOSED (403 en vez de acceso indebido) — el fix ABRE acceso a quien tiene permisos asignados en BD. Requiere validar la matriz userPermits de producción antes de desplegar.

## Estado de implementación (2026-10-20)

- **Código y tests: LISTO.** `verifyRole.ts` lee `user.permits` (sin cast) y `verifyRole.unit.test.ts` cubre el camino 3 con **16 tests** (4 nuevos). Gates: `type-check` 0 · `eslint --max-warnings 0` 0 · `test:unit` **201/201** · `depcruise:server` 0 errores.
- **Smoke real (3.1): LISTO.** `tests/integration/authorization/permission-grant-path.integration.test.ts` contra BD real, sin mocks: USER (C02) con `canViewEvents` → **200** en `GET /api/v1/events` (pre-fix 403), sin el permiso → 403, ADMIN → 200. `test:integration` **62/62** (contra-prueba: con el acceso pre-fix falla `expected 403 to be 200`).
- **Barrido del inventario (3.2, mitad "nada se abre"): LISTO.** `permission-guard-inventory.integration.test.ts` descubre las rutas en el código y las pide todas con un USER sin `userPermits`: **98 endpoints → 403** (2 `detail/:id` no registrados → 404). Mutación: quitando el 403 del middleware falla con **44 rutas abiertas**.
- **Contra-prueba unit:** con el acceso pre-fix restaurado temporalmente, los 2 tests de concesión fallan (403 donde se espera `next()`); el resto pasa igual por diseño fail-closed.
- **BLOQUEADO PARA MERGE:** task 1.1 (matriz `userPermits` de producción + sign-off de producto) y el cruce ruta-por-ruta de 3.2 no pueden ejecutarse sin la BD de producción ni el owner de producto. Sin ese sign-off, el change queda en rama con gates verdes y **no se mergea**.
- **No commiteado:** el repo exige firma SSH + DCO (`git commit -S -s`).
