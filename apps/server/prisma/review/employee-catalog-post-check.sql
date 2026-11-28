-- employee-position-department-catalogs: post-deploy consistency check.
--
-- The three catalog migrations must be applied as a set. If only the first two
-- ran, the FKs still use ON DELETE SET NULL on NOT NULL columns, so deleting an
-- assigned catalog row fails with a not-null violation instead of the 409 the
-- spec promises. Run this after `migrate deploy`.
--
-- Expected result: two rows, both with fk_on_delete = 'RESTRICT' and
-- not_null = true. Anything else means the set is incomplete.

SELECT c.conname                                                AS constraint_name,
       CASE c.confdeltype WHEN 'r' THEN 'RESTRICT'
                          WHEN 'n' THEN 'SET NULL'
                          WHEN 'a' THEN 'NO ACTION'
                          ELSE c.confdeltype::text END          AS fk_on_delete,
       a.attnotnull                                             AS not_null
FROM pg_constraint c
JOIN pg_attribute a
  ON a.attrelid = c.conrelid
 AND a.attnum = c.conkey[1]
WHERE c.conrelid = 'employees'::regclass
  AND c.conname IN ('employees_positionId_fkey', 'employees_departmentId_fkey')
ORDER BY c.conname;
