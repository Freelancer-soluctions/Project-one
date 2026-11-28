-- employee-position-department-catalogs
-- Expand/contract in a single migration:
--   1. Create the positions/departments catalogs.
--   2. Add nullable positionId/departmentId FKs to employees.
--   3. Backfill catalogs from the distinct normalized (trim + case-fold)
--      free-text values and link each employee.
--   4. Contract: drop the legacy `position`/`department` free-text columns
--      (their data now lives in the catalogs).
-- FKs stay nullable on purpose (spec: "store positionId and departmentId
-- (nullable FKs)"); requiring them is left to a later cleanup once the
-- unmapped/legacy rows have been reviewed.

-- 1. Catalogs ---------------------------------------------------------------

CREATE TABLE "positions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdOn" TIMESTAMP(3) NOT NULL,
    "updatedOn" TIMESTAMP(3),

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "positions_code_key" ON "positions"("code");

CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdOn" TIMESTAMP(3) NOT NULL,
    "updatedOn" TIMESTAMP(3),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- 2. Nullable FKs on employees ---------------------------------------------

ALTER TABLE "employees" ADD COLUMN "positionId" INTEGER;
ALTER TABLE "employees" ADD COLUMN "departmentId" INTEGER;

-- 3. Backfill ---------------------------------------------------------------
-- One catalog row per distinct normalized value. The display name is the
-- spelling of the earliest-created employee in that group (the original entry
-- wins, casing included) and the generated code is deterministic
-- (POS-0001, DEP-0001, ...).

INSERT INTO "positions" ("code", "name", "active", "createdOn")
SELECT
    'POS-' || LPAD(ROW_NUMBER() OVER (ORDER BY LOWER(BTRIM("position")))::text, 4, '0'),
    (ARRAY_AGG(BTRIM("position") ORDER BY "createdOn", "id"))[1],
    true,
    CURRENT_TIMESTAMP
FROM "employees"
WHERE "position" IS NOT NULL AND BTRIM("position") <> ''
GROUP BY LOWER(BTRIM("position"));

INSERT INTO "departments" ("code", "name", "active", "createdOn")
SELECT
    'DEP-' || LPAD(ROW_NUMBER() OVER (ORDER BY LOWER(BTRIM("department")))::text, 4, '0'),
    (ARRAY_AGG(BTRIM("department") ORDER BY "createdOn", "id"))[1],
    true,
    CURRENT_TIMESTAMP
FROM "employees"
WHERE "department" IS NOT NULL AND BTRIM("department") <> ''
GROUP BY LOWER(BTRIM("department"));

UPDATE "employees" e
SET "positionId" = p."id"
FROM "positions" p
WHERE e."position" IS NOT NULL
  AND LOWER(BTRIM(e."position")) = LOWER(BTRIM(p."name"));

UPDATE "employees" e
SET "departmentId" = d."id"
FROM "departments" d
WHERE e."department" IS NOT NULL
  AND LOWER(BTRIM(e."department")) = LOWER(BTRIM(d."name"));

-- 4. Contract: drop the legacy free-text columns ----------------------------

ALTER TABLE "employees" DROP COLUMN "position";
ALTER TABLE "employees" DROP COLUMN "department";

-- 5. Constraints + indexes --------------------------------------------------

CREATE INDEX "employees_positionId_idx" ON "employees"("positionId");
CREATE INDEX "employees_departmentId_idx" ON "employees"("departmentId");

ALTER TABLE "employees"
    ADD CONSTRAINT "employees_positionId_fkey"
    FOREIGN KEY ("positionId") REFERENCES "positions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employees"
    ADD CONSTRAINT "employees_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
