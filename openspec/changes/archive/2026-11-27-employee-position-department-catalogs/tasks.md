# Tasks

## 1. Schema & Migration

- [x] 1.1 Add `positions` and `departments` models + nullable `positionId`/`departmentId` FKs on employees; verify `prisma validate`
- [x] 1.2 Create migration and apply locally; verify
- [x] 1.3 Backfill script (distinct normalized free text → catalog rows + FKs); verify
- [x] 1.4 (Optional) Contract FKs to required after cleanup; verify

> 1.2/1.3 note: `20261127000000_add_position_department_catalogs` creates the
> catalogs, adds the nullable FKs, backfills from `LOWER(BTRIM(...))` groups
> (display name = earliest-created spelling, deterministic `POS-0001`/`DEP-0001`
> codes), then drops the legacy free-text columns in the same migration (their
> data now lives in the catalogs). 1.4: the FKs were contracted to NOT NULL
> (`20261127120000_employee_catalog_fks_required`) after verifying 0 employees
> and 0 NULLs, so no cleanup was needed. Follow-up migration
> `20261127120001_employee_catalog_fk_restrict` switches both FKs to
> `ON DELETE RESTRICT` (the `SET NULL` action cannot run on NOT NULL columns), so
> deleting an assigned catalog row returns 409.
> Backfill verified by `tests/integration/employees/employee-catalogs-backfill.integration.test.ts`
> (RN-EC-007): it runs the shipped backfill SQL from the migration against legacy
> fixtures in temp shadow tables inside a rolled-back transaction (case/whitespace
> variants merge, null and blank values stay unlinked, real tables untouched).

## 2. Backend

- [x] 2.1 Create position/department modules (CRUD, dao, service, controller, routes, Joi, types); verify routes registered
- [x] 2.2 Update employee types/Joi/dao (FKs, raw SQL joins, filters) and controller; verify
- [x] 2.3 Update OpenAPI schemas.ts; verify

> 2.1: `GET/POST /positions`, `PATCH/DELETE /positions/:id` and the same set for
> `/departments`, registered in `routes/v1/index.ts`. Permissions reuse the
> employee codes (D4). Duplicate `code` → 409 via the Prisma P2002 mapping.
> 2.2: `getAllEmployees` joins `positions`/`departments`, aliases their names as
> `position`/`department` and keeps `decryptResults`; filters are
> `departmentId`/`positionId`. Invalid catalog ids are rejected with 400 before
> hitting the FK. Also fixed a latent crash: PATCH without `dni` re-hashed
> `undefined`.
> 2.3: employee schemas updated and `Position`/`Department` schemas added in
> `docs/schemas-shift-left.ts`; `openapi.yaml` regenerated with
> `npm run openapi:generate`.

## 3. Frontend

- [x] 3.1 EmployeesDialog: replace text inputs with selects (RTK hooks); update zod; verify
- [x] 3.2 EmployeesDatatable: columns + filters; verify
- [x] 3.3 i18n keys + fieldLimits; verify
- [x] 3.4 Regenerate snapshots; verify

> 3.1: position/department selects load from `GET /positions/options` / `GET /departments/options`
> (unpaginated `{id,name}` lists; the paginated lists are capped at `MAX_QUERY_LIMIT`, 100 by default)
> and store the catalog id. 3.2: the datatable keeps the same columns (the API
> returns the catalog names under `position`/`department`); the filters form gains
> position/department selects. 3.3: `select_position`, `select_department`,
> `all_positions`, `all_departments` in `en.json`/`es.json`. 3.4: the existing
> datatable snapshot is unchanged and still passes.
> Post-change (requested after closing): catalog admin page at
> `/home/employeeCatalogs` (`modules/employeeCatalogs/`: tabs for positions and
> departments, CRUD + filters + status), `FIELD_LIMITS.employeeCatalogs` and UI
> tests in `EmployeeCatalogManager.ui.test.jsx` (render, create, delete).

## 4. Tests

- [x] 4.1 Integration tests for catalogs + employee linkage; verify pass
- [x] 4.2 Employee UI tests; verify pass

> 4.1: `tests/integration/employees/employee-catalogs.integration.test.ts`
> (12 tests, real DB): catalog creation, duplicate code → 409, unauthenticated →
> 401, employee create with catalog ids, invalid catalog id → 400, filtering by
> `departmentId`/`positionId`, catalog update, and delete of an assigned position
> and department → 409 (row kept). 4.2: the datatable snapshot
> suite and the zod property tests (`schemas.properties.unit.test.js`, updated to
> the catalog ids) pass; no new dialog render test was added.

## 5. Verification

- [x] 5.1 Run `openspec validate employee-position-department-catalogs`; verify no errors
- [x] 5.2 Run full test suite; verify green

> 5.1: `Change 'employee-position-department-catalogs' is valid`.
> 5.2: server `npx vitest run` → 46 files / 427 tests pass; `tsc -b` clean;
> `npm run lint:api` 0 errors. Client `vite build` clean, `eslint` clean,
> employees + properties tests 22 pass.
