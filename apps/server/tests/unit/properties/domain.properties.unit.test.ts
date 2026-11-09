import fc from 'fast-check';
import type Joi from 'joi';
import { describe, expect, it } from 'vitest';
import {
  stockCreateSchema,
  stockUpdateSchema,
} from '../../../src/modules/stock/schemas/stock.joi.js';
import {
  attendanceCreateSchema,
  attendanceUpdateSchema,
} from '../../../src/modules/attendance/schemas/attendance.joi.js';

/**
 * Invariantes de DOMINIO como propiedades (change `pbt-hardening`, tareas 1.1,
 * 1.2 y 3.1).
 *
 * A diferencia de `schemas.properties.unit.test.ts`, que sólo comprueba que los
 * valores generados como válidos son aceptados, aquí se afirma el invariante
 * del dominio sobre CUALQUIER candidato: si el schema lo acepta, el resultado no
 * puede violar la regla de negocio (stock nunca negativo, horas trabajadas
 * siempre positivas). El generador cubre valores fuera de rango a propósito,
 * para que se ejerciten las dos ramas (aceptado / rechazado).
 *
 * Alcance de idempotencia de asistencia (tarea 1.2): `attendance/service.ts` no
 * implementa idempotencia de check-in/check-out (no hay clave de deduplicación
 * ni guard de "ya fichado"), y añadirla es trabajo de servicio fuera del alcance
 * de este change. La tarea se acota a lo que el SUT real garantiza hoy: los
 * invariantes de los schemas de asistencia.
 */

const validate = (schema: Joi.ObjectSchema, candidate: unknown) =>
  schema.validate(candidate, { convert: true, stripUnknown: true });

const stockCandidate = (
  quantity: number,
  minimum: number,
  maximum: number | null = null
) => ({
  quantity,
  minimum,
  maximum,
  lot: '',
  unitMeasure: 'PIECES',
  expirationDate: null,
  productId: 1,
  warehouseId: 1,
});

const attendanceCandidate = ({
  employeeId = 1,
  date = new Date('2026-01-15T00:00:00.000Z'),
  entryTime = '08:00',
  exitTime = '17:00',
  workedHours = 9,
} = {}) => ({ employeeId, date, entryTime, exitTime, workedHours });

const shockValues = fc.integer({ min: -1000, max: 1000 });
const optionalShockValues: fc.Arbitrary<number | null> = fc.option(
  shockValues,
  { nil: null }
);

describe('stock domain invariants', () => {
  it('accepted create payloads never carry negative stock', () => {
    fc.assert(
      fc.property(
        shockValues,
        shockValues,
        optionalShockValues,
        (quantity, minimum, maximum) => {
          const { error, value } = validate(
            stockCreateSchema,
            stockCandidate(quantity, minimum, maximum)
          );
          if (error) return; // rechazado: el dominio queda protegido igual

          expect(value.quantity).toBeGreaterThanOrEqual(0);
          expect(value.minimum).toBeGreaterThanOrEqual(0);
          expect(value.maximum === null || value.maximum >= 0).toBe(true);
        }
      ),
      {
        // Valores frontera fijados como regresión (tarea 6.5).
        examples: [
          [0, 0, null],
          [1, 0, 10],
          [Number.MAX_SAFE_INTEGER, 0, null],
        ],
      }
    );
  });

  it('accepted update patches never introduce negative stock', () => {
    fc.assert(
      fc.property(shockValues, shockValues, (quantity, minimum) => {
        const { error, value } = validate(stockUpdateSchema, {
          quantity,
          minimum,
        });
        if (error) return;

        expect(value.quantity).toBeGreaterThanOrEqual(0);
        expect(value.minimum).toBeGreaterThanOrEqual(0);
      })
    );
  });

  it('rejects negative quantity and negative minimum', () => {
    fc.assert(
      fc.property(
        fc.integer({ max: -1 }),
        fc.constantFrom('quantity', 'minimum'),
        (negative, field) => {
          const candidate = {
            ...stockCandidate(0, 0),
            [field]: negative,
          };
          expect(validate(stockCreateSchema, candidate).error).toBeDefined();
          expect(
            validate(stockUpdateSchema, { [field]: negative }).error
          ).toBeDefined();
        }
      )
    );
  });

  it('rejects an empty update patch (no-op PATCH)', () => {
    expect(validate(stockUpdateSchema, {}).error).toBeDefined();
  });
});

describe('attendance domain invariants (schema scope)', () => {
  it('accepted records always have positive worked hours and bounded times', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.string({ maxLength: 10 }),
        fc.string({ maxLength: 10 }),
        (employeeId, workedHours, entryTime, exitTime) => {
          const { error, value } = validate(
            attendanceCreateSchema,
            attendanceCandidate({
              employeeId,
              workedHours,
              entryTime,
              exitTime,
            })
          );
          if (error) return;

          expect(value.workedHours).toBeGreaterThan(0);
          expect(String(value.entryTime).length).toBeLessThanOrEqual(5);
          expect(String(value.exitTime).length).toBeLessThanOrEqual(5);
          expect(Number.isInteger(value.employeeId)).toBe(true);
        }
      ),
      { examples: [[1, 9, '08:00', '17:00']] }
    );
  });

  it('rejects non-positive worked hours', () => {
    fc.assert(
      fc.property(fc.double({ min: -100, max: 0, noNaN: true }), (hours) => {
        const { error } = validate(
          attendanceCreateSchema,
          attendanceCandidate({ workedHours: hours })
        );
        expect(error).toBeDefined();
      })
    );
  });

  it('rejects times longer than the stored 5-character format', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 6, maxLength: 20 }), (time) => {
        expect(
          validate(
            attendanceCreateSchema,
            attendanceCandidate({ entryTime: time })
          ).error
        ).toBeDefined();
        expect(
          validate(
            attendanceCreateSchema,
            attendanceCandidate({ exitTime: time })
          ).error
        ).toBeDefined();
      })
    );
  });

  it('rejects an empty update patch (no-op PATCH)', () => {
    expect(validate(attendanceUpdateSchema, {}).error).toBeDefined();
  });
});
