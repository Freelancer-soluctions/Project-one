-- employee-position-department-catalogs: review queue (warning 4).
--
-- Run this BEFORE applying migration 20261127000000_add_position_department_catalogs
-- on a populated database. That migration drops the legacy free-text columns
-- `employees.position` / `employees.department`, so anything reviewed later is gone.
--
-- Rows listed here will NOT be linked to a catalog row by the backfill:
--   * legacy value NULL, or
--   * legacy value blank / whitespace only.
-- 20261127120000 (contract to NOT NULL) fails while any such row remains, so
-- decide what each one should become (assign a catalog row manually, or
-- delete/fix the employee) before deploying the contract step.

-- 1. Employees the backfill leaves unlinked (review queue).
SELECT e."id",
       e."name",
       e."lastName",
       e."position"   AS "legacyPosition",
       e."department" AS "legacyDepartment"
FROM "employees" e
WHERE e."position" IS NULL OR BTRIM(e."position") = ''
   OR e."department" IS NULL OR BTRIM(e."department") = ''
ORDER BY e."id";

-- 2. Distinct normalized values the backfill will turn into catalog rows
--    (case/whitespace variants are merged; the display name is the earliest spelling).
SELECT LOWER(BTRIM(e."position")) AS "normalizedPosition",
       COUNT(*)                   AS "employees"
FROM "employees" e
WHERE e."position" IS NOT NULL AND BTRIM(e."position") <> ''
GROUP BY LOWER(BTRIM(e."position"))
ORDER BY "employees" DESC;

SELECT LOWER(BTRIM(e."department")) AS "normalizedDepartment",
       COUNT(*)                     AS "employees"
FROM "employees" e
WHERE e."department" IS NOT NULL AND BTRIM(e."department") <> ''
GROUP BY LOWER(BTRIM(e."department"))
ORDER BY "employees" DESC;
