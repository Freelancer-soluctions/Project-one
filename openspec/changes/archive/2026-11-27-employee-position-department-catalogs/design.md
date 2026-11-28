# Design

## Context

See proposal.md. Current employees use free-text position/department (schema.prisma:605-606). Existing catalog pattern: productCategories (schema.prisma:363).

## Goals / Non-Goals

**Goals:** Catalogs for position/department; employee FK linkage; filtering; backfill.
**Non-Goals:** salaryType, user linkage, org-chart UI.

## Decisions

### D1 — Two separate catalogs (not one "areas" table)

Position and department are semantically distinct; separate tables keep FKs clear and allow independent area managers later.

### D2 — Expand/contract migration

1. Add nullable FKs + catalog tables.
2. Backfill (distinct normalized values).
3. During expand phase, create/update/read payloads switch to positionId/departmentId; the legacy string columns remain in DB but are removed from API payloads. Contract step drops the columns in a later migration.

**Implemented:** the contract step ships in the same migration
(`20261127000000_add_position_department_catalogs`) because the legacy
`position`/`department` scalars collide with the Prisma relation fields of the
same name; the catalog tables hold the data before the drop.

**Contract (1.4):** `20261127120000_employee_catalog_fks_required` sets both FKs
to NOT NULL after verifying 0 employees / 0 NULLs on the test DB. Create and
update payloads already required a catalog id (Joi + zod), so the API contract
did not change; `PATCH` no longer accepts `null` to unlink, and an assigned
catalog row can no longer be deleted (FK violation → 409).

**Delete behaviour (follow-up migration `20261127120001_employee_catalog_fk_restrict`):**
once the FKs are NOT NULL, the original `ON DELETE SET NULL` cannot run, so the
FKs are recreated with `ON DELETE RESTRICT`. This second migration is what makes
the "assigned catalog row cannot be deleted → 409" scenario hold for both
positions and departments.

### D3 — Raw SQL joins

`getAllEmployees` uses `$queryRaw`; new joins to catalogs must alias columns and keep `decryptResults` for salary/dni/email.

### D4 — Permissions

Reuse employee permission codes for catalog CRUD (ADMIN/MANAGER) — no new codes in v1.

## Risks / Trade-offs

- [Backfill inconsistencies] → normalization (trim + case-fold) + review queue for unmapped rows.
- [No employee tests] → add integration tests before refactor.
- [Encryption] → verify decryptResults handles new joins.

## Migration Plan

1. Create tables.
2. Add nullable FKs.
3. Backfill script.
4. Contract (optional, separate migration).

**Deployment runbook (warning 3 / 4):**

1. Before deploying on a populated database, run
   `apps/server/prisma/review/employee-catalog-pre-check.sql`. It lists the
   employees the backfill cannot link (NULL or blank legacy values) and the
   distinct normalized values it will create. Resolve the review queue first.
2. Apply the three migrations as one set, in filename order, with no pause in
   between: `20261127000000_add_position_department_catalogs`,
   `20261127120000_employee_catalog_fks_required`,
   `20261127120001_employee_catalog_fk_restrict`. Stopping after the first or
   second leaves the FKs in an inconsistent delete behaviour (see D2).
3. Applied migrations are not edited afterwards: changing a migration file after
   it ran changes its checksum and breaks `prisma migrate`. Corrections go into a
   new migration.
4. After `migrate deploy`, run `apps/server/prisma/review/employee-catalog-post-check.sql`.
   It must return both FKs as `RESTRICT` with `not_null = true`. Any `SET NULL`
   result means only part of the set was applied: finish the deployment before
   serving traffic.

**Verified on a populated database:** the whole sequence was applied to a
scratch copy of the schema with legacy rows (linkable values, case/whitespace
variants and one blank row). The backfill created the expected catalog rows,
`120000` failed loudly on the unlinked blank row as step 1 predicts, and after
a manual link both contract migrations applied cleanly. Deleting an assigned
catalog row then failed with a foreign-key violation.

Rollback: manual SQL.

## Threat Model

Auth fail-closed; input validation; no PII in catalogs.
