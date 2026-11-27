import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../config/db.js', async () => {
  const { Prisma } = await import('@prisma/client');
  return { prisma: {}, Prisma };
});

vi.mock('./dao.js', () => ({
  getAllProviderOrders: vi.fn(),
  findProviderOrderById: vi.fn(),
  createProviderOrder: vi.fn(),
  patchProviderOrderById: vi.fn(),
  deleteProviderOrderById: vi.fn(),
  convertProviderOrderToPurchase: vi.fn(),
}));

import * as providerOrderService from './service.js';
import * as providerOrderDao from './dao.js';
import { ROLESCODES } from '../../utils/constants/enums.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import type { ProviderOrderListItem } from './types.js';

const mockedDao = vi.mocked(providerOrderDao);

const orderRow = (
  overrides: Partial<ProviderOrderListItem> = {}
): ProviderOrderListItem =>
  ({
    id: 1,
    supplierId: 10,
    status: 'PENDING',
    notes: null,
    total: '13.5',
    expectedDeliveryDate: null,
    deliveredOn: null,
    createdOn: new Date('2026-01-01T00:00:00.000Z'),
    updatedOn: null,
    createdBy: 1,
    updatedBy: null,
    purchaseId: null,
    ...overrides,
  }) as unknown as ProviderOrderListItem;

describe('providerOrder service lifecycle (RN-ORD-005/005b/010/011)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a non-ADMIN setting deliveredOn manually with 403', async () => {
    mockedDao.findProviderOrderById.mockResolvedValue(orderRow());

    await expect(
      providerOrderService.patchProviderOrderById(1, {
        updatedBy: 2,
        userRole: ROLESCODES.MANAGER,
        deliveredOn: '2026-02-01',
      })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedDao.patchProviderOrderById).not.toHaveBeenCalled();
  });

  it('allows an ADMIN to override deliveredOn', async () => {
    mockedDao.findProviderOrderById.mockResolvedValue(orderRow());
    mockedDao.patchProviderOrderById.mockResolvedValue(
      orderRow({ deliveredOn: new Date('2026-02-01') })
    );

    await providerOrderService.patchProviderOrderById(1, {
      updatedBy: 1,
      userRole: ROLESCODES.ADMIN,
      deliveredOn: '2026-02-01',
    });

    const [, patch] = mockedDao.patchProviderOrderById.mock.calls[0]!;
    expect(patch.deliveredOn).toBeInstanceOf(Date);
  });

  it('rejects an invalid transition with 400', async () => {
    mockedDao.findProviderOrderById.mockResolvedValue(orderRow());

    await expect(
      providerOrderService.patchProviderOrderById(1, {
        updatedBy: 1,
        status: 'COMPLETED',
      })
    ).rejects.toBeInstanceOf(ClientError);
    expect(mockedDao.patchProviderOrderById).not.toHaveBeenCalled();
  });

  it('stamps deliveredOn when transitioning to RECEIVED', async () => {
    mockedDao.findProviderOrderById.mockResolvedValue(
      orderRow({ status: 'SHIPPED' })
    );
    mockedDao.patchProviderOrderById.mockResolvedValue(
      orderRow({ status: 'RECEIVED', deliveredOn: new Date() })
    );

    await providerOrderService.patchProviderOrderById(1, {
      updatedBy: 1,
      status: 'RECEIVED',
    });

    const [, patch] = mockedDao.patchProviderOrderById.mock.calls[0]!;
    expect(patch.status).toBe('RECEIVED');
    expect(patch.deliveredOn).toBeInstanceOf(Date);
  });

  it('does not rewrite deliveredOn once it is already set', async () => {
    const deliveredOn = new Date('2026-01-10T00:00:00.000Z');
    mockedDao.findProviderOrderById.mockResolvedValue(
      orderRow({ status: 'RECEIVED', deliveredOn })
    );
    mockedDao.patchProviderOrderById.mockResolvedValue(
      orderRow({ status: 'COMPLETED', deliveredOn })
    );

    await providerOrderService.patchProviderOrderById(1, {
      updatedBy: 1,
      status: 'COMPLETED',
    });

    const [, patch] = mockedDao.patchProviderOrderById.mock.calls[0]!;
    expect(patch.deliveredOn).toBeUndefined();
  });

  it('parses expectedDeliveryDate strings before hitting the DAO', async () => {
    mockedDao.createProviderOrder.mockResolvedValue(orderRow());

    await providerOrderService.createProviderOrder({
      supplierId: 10,
      createdBy: 1,
      status: 'PENDING',
      expectedDeliveryDate: '2026-12-01',
      details: [{ productId: 1, quantity: 1, estimatedPrice: 10 }],
    });

    const [createData] = mockedDao.createProviderOrder.mock.calls[0]!;
    expect(createData.expectedDeliveryDate).toBeInstanceOf(Date);
  });
});
