import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import app from '../../../src/app.js';
import { prisma } from '../../../src/config/db.js';
import { ROLESCODES } from '../../../src/utils/constants/enums.js';

/**
 * Sale/purchase lifecycle against the real database (capability
 * `sale-purchase-status`): status transitions, `paidAt` stamping, invoice
 * uniqueness, status filtering and cancellation with compensating inventory
 * movements (RN-SP-001..RN-SP-008).
 */

const SECRET = process.env.SECRETKEY as string;
const ADMIN_EMAIL = 'sale-status-admin@test.local';
const CLIENT_EMAIL = 'sale-status-client@test.local';
const PROVIDER_NAME = 'Sale Status Integration Provider';
const CATEGORY_CODE = 'SSI';
const PRODUCT_SKU = 'SALE-STATUS-1';
const WAREHOUSE_NAME = 'Sale Status Integration Warehouse';
const INVOICE = 'INV-STATUS-001';
const CLIENT_PAYLOAD_INVOICE = 'INV-CLIENT-PAYLOAD-001';
const CLIENT_PAYLOAD_PURCHASE_INVOICE = 'INV-CLIENT-PAYLOAD-002';

let adminToken = '';
let adminId = 0;
let clientId = 0;
let providerId = 0;
let productId = 0;
let warehouseId = 0;

/** Every mutating request goes through the conditional CSRF guard. */
const CSRF_TOKEN = 'sale-status-integration-csrf';
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

