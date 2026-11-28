-- Task 1.4 (follow-up): the FKs are now NOT NULL, so the previous
-- ON DELETE SET NULL cannot run anymore (it tries to write NULL). Deleting a
-- catalog row that is still assigned must fail with a FK violation, which the
-- global error handler maps to 409.

ALTER TABLE "employees" DROP CONSTRAINT "employees_positionId_fkey";
ALTER TABLE "employees"
    ADD CONSTRAINT "employees_positionId_fkey"
    FOREIGN KEY ("positionId") REFERENCES "positions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employees" DROP CONSTRAINT "employees_departmentId_fkey";
ALTER TABLE "employees"
    ADD CONSTRAINT "employees_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
