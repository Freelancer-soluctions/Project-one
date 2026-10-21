# Proposal

> Change de seguridad/autorización — follow-up 4.3 de `server-ts-latent-defects` (archivado). **GATE DE PRODUCTO: no implementar sin confirmar la matriz de `userPermits` en producción** — el fix convierte 403 en acceso para los no-ADMIN con permisos asignados.

## Why

`checkRoleAuthOrPermisssion` es el guard de **21 archivos de rutas / 103 call sites** (102 con `permissions: [...]` exigida; 0 rutas ADMIN-only — todas admiten USER/MANAGER). Su camino 3 (concesión por permiso) lee `user.rolePermits` — propiedad que **no existe**: el DAO (`users/dao.getUserRoleByUserId` L118-127) incluye `permits: { include: { permissions: true } }` (relación Prisma `userPermits → permissions`). Resultado: `rolePermissions` es siempre `[]`, `hasSomePermission` siempre `false`, y **cualquier no-ADMIN recibe 403 "Insufficient permissions for this operation"** en las rutas que exigen permisos — aunque su rol tenga el permiso asignado en la BD.

El defecto es **fail-closed** (seguro, pero funcionalmente roto): el sistema de permisos granular (`userPermits`) está muerto en runtime. Descubierto como follow-up 4.3 durante `server-ts-latent-defects` (Fase 3 lo registró preservando comportamiento; `strict` solo tipó el acceso como existía).

## What Changes

- **Fix de 1 línea + tests**: `user.rolePermits` → `user.permits` en `checkRoleAuthOrPermisssion` (y el cast interno `rolePermits?` → tipado desde el DAO real `permits?: Array<{ permissions: { code: string } }>`).
- **Tests de regresión**: unit — non-ADMIN con `permits` conteniendo el permiso requerido → next() (hoy 403); sin el permiso → 403 (se mantiene); sin `permits` → 403 (se mantiene).
- **Inventario de rutas afectadas (21 módulos, ≥14 con permissions)**: documentar en tasks qué rutas cambian de 403 → acceso al desplegar, para validación de producto.
- **Gate de producto (task 1.1, BLOQUEANTE)**: validar la matriz `userPermits` de producción — qué roles/usuarios tienen qué permisos — ANTES de mergear. Si la matriz está vacía o desactualizada, el fix no cambia nada en runtime (los 403 persisten por falta de permisos asignados) y el change queda listo para cuando se asignen.

**Fuera de alcance**: el guard 403-vs-401 de `userId` undefined (design de latent-defects §4), `patchSettingsById` sin `updatedOn`, la matriz de permisos en sí (asignación de datos).

## Capabilities

### New Capabilities

- `server-permission-grant-path`: Autorización por permisos operativa en `checkRoleAuthOrPermisssion`. Cubre la corrección del acceso `permits` (no `rolePermits`), los tests de regresión del camino 3 (con permiso → next; sin permiso → 403; sin permits → 403), el inventario de rutas afectadas para sign-off de producto, y el gate de matriz de userPermits antes de merge.

## Impact

| File                                            | Change                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `src/middleware/verifyRole.ts` L144-152         | `rolePermits` → `permits` (+ tipado alineado al include real del DAO) |
| `src/middleware/verifyRole.unit.test.ts`        | casos nuevos del camino 3 (con/sin permiso, sin permits)              |
| 21 archivos de rutas (solo inventario en tasks) | sin cambios de código — documentan el delta 403→acceso                |
| `docs/CONTEXT-CICD.md`                          | follow-up 4.3 cerrado                                                 |

**Riesgos**: (1) **apertura de autorización**: usuarios con permisos mal asignados en BD ganarían acceso — mitigado por el gate de producto (1.1) sobre 102 call sites; (2) si `userPermits` en producción está vacío, el fix es un no-op runtime (los 403 persisten correctamente); (3) segundo defecto de la misma clase incluido: typo `canDeletStock` en `PERMISSIONCODES` (task 2.4); (4) los mocks de integration events YA implementan el contrato post-fix (leían `user.permits`) y NUNCA ejercitaron el middleware real (mockean `middleware/index.js` completo) — el bug solo era detectable por unit test; registrar la deuda del duplicado.
