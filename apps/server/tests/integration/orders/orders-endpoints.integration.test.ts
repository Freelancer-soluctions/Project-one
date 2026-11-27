import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import app from '../../../src/app.js';
import { prisma } from '../../../src/config/db.js';
import { ROLESCODES } from '../../../src/utils/constants/enums.js';

/**
 * Order endpoints against the real database: auth (RN-ORD-009), CRUD with
 * details, transactional total, delivery stamping, conversion link persistence
 * (RN-ORD-006) and delete-blocked-when-linked (RN-ORD-007).
 */

const SECRET = process.env.SECRETKEY as string;
const ADMIN_EMAIL = 'orders-admin@test.local';
const MANAGER_EMAIL = 'orders-manager@test.local';
const CLIENT_EMAIL = 'orders-client@test.local';
const PROVIDER_NAME = 'Orders Integration Provider';
const CATEGORY_CODE = 'OIC';
const PRODUCT_SKU = 'ORD-INT-1';

let adminToken = '';
let managerToken = '';
let clientId = 0;
let providerId = 0;
let productId = 0;

/** Every mutating request goes through the conditional CSRF guard. */
const CSRF_TOKEN = 'orders-integration-csrf';
const withCsrf = <T extends { set: (field: string, value: string) => T }>(
  req: T
): T =>
  req.set('Cookie', `csrfToken=${CSRF_TOKEN}`).set('csrf-token', CSRF_TOKEN);

const tokenFor = (userId: number): string =>
  jwt.sign({ id: userId }, SECRET, {
    algorithm: 'HS256',
    expiresIn: '5m',
    issuer: 'mi-api',
    audience: 'mi-front',
  });

const createUser = async (email: string, roleCode: string, name: string) => {
  const role = await prisma.roles.findUnique({ where: { code: roleCode } });
  const status = await prisma.userStatus.findFirst();
  if (!role || !status) {
    throw new Error('Test DB is not seeded: missing roles/userStatus');
  }

  return prisma.users.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      password: 'not-a-real-login',
      birthday: new Date('1990-01-01T00:00:00.000Z'),
      socialSecurity: '000000000',
      state: 'N/A',
      telephone: '0000000000',
      zipcode: '00000',
      roleId: role.id,
      statusId: status.id,
      lastUpdatedBy: 1,
      startDate: new Date('2024-01-01T00:00:00.000Z'),
    },
  });
};

const createClientOrder = async (
  details: Array<Record<string, number>>,
  extra: Record<string, unknown> = {}
) =>
  withCsrf(
    request(app)
      .post('/api/v1/clientOrder')
      .set('Authorization', `Bearer ${adminToken}`)
  ).send({ clientId, notes: 'integration order', details, ...extra });

const createProviderOrder = async (details: Array<Record<string, number>>) =>
  withCsrf(
    request(app)
      .post('/api/v1/providerOrder')
      .set('Authorization', `Bearer ${adminToken}`)
  ).send({ supplierId: providerId, details });

beforeAll(async () => {
  const admin = await createUser(ADMIN_EMAIL, ROLESCODES.ADMIN, 'Orders Admin');
  const manager = await createUser(
    MANAGER_EMAIL,
    ROLESCODES.MANAGER,
    'Orders Manager'
  );
  adminToken = tokenFor(admin.id);
  managerToken = tokenFor(manager.id);

  // `clients.email` is not unique, so it cannot be used in an upsert.
  const existingClient = await prisma.clients.findFirst({
    where: { email: CLIENT_EMAIL },
  });
  const client =
    existingClient ??
    (await prisma.clients.create({
      data: {
        name: 'Orders Integration Client',
        email: CLIENT_EMAIL,
        phone: '0000000000',
        address: 'N/A',
        createdBy: admin.id,
        createdOn: new Date('2024-01-01T00:00:00.000Z'),
      },
    }));
  clientId = client.id;

  const provider = await prisma.productProviders.upsert({
    where: { name: PROVIDER_NAME },
    update: {},
    create: {
      code: 'OIP',
      name: PROVIDER_NAME,
      createdBy: admin.id,
      createdOn: new Date('2024-01-01T00:00:00.000Z'),
    },
  });
  providerId = provider.id;

  const category = await prisma.productCategories.upsert({
    where: { code: CATEGORY_CODE },
    update: {},
    create: {
      code: CATEGORY_CODE,
      description: 'Orders integration category',
      createdOn: new Date('2024-01-01T00:00:00.000Z'),
    },
  });

  const status = await prisma.productStatus.findFirst();
  if (!status) throw new Error('Test DB is not seeded: missing productStatus');

  const product = await prisma.products.upsert({
    where: { sku: PRODUCT_SKU },
    update: {},
    create: {
      sku: PRODUCT_SKU,
      name: 'Orders integration product',
      productCategoryId: category.id,
      productProviderId: provider.id,
      productStatusId: status.id,
      price: 10,
      cost: 5,
      createdBy: admin.id,
      createdOn: new Date('2024-01-01T00:00:00.000Z'),
    },
  });
  productId = product.id;
});

