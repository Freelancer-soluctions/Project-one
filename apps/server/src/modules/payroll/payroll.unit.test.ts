import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./dao.js', () => ({
  createPayroll: vi.fn(),
  getPayrollById: vi.fn(),
  getAllPayroll: vi.fn(),
  updatePayrollById: vi.fn(),
  deletePayrollById: vi.fn(),
}));

vi.mock('../vacation/dao.js', () => ({
  findApprovedUnpaidVacations: vi.fn(),
}));

import * as payrollDao from './dao.js';
import * as vacationDao from '../vacation/dao.js';
import { createPayroll, updatePayrollByIdPartial } from './service.js';

const baseInput = {
  employeeId: 1,
  month: 2,
  year: 2026,
  baseSalary: 3000,
  extraHours: 0,
  deductions: 0,
  totalPayment: 2700,
  status: 'DRAFT',
} as never;

describe('createPayroll — unpaid leave deduction (RN-VP-009, task 4.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(payrollDao.createPayroll).mockResolvedValue({} as never);
  });

  it('subtracts approved unpaid leave from totalPayment', async () => {
    vi.mocked(vacationDao.findApprovedUnpaidVacations).mockResolvedValue([
      {
        startDate: new Date('2026-02-01T00:00:00Z'),
        endDate: new Date('2026-02-03T00:00:00Z'),
      },
    ] as never);

    await createPayroll(baseInput, 9);

    expect(vacationDao.findApprovedUnpaidVacations).toHaveBeenCalledWith(
      1,
      new Date('2026-02-01T00:00:00.000Z'),
      new Date('2026-02-28T00:00:00.000Z')
    );
    expect(payrollDao.createPayroll).toHaveBeenCalledWith(
      expect.objectContaining({ totalPayment: '2400' })
    );
  });

  it('leaves totalPayment unchanged when there is no unpaid leave', async () => {
    vi.mocked(vacationDao.findApprovedUnpaidVacations).mockResolvedValue(
      [] as never
    );

    await createPayroll(baseInput, 9);

    expect(payrollDao.createPayroll).toHaveBeenCalledWith(
      expect.objectContaining({ totalPayment: '2700' })
    );
  });

  it('never produces a negative totalPayment', async () => {
    vi.mocked(vacationDao.findApprovedUnpaidVacations).mockResolvedValue([
      {
        startDate: new Date('2026-02-01T00:00:00Z'),
        endDate: new Date('2026-02-28T00:00:00Z'),
      },
    ] as never);

    await createPayroll(
      { ...(baseInput as object), totalPayment: 100 } as never,
      9
    );

    expect(payrollDao.createPayroll).toHaveBeenCalledWith(
      expect.objectContaining({ totalPayment: '0' })
    );
  });
});

describe('updatePayrollByIdPartial — recálculo del descuento (RN-VP-009, cierre de hueco)', () => {
  const storedRecord = {
    id: 7,
    employeeId: 1,
    month: 2,
    year: 2026,
    baseSalary: '3000',
    totalPayment: '2400',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(payrollDao.getPayrollById).mockResolvedValue(
      storedRecord as never
    );
    vi.mocked(payrollDao.updatePayrollById).mockResolvedValue({} as never);
    vi.mocked(vacationDao.findApprovedUnpaidVacations).mockResolvedValue([
      {
        startDate: new Date('2026-02-01T00:00:00Z'),
        endDate: new Date('2026-02-03T00:00:00Z'),
      },
    ] as never);
  });

  it('a new gross totalPayment is reduced by the unpaid leave of the stored period', async () => {
    await updatePayrollByIdPartial(7, { totalPayment: 2700 } as never, 9);

    expect(payrollDao.updatePayrollById).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ totalPayment: '2400' })
    );
  });

  it('changing employee or period recalculates with the effective values', async () => {
    await updatePayrollByIdPartial(
      7,
      { month: 2, totalPayment: 2700 } as never,
      9
    );

    expect(vacationDao.findApprovedUnpaidVacations).toHaveBeenCalledWith(
      1,
      new Date('2026-02-01T00:00:00.000Z'),
      new Date('2026-02-28T00:00:00.000Z')
    );
  });

  it('an update without totalPayment does not touch the stored amount', async () => {
    await updatePayrollByIdPartial(7, { extraHours: 4 } as never, 9);

    expect(payrollDao.getPayrollById).not.toHaveBeenCalled();
    const arg = vi.mocked(payrollDao.updatePayrollById).mock
      .calls[0]?.[1] as Record<string, unknown>;
    expect(arg).not.toHaveProperty('totalPayment');
  });

  it('changing the period without totalPayment is rejected with 400', async () => {
    await expect(
      updatePayrollByIdPartial(7, { month: 3 } as never, 9)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(payrollDao.updatePayrollById).not.toHaveBeenCalled();
  });
});
