import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import app from '../../../src/app.js';
import { prisma } from '../../../src/config/db.js';

/**
 * vacation-permission-full — huecos de cobertura contra la BD real:
 *
 *  - aprobar permiso sin canApprovePermission → 403; con el código → 200 y approvedBy (RN-VP-010)
 *  - devengo manual solo ADMIN → 403 a USER (RN-VP-013)
 *  - aprobaciones concurrentes sobre un saldo insuficiente: solo una pasa (R1, bloqueo FOR UPDATE)
 *  - nómina descuenta solo permisos NO remunerados aprobados del periodo (RN-VP-009)
 *
 * Usa el usuario sembrado user2@gmail.com (USER). Los permisos que se le conceden
 * para el test se revocan en afterAll. Años 2097 para no tocar datos reales.
 */

const SECRET = process.env.SECRETKEY as string;
const CSRF_TOKEN = 'vacation-gaps-csrf';
const suffix = `${Date.now()}`.slice(-8);

const tokenFor = (userId: number): string =>
  jwt.sign({ id: userId }, SECRET, {
    algorithm: 'HS256',
    expiresIn: '5m',
    issuer: 'mi-api',
    audience: 'mi-front',
  });

const authAs = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'csrf-token': CSRF_TOKEN,
  Cookie: `csrfToken=${CSRF_TOKEN}`,
});

let adminId = 0;
let userId = 0;
let adminAuth: Record<string, string> = {};
let userAuth: Record<string, string> = {};
let positionId = 0;
let departmentId = 0;
let employeeId = 0;
const vacationIds: number[] = [];
const permissionIds: number[] = [];
const grantedUserPermitIds: number[] = [];

const grantUserPermission = async (code: string) => {
  const perm = await prisma.permissions.findUnique({ where: { code } });
  if (!perm) throw new Error(`Falta el permiso sembrado ${code}`);
  const row = await prisma.userPermits.upsert({
    where: { userId_permissionId: { userId, permissionId: perm.id } },
    update: {},
    create: { userId, permissionId: perm.id },
  });
  grantedUserPermitIds.push(row.id);
};

const revokeGrants = async () => {
  if (grantedUserPermitIds.length) {
    await prisma.userPermits.deleteMany({
      where: { id: { in: grantedUserPermitIds } },
    });
    grantedUserPermitIds.length = 0;
  }
};

beforeAll(async () => {
  const admin = await prisma.users.findUnique({
    where: { email: 'admin@gmail.com' },
  });
  const user = await prisma.users.findUnique({
    where: { email: 'user2@gmail.com' },
  });
  if (!admin || !user)
    throw new Error('BD de test sin sembrar (admin / user2)');
  adminId = admin.id;
  userId = user.id;
  adminAuth = authAs(tokenFor(adminId));
  userAuth = authAs(tokenFor(userId));

  const position = await prisma.positions.create({
    data: { code: `VG${suffix}`, name: 'Vacation gaps', createdOn: new Date() },
  });
  const department = await prisma.departments.create({
    data: { code: `VH${suffix}`, name: 'Vacation gaps', createdOn: new Date() },
  });
  positionId = position.id;
  departmentId = department.id;
  const employee = await prisma.employees.create({
    data: {
      name: 'Gap',
      lastName: 'Tester',
      dni_hash: `vg-${suffix}`,
      dni: '87654321',
      email: `vacation-gaps-${suffix}@example.com`,
      startDate: new Date('2020-01-01'),
      positionId,
      departmentId,
      salary: '1000',
      createdBy: adminId,
      createdOn: new Date(),
    },
    select: { id: true },
  });
  employeeId = employee.id;

  // Saldo 2097: 5 días.
  await prisma.vacationBalance.create({
    data: {
      employeeId,
      year: 2097,
      accrued: 5,
      used: 0,
      remaining: 5,
      createdOn: new Date(),
    },
  });

  // user2 puede editar permisos y solicitudes de vacaciones, pero NO aprobarlas.
  await grantUserPermission('canEditPermission');
  await grantUserPermission('canEditRequestVacation');
});