afterAll(async () => {
  // Orders first (details are RESTRICT), then the documents they point to.
  await prisma.clientOrderDetail.deleteMany({ where: { order: { clientId } } });
  await prisma.clientOrder.deleteMany({ where: { clientId } });
  await prisma.saleDetail.deleteMany({ where: { sale: { clientId } } });
  await prisma.sale.deleteMany({ where: { clientId } });

  await prisma.providerOrderDetail.deleteMany({
    where: { order: { supplierId: providerId } },
  });
  await prisma.providerOrder.deleteMany({ where: { supplierId: providerId } });
  await prisma.purchaseDetail.deleteMany({
    where: { purchase: { providerId } },
  });
  await prisma.purchase.deleteMany({ where: { providerId } });

  await prisma.products.deleteMany({ where: { sku: PRODUCT_SKU } });
  await prisma.productCategories.deleteMany({
    where: { code: CATEGORY_CODE },
  });
  await prisma.productProviders.deleteMany({
    where: { name: PROVIDER_NAME },
  });
  await prisma.clients.deleteMany({ where: { email: CLIENT_EMAIL } });
  await prisma.users.deleteMany({
    where: { email: { in: [ADMIN_EMAIL, MANAGER_EMAIL] } },
  });

  await prisma.$disconnect();
});

