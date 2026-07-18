# Modules Index

Índice de módulos del sistema. Cada documento consolida frontend (React) y backend (Express) en un único SDD (Software Design Description) siguiendo estándares arc42 / C4 Model / IEEE 1016.

> 26 módulos documentados. Última actualización: 2026-06-11.

## Dashboard & Layout

- [Home](home.md) — Layout principal con sidebar, navbar y dashboard de acceso a módulos (client-only)

## Core System

- [Auth](auth.md) — Autenticación JWT, login/register, refresh token, logout
- [Permission](permission.md) — Permisos laborales de empleados (licencias, enfermedad, maternidad, asuntos personales)
- [Users](users.md) — Gestión de usuarios con roles RBAC y permisos granulares
- [Settings](settings.md) — Configuración de visualización e idioma
- [Settings Product Categories](settingsProductCategories.md) — Categorías de producto con código y descripción (client-only)

## Inventory & Products

- [Products](products.md) — CRUD de productos con SKU, categorías, proveedores y atributos dinámicos
- [Stock](stock.md) — Control de stock por producto/almacén/lote con alertas de stock bajo y vencido
- [Inventory Movement](inventoryMovement.md) — Movimientos de inventario (entrada/salida/transferencia/ajuste)

## Sales & Purchases

- [Sales](sales.md) — Ventas con items y totales
- [Client Orders](clientOrder.md) — Pedidos de clientes
- [Providers](providers.md) — Catálogo de proveedores
- [Provider Orders](providerOrder.md) — Órdenes de compra a proveedores
- [Purchase](purchase.md) — Compras registradas
- [Clients](clients.md) — Catálogo de clientes

## Warehouse & Employees

- [Warehouse](warehouse.md) — Almacenes con CRUD, estados operativos y vinculación a stock
- [Employees](employees.md) — Empleados con datos sensibles encriptados
- [Attendance](attendance.md) — Asistencia y horas trabajadas
- [Payroll](payroll.md) — Nóminas con montos encriptados
- [Vacation](vacation.md) — Solicitudes de vacaciones (PENDING/APPROVED/REJECTED)
- [Performance Evaluation](performanceEvaluation.md) — Evaluaciones de desempeño

## Security

- [Security](security.md) — CSP report endpoint

## Content & Communication

- [Events](events.md) — Gestión de eventos con tipos y fechas
- [Notes](notes.md) — Notas Kanban con columnas, hashtags, menciones y favoritos
- [News](news.md) — Noticias con ciclo de vida ACTIVE→PENDING→CLOSED

## Finance

- [Expenses](expenses.md) — Gastos empresariales categorizados (Prisma native enum)

---

## Convenciones transversales

| Aspecto | Patrón |
| -------------- | ----------------------------------------------- |
| Arquitectura | `routes → controller → service → dao` |
| ORM | Prisma ORM + `$queryRaw` (Warehouse, Employees, Attendance, Vacation, Expenses) |
| Auth | `verifyToken` global + `checkRoleAuthOrPermisssion` por endpoint |
| User ID | `req.userId` en controller middleware |
| Pagination | `getSafePagination({page, limit})` |
| Validation | Joi (server) + Zod (client) |
| State mgmt | Redux Toolkit + RTK Query |
| Date format | `date-fns` |
| i18n | `react-i18next` (cliente) |

## Módulos con bugs conocidos

| Módulo | Bug | Severidad |
| ----------- | --- | --------- |
| Events | `updateEventById` no puede actualizar FK `type` | HIGH |
| Notes | `updateNoteById` llamada recursiva para `hasMentions: true` | HIGH |
| PerformanceEvaluation | URL mismatch client (`/performance-evaluation`) vs server (`/performance-evaluations`) → 404 | HIGH |
| Expenses | Category enum spaces vs underscores (`BANK FEES` vs `BANK_FEES`) | HIGH |
| Vacation | `createdBy`/`updatedBy` nunca seteados | HIGH |
| Payroll | `ILIKE` en columnas Int (month, year) | HIGH |
| ProviderOrder | Middleware registrado pero rutas no montadas en v1/index.js | HIGH |
| ClientOrder | `routes.js` vacío | HIGH |
