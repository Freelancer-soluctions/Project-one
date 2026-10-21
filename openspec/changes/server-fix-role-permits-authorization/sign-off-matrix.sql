-- Insumo del gate de producto (task 1.1) de server-fix-role-permits-authorization.
--
-- Ejecutar contra la BD de PRODUCCIÓN (solo lectura) y pegar la salida en
-- tasks.md §1.1. El sign-off responde a una sola pregunta por bloque:
--   "¿estos usuarios DEBEN acceder a las rutas que exigen estos permisos?"
--
-- Relaciones (prisma/schema.prisma): users → userPermits → permissions.
-- El fix solo consulta `userPermits` (no hay permisos por rol: `rolePermits`
-- está comentado en el schema), así que la matriz real es usuario × permiso.

-- 1) MATRIZ usuario × permiso (el oráculo del cruce 3.2)
SELECT
  u.id                                        AS "userId",
  u.email,
  r.code                                      AS "roleCode",
  p.code                                      AS "permissionCode",
  p.description                               AS "permissionDescription"
FROM "userPermits" up
JOIN "users" u        ON u.id = up."userId"
LEFT JOIN "roles" r   ON r.id = u."roleId"
JOIN "permissions" p  ON p.id = up."permissionId"
ORDER BY u.id, p.code;

-- 2) COBERTURA: usuarios sin ningún permiso asignado.
--    Si esto devuelve casi todos los no-ADMIN, el fix es un no-op en runtime
--    (los 403 persisten por falta de datos, no por el bug).
SELECT
  u.id,
  u.email,
  r.code AS "roleCode",
  COUNT(up.id) AS "permits"
FROM "users" u
LEFT JOIN "roles" r       ON r.id = u."roleId"
LEFT JOIN "userPermits" up ON up."userId" = u.id
GROUP BY u.id, u.email, r.code
HAVING COUNT(up.id) = 0
ORDER BY u.id;

-- 3) PERMISOS sin ningún usuario: las rutas que los exigen seguirán dando 403
--    a todo no-ADMIN después del fix. El inventario de tasks.md §1.2 dice qué
--    rutas dependen de cada código.
SELECT p.code, p.description, COUNT(up.id) AS "users"
FROM "permissions" p
LEFT JOIN "userPermits" up ON up."permissionId" = p.id
WHERE p.code IN (
  -- códigos exigidos por las rutas del inventario (§1.2)
  'canViewAttendance', 'canCreateAttendance', 'canDeleteAttendance', 'canEditAttendance',
  'canViewClient', 'canCreateClient', 'canEditClient', 'canDeleteClient',
  'canViewEmployee', 'canCreateEmployee', 'canEditEmployee', 'canDeleteEmployee',
  'canRegisterForEvent', 'canCancelRegistration', 'canViewAttendees', 'canManageAttendees',
  'canCreateEvents', 'canViewEvents', 'canEditEvents', 'canDeleteEvents',
  'canViewExpense', 'canCreateExpense', 'canDeleteExpense', 'canEditExpense',
  'canViewInventory', 'canCreateInventory', 'canEditInventory', 'canDeleteInventory',
  'canViewNews', 'canCreateNews', 'canEditNews', 'canDeleteNews',
  'canViewPayroll', 'canCreatePayroll', 'canDeletePayroll', 'canEditPayroll',
  'canViewPerformanceEvaluations', 'canCreateEvaluatePerformance',
  'canEditEvaluatePerformance', 'canDeleteEvaluationPerformance',
  'canViewPermission', 'canCreatePermission', 'canEditPermission', 'canDeletePermission',
  'canViewProduct', 'canCreateProduct', 'canEditProduct', 'canDeleteProduct',
  'canViewProvider', 'canCreateProvider', 'canEditProvider', 'canDeleteProvider',
  'canViewPurchase', 'canCreatePurchase', 'canEditPurchase', 'canDeletePurchase',
  'canViewSale', 'canCreateSale', 'canEditSale', 'canDeleteSale',
  'canViewCategory', 'canCreateCategory', 'canEditCategory', 'canDeleteCategory',
  'canViewStock', 'canCreateStock', 'canEditStock', 'canDeleteStock',
  'canViewUser', 'canCreateUser', 'canEditUser', 'canDeleteUser',
  'canViewVacations', 'canRequestVacation', 'canDeleteVacation', 'canEditRequestVacation',
  'canViewWarehouse', 'canCreateWarehouse', 'canEditWarehouse', 'canDeleteWarehouse'
)
GROUP BY p.code, p.description
ORDER BY "users" ASC, p.code;

-- Cierre del gate: si (1) lista permisos para cada usuario que debe entrar y
-- (3) no deja permisos huérfanos en rutas críticas, el owner de producto firma
-- "estos accesos son los esperados" y el change puede mergearse.
