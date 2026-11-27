import { describe, it, expect, beforeEach, vi } from 'vitest';

// Real `Prisma` namespace (Decimal) without instantiating a PrismaClient.
vi.mock('../../config/db.js', async () => {
  const { Prisma } = await import('@prisma/client');
  return { prisma: {}, Prisma };
});

vi.mock('./dao.js', () => ({
  getAllClientOrders: vi.fn(),
  findClientOrderById: vi.fn(),
  createClientOrder: vi.fn(),
  patchClientOrderById: vi.fn(),
  deleteClientOrderById: vi.fn(),
  convertClientOrderToSale: vi.fn(),
}));

import * as clientOrderService from './service.js';
import * as clientOrderDao from './dao.js';
import { ROLESCODES } from '../../utils/constants/enums.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import type { ClientOrderListItem } from './types.js';

const mockedDao = vi.mocked(clientOrderDao);

const orderRow = (
  overrides: Partial<ClientOrderListItem> = {}
): ClientOrderListItem =>
  ({
    id: 1,
    clientId: 10,
    status: 'PENDING',
    notes: null,
    total: '13.5',
    expectedDeliveryDate: null,
    deliveredOn: null,
    createdOn: new Date('2026-01-01T00:00:00.000Z'),
    updatedOn: null,
    createdBy: 1,
    updatedBy: null,
    saleId: null,
    ...overrides,
  }) as unknown as ClientOrderListItem;

describe('clientOrder service lifecycle (RN-ORD-005/005b/010/011)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a non-ADMIN setting deliveredOn manually with 403', async () => {
    mockedDao.findClientOrderById.mockResolvedValue(orderRow());

    await expect(
      clientOrderService.patchClientOrderById(1, {
        updatedBy: 2,
        userRole: ROLESCODES.MANAGER,
        deliveredOn: '2026-02-01',
      })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedDao.patchClientOrderById).not.toHaveBeenCalled();
  });

  it('allows an ADMIN to override deliveredOn', async () => {
    mockedDao.findClientOrderById.mockResolvedValue(orderRow());
    mockedDao.patchClientOrderById.mockResolvedValue(
      orderRow({ deliveredOn: new Date('2026-02-01') })
    );

    await clientOrderService.patchClientOrderById(1, {
      updatedBy: 1,
      userRole: ROLESCODES.ADMIN,
      deliveredOn: '2026-02-01',
    });

    const [, patch] = mockedDao.patchClientOrderById.mock.calls[0]!;
    expect(patch.deliveredOn).toBeInstanceOf(Date);
  });

  it('rejects an invalid transition with 400', async () => {
    mockedDao.findClientOrderById.mockResolvedValue(orderRow());

    await expect(
      clientOrderService.patchClientOrderById(1, {
        updatedBy: 1,
        status: 'COMPLETED',
      })
    ).rejects.toBeInstanceOf(ClientError);
    expect(mockedDao.patchClientOrderById).not.toHaveBeenCalled();
  });

  it('stamps deliveredOn when transitioning to RECEIVED', async () => {
    mockedDao.findClientOrderById.mockResolvedValue(
      orderRow({ status: 'SHIPPED' })
    );
    mockedDao.patchClientOrderById.mockResolvedValue(
      orderRow({ status: 'RECEIVED', deliveredOn: new Date() })
    );

    await clientOrderService.patchClientOrderById(1, {
      updatedBy: 1,
      status: 'RECEIVED',
    });

    const [, patch] = mockedDao.patchClientOrderById.mock.calls[0]!;
    expect(patch.status).toBe('RECEIVED');
    expect(patch.deliveredOn).toBeInstanceOf(Date);
  });

  it('does not rewrite deliveredOn once it is already set', async () => {
    const deliveredOn = new Date('2026-01-10T00:00:00.000Z');
    mockedDao.findClientOrderById.mockResolvedValue(
      orderRow({ status: 'RECEIVED', deliveredOn })
    );
    mockedDao.patchClientOrderById.mockResolvedValue(
      orderRow({ status: 'COMPLETED', deliveredOn })
    );

    await clientOrderService.patchClientOrderById(1, {
      updatedBy: 1,
      status: 'COMPLETED',
    });

    const [, patch] = mockedDao.patchClientOrderById.mock.calls[0]!;
    expect(patch.deliveredOn).toBeUndefined();
  });

  it('parses expectedDeliveryDate strings before hitting the DAO', async () => {
    mockedDao.createClientOrder.mockResolvedValue(orderRow());

    await clientOrderService.createClientOrder({
      clientId: 10,
      createdBy: 1,
      status: 'PENDING',
      expectedDeliveryDate: '2026-12-01',
      details: [{ productId: 1, quantity: 1, unitPrice: 10 }],
    });

    const [createData] = mockedDao.createClientOrder.mock.calls[0]!;
    expect(createData.expectedDeliveryDate).toBeInstanceOf(Date);
  });
});