afterAll(async () => {
  await revokeGrants();
  await prisma.payroll.deleteMany({ where: { employeeId } });
  if (vacationIds.length) {
    await prisma.vacation.deleteMany({ where: { id: { in: vacationIds } } });
  }
  if (permissionIds.length) {
    await prisma.permission.deleteMany({
      where: { id: { in: permissionIds } },
    });
  }
  await prisma.vacationAccrualRecord.deleteMany({ where: { employeeId } });
  await prisma.vacationBalance.deleteMany({ where: { employeeId } });
  await prisma.employees.deleteMany({ where: { id: employeeId } });
  await prisma.positions.deleteMany({ where: { id: positionId } });
  await prisma.departments.deleteMany({ where: { id: departmentId } });
});

const createVacationAsAdmin = async (startDate: string, endDate: string) => {
  const res = await request(app)
    .post('/api/v1/vacation')
    .set(adminAuth)
    .send({ employeeId, startDate, endDate, reason: 'gap test' });
  expect(res.status).toBe(201);
  vacationIds.push(res.body.data.id as number);
  return res.body.data.id as number;
};

describe('aprobación de permisos (RN-VP-010)', () => {
  it('rechaza con 403 a quien no tiene canApprovePermission', async () => {
    const created = await request(app)
      .post('/api/v1/permission')
      .set(adminAuth)
      .send({
        employeeId,
        type: 'PERSONAL',
        startDate: '2097-05-01',
        endDate: '2097-05-02',
        reason: 'gap test',
      });
    expect(created.status).toBe(201);
    const id = created.body.data.id as number;
    permissionIds.push(id);

    const res = await request(app)
      .patch(`/api/v1/permission/${id}`)
      .set(userAuth)
      .send({ status: 'APPROVED' });
    expect(res.status).toBe(403);

    const row = await prisma.permission.findUnique({ where: { id } });
    expect(row?.status).toBe('PENDING');
    expect(row?.approvedBy).toBeNull();
  });

  it('un cambio que no es de aprobación no requiere el código', async () => {
    const id = permissionIds[0]!;
    const res = await request(app)
      .patch(`/api/v1/permission/${id}`)
      .set(userAuth)
      .send({ comments: 'solo comentario' });
    expect(res.status).toBe(200);
  });

  it('con canApprovePermission aprueba y estampa approvedBy con el usuario del token', async () => {
    await grantUserPermission('canApprovePermission');
    const id = permissionIds[0]!;

    const res = await request(app)
      .patch(`/api/v1/permission/${id}`)
      .set(userAuth)
      .send({ status: 'APPROVED' });
    expect(res.status).toBe(200);

    const row = await prisma.permission.findUnique({ where: { id } });
    expect(row?.status).toBe('APPROVED');
    expect(row?.approvedBy).toBe(userId);
    expect(row?.rejectedBy).toBeNull();
    await revokeGrants();
    await grantUserPermission('canEditPermission');
    await grantUserPermission('canEditRequestVacation');
  });
});

describe('aprobación de vacaciones sin permiso y devengo (RN-VP-010, RN-VP-013)', () => {
  it('rechaza APPROVED de vacaciones a quien no tiene canApproveVacation', async () => {
    const id = await createVacationAsAdmin('2097-06-01', '2097-06-01');
    const res = await request(app)
      .patch(`/api/v1/vacation/${id}`)
      .set(userAuth)
      .send({ status: 'APPROVED' });
    expect(res.status).toBe(403);
    const row = await prisma.vacation.findUnique({ where: { id } });
    expect(row?.status).toBe('PENDING');
  });

  it('el devengo manual responde 403 a un USER', async () => {
    const res = await request(app)
      .post('/api/v1/vacation/accrual')
      .set(userAuth)
      .send({ period: '2097-01' });
    expect(res.status).toBe(403);
  });
});