const createSale = async (extra: Record<string, unknown> = {}) =>
  withCsrf(
    request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${adminToken}`)
  ).send({
    clientId,
    total: 20,
    details: [{ productId, quantity: 2, price: 10 }],
    ...extra,
  });

const transition = async (
  resource: 'sales' | 'purchases',
  id: number,
  body: Record<string, unknown>
) =>
  withCsrf(
    request(app)
      .patch(`/api/v1/${resource}/${id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
  ).send(body);

beforeAll(async () => {
  const admin = await createUser(
    ADMIN_EMAIL,
    ROLESCODES.ADMIN,
    'Sale Status Admin'
  );
  adminId = admin.id;
  adminToken = tokenFor(admin.id);

  // `clients.email` is not unique, so it cannot be used in an upsert.
  const existingClient = await prisma.clients.findFirst({
    where: { email: CLIENT_EMAIL },
  });
  const client =
    existingClient ??
    (await prisma.clients.create({
      data: {
        name: 'Sale Status Integration Client',
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
      code: 'SSP',
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
      description: 'Sale status integration category',
      createdOn: new Date('2024-01-01T00:00:00.000Z'),
    },
  });

  const productStatus = await prisma.productStatus.findFirst();
  if (!productStatus) {
    throw new Error('Test DB is not seeded: missing productStatus');
  }

  const product = await prisma.products.upsert({
    where: { sku: PRODUCT_SKU },
    update: {},
    create: {
      sku: PRODUCT_SKU,
      name: 'Sale status integration product',
      productCategoryId: category.id,
      productProviderId: provider.id,
      productStatusId: productStatus.id,
      price: 10,
      cost: 5,
      createdBy: admin.id,
      createdOn: new Date('2024-01-01T00:00:00.000Z'),
    },
  });
  productId = product.id;

  const existingWarehouse = await prisma.warehouse.findFirst({
    where: { name: WAREHOUSE_NAME },
  });
  const warehouse =
    existingWarehouse ??
    (await prisma.warehouse.create({
      data: {
        name: WAREHOUSE_NAME,
        description: 'Sale status integration warehouse',
        createdOn: new Date('2024-01-01T00:00:00.000Z'),
      },
    }));
  warehouseId = warehouse.id;
});

afterAll(async () => {
  // Movements first, then details, then the documents they belong to.
  await prisma.inventoryMovement.deleteMany({
    where: {
      OR: [
        { sale: { clientId } },
        { purchase: { providerId } },
        { productId, warehouseId },
      ],
    },
  });
  await prisma.saleDetail.deleteMany({ where: { sale: { clientId } } });
  await prisma.sale.deleteMany({ where: { clientId } });
  await prisma.purchaseDetail.deleteMany({
    where: { purchase: { providerId } },
  });
  await prisma.purchase.deleteMany({ where: { providerId } });
  await prisma.stock.deleteMany({ where: { productId, warehouseId } });

  await prisma.products.deleteMany({ where: { sku: PRODUCT_SKU } });
  await prisma.productCategories.deleteMany({ where: { code: CATEGORY_CODE } });
  await prisma.productProviders.deleteMany({ where: { name: PROVIDER_NAME } });
  await prisma.warehouse.deleteMany({ where: { name: WAREHOUSE_NAME } });
  await prisma.clients.deleteMany({ where: { email: CLIENT_EMAIL } });
  await prisma.users.deleteMany({ where: { email: ADMIN_EMAIL } });

  await prisma.$disconnect();
});

describe('sale status lifecycle (integration, real DB)', () => {
  it('rejects unauthenticated requests with 401 (RN-SP-009)', async () => {
    const response = await request(app).get('/api/v1/sales');
    expect(response.status).toBe(401);
  });

  it('creates a sale as PENDING and stamps paidAt on PAID (RN-SP-001/RN-SP-005)', async () => {
    const created = await createSale();
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('PENDING');
    expect(created.body.data.paidAt).toBeNull();

    const paid = await transition('sales', created.body.data.id, {
      status: 'PAID',
      paymentMethod: 'CARD',
    });

    expect(paid.status).toBe(200);
    expect(paid.body.data.status).toBe('PAID');
    expect(paid.body.data.paymentMethod).toBe('CARD');
    expect(paid.body.data.paidAt).not.toBeNull();
  });

  it('rejects PAID -> PENDING with 400 (RN-SP-002)', async () => {
    const created = await createSale();
    const id = created.body.data.id;

    expect((await transition('sales', id, { status: 'PAID' })).status).toBe(
      200
    );

    const response = await transition('sales', id, { status: 'PENDING' });
    expect(response.status).toBe(400);
  });

  it('creates a sale from the client payload and keeps payment data', async () => {
    // Exactly the body `buildCreatePayload` sends from the create dialog: the
    // form state keeps audit fields for edit mode, but they are filtered out.
    const response = await createSale({
      paymentMethod: 'CASH',
      invoiceNumber: CLIENT_PAYLOAD_INVOICE,
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      status: 'PENDING',
      paymentMethod: 'CASH',
      invoiceNumber: CLIENT_PAYLOAD_INVOICE,
      paidAt: null,
    });
  });

  it('rejects the audit fields the client form state must not send', async () => {
    const response = await createSale({
      createdOn: '',
      updatedOn: '',
      userSaleCreatedName: 'someone',
    });

    expect(response.status).toBe(400);
  });

  it('rejects a duplicate invoiceNumber with 409 (RN-SP-006)', async () => {
    const first = await createSale({ invoiceNumber: INVOICE });
    expect(first.status).toBe(201);

    const second = await createSale({ invoiceNumber: INVOICE });
    expect(second.status).toBe(409);
  });

  it('reverses sale movements on cancel and never double-reverses (RN-SP-007)', async () => {
    const created = await createSale();
    const id = created.body.data.id;

    await prisma.stock.create({
      data: {
        productId,
        warehouseId,
        lot: 'sale-cancel-lot',
        quantity: 10,
        minimum: 0,
        createdOn: new Date('2024-01-01T00:00:00.000Z'),
        createdBy: adminId,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        productId,
        warehouseId,
        quantity: 2,
        type: 'EXIT',
        reason: 'integration sale exit',
        createdOn: new Date(),
        createdBy: adminId,
        saleId: id,
      },
    });

    const stockBefore = await prisma.stock.findFirst({
      where: { productId, warehouseId },
      orderBy: { createdOn: 'asc' },
    });

    const cancelled = await transition('sales', id, { status: 'CANCELLED' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe('CANCELLED');

    // The reversal is an ENTRY movement, not a no-op ADJUSTMENT row.
    const reversals = await prisma.inventoryMovement.findMany({
      where: { saleId: id, type: 'ENTRY' },
    });
    expect(reversals).toHaveLength(1);
    expect(reversals[0]!.quantity).toBe(2);
    expect(reversals[0]!.productId).toBe(productId);
    expect(reversals[0]!.reason).toContain('EXIT->ENTRY');

    // Cancelling also returns the stock (the reversed EXIT becomes an ENTRY),
    // not only the audit row.
    const stockAfter = await prisma.stock.findFirst({
      where: { productId, warehouseId },
      orderBy: { createdOn: 'asc' },
    });
    expect(stockAfter!.quantity).toBe(stockBefore!.quantity + 2);

    // Re-sending CANCELLED is an idempotent no-op.
    const again = await transition('sales', id, { status: 'CANCELLED' });
    expect(again.status).toBe(200);
    expect(
      await prisma.inventoryMovement.count({
        where: { saleId: id, type: 'ENTRY' },
      })
    ).toBe(1);
  });

  it('reverses stock when a paid sale is refunded (RN-SP-007)', async () => {
    const created = await createSale();
    const id = created.body.data.id;
    expect((await transition('sales', id, { status: 'PAID' })).status).toBe(
      200
    );

    await prisma.inventoryMovement.create({
      data: {
        productId,
        warehouseId,
        quantity: 1,
        type: 'EXIT',
        reason: 'integration refund exit',
        createdOn: new Date(),
        createdBy: adminId,
        saleId: id,
      },
    });

    const refunded = await transition('sales', id, { status: 'REFUNDED' });
    expect(refunded.status).toBe(200);
    expect(refunded.body.data.status).toBe('REFUNDED');

    expect(
      await prisma.inventoryMovement.count({
        where: { saleId: id, type: 'ENTRY' },
      })
    ).toBe(1);
  });

  it('filters sales by status (RN-SP-008)', async () => {
    // `page`/`limit` are sent by the client on every load and the query
    // middleware rejects unknown params, so they must be part of the contract.
    const response = await request(app)
      .get('/api/v1/sales')
      .query({ status: 'PAID', page: 1, limit: 20 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.dataList)).toBe(true);
    expect(response.body.data.dataList.length).toBeGreaterThan(0);
    expect(response.body.data.total).toBeGreaterThan(0);
    for (const sale of response.body.data.dataList) {
      expect(sale.status).toBe('PAID');
    }
  });
});

describe('purchase status lifecycle (integration, real DB)', () => {
  const createPurchase = async (extra: Record<string, unknown> = {}) =>
    withCsrf(
      request(app)
        .post('/api/v1/purchases')
        .set('Authorization', `Bearer ${adminToken}`)
    ).send({
      providerId,
      total: 15,
      details: [{ productId, quantity: 3, price: 5 }],
      ...extra,
    });

  it('creates a purchase from the client payload and keeps payment data', async () => {
    const response = await createPurchase({
      paymentMethod: 'TRANSFER',
      invoiceNumber: CLIENT_PAYLOAD_PURCHASE_INVOICE,
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      status: 'PENDING',
      paymentMethod: 'TRANSFER',
      invoiceNumber: CLIENT_PAYLOAD_PURCHASE_INVOICE,
      paidAt: null,
    });
  });

  it('rejects the audit fields the client form state must not send', async () => {
    const response = await createPurchase({
      createdOn: '',
      updatedOn: '',
      userPurchaseCreated: '',
      userPurchaseUpdated: '',
    });

    expect(response.status).toBe(400);
  });

  it('moves PENDING -> RECEIVED -> PAID and stamps paidAt (RN-SP-003)', async () => {
    const created = await createPurchase();
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('PENDING');

    const received = await transition('purchases', created.body.data.id, {
      status: 'RECEIVED',
    });
    expect(received.status).toBe(200);
    expect(received.body.data.status).toBe('RECEIVED');

    const paid = await transition('purchases', created.body.data.id, {
      status: 'PAID',
      paymentMethod: 'TRANSFER',
    });
    expect(paid.status).toBe(200);
    expect(paid.body.data.status).toBe('PAID');
    expect(paid.body.data.paidAt).not.toBeNull();
  });

  it('reverses purchase movements when a received purchase is cancelled (RN-SP-004)', async () => {
    const created = await createPurchase();
    const id = created.body.data.id;

    await transition('purchases', id, { status: 'RECEIVED' });

    await prisma.stock.create({
      data: {
        productId,
        warehouseId,
        lot: 'purchase-cancel-lot',
        quantity: 5,
        minimum: 0,
        createdOn: new Date('2024-01-02T00:00:00.000Z'),
        createdBy: adminId,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        productId,
        warehouseId,
        quantity: 3,
        type: 'ENTRY',
        reason: 'integration purchase entry',
        createdOn: new Date(),
        createdBy: adminId,
        purchaseId: id,
      },
    });

    const stockBefore = await prisma.stock.findFirst({
      where: { productId, warehouseId },
      orderBy: { createdOn: 'asc' },
    });

    const cancelled = await transition('purchases', id, {
      status: 'CANCELLED',
    });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe('CANCELLED');

    const reversals = await prisma.inventoryMovement.findMany({
      where: { purchaseId: id, type: 'EXIT' },
    });
    expect(reversals).toHaveLength(1);
    expect(reversals[0]!.quantity).toBe(3);
    expect(reversals[0]!.reason).toContain('ENTRY->EXIT');

    const stockAfter = await prisma.stock.findFirst({
      where: { productId, warehouseId },
      orderBy: { createdOn: 'asc' },
    });
    // The original ENTRY is reversed with an EXIT: the goods go back.
    expect(stockAfter!.quantity).toBe(stockBefore!.quantity - 3);
  });
});
