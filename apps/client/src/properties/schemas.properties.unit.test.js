import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { signInSchema } from '@/modules/auth/utils/schema';
import { EmployeeSchema } from '@/modules/employees/utils/schema';

describe('zod schema properties', () => {
  it('signInSchema accepts generated valid values', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc
            .string({ minLength: 1, maxLength: 10 })
            .map(
              (s) => (s.replace(/[^a-zA-Z0-9]/g, '') || 'test') + '@example.com'
            ),
          password: fc.string({ minLength: 6, maxLength: 16 }),
        }),
        (cand) => {
          expect(signInSchema.safeParse(cand).success).toBe(true);
        }
      )
    );
  });

  it('EmployeeSchema accepts generated valid values', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1 }),
          lastName: fc.string({ minLength: 1 }),
          dni: fc.string({ minLength: 1 }),
          email: fc
            .string({ minLength: 1, maxLength: 10 })
            .map(
              (s) => (s.replace(/[^a-zA-Z0-9]/g, '') || 'test') + '@example.com'
            ),
          phone: fc.option(fc.string(), { nil: undefined }),
          address: fc.option(fc.string(), { nil: undefined }),
          startDate: fc.date(),
          position: fc.string({ minLength: 1 }),
          department: fc.string({ minLength: 1 }),
          salary: fc.string({ minLength: 1 }),
        }),
        (cand) => {
          const parsed = EmployeeSchema.safeParse(cand);
          expect(parsed.success).toBe(true);
        }
      )
    );
  });
});
