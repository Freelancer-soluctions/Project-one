# Design

## Context

See proposal.md. Current state: no traceability, reason/comments (permission only in UI, dropped), no balance/accrual, payroll decoupled, approval via generic PATCH by any editor.

## Goals / Non-Goals

**Goals:** full traceability + reason/comments + balance/accrual + payroll deduction + approval authorization.
**Non-Goals:** multi-tenant, notifications, external HR.

## Decisions

### D1 — 4 traceability columns (approvedBy/approvedAt/rejectedBy/rejectedAt) + reason + comments on both models.

### D2 — Stamp in service based on status transition + req.userId; sanitize spread to block forgery.

### D3 — New `vacationBalance` (employeeId, year, accrued, used, remaining) + `vacationAccrualRecord` (employeeId, period, days, type) models; accrual policy v1 = 1.25 days/month, cap 30, no carry-over; transactional updates with locking. Add `paid Boolean @default(true)` to vacation and permission.

### D4 — New permission codes `canApproveVacation`, `canApprovePermission`; ADMIN bypass.

### D5 — Payroll service reads approved unpaid vacations in period and deducts.

### D6 — Keep raw SQL `va.*`/`pe.*` but extend joins/types; keep reason/comments unencrypted.

## Risks / Trade-offs

- [Concurrency on balance] → DB transactions + row locking.
- [Payroll semantics change] → tests + documented formula.
- [No existing tests] → add integration tests first.
- [Spread forgery] → whitelist fields in service.

## Migration Plan

1. Add nullable columns + new models.
2. Backfill null (no data migration needed).
3. Contract not required (keep nullable for historical).

Rollback: manual SQL.

## Frontend Impact

- VacationDialog: reason + comments inputs + paid toggle + audit pairs (approved/rejected by/on).
- PermissionDialog: approved/rejected audit pairs + paid toggle (reason/comments already).
- Datatables: new columns (reason, comments, paid, approved/rejected by/on).
- Balance: RTK Query endpoints + UI placement (request dialog validation + remaining display).
- Filters forms: update EMPTY_FILTERS/toFilterParams or mark out of scope.
- i18n keys (en/es): approved_by, approved_on, rejected_by, rejected_on, reason, comments, paid, balance/remaining/accrued/used.
- fieldLimits: vacation block (reason 500, comments 1000).
- UI tests: update fixtures + regenerate snapshots.
- Permission-gated status transitions in UI (canApprove\* or ADMIN).

## Threat Model

Auth fail-closed; approval gated by new codes; no PII leak; encrypted salary/dni untouched.

## Decisiones de implementación (cierre)

Confirmadas por el usuario en esta sesión (2026-11-27): las decisiones de abajo se mantienen tal como están implementadas.

Decisiones tomadas al implementar; quedan registradas aquí para revisión.

- **Saldo para todo tipo de vacación.** El descuento aplica también a permisos no remunerados (`paid = false`), tal como dice RN-VP-006/007. Solo la nómina distingue por `paid`.
- **Días corridos, inclusivos, en UTC.** No se excluyen fines de semana ni festivos (`countVacationDays`).
- **Año del saldo = año de la fecha de inicio.** Un permiso que cruza el cambio de año se carga entero al año de inicio.
- **Salir de APPROVED devuelve los días.** Aplica a `REJECTED`, `CANCELLED` y `PENDING` (RN-VP-008). Re-aprobar re-estampa y re-descuenta; el neto es cero.
- **Estado `CANCELLED`.** Se añade a `vacationStatus` y `permissionStatus` (migración `20261128002504_vacation_permission_cancelled`). Se estampa como rechazo y exige `canApprove*` (RN-VP-010).
- **Nómina: descuento = salario / 30 × días no remunerados del periodo.** Solo vacaciones (`paid = false`, `APPROVED`). Se resta de `totalPayment` con tope en 0. Los permisos de `permission` no descuentan.
- **Nómina en PATCH.** Si el PATCH trae `totalPayment` (bruto), se recalcula con el empleado y periodo efectivos. Si cambia empleado o periodo sin `totalPayment`, responde 400.
- **Devengo a todos los empleados.** El modelo no tiene flag de activo. Idempotente por (empleado, periodo, ACCRUAL). Solo ADMIN.
- **Capacidad de aprobación en UI.** `GET /vacation/approval-access` devuelve solo booleanos. Es un endpoint adicional a la especificación original, para que la UI no necesite conocer los permisos del usuario.
- **Filtros (5.5).** Fuera de alcance: los filtros no cambian y los campos nuevos no son filtrables.

## Despliegue

Las migraciones `20261127191822_vacation_permission_full` y `20261128002504_vacation_permission_cancelled` son aditivas (columnas nullable, tablas nuevas y valores de enum). Aplicar con `npx prisma migrate deploy` en cada entorno antes de desplegar el servidor. No usar `npm run prisma-migration`: ese script ejecuta `prisma migrate dev`, pensado solo para desarrollo. Rollback manual: eliminar columnas y tablas nuevas; PostgreSQL no permite quitar valores de un enum sin recrearlo.
