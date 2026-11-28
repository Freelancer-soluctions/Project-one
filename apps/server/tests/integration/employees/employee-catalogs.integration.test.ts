import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import app from '../../../src/app.js';
import { prisma } from '../../../src/config/db.js';

/**
 * employee-position-department-catalogs — integration coverage against the
 * real test database (no mocks):
 *
 *  - catalog CRUD + duplicate code → 409 (RN-EC-001..003, RN-EC-009)
 *  - employee linkage with catalog ids (RN-EC-004)
 *  - invalid catalog id → 400 (RN-EC-005)
 *  - filtering by departmentId / positionId (RN-EC-006, RN-EC-010)
 *  - unauthenticated access → 401 (RN-EC-008)
 *
 * Requires the seeded test DB (`admin@gmail.com`, see tests/setupGlobal.ts).
 */

const SECRET = process.env.SECRETKEY as string;

/** Token with the contract verifyToken requires (HS256 + iss + aud). */
const tokenFor = (userId: number): string =>
  jwt.sign({ id: userId }, SECRET, {
    algorithm: 'HS256',
    expiresIn: '5m',
    issuer: 'mi-api',
    audience: 'mi-front',
  });

const suffix = `${Date.now()}`;
const positionCode = `POS-T${suffix.slice(-8)}`;
const departmentCode = `DEP-T${suffix.slice(-8)}`;

let adminToken = '';
let positionId = 0;
let departmentId = 0;
let employeeId = 0;

// `csrfConditional` protects every non-GET route: cookie and header must match.
const CSRF_TOKEN = 'employee-catalogs-csrf';
const auth = () => ({
  Authorization: `Bearer ${adminToken}`,
  'csrf-token': CSRF_TOKEN,
  Cookie: `csrfToken=${CSRF_TOKEN}`,
});

beforeAll(async () => {
  const admin = await prisma.users.findUnique({
    where: { email: 'admin@gmail.com' },
  });
  if (!admin) {
    throw new Error(
      'BD de test sin sembrar: falta admin@gmail.com (tests/setupGlobal.ts)'
    );
  }
  adminToken = tokenFor(admin.id);
});

afterAll(async () => {
  if (employeeId) {
    // Other modules (vacation accrual) may create dependent rows for this
    // employee; remove them first or the FK blocks the employee delete.
    await prisma.vacationBalance.deleteMany({ where: { employeeId } });
    await prisma.employees.deleteMany({ where: { id: employeeId } });
  }
  await prisma.positions.deleteMany({ where: { code: positionCode } });
  await prisma.departments.deleteMany({ where: { code: departmentCode } });
});

describe('employee catalogs — positions', () => {
  it('rejects unauthenticated access with 401', async () => {
    const res = await request(app).get('/api/v1/positions');
    expect(res.status).toBe(401);
  });

  it('creates a position and returns its audit fields', async () => {
    const res = await request(app)
      .post('/api/v1/positions')
      .set(auth())
      .send({ code: positionCode, name: `Test Position ${suffix}` });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      code: positionCode,
      name: `Test Position ${suffix}`,
      active: true,
    });
    expect(res.body.data.createdOn).toBeTruthy();
    positionId = res.body.data.id;
  });

  it('rejects a duplicate position code with 409', async () => {
    const res = await request(app)
      .post('/api/v1/positions')
      .set(auth())
      .send({ code: positionCode, name: 'Duplicate' });

    expect(res.status).toBe(409);
  });
});

describe('employee catalogs — departments', () => {
  it('creates a department and returns its audit fields', async () => {
    const res = await request(app)
      .post('/api/v1/departments')
      .set(auth())
      .send({ code: departmentCode, name: `Test Department ${suffix}` });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      code: departmentCode,
      name: `Test Department ${suffix}`,
      active: true,
    });
    departmentId = res.body.data.id;
  });

  it('rejects a duplicate department code with 409', async () => {
    const res = await request(app)
      .post('/api/v1/departments')
      .set(auth())
      .send({ code: departmentCode, name: 'Duplicate' });

    expect(res.status).toBe(409);
  });
});

describe('employee catalogs — options for selects', () => {
  it('returns every position as {id,name} without pagination', async () => {
    const res = await request(app).get('/api/v1/positions/options').set(auth());

    expect(res.status).toBe(200);
    const rows = res.body.data.dataList as Array<{ id: number; name: string }>;
    expect(rows).toContainEqual(
      expect.objectContaining({
        id: positionId,
        name: `Test Position ${suffix}`,
        active: true,
      })
    );
    expect(res.body.data.total).toBe(rows.length);
  });

  it('returns every department as {id,name} without pagination', async () => {
    const res = await request(app)
      .get('/api/v1/departments/options')
      .set(auth());

    expect(res.status).toBe(200);
    const rows = res.body.data.dataList as Array<{ id: number; name: string }>;
    expect(rows).toContainEqual(
      expect.objectContaining({
        id: departmentId,
        name: `Test Department ${suffix}`,
        active: true,
      })
    );
    expect(res.body.data.total).toBe(rows.length);
  });

  it('includes inactive departments with active=false so the client can decide', async () => {
    const created = await request(app)
      .post('/api/v1/departments')
      .set(auth())
      .send({
        code: `${departmentCode}I`,
        name: `Inactive Department ${suffix}`,
        active: false,
      });
    expect(created.status).toBe(201);

    const res = await request(app)
      .get('/api/v1/departments/options')
      .set(auth());

    const rows = res.body.data.dataList as Array<{
      id: number;
      active: boolean;
    }>;
    expect(rows).toContainEqual(
      expect.objectContaining({ id: created.body.data.id, active: false })
    );

    await prisma.departments.deleteMany({
      where: { code: `${departmentCode}I` },
    });
  });

  it('rejects unauthenticated access to the options endpoints with 401', async () => {
    expect((await request(app).get('/api/v1/positions/options')).status).toBe(
      401
    );
    expect((await request(app).get('/api/v1/departments/options')).status).toBe(
      401
    );
  });
});

