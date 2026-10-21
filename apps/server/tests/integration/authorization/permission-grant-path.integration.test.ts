import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import app from '../../../src/app.js';
import { prisma } from '../../../src/config/db.js';
import {
  ROLESCODES,
  PERMISSIONCODES,
} from '../../../src/utils/constants/enums.js';

/**
 * Smoke de autorización end-to-end de `server-fix-role-permits-authorization`
 * (tasks 3.1 y 3.2), contra la BD real de test — no mocks.
 *
 * Cadena verificada: `verifyToken` (JWT real firmado con `SECRETKEY`) →
 * `checkRoleAuthOrPermisssion` → `getUserRoleByUserId` (Prisma
 * `permits.include.permissions`) → controller. Es la cadena exacta donde el
 * defecto vivía: el middleware leía `rolePermits`, el DAO devuelve `permits`.
 *
 * Pre-fix: el USER con `canViewEvents` asignado recibía **403**
 * `Insufficient permissions for this operation`. Post-fix: **200**.
 *
 * Requiere la BD sembrada (`tests/setupGlobal.ts` corre `prisma db seed`):
 * usuarios `admin@gmail.com` (C01) y `user2@gmail.com` (C02), permiso
 * `canViewEvents`.
 */

const SECRET = process.env.SECRETKEY as string;

/** Token con el contrato exacto que exige `verifyToken` (HS256 + iss + aud). */
const tokenFor = (userId: number): string =>
  jwt.sign({ id: userId }, SECRET, {
    algorithm: 'HS256',
    expiresIn: '5m',
    issuer: 'mi-api',
    audience: 'mi-front',
  });

const USER_EMAIL = 'user2@gmail.com';
const ADMIN_EMAIL = 'admin@gmail.com';

let userWithPermitId = 0;
let adminId = 0;
let permissionId = 0;

const getUsers = async () => {
  const user = await prisma.users.findUnique({
    where: { email: USER_EMAIL },
    include: { roles: true },
  });
  const admin = await prisma.users.findUnique({
    where: { email: ADMIN_EMAIL },
    include: { roles: true },
  });
  if (!user || !admin) {
    throw new Error(
      'BD de test sin sembrar: faltan admin@gmail.com o user2@gmail.com (tests/setupGlobal.ts)'
    );
  }
  return { user, admin };
};

const grantViewEvents = async () => {
  await prisma.userPermits.create({
    data: { userId: userWithPermitId, permissionId },
  });
};

const revokeViewEvents = async () => {
  await prisma.userPermits.deleteMany({ where: { userId: userWithPermitId } });
};

describe('permission grant path (integration, BD real) — GET /api/v1/events', () => {
  beforeAll(async () => {
    const { user, admin } = await getUsers();

    // Guardas de entorno: si el seed cambia, el test lo dice en vez de dar un
    // falso verde por un rol inesperado. `throw` (no `expect`) porque está fuera
    // de un bloque `it` (`vitest/no-standalone-expect`).
    if (user.roles.code !== ROLESCODES.USER) {
      throw new Error(
        `El usuario de test debe ser ${ROLESCODES.USER}, es ${user.roles.code}`
      );
    }
    if (admin.roles.code !== ROLESCODES.ADMIN) {
      throw new Error(
        `El admin de test debe ser ${ROLESCODES.ADMIN}, es ${admin.roles.code}`
      );
    }

    userWithPermitId = user.id;
    adminId = admin.id;

    const permission = await prisma.permissions.findUnique({
      where: { code: PERMISSIONCODES.canViewEvents },
    });
    if (!permission) {
      throw new Error(
        'BD de test sin el permiso canViewEvents (prisma/seed.ts)'
      );
    }
    permissionId = permission.id;

    await revokeViewEvents();
    await grantViewEvents();
  });

  afterAll(async () => {
    // Deja la BD como estaba: el resto de la suite reutiliza estos usuarios.
    await revokeViewEvents();
  });

  it('3.1 USER (C02) con canViewEvents asignado: accede a GET /events (pre-fix: 403)', async () => {
    const res = await request(app)
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${tokenFor(userWithPermitId)}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, statusCode: 200 });
  });

  it('3.2 USER (C02) sin el permiso: sigue cerrado con 403 (fail-closed preservado)', async () => {
    await revokeViewEvents();

    const res = await request(app)
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${tokenFor(userWithPermitId)}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: 'Insufficient permissions for this operation',
    });

    await grantViewEvents();
  });

  it('ADMIN (C01) sin filas de userPermits: accede por short-circuit (sin cambios)', async () => {
    const res = await request(app)
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${tokenFor(adminId)}`);

    expect(res.status).toBe(200);
  });
});
