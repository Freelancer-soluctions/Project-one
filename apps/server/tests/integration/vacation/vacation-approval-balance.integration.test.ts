import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import app from '../../../src/app.js';
import { prisma } from '../../../src/config/db.js';

/**
 * vacation-permission-full — approval flow + balance against the real test DB.
 *
 *  - unauthenticated access → 401 (RN-VP-011)
 *  - forged approvedBy in body → 400 (RN-VP-003)
 *  - approve deducts days, stamps approvedBy (RN-VP-001, RN-VP-006/007)
 *  - insufficient balance → 400 and balance untouched (RN-VP-006, transactional)
 *  - reject restores days and stamps rejectedBy (RN-VP-002, RN-VP-008)
 *  - accrual endpoint is idempotent per period (RN-VP-013)
 *
 * Uses year 2099 and the seeded admin so it never touches real balances.
 */

const SECRET = process.env.SECRETKEY as string;
const YEAR = 2099;
const ACCRUAL_PERIOD = '2099-01';
const CSRF_TOKEN = 'vacation-approval-csrf';

const tokenFor = (userId: number): string =>
  jwt.sign({ id: userId }, SECRET, {
    algorithm: 'HS256',
    expiresIn: '5m',
    issuer: 'mi-api',
    audience: 'mi-front',
  });

const suffix = `${Date.now()}`.slice(-8);
let positionId = 0;
let departmentId = 0;
let adminId = 0;
let adminToken = '';
let employeeId = 0;
const createdVacationIds: number[] = [];

const auth = () => ({
  Authorization: `Bearer ${adminToken}`,
  'csrf-token': CSRF_TOKEN,
  Cookie: `csrfToken=${CSRF_TOKEN}`,
});

const balanceOf = async () =>
  prisma.vacationBalance.findUnique({
    where: { employeeId_year: { employeeId, year: YEAR } },
  });

const createVacation = async (startDate: string, endDate: string) => {
  const res = await request(app)
    .post('/api/v1/vacation')
    .set(auth())
    .send({ employeeId, startDate, endDate, reason: 'integration' });
  expect(res.status).toBe(201);
  const id = res.body.data.id as number;
  createdVacationIds.push(id);
  return id;
};

beforeAll(async () => {
  const admin = await prisma.users.findUnique({
    where: { email: 'admin@gmail.com' },
  });
  if (!admin) {
    throw new Error('BD de test sin sembrar: falta admin@gmail.com');
  }
  adminId = admin.id;
  adminToken = tokenFor(admin.id);

  const position = await prisma.positions.create({
    data: { code: `VP${suffix}`, name: 'Vacation test', createdOn: new Date() },
  });
  const department = await prisma.departments.create({
    data: { code: `VD${suffix}`, name: 'Vacation test', createdOn: new Date() },
  });
  positionId = position.id;
  departmentId = department.id;
  const employee = await prisma.employees.create({
    data: {
      name: 'Vacation',
      lastName: 'Tester',
      dni_hash: `vp-${suffix}`,
      dni: '12345678',
      email: `vacation-test-${suffix}@example.com`,
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

  await prisma.vacationBalance.deleteMany({
    where: { employeeId, year: YEAR },
  });
  // Saldo inicial de 5 días para el año de prueba.
  await prisma.vacationBalance.create({
    data: {
      employeeId,
      year: YEAR,
      accrued: 5,
      used: 0,
      remaining: 5,
      createdOn: new Date(),
    },
  });
});

afterAll(async () => {
  await prisma.vacationAccrualRecord.deleteMany({
    where: { period: ACCRUAL_PERIOD },
  });
  if (createdVacationIds.length) {
    await prisma.vacation.deleteMany({
      where: { id: { in: createdVacationIds } },
    });
  }
  await prisma.vacationBalance.deleteMany({
    where: { employeeId, year: YEAR },
  });
  await prisma.employees.deleteMany({ where: { id: employeeId } });
  await prisma.positions.deleteMany({ where: { id: positionId } });
  await prisma.departments.deleteMany({ where: { id: departmentId } });
});

describe('vacation approval flow + balance (integration)', () => {
  it('rejects unauthenticated access with 401', async () => {
    const res = await request(app).get('/api/v1/vacation');
    expect(res.status).toBe(401);
  });

  it('rejects a client-forged approvedBy with 400', async () => {
    const id = await createVacation('2099-03-01', '2099-03-01');
    const res = await request(app)
      .patch(`/api/v1/vacation/${id}`)
      .set(auth())
      .send({ comments: 'x', approvedBy: adminId });
    expect(res.status).toBe(400);
  });

  it('approve deducts the leave days and stamps approvedBy', async () => {
    const id = await createVacation('2099-03-10', '2099-03-12'); // 3 días
    const res = await request(app)
      .patch(`/api/v1/vacation/${id}`)
      .set(auth())
      .send({ status: 'APPROVED' });
    expect(res.status).toBe(200);

    const row = await prisma.vacation.findUnique({ where: { id } });
    expect(row?.approvedBy).toBe(adminId);
    expect(row?.approvedAt).toBeInstanceOf(Date);

    const balance = await balanceOf();
    expect(Number(balance?.used)).toBe(3);
    expect(Number(balance?.remaining)).toBe(2);
  });

  it('insufficient balance returns 400 and leaves the balance untouched', async () => {
    const before = await balanceOf();
    const id = await createVacation('2099-04-01', '2099-04-10'); // 10 días > 2 restantes
    const res = await request(app)
      .patch(`/api/v1/vacation/${id}`)
      .set(auth())
      .send({ status: 'APPROVED' });
    expect(res.status).toBe(400);

    const after = await balanceOf();
    expect(Number(after?.remaining)).toBe(Number(before?.remaining));
    expect(Number(after?.used)).toBe(Number(before?.used));
    const row = await prisma.vacation.findUnique({ where: { id } });
    expect(row?.status).toBe('PENDING');
  });

  it('reject after approval restores the days and stamps rejectedBy', async () => {
    const approved = await prisma.vacation.findFirst({
      where: { employeeId, status: 'APPROVED', approvedBy: adminId },
      orderBy: { id: 'desc' },
    });
    expect(approved).not.toBeNull();

    const res = await request(app)
      .patch(`/api/v1/vacation/${approved!.id}`)
      .set(auth())
      .send({ status: 'REJECTED' });
    expect(res.status).toBe(200);

    const row = await prisma.vacation.findUnique({
      where: { id: approved!.id },
    });
    expect(row?.rejectedBy).toBe(adminId);
    expect(row?.approvedBy).toBeNull();

    const balance = await balanceOf();
    expect(Number(balance?.remaining)).toBe(5);
    expect(Number(balance?.used)).toBe(0);
  });

  it('accrual is idempotent for the same period', async () => {
    const first = await request(app)
      .post('/api/v1/vacation/accrual')
      .set(auth())
      .send({ period: ACCRUAL_PERIOD });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/v1/vacation/accrual')
      .set(auth())
      .send({ period: ACCRUAL_PERIOD });
    expect(second.status).toBe(200);
    expect(second.body.data.accrued).toBe(0);

    const ledger = await prisma.vacationAccrualRecord.count({
      where: { employeeId, period: ACCRUAL_PERIOD },
    });
    expect(ledger).toBe(1);
  });
});
