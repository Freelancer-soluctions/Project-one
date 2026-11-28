import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  countVacationDays,
  deductVacationBalance,
  restoreVacationBalance,
} from './balance.js';
import type { TxClient } from './balance.js';
import ClientError from '../../utils/responses&Errors/errors.js';

const makeTx = (rows: Array<{ id: number; remaining: number }>) => {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue(rows),
    vacationBalance: { update: vi.fn().mockResolvedValue({}) },
  };
  return tx as unknown as TxClient & {
    $queryRaw: ReturnType<typeof vi.fn>;
    vacationBalance: { update: ReturnType<typeof vi.fn> };
  };
};

describe('countVacationDays (RN-VP-007 basis)', () => {
  it('counts both ends inclusive', () => {
    expect(
      countVacationDays(
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-05T00:00:00Z')
      )
    ).toBe(5);
  });

  it('a single-day leave counts as 1', () => {
    expect(
      countVacationDays(
        new Date('2026-03-10T00:00:00Z'),
        new Date('2026-03-10T00:00:00Z')
      )
    ).toBe(1);
  });
});

describe('deductVacationBalance (RN-VP-006, RN-VP-007)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects with 400 when remaining balance is below the requested days and writes nothing', async () => {
    const tx = makeTx([{ id: 1, remaining: 2 }]);

    await expect(
      deductVacationBalance(
        tx,
        10,
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-05T00:00:00Z')
      )
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(tx.vacationBalance.update).not.toHaveBeenCalled();
  });

  it('rejects with 400 when the employee has no balance row for the year', async () => {
    const tx = makeTx([]);

    await expect(
      deductVacationBalance(
        tx,
        10,
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-01T00:00:00Z')
      )
    ).rejects.toBeInstanceOf(ClientError);
  });

  it('increments used and decrements remaining by the leave length', async () => {
    const tx = makeTx([{ id: 7, remaining: 10 }]);

    const days = await deductVacationBalance(
      tx,
      10,
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-05T00:00:00Z')
    );

    expect(days).toBe(5);
    expect(tx.vacationBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: expect.objectContaining({
          used: { increment: 5 },
          remaining: { decrement: 5 },
        }),
      })
    );
  });

  it('locks the balance row before reading it (FOR UPDATE)', async () => {
    const tx = makeTx([{ id: 7, remaining: 10 }]);

    await deductVacationBalance(
      tx,
      10,
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-01T00:00:00Z')
    );

    const sql = (tx.$queryRaw.mock.calls[0]?.[0] as string[]).join('?');
    expect(sql).toMatch(/FOR UPDATE/i);
  });
});

describe('restoreVacationBalance (RN-VP-008)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('decrements used and increments remaining by the leave length', async () => {
    const tx = makeTx([{ id: 7, remaining: 3 }]);

    await restoreVacationBalance(
      tx,
      10,
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-03T00:00:00Z')
    );

    expect(tx.vacationBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: expect.objectContaining({
          used: { decrement: 3 },
          remaining: { increment: 3 },
        }),
      })
    );
  });

  it('is a no-op when no balance row exists', async () => {
    const tx = makeTx([]);

    await restoreVacationBalance(
      tx,
      10,
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-03T00:00:00Z')
    );

    expect(tx.vacationBalance.update).not.toHaveBeenCalled();
  });
});
