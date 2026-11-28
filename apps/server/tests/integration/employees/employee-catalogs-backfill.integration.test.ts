import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

import { prisma } from '../../../src/config/db.js';

/**
 * RN-EC-007 — backfill normalizes legacy free-text values into catalog rows.
 *
 * Runs the backfill section of the shipped migration (not a copy of it) against
 * temporary shadow tables (`employees`, `positions`, `departments`). Temp tables
 * live in `pg_temp`, which the search_path resolves first, so the real tables are
 * never touched. Everything runs inside a transaction that is rolled back.
 */

const MIGRATION_PATH = new URL(
  '../../../prisma/migrations/20261127000000_add_position_department_catalogs/migration.sql',
  import.meta.url
);

const ROLLBACK_SENTINEL = 'BACKFILL_TEST_ROLLBACK';

/** Statements of the "-- 3. Backfill" section, split on ';' (no ';' in comments/strings). */
const backfillStatements = (): string[] => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const sql = readFileSync(MIGRATION_PATH, 'utf8');
  const start = sql.indexOf('-- 3. Backfill');
  const end = sql.indexOf('-- 4. Contract');
  if (start === -1 || end === -1) {
    throw new Error('Backfill section not found in migration.sql');
  }
  return sql
    .slice(start, end)
    .split(';')
    .map((chunk) => chunk.trim())
    .filter((chunk) =>
      chunk.split('\n').some((line) => {
        const trimmed = line.trim();
        return trimmed !== '' && !trimmed.startsWith('--');
      })
    );
};

interface EmployeeRow {
  positionName: string | null;
  departmentName: string | null;
}

interface CatalogRow {
  code: string;
  name: string;
}

interface BackfillResult {
  employees: EmployeeRow[];
  positions: CatalogRow[];
  departments: CatalogRow[];
}

/** Legacy fixtures: casing/whitespace variants, nulls and blanks. */
const LEGACY_ROWS: Array<{
  position: string | null;
  department: string | null;
  createdOn: Date;
}> = [
  {
    position: '  Analista ',
    department: 'Ventas',
    createdOn: new Date('2020-01-01T00:00:00Z'),
  },
  {
    position: 'analista',
    department: ' ventas',
    createdOn: new Date('2020-02-01T00:00:00Z'),
  },
  {
    position: 'Operaciones',
    department: null,
    createdOn: new Date('2020-03-01T00:00:00Z'),
  },
  {
    position: null,
    department: null,
    createdOn: new Date('2020-04-01T00:00:00Z'),
  },
  {
    position: '   ',
    department: '   ',
    createdOn: new Date('2020-05-01T00:00:00Z'),
  },
];

const runBackfillOnFixtures = async (): Promise<BackfillResult> => {
  let result: BackfillResult | undefined;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`
        CREATE TEMP TABLE employees (
          id SERIAL PRIMARY KEY,
          "position" VARCHAR(100),
          "department" VARCHAR(100),
          "createdOn" TIMESTAMP(3) NOT NULL,
          "positionId" INTEGER,
          "departmentId" INTEGER
        )`);
      await tx.$executeRawUnsafe(
        `CREATE TEMP TABLE positions (LIKE public.positions INCLUDING ALL)`
      );
      await tx.$executeRawUnsafe(
        `CREATE TEMP TABLE departments (LIKE public.departments INCLUDING ALL)`
      );

      for (const row of LEGACY_ROWS) {
        await tx.$executeRaw`
          INSERT INTO employees ("position", "department", "createdOn")
          VALUES (${row.position}::varchar, ${row.department}::varchar, ${row.createdOn})`;
      }

      for (const statement of backfillStatements()) {
        await tx.$executeRawUnsafe(statement);
      }

      const employees = await tx.$queryRawUnsafe<EmployeeRow[]>(`
        SELECT p."name" AS "positionName", d."name" AS "departmentName"
        FROM employees e
        LEFT JOIN positions p ON p."id" = e."positionId"
        LEFT JOIN departments d ON d."id" = e."departmentId"
        ORDER BY e."id"`);
      const positions = await tx.$queryRawUnsafe<CatalogRow[]>(
        `SELECT "code", "name" FROM positions ORDER BY "code"`
      );
      const departments = await tx.$queryRawUnsafe<CatalogRow[]>(
        `SELECT "code", "name" FROM departments ORDER BY "code"`
      );

      result = { employees, positions, departments };

      throw new Error(ROLLBACK_SENTINEL);
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== ROLLBACK_SENTINEL) {
      throw error;
    }
  }

  if (!result) {
    throw new Error('Backfill fixture run produced no result');
  }
  return result;
};

describe('employee catalogs — backfill (RN-EC-007)', () => {
  it('creates one catalog row per distinct normalized value', async () => {
    const { positions, departments } = await runBackfillOnFixtures();

    expect(positions).toEqual([
      { code: 'POS-0001', name: 'Analista' },
      { code: 'POS-0002', name: 'Operaciones' },
    ]);
    expect(departments).toEqual([{ code: 'DEP-0001', name: 'Ventas' }]);
  });

  it('links employees whose values normalize to the same catalog row', async () => {
    const { employees } = await runBackfillOnFixtures();

    expect(employees[0]).toEqual({
      positionName: 'Analista',
      departmentName: 'Ventas',
    });
    expect(employees[1]).toEqual({
      positionName: 'Analista',
      departmentName: 'Ventas',
    });
  });

  it('keeps null and blank legacy values unlinked', async () => {
    const { employees } = await runBackfillOnFixtures();

    expect(employees[2]).toEqual({
      positionName: 'Operaciones',
      departmentName: null,
    });
    expect(employees[3]).toEqual({ positionName: null, departmentName: null });
    expect(employees[4]).toEqual({ positionName: null, departmentName: null });
  });

  it('leaves the real catalog tables untouched (rolled back)', async () => {
    // Compare row counts before/after instead of fixed codes: a populated DB
    // may already contain POS-0001 / DEP-0001.
    const positionsBefore = await prisma.positions.count();
    const departmentsBefore = await prisma.departments.count();

    await runBackfillOnFixtures();

    expect(await prisma.positions.count()).toBe(positionsBefore);
    expect(await prisma.departments.count()).toBe(departmentsBefore);
  });
});