describe('employee linkage', () => {
  it('rejects a non-existent positionId with 400', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .set(auth())
      .send({
        name: 'Invalid',
        lastName: 'Catalog',
        dni: `9${suffix.slice(-8)}`,
        email: `invalid.${suffix}@example.com`,
        startDate: '2024-01-01T00:00:00.000Z',
        positionId: 99999999,
        departmentId,
        salary: 1000,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Position not found/i);
  });

  it('creates an employee with catalog ids and returns them in reads', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .set(auth())
      .send({
        name: 'Catalog',
        lastName: 'Tester',
        dni: `8${suffix.slice(-8)}`,
        email: `catalog.${suffix}@example.com`,
        startDate: '2024-01-01T00:00:00.000Z',
        positionId,
        departmentId,
        salary: 2500.5,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ positionId, departmentId });
    employeeId = res.body.data.id;
  });

  it('filters employees by departmentId and returns catalog names', async () => {
    const res = await request(app)
      .get('/api/v1/employees')
      .query({ departmentId, limit: 100 })
      .set(auth());

    expect(res.status).toBe(200);
    const rows = res.body.data.dataList as Array<{
      id: number;
      positionId: number;
      departmentId: number;
      position: string;
      department: string;
    }>;

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.departmentId === departmentId)).toBe(true);
    expect(res.body.data.total).toBe(rows.length);
    const created = rows.find((row) => row.id === employeeId);
    expect(created?.position).toBe(`Test Position ${suffix}`);
    expect(created?.department).toBe(`Test Department ${suffix}`);
  });

  it('matches % and _ in the name filter literally (no wildcard widening)', async () => {
    const res = await request(app)
      .get('/api/v1/employees')
      .query({ name: '%', limit: 100 })
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.dataList).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  it('filters employees by positionId', async () => {
    const res = await request(app)
      .get('/api/v1/employees')
      .query({ positionId, limit: 100 })
      .set(auth());

    expect(res.status).toBe(200);
    const rows = res.body.data.dataList as Array<{
      id: number;
      positionId: number;
    }>;

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.positionId === positionId)).toBe(true);
  });

  it('rejects deleting a catalog row still assigned to an employee with 409 and keeps the row', async () => {
    const res = await request(app)
      .delete(`/api/v1/positions/${positionId}`)
      .set(auth());

    expect(res.status).toBe(409);
    const stillThere = await prisma.positions.count({
      where: { id: positionId },
    });
    expect(stillThere).toBe(1);
  });

  it('rejects null catalog ids on update with 400 (never unlinks)', async () => {
    const res = await request(app)
      .patch(`/api/v1/employees/${employeeId}`)
      .set(auth())
      .send({ positionId: null, departmentId: null });

    expect(res.status).toBe(400);

    const row = await prisma.employees.findUnique({
      where: { id: employeeId },
      select: { positionId: true, departmentId: true },
    });
    expect(row).toEqual({ positionId, departmentId });
  });

  it('rejects deleting a department still assigned to an employee with 409 and keeps the row', async () => {
    const res = await request(app)
      .delete(`/api/v1/departments/${departmentId}`)
      .set(auth());

    expect(res.status).toBe(409);
    const stillThere = await prisma.departments.count({
      where: { id: departmentId },
    });
    expect(stillThere).toBe(1);
  });

  it('rejects a non-existent departmentId on update with 400', async () => {
    const res = await request(app)
      .patch(`/api/v1/employees/${employeeId}`)
      .set(auth())
      .send({ departmentId: 99999999 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Department not found/i);
  });

  it('updates the department of an employee', async () => {
    const otherDepartment = await request(app)
      .post('/api/v1/departments')
      .set(auth())
      .send({ code: `${departmentCode}X`, name: `Other Department ${suffix}` });

    expect(otherDepartment.status).toBe(201);

    const res = await request(app)
      .patch(`/api/v1/employees/${employeeId}`)
      .set(auth())
      .send({ departmentId: otherDepartment.body.data.id });

    expect(res.status).toBe(200);
    expect(res.body.data.departmentId).toBe(otherDepartment.body.data.id);

    // El FK es RESTRICT: hay que reasignar antes de borrar el temporal.
    await prisma.employees.update({
      where: { id: employeeId },
      data: { departmentId },
    });

    await prisma.departments.deleteMany({
      where: { code: `${departmentCode}X` },
    });
  });
});
