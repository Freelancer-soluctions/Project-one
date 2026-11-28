-- Task 1.4: contract the employee catalog FKs to NOT NULL.
--
-- Precondition verified on the test DB before applying: 0 employees and
-- 0 NULL positionId/departmentId, so no cleanup was required. On an
-- environment with legacy rows the migration fails loudly instead of
-- silently keeping unmapped employees.

ALTER TABLE "employees" ALTER COLUMN "positionId" SET NOT NULL;
ALTER TABLE "employees" ALTER COLUMN "departmentId" SET NOT NULL;
