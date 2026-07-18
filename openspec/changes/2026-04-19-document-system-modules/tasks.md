# Tasks: Document System Modules

> Tareas secuenciales para documentar todos los módulos del sistema usando el formato arc42 / C4 Model / IEEE 1016 (consolidado server+client).

## Task List

### Fase 1: Documentación de Módulos

- [x] **Task 1: Auth module docs** — Generar `docs/modules/auth.md` explorando `apps/server/src/modules/auth/` y `apps/client/src/modules/auth/`. Incluir: endpoints de login/register/refresh/logout, JWT middleware, RBAC, esquemas Joi/Zod, flujo de autenticación.
- [x] **Task 2: Permission module docs** — Generar `docs/modules/permission.md` explorando `apps/server/src/modules/permission/` y `apps/client/src/modules/permission/`. Incluir: gestión de permisos laborales, tipos (SICK/PERSONAL/MATERNITY/PATERNITY/OTHER), estados (PENDING/APPROVED/REJECTED), CRUD completo, filtros, paginación.
- [x] **Task 3: Users module docs** — Generar `docs/modules/users.md` explorando `apps/server/src/modules/users/` y `apps/client/src/modules/users/`. Incluir: CRUD de usuarios, roles, permisos, perfil, gestión de usuarios.
- [x] **Task 4: Products module docs** — Generar `docs/modules/products.md` explorando `apps/server/src/modules/products/` y `apps/client/src/modules/products/`. Incluir: CRUD de productos, categorías, precios, imágenes, stock vinculado.
- [x] **Task 5: Stock module docs** — Generar `docs/modules/stock.md` explorando `apps/server/src/modules/stock/` y `apps/client/src/modules/stock/`. Incluir: control de stock, ajustes, movimientos, consultas.
- [x] **Task 6: InventoryMovement module docs** — Generar `docs/modules/inventoryMovement.md` explorando `apps/server/src/modules/inventoryMovement/` y `apps/client/src/modules/inventoryMovement/`. Incluir: movimientos de inventario, tipos, ajustes, historial.
- [x] **Task 7: Sales module docs** — Generar `docs/modules/sales.md` explorando `apps/server/src/modules/sales/` y `apps/client/src/modules/sales/`. Incluir: registro de ventas, cálculo de totales, métodos de pago, historial.
- [ ] **Task 8: Purchase module docs** — Generar `docs/modules/purchase.md` explorando `apps/server/src/modules/purchase/` y `apps/client/src/modules/purchase/`. Incluir: compras, workflow de aprobación, asociación con proveedores.
- [ ] **Task 9: ClientOrder module docs** — Generar `docs/modules/clientOrder.md` explorando `apps/server/src/modules/clientOrder/` y `apps/client/src/modules/clientOrder/`. Incluir: pedidos de clientes, workflow de estados, items del pedido.
- [ ] **Task 10: ProviderOrder module docs** — Generar `docs/modules/providerOrder.md` explorando `apps/server/src/modules/providerOrder/` y `apps/client/src/modules/providerOrder/`. Incluir: órdenes a proveedores, workflow de aprobación, recepción.
- [ ] **Task 11: ✅ CHECKPOINT: Verify template consistency across first 10 modules** — Verificar consistencia de plantilla entre los primeros 10 módulos documentados (auth, permission, users, products, stock, inventoryMovement, sales, purchase, clientOrder, providerOrder). Revisar: estructura arc42/C4/IEEE 1016, secciones obligatorias, formato de diagramas Mermaid, nomenclatura de endpoints, estilo de tablas.
- [ ] **Task 12: Clients module docs** — Generar `docs/modules/clients.md` explorando `apps/server/src/modules/clients/` y `apps/client/src/modules/clients/`. Incluir: CRUD de clientes, datos de contacto, historial de compras, estados.
- [ ] **Task 13: Providers module docs** — Generar `docs/modules/providers.md` explorando `apps/server/src/modules/providers/` y `apps/client/src/modules/providers/`. Incluir: CRUD de proveedores, datos de contacto, productos suministrados.
- [ ] **Task 14: Warehouse module docs** — Generar `docs/modules/warehouse.md` explorando `apps/server/src/modules/warehouse/` y `apps/client/src/modules/warehouse/`. Incluir: gestión de almacenes, ubicaciones, transferencias entre almacenes.
- [ ] **Task 15: Employees module docs** — Generar `docs/modules/employees.md` explorando `apps/server/src/modules/employees/` y `apps/client/src/modules/employees/`. Incluir: CRUD de empleados, datos personales, laborales, documentos.
- [ ] **Task 16: Attendance module docs** — Generar `docs/modules/attendance.md` explorando `apps/server/src/modules/attendance/` y `apps/client/src/modules/attendance/`. Incluir: registro de asistencia, marcación, reportes.
- [ ] **Task 17: Payroll module docs** — Generar `docs/modules/payroll.md` explorando `apps/server/src/modules/payroll/` y `apps/client/src/modules/payroll/`. Incluir: cálculo de nómina, deducciones, percepciones, periodos.
- [ ] **Task 18: Vacation module docs** — Generar `docs/modules/vacation.md` explorando `apps/server/src/modules/vacation/` y `apps/client/src/modules/vacation/`. Incluir: solicitudes de vacaciones, cálculo de días, aprobación.
- [ ] **Task 19: PerformanceEvaluation module docs** — Generar `docs/modules/performanceEvaluation.md` explorando `apps/server/src/modules/performanceEvaluation/` y `apps/client/src/modules/performanceEvaluation/`. Incluir: evaluaciones de desempeño, criterios, periodos, resultados.
- [ ] **Task 20: Settings module docs** — Generar `docs/modules/settings.md` explorando `apps/server/src/modules/settings/` y `apps/client/src/modules/settings/`. Incluir: configuración general del sistema, parámetros, valores por defecto.
- [ ] **Task 21: ✅ CHECKPOINT: Verify template consistency across modules 12-20** — Verificar consistencia de plantilla entre los módulos 12-20 (clients, providers, warehouse, employees, attendance, payroll, vacation, performanceEvaluation, settings). Revisar: estructura arc42/C4/IEEE 1016, secciones obligatorias, formato de diagramas Mermaid, nomenclatura de endpoints, estilo de tablas.
- [ ] **Task 22: SettingsProductCategories module docs** — Generar `docs/modules/settingsProductCategories.md` explorando `apps/server/src/modules/settingsProductCategories/` y `apps/client/src/modules/settingsProductCategories/`. Incluir: categorías de productos, atributos, configuración.
- [ ] **Task 23: Home module docs** — Generar `docs/modules/home.md` explorando `apps/client/src/modules/home/`. Módulo client-only (no tiene backend). Incluir: dashboard, widgets, indicadores, resúmenes.
- [ ] **Task 24: Security module docs** — Generar `docs/modules/security.md` explorando `apps/server/src/modules/security/`. Módulo server-only (no tiene frontend). Incluir: auditoría, logs de seguridad, intentos de acceso, trazabilidad.
- [ ] **Task 25: Expenses module docs** — Generar `docs/modules/expenses.md` explorando `apps/server/src/modules/expenses/` y `apps/client/src/modules/expenses/`. Incluir: registro de gastos, categorías, aprobación, reportes.
- [ ] **Task 26: News module docs** — Generar `docs/modules/news.md` explorando `apps/server/src/modules/news/` y `apps/client/src/modules/news/`. Incluir: gestión de noticias, publicación, categorías, visibilidad.
- [ ] **Task 27: Notes module docs** — Actualizar y verificar `docs/modules/notes.md`. Explorar `apps/server/src/modules/notes/` y `apps/client/src/modules/notes/` para identificar drift contra el código fuente actual. Alinear con formato arc42/C4/IEEE 1016 completo.

### Fase 2: Limpieza y Finalización

- [ ] **Task 28: Remove old stub files** — Eliminar `docs/modules/server-auth.md`, `server-users.md`, `server-stock.md`, `server-notes.md`, `client-auth.md`, `client-users.md`, `client-stock.md`, `client-notes.md` (reemplazados por versiones consolidadas).
- [ ] **Task 29: Update INDEX.md** — Reescribir `docs/modules/INDEX.md` con lista consolidada full-stack (sin separación Server/Client). Incluir todos los módulos con links a sus documentos.
- [ ] **Task 30: Final review and verify all docs** — Revisión final de consistencia: verificar que todos los documentos existen, que los links en INDEX.md son válidos, que los diagramas Mermaid son correctos, y que no hay referencias a stubs legacy.

## Notas

- Cada tarea de documentación implica: (1) explorar código fuente server + client, (2) generar markdown siguiendo la plantilla estandarizada, (3) verificar consistencia con módulos previos.
- Los checkpoints (Tasks 11 y 21) detienen la fase para revisar uniformidad de plantilla antes de continuar.
- Tasks ejecutar secuencialmente en 
