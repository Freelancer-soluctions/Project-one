import { describe, it, expect } from 'vitest';
import { EmployeeFiltersSchema } from './schema.js';

describe('EmployeeFiltersSchema — catalog filters', () => {
  it('accepts an omitted catalog filter ("all" clears it to undefined)', () => {
    expect(EmployeeFiltersSchema.safeParse({}).success).toBe(true);
  });

  it('accepts digit-only catalog ids as strings (what the selects store)', () => {
    const result = EmployeeFiltersSchema.safeParse({
      positionId: '12',
      departmentId: '3',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-numeric catalog ids', () => {
    expect(EmployeeFiltersSchema.safeParse({ positionId: 'abc' }).success).toBe(
      false
    );
    expect(
      EmployeeFiltersSchema.safeParse({ departmentId: '1; DROP' }).success
    ).toBe(false);
  });
});
