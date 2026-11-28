import { describe, it, expect } from 'vitest';
import { PermissionSchema } from './schema';

const base = {
  employeeId: 1,
  type: 'SICK',
  startDate: new Date('2026-02-01'),
  endDate: new Date('2026-02-02'),
  reason: 'doctor',
};

describe('PermissionSchema status (task 5.2b, RN-VP-008)', () => {
  it('accepts CANCELLED', () => {
    expect(
      PermissionSchema.safeParse({ ...base, status: 'CANCELLED' }).success
    ).toBe(true);
  });

  it('defaults paid to true', () => {
    const r = PermissionSchema.safeParse(base);
    expect(r.success && r.data.paid).toBe(true);
  });
});
