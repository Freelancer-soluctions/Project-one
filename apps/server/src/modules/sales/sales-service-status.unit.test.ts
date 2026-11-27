import { describe, it, expect, beforeEach, vi } from 'vitest';

// Real `Prisma` namespace (Decimal) without instantiating a PrismaClient.
vi.mock('../../config/db.js', async () => {
  const { Prisma } = await import('@prisma/client');
  return { prisma: {}, Prisma };
});

vi.mock('./dao.js', () => ({
  getAllSales: vi.fn(),
  createSale: vi.fn(),
  deleteSaleById: vi.fn(),
  deleteSaleDetailById: vi.fn(),
  findSaleById: vi.fn(),
  patchSaleById: vi.fn(),
  transitionSaleStatus: vi.fn(),
  transitionSaleWithReversal: vi.fn(),
}));

import * as salesService from './service.js';
import * as salesDao from './dao.js';
import type { SaleRecord } from './types.js';

const mockedDao = vi.mocked(salesDao);

const saleRow = (overrides: Partial<SaleRecord> = {}): SaleRecord =>
  ({
    id: 1,
    clientId: 10,
    total: '10',
    status: 'PENDING',
    paymentMethod: null,
    paidAt: null,
    invoiceNumber: null,
    createdOn: new Date('2026-01-01T00:00:00.000Z'),
    updatedOn: null,
    createdBy: 1,
    updatedBy: null,
    ...overrides,
  }) as unknown as SaleRecord;

describe('sales service status lifecycle (RN-SP-001..RN-SP-005)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an unknown sale with 404', async () => {
    mockedDao.findSaleById.mockResolvedValue(null);

    await expect(
      salesService.transitionSaleStatus(99, { status: 'PAID', updatedBy: 1 })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(mockedDao.transitionSaleStatus).not.toHaveBeenCalled();
    expect(mockedDao.transitionSaleWithReversal).not.toHaveBeenCalled();
  });

  it('rejects an invalid transition with 400 and writes nothing', async () => {
    mockedDao.findSaleById.mockResolvedValue(saleRow({ status: 'CANCELLED' }));

    await expect(
      salesService.transitionSaleStatus(1, { status: 'PAID', updatedBy: 1 })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mockedDao.transitionSaleStatus).not.toHaveBeenCalled();
    expect(mockedDao.transitionSaleWithReversal).not.toHaveBeenCalled();
  });

  it('stamps paidAt on the PAID transition', async () => {
    mockedDao.findSaleById.mockResolvedValue(saleRow());
    mockedDao.transitionSaleStatus.mockResolvedValue(
      saleRow({ status: 'PAID' })
    );

    await salesService.transitionSaleStatus(1, {
      status: 'PAID',
      paymentMethod: 'CASH',
      invoiceNumber: 'FAC-1',
      updatedBy: 7,
    });

    const [id, currentStatus, payload] =
      mockedDao.transitionSaleStatus.mock.calls[0]!;
    expect(id).toBe(1);
    expect(currentStatus).toBe('PENDING');
    expect(payload.status).toBe('PAID');
    expect(payload.paidAt).toBeInstanceOf(Date);
    expect(payload.paymentMethod).toBe('CASH');
    expect(payload.invoiceNumber).toBe('FAC-1');
    expect(payload.updatedBy).toBe(7);
  });

  it('delegates cancellation to the reversal path', async () => {
    mockedDao.findSaleById.mockResolvedValue(saleRow({ status: 'PENDING' }));
    mockedDao.transitionSaleWithReversal.mockResolvedValue(
      saleRow({ status: 'CANCELLED' })
    );

    const result = await salesService.transitionSaleStatus(1, {
      status: 'CANCELLED',
      updatedBy: 7,
    });

    expect(result.status).toBe('CANCELLED');
    expect(mockedDao.transitionSaleWithReversal).toHaveBeenCalledWith(
      1,
      'PENDING',
      'CANCELLED',
      {
        paymentMethod: undefined,
        invoiceNumber: undefined,
        updatedBy: 7,
      }
    );
    expect(mockedDao.transitionSaleStatus).not.toHaveBeenCalled();
  });

  it('delegates refund to the reversal path', async () => {
    mockedDao.findSaleById.mockResolvedValue(saleRow({ status: 'PAID' }));
    mockedDao.transitionSaleWithReversal.mockResolvedValue(
      saleRow({ status: 'REFUNDED' })
    );

    const result = await salesService.transitionSaleStatus(1, {
      status: 'REFUNDED',
      updatedBy: 7,
    });

    expect(result.status).toBe('REFUNDED');
    expect(mockedDao.transitionSaleWithReversal).toHaveBeenCalledWith(
      1,
      'PAID',
      'REFUNDED',
      {
        paymentMethod: undefined,
        invoiceNumber: undefined,
        updatedBy: 7,
      }
    );
  });

  it('treats a repeated status as an idempotent no-op', async () => {
    mockedDao.findSaleById.mockResolvedValue(saleRow({ status: 'CANCELLED' }));

    const result = await salesService.transitionSaleStatus(1, {
      status: 'CANCELLED',
      updatedBy: 7,
    });

    expect(result.status).toBe('CANCELLED');
    expect(mockedDao.transitionSaleWithReversal).not.toHaveBeenCalled();
    expect(mockedDao.transitionSaleStatus).not.toHaveBeenCalled();
  });

  it('persists payment data sent with the current status', async () => {
    mockedDao.findSaleById.mockResolvedValue(saleRow({ status: 'PAID' }));
    mockedDao.transitionSaleStatus.mockResolvedValue(
      saleRow({ status: 'PAID', paymentMethod: 'CARD' })
    );

    await salesService.transitionSaleStatus(1, {
      status: 'PAID',
      paymentMethod: 'CARD',
      updatedBy: 7,
    });

    expect(mockedDao.transitionSaleStatus).toHaveBeenCalledWith(1, 'PAID', {
      status: 'PAID',
      paymentMethod: 'CARD',
      updatedBy: 7,
    });
    expect(mockedDao.transitionSaleWithReversal).not.toHaveBeenCalled();
  });
});
