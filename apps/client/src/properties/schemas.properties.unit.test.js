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
          startDate: fc.date({
            min: new Date('2000-01-01T00:00:00.000Z'),
            max: new Date('2100-12-31T23:59:59.999Z'),
            noInvalidDate: true,
          }),
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

/**
 * Propiedades NEGATIVAS (change `pbt-hardening`, tarea 3.1): hasta ahora sólo
 * se afirmaba que los valores válidos pasan, lo que deja pasar un schema roto
 * que acepte todo. Aquí se afirma el complemento — un valor inválido NUNCA se
 * acepta — que es el lado que realmente protege al usuario del formulario.
 */
describe('zod schema negative properties', () => {
  const validSignIn = {
    email: 'user@example.com',
    password: 'secret123',
  };

  it('signInSchema rejects passwords shorter than 6 characters', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 5 }), (password) => {
        expect(
          signInSchema.safeParse({ ...validSignIn, password }).success
        ).toBe(false);
      })
    );
  });

  it('signInSchema rejects passwords longer than 16 characters', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 17, maxLength: 40 }), (password) => {
        expect(
          signInSchema.safeParse({ ...validSignIn, password }).success
        ).toBe(false);
      })
    );
  });

  it('signInSchema rejects strings that are not an email', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z0-9]{0,12}$/), (email) => {
        expect(signInSchema.safeParse({ ...validSignIn, email }).success).toBe(
          false
        );
      })
    );
  });

  it('EmployeeSchema rejects blank mandatory fields', () => {
    const validEmployee = {
      name: 'Ana',
      lastName: 'Perez',
      dni: '12345678',
      email: 'ana@example.com',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      position: 'Dev',
      department: 'IT',
      salary: '1000',
    };

    fc.assert(
      fc.property(
        fc.constantFrom(
          'name',
          'lastName',
          'dni',
          'position',
          'department',
          'salary'
        ),
        (field) => {
          const parsed = EmployeeSchema.safeParse({
            ...validEmployee,
            [field]: '',
          });
          expect(parsed.success).toBe(false);
        }
      )
    );
  });

  it('EmployeeSchema rejects a start date that is not a Date', () => {
    fc.assert(
      fc.property(fc.string(), (startDate) => {
        const parsed = EmployeeSchema.safeParse({
          name: 'Ana',
          lastName: 'Perez',
          dni: '12345678',
          email: 'ana@example.com',
          startDate,
          position: 'Dev',
          department: 'IT',
          salary: '1000',
        });
        // Una cadena ISO no se coerciona: el schema exige `z.date()`.
        expect(parsed.success).toBe(false);
      })
    );
  });
});
