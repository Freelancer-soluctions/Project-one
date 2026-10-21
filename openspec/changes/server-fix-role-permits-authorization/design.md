# Design

> Follow-up 4.3 de `server-ts-latent-defects`. Fix de 1 línea con gate de producto. Hereda el protocolo de gates.

## Decisión 1 — El fix es `rolePermits` → `permits` (1 propiedad, no re-diseño)

El DAO incluye `permits: { include: { permissions: true } }` (`users/dao.ts` L118-127 — relación Prisma `users → userPermits → permissions`, confirmada en schema). El middleware lee `rolePermits` (inexistente). El fix corrige el nombre y alinea el cast:

```ts
const rolePermits = (user as unknown as {
  rolePermits?: ...
}).rolePermits;
```

→

```ts
const rolePermissions = user.permits?.map((rp) => rp.permissions.code) ?? [];
```

(`user` ya está tipado por el retorno del DAO tras la migración — el cast `as unknown as` desaparece si el tipo incluye `permits`.)

**Descartado**: re-diseñar el sistema de permisos (roles anidados, permisos por usuario vs por rol) — fuera de alcance; el diseño existente es usuario → userPermits → permissions y solo está roto el nombre de la propiedad.

## Decisión 2 — Gate de producto ANTES de merge (task 1.1 BLOQUEANTE)

Magnitud real (@planner, 2026-10-20): **103 call sites en 20 archivos, 102 con `permissions: [...]` exigida, 0 ADMIN-only** — el delta de autorización es ~7× la estimación inicial de 14, e incluye rutas sensibles (`users`, `settings`, `permission`, `payroll`). Antes de mergear se debe:

1. Consultar la matriz real: `SELECT` de `userPermits` join `permissions` join `users` en producción (o su export) — qué usuarios tienen qué permisos. **La task 1.1 exige evidencia**: conteo de filas, lista de usuarios por permiso, fecha y aprobador con nombre (no basta marcar el checkbox).
2. Generar el inventario de rutas afectadas **por script** (`scripts/inventory-permission-routes.mjs` — output markdown commiteado como evidencia; reproducible, no a mano sobre 102 filas).
3. Sign-off del owner de producto: "estos usuarios DEBEN tener acceso a estas rutas".

Si el sign-off no llega: el change queda implementado-en-rama con tests verdes y NO se mergea (los 403 actuales son el comportamiento de producción).

## Decisión 3 — Tests de regresión del camino 3 (unit, mocks del DAO)

Suite `verifyRole.unit.test.ts` (ya existente, 12 tests) amplía el describe de `checkRoleAuthOrPermisssion`:

- non-ADMIN + `permits` conteniendo el permiso requerido → `next()` llamado, `req.userRole` asignado (**hoy: 403** — el test nuevo captura el fix)
- non-ADMIN + `permits` SIN el permiso → 403 (se mantiene)
- non-ADMIN + sin `permits` (undefined/[]) → 403 (se mantiene)
- ADMIN → next() sin evaluar permisos (ya cubierto, se mantiene)

Mock del DAO: `getUserRoleByUserId` retorna `{ roles: { code }, permits: [{ permissions: { code } }] }` — shape real del include.

## Decisión 4 — Inventario de rutas afectadas (delta de autorización)

Task 1.2 genera la tabla: módulo / ruta / método / roles-allowlist / permissions-exigidos / estado-hoy (403) / estado-post-fix (acceso si tiene permiso). Fuentes: grep `checkRoleAuthOrPermisssion` + `permissions: [` sobre los 21 archivos de rutas. Esta tabla es el insumo del sign-off de producto.

## Decisión 5 — Los mocks de integration events (B1) NO se tocan aquí

Los mocks de `events-soft-delete`/`combined-filters` ya fueron alineados a C01/C02 en latent-defects (B1). Los mocks que repliquen el camino 3 con `rolePermits` (si existen en otros tests) se actualizan en el commit de este fix — verificación grep en task 2.2.
