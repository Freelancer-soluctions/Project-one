import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  accrualAmount,
  ACCRUAL_RATE,
  ACCRUAL_CAP,
  accrueMonthly,
} from './accrual.js';
import type { TxClient } from './balance.js';

const NOW = new Date('2026-03-31T12:00:00.000Z');

const makeTx = (opts: {
  employees: Array<{ id: number }>;
  existingLedger?: Set<number>;
  balances?: Map<number, number>;
}) => {
  const ledger = opts.existingLedger ?? new Set<number>();
  const balances = opts.balances ?? new Map<number, number>();
  const tx = {
    employees: { findMany: vi.fn().mockResolvedValue(opts.employees) },
    vacationAccrualRecord: {
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { employeeId_period_type: { employeeId: number } };
        }) =>
          ledger.has(where.employeeId_period_type.employeeId) ? { id: 1 } : null
      ),
      create: vi.fn().mockResolvedValue({}),
    },
    vacationBalance: {
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { employeeId_year: { employeeId: number } };
        }) => {
          const accrued = balances.get(where.employeeId_year.employeeId);
          return accrued === undefined
            ? null
            : {
                id: where.employeeId_year.employeeId,
                accrued,
                used: 0,
                remaining: accrued,
              };
        }
      ),
      create: vi.fn().mockResolvedValue({ id: 99 }),
      update: vi.fn().mockResolvedValue({}),
    },
  };
  return tx as unknown as TxClient & typeof tx;
};

describe('accrualAmount (RN-VP-013 policy v1)', () => {
  it('accrues 1.25 days per month', () => {
    expect(ACCRUAL_RATE).toBe(1.25);
    expect(accrualAmount(0)).toBe(1.25);
  });

  it('caps accrued days at 30 with no carry-over beyond the cap', () => {
    expect(ACCRUAL_CAP).toBe(30);
    expect(accrualAmount(29)).toBe(1);
    expect(accrualAmount(30)).toBe(0);
    expect(accrualAmount(45)).toBe(0);
  });
});

describe('accrueMonthly (RN-VP-013)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates the year balance when missing and writes a ledger record', async () => {
    const tx = makeTx({ employees: [{ id: 1 }] });

    const result = await accrueMonthly(tx, {
      period: '2026-03',
      userId: 9,
      now: NOW,
    });

    expect(tx.vacationBalance.create).toHaveBeenCalled();
    expect(tx.vacationBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accrued: { increment: 1.25 },
          remaining: { increment: 1.25 },
        }),
      })
    );
    expect(tx.vacationAccrualRecord.create).toHaveBeenCalledWith({
      data: {
        employeeId: 1,
        period: '2026-03',
        days: 1.25,
        type: 'ACCRUAL',
        createdOn: NOW,
        createdBy: 9,
      },
    });
    expect(result).toEqual({ accrued: 1, skipped: 0 });
  });

  it('is idempotent: an existing ledger row for the period is skipped', async () => {
    const tx = makeTx({ employees: [{ id: 1 }], existingLedger: new Set([1]) });

    const result = await accrueMonthly(tx, {
      period: '2026-03',
      userId: 9,
      now: NOW,
    });

    expect(tx.vacationAccrualRecord.create).not.toHaveBeenCalled();
    expect(tx.vacationBalance.update).not.toHaveBeenCalled();
    expect(result).toEqual({ accrued: 0, skipped: 1 });
  });

  it('does not accrue beyond the cap of 30 days', async () => {
    const tx = makeTx({ employees: [{ id: 1 }], balances: new Map([[1, 30]]) });

    const result = await accrueMonthly(tx, {
      period: '2026-03',
      userId: 9,
      now: NOW,
    });

    expect(tx.vacationBalance.update).not.toHaveBeenCalled();
    expect(tx.vacationAccrualRecord.create).not.toHaveBeenCalled();
    expect(result).toEqual({ accrued: 0, skipped: 1 });
  });

  it('accrues only the remaining room when close to the cap', async () => {
    const tx = makeTx({ employees: [{ id: 1 }], balances: new Map([[1, 29]]) });

    await accrueMonthly(tx, { period: '2026-03', userId: 9, now: NOW });

    expect(tx.vacationBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accrued: { increment: 1 } }),
      })
    );
  });
});