describe('clientOrder endpoints (integration, real DB)', () => {
  it('rejects unauthenticated requests with 401 (RN-ORD-009)', async () => {
    const response = await request(app).get('/api/v1/clientOrder');
    expect(response.status).toBe(401);
  });

  it('rejects a non-admin without the order permission with 403', async () => {
    const response = await withCsrf(
      request(app)
        .post('/api/v1/clientOrder')
        .set('Authorization', `Bearer ${managerToken}`)
    ).send({
      clientId,
      details: [{ productId, quantity: 1, unitPrice: 5 }],
    });
    expect(response.status).toBe(403);
  });

  it('creates an order with details, a computed total and expected delivery date', async () => {
    const response = await createClientOrder(
      [
        { productId, quantity: 2, unitPrice: 5 },
        { productId, quantity: 1, unitPrice: 3.5 },
      ],
      { expectedDeliveryDate: '2026-12-01' }
    );

    expect(response.status).toBe(201);
    expect(response.body.data.details).toHaveLength(2);
    expect(Number(response.body.data.total)).toBeCloseTo(13.5, 2);
    expect(response.body.data.saleId).toBeNull();
    expect(response.body.data.expectedDeliveryDate).not.toBeNull();
  });

  it('rejects empty details with 400 (RN-ORD-008)', async () => {
    const response = await createClientOrder([]);
    expect(response.status).toBe(400);
  });

  it('rejects a unit price with more than 2 decimals with 400 (RN-ORD-001)', async () => {
    const response = await createClientOrder([
      { productId, quantity: 1, unitPrice: 10.123 },
    ]);
    expect(response.status).toBe(400);
  });

  it('rejects an invalid status transition with 400 (RN-ORD-011)', async () => {
    const created = await createClientOrder([
      { productId, quantity: 1, unitPrice: 5 },
    ]);

    const response = await withCsrf(
      request(app)
        .patch(`/api/v1/clientOrder/${created.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
    ).send({ status: 'COMPLETED' });

    expect(response.status).toBe(400);
  });

  it('stamps deliveredOn when the order reaches RECEIVED (RN-ORD-005)', async () => {
    const created = await createClientOrder([
      { productId, quantity: 1, unitPrice: 5 },
    ]);
    const id = created.body.data.id;

    const transitions = [];
    for (const status of ['PROCESSING', 'SHIPPED', 'RECEIVED']) {
      transitions.push(
        await withCsrf(
          request(app)
            .patch(`/api/v1/clientOrder/${id}`)
            .set('Authorization', `Bearer ${adminToken}`)
        ).send({ status })
      );
    }

    transitions.forEach((response) => expect(response.status).toBe(200));
    expect(transitions[2]!.body.data.deliveredOn).not.toBeNull();
  });

  it('recomputes the total when detail lines change (RN-ORD-003)', async () => {
    const created = await createClientOrder([
      { productId, quantity: 2, unitPrice: 5 },
      { productId, quantity: 1, unitPrice: 3.5 },
    ]);
    const id = created.body.data.id;

    const response = await withCsrf(
      request(app)
        .patch(`/api/v1/clientOrder/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
    ).send({ details: [{ productId, quantity: 1, unitPrice: 3.5 }] });

    expect(response.status).toBe(200);
    expect(response.body.data.details).toHaveLength(1);
    expect(Number(response.body.data.total)).toBeCloseTo(3.5, 2);
  });

  it('deletes an order and its detail lines', async () => {
    const created = await createClientOrder([
      { productId, quantity: 1, unitPrice: 5 },
    ]);
    const id = created.body.data.id;

    const response = await withCsrf(
      request(app)
        .delete(`/api/v1/clientOrder/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
    );

    expect(response.status).toBe(200);
    expect(
      await prisma.clientOrderDetail.count({ where: { orderId: id } })
    ).toBe(0);
  });
});

describe('clientOrder conversion (integration, real DB)', () => {
  it('persists saleId and blocks delete with 409 (RN-ORD-006/007)', async () => {
    const created = await createClientOrder([
      { productId, quantity: 2, unitPrice: 5 },
      { productId, quantity: 1, unitPrice: 3.5 },
    ]);
    const id = created.body.data.id;

    const converted = await withCsrf(
      request(app)
        .post(`/api/v1/clientOrder/${id}/convert`)
        .set('Authorization', `Bearer ${adminToken}`)
    );

    expect(converted.status).toBe(200);
    expect(converted.body.data.saleId).toEqual(expect.any(Number));

    const sale = await prisma.sale.findUnique({
      where: { id: converted.body.data.saleId },
      include: { saleDetail: true },
    });
    expect(sale).not.toBeNull();
    expect(Number(sale!.total)).toBeCloseTo(13.5, 2);
    expect(sale!.saleDetail).toHaveLength(2);

    const deleted = await withCsrf(
      request(app)
        .delete(`/api/v1/clientOrder/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
    );
    expect(deleted.status).toBe(409);
  });
});

describe('providerOrder endpoints (integration, real DB)', () => {
  it('persists purchaseId on conversion and blocks delete with 409', async () => {
    const created = await createProviderOrder([
      { productId, quantity: 2, estimatedPrice: 5 },
      { productId, quantity: 1, estimatedPrice: 3.5 },
    ]);

    expect(created.status).toBe(201);
    expect(Number(created.body.data.total)).toBeCloseTo(13.5, 2);

    const id = created.body.data.id;
    const converted = await withCsrf(
      request(app)
        .post(`/api/v1/providerOrder/${id}/convert`)
        .set('Authorization', `Bearer ${adminToken}`)
    );

    expect(converted.status).toBe(200);
    expect(converted.body.data.purchaseId).toEqual(expect.any(Number));

    const purchase = await prisma.purchase.findUnique({
      where: { id: converted.body.data.purchaseId },
      include: { purchaseDetail: true },
    });
    expect(purchase).not.toBeNull();
    expect(Number(purchase!.total)).toBeCloseTo(13.5, 2);
    expect(purchase!.purchaseDetail).toHaveLength(2);

    const deleted = await withCsrf(
      request(app)
        .delete(`/api/v1/providerOrder/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
    );
    expect(deleted.status).toBe(409);
  });
});
