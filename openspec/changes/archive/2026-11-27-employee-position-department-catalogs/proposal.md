# Proposal

## Why

`employees.position` and `employees.department` are free-text `String @db.VarChar(100)` (schema.prisma:605-606). There are no `positions`/`departments` entities, so the system cannot group/filter consistently, build org charts, or assign area managers. Historical free text is inconsistent (casing/whitespace), making reports unreliable.

## What Changes

- New `positions` and `departments` catalog tables (id, code, name, active, audit fields) modeled on existing `productCategories`.
- `employees.positionId` and `employees.departmentId` nullable FKs (expand step), backfilled by normalized distinct free-text values.
- Migrate and require FKs after backfill (contract step).
- Update backend (dao raw SQL, Joi, types, controllers, routes, OpenAPI) and frontend (dialog selects, datatable columns, zod, i18n, snapshots).
- Catalog CRUD reuses the existing employee permission codes (`canCreate/Edit/View/DeleteEmployee`, ADMIN/MANAGER); no new permission codes in v1 (see design D4).

## Non-goals

- No `salaryType` enum (separate change).
- No employee↔user FK linkage (separate change).
- No org-chart UI beyond grouping/filtering by department.

## Capabilities

### New Capabilities

- `employee-catalogs`: position and department catalog CRUD, employee linkage, grouping/filtering.

### Modified Capabilities

- (none — no existing spec covers employees)

## Impact

- **DB**: 2 new tables + 2 nullable FKs + backfill + contract migration.
- **API**: new `/positions`, `/departments` endpoints; employee create/update payloads change from string to id.
- **Frontend**: EmployeeDialog, EmployeesDatatable, filters, zod, i18n, snapshots.
- **Risk**: backfill inconsistencies; high regression risk (no employee tests beyond UI snapshot).

## Riesgos

- R1: free-text inconsistencies → idempotent backfill + manual review queue.
- R2: raw SQL joins must keep `decryptResults` working (salary/dni encrypted).
- R3: no employee integration tests → add before refactor.
- R4: Sequencing — all three employee changes (catalogs → salary-type → user-linkage) modify the same files (employees Joi/types/dao/routes/OpenAPI, EmployeesDialog, zod, i18n, snapshots); implement serially to avoid conflicts.

## Dependencias

- Existing `productCategories` pattern for catalog design.
- RBAC permission assignment pattern.
