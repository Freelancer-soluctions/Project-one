import { describe, it, expect } from 'vitest';
import {
  computeUnpaidLeaveDeduction,
  periodBounds,
} from './leave-deduction.js';

describe('periodBounds', () => {
  it('returns the first and last UTC day of a YYYY-MM period', () => {
    const { start, end } = periodBounds('2026-02');
    expect(start.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-02-28T00:00:00.000Z');
  });

  it('handles 31-day months', () => {
    expect(periodBounds('2026-01').end.toISOString()).toBe(
      '2026-01-31T00:00:00.000Z'
    );
  });
});

describe('computeUnpaidLeaveDeduction (RN-VP-009)', () => {
  const salary = 3000;

  it('deducts salary/30 per unpaid day inside the period', () => {
    const r = computeUnpaidLeaveDeduction(salary, '2026-02', [
      {
        startDate: new Date('2026-02-01T00:00:00Z'),
        endDate: new Date('2026-02-03T00:00:00Z'),
      },
    ]);
    expect(r.unpaidDays).toBe(3);
    expect(r.deduction).toBe(300);
  });

  it('counts only the days that fall inside the period (leave crossing the month start)', () => {
    const r = computeUnpaidLeaveDeduction(salary, '2026-02', [
      {
        startDate: new Date('2026-01-30T00:00:00Z'),
        endDate: new Date('2026-02-02T00:00:00Z'),
      },
    ]);
    expect(r.unpaidDays).toBe(2);
  });

  it('ignores leave outside the period', () => {
    const r = computeUnpaidLeaveDeduction(salary, '2026-02', [
      {
        startDate: new Date('2026-03-01T00:00:00Z'),
        endDate: new Date('2026-03-05T00:00:00Z'),
      },
    ]);
    expect(r).toEqual({ unpaidDays: 0, deduction: 0 });
  });

  it('rounds the deduction to 2 decimals', () => {
    const r = computeUnpaidLeaveDeduction(1000, '2026-02', [
      {
        startDate: new Date('2026-02-01T00:00:00Z'),
        endDate: new Date('2026-02-01T00:00:00Z'),
      },
    ]);
    expect(r.deduction).toBe(33.33);
  });

  it('sums multiple unpaid leaves in the same period', () => {
    const r = computeUnpaidLeaveDeduction(salary, '2026-02', [
      {
        startDate: new Date('2026-02-01T00:00:00Z'),
        endDate: new Date('2026-02-02T00:00:00Z'),
      },
      {
        startDate: new Date('2026-02-10T00:00:00Z'),
        endDate: new Date('2026-02-10T00:00:00Z'),
      },
    ]);
    expect(r.unpaidDays).toBe(3);
    expect(r.deduction).toBe(300);
  });
});
