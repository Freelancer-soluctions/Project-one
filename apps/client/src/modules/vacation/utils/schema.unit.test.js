import { describe, it, expect } from 'vitest';
import { VacationSchema } from './schema';

const base = {
  employeeId: 1,
  startDate: new Date('2026-02-01'),
  endDate: new Date('2026-02-03'),
};

describe('VacationSchema reason/comments/paid (task 5.1b)', () => {
  it('accepts reason and comments within limits', () => {
    const r = VacationSchema.safeParse({
      ...base,
      reason: 'family',
      comments: 'ok',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a reason longer than 500 characters', () => {
    const r = VacationSchema.safeParse({ ...base, reason: 'a'.repeat(501) });
    expect(r.success).toBe(false);
  });

  it('rejects comments longer than 1000 characters', () => {
    const r = VacationSchema.safeParse({ ...base, comments: 'a'.repeat(1001) });
    expect(r.success).toBe(false);
  });

  it('defaults paid to true', () => {
    const r = VacationSchema.safeParse(base);
    expect(r.success && r.data.paid).toBe(true);
  });
});

describe('VacationSchema status CANCELLED (RN-VP-008)', () => {
  it('accepts CANCELLED', () => {
    const r = VacationSchema.safeParse({ ...base, status: 'CANCELLED' });
    expect(r.success).toBe(true);
  });
});