describe('concurrencia sobre el saldo (R1)', () => {
  it('dos aprobaciones simultáneas de 3 días sobre 5 restantes: solo una pasa', async () => {
    const a = await createVacationAsAdmin('2097-07-01', '2097-07-03');
    const b = await createVacationAsAdmin('2097-08-01', '2097-08-03');

    const [ra, rb] = await Promise.all([
      request(app)
        .patch(`/api/v1/vacation/${a}`)
        .set(adminAuth)
        .send({ status: 'APPROVED' }),
      request(app)
        .patch(`/api/v1/vacation/${b}`)
        .set(adminAuth)
        .send({ status: 'APPROVED' }),
    ]);

    expect([ra.status, rb.status].sort()).toEqual([200, 400]);

    const balance = await prisma.vacationBalance.findUnique({
      where: { employeeId_year: { employeeId, year: 2097 } },
    });
    expect(Number(balance?.used)).toBe(3);
    expect(Number(balance?.remaining)).toBe(2);
  });
});

describe('nómina: descuento de permisos no remunerados (RN-VP-009)', () => {
  it('descuenta solo el permiso NO remunerado aprobado del periodo', async () => {
    // Febrero 2097: permiso no remunerado aprobado de 3 días (300 de 3000/30 × 3).
    await prisma.vacation
      .create({
        data: {
          employeeId,
          startDate: new Date('2097-02-01T00:00:00Z'),
          endDate: new Date('2097-02-03T00:00:00Z'),
          status: 'APPROVED',
          paid: false,
          reason: 'unpaid',
          createdBy: adminId,
          createdOn: new Date(),
          approvedBy: adminId,
          approvedAt: new Date(),
        },
      })
      .then((row) => vacationIds.push(row.id));

    // Marzo 2097: permiso REMUNERADO aprobado: no debe descontar.
    await prisma.vacation
      .create({
        data: {
          employeeId,
          startDate: new Date('2097-03-01T00:00:00Z'),
          endDate: new Date('2097-03-03T00:00:00Z'),
          status: 'APPROVED',
          paid: true,
          reason: 'paid',
          createdBy: adminId,
          createdOn: new Date(),
          approvedBy: adminId,
          approvedAt: new Date(),
        },
      })
      .then((row) => vacationIds.push(row.id));

    const body = {
      employeeId,
      baseSalary: 3000,
      extraHours: 0,
      deductions: 0,
      totalPayment: 2700,
      year: 2097,
    };

    const unpaid = await request(app)
      .post('/api/v1/payroll')
      .set(adminAuth)
      .send({ ...body, month: 2 });
    expect(unpaid.status).toBe(201);
    expect(Number(unpaid.body.data.totalPayment)).toBe(2400);

    const paid = await request(app)
      .post('/api/v1/payroll')
      .set(adminAuth)
      .send({ ...body, month: 3 });
    expect(paid.status).toBe(201);
    expect(Number(paid.body.data.totalPayment)).toBe(2700);
  });
});

describe('cancelación de una vacación aprobada (RN-VP-008)', () => {
  it('CANCELLED devuelve los días al saldo y estampa el rechazo', async () => {
    const approved = await prisma.vacation.findFirst({
      where: { employeeId, status: 'APPROVED' },
      orderBy: { id: 'asc' },
    });
    expect(approved).not.toBeNull();
    const days =
      Math.round(
        (approved!.endDate.getTime() - approved!.startDate.getTime()) / 86400000
      ) + 1;
    const before = await prisma.vacationBalance.findUnique({
      where: { employeeId_year: { employeeId, year: 2097 } },
    });

    const res = await request(app)
      .patch(`/api/v1/vacation/${approved!.id}`)
      .set(adminAuth)
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(200);

    const row = await prisma.vacation.findUnique({
      where: { id: approved!.id },
    });
    expect(row?.status).toBe('CANCELLED');
    expect(row?.rejectedBy).toBe(adminId);
    expect(row?.approvedBy).toBeNull();

    const after = await prisma.vacationBalance.findUnique({
      where: { employeeId_year: { employeeId, year: 2097 } },
    });
    expect(Number(after?.remaining)).toBe(Number(before?.remaining) + days);
    expect(Number(after?.used)).toBe(Number(before?.used) - days);
  });
});
