import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  stockCreateSchema,
  stockUpdateSchema,
} from '../../../src/modules/stock/schemas/stock.joi.js';
import { attendanceCreateSchema } from '../../../src/modules/attendance/schemas/attendance.joi.js';

describe('Joi schema properties', () => {
  it('stockCreateSchema accepts generated valid values', () => {
    fc.assert(
      fc.property(
        fc.record({
          quantity: fc.integer({ min: 0 }),
          minimum: fc.integer({ min: 0 }),
          maximum: fc.option(fc.integer({ min: 0 }), { nil: null }),
          lot: fc.option(fc.string({ maxLength: 50 }), { nil: '' }),
          unitMeasure: fc.oneof(
            fc.constant('PIECES'),
            fc.constant('KILOGRAMS'),
            fc.constant('LITERS'),
            fc.constant('METERS')
          ),
          expirationDate: fc.option(
            fc
              .integer({ min: 0, max: 4102444800000 })
              .map((ts) => new Date(ts)),
            { nil: null }
          ),
          productId: fc.integer(),
          warehouseId: fc.integer(),
        }),
        (cand) => {
          const { value } = stockCreateSchema.validate(cand, {
            convert: true,
            stripUnknown: true,
          });
          expect(stockCreateSchema.validate(value).error).toBeUndefined();
        }
      )
    );
  });

  it('stockUpdateSchema accepts generated valid values', () => {
    fc.assert(
      fc.property(
        fc.record({
          quantity: fc.option(fc.integer({ min: 0 }), { nil: undefined }),
          minimum: fc.option(fc.integer({ min: 0 }), { nil: undefined }),
          maximum: fc.option(fc.integer({ min: 0 }), { nil: null }),
          lot: fc.option(fc.string({ maxLength: 50 }), { nil: '' }),
          unitMeasure: fc.oneof(
            fc.constant('PIECES'),
            fc.constant('KILOGRAMS'),
            fc.constant('LITERS'),
            fc.constant('METERS')
          ),
          expirationDate: fc.option(
            fc
              .integer({ min: 0, max: 4102444800000 })
              .map((ts) => new Date(ts)),
            { nil: null }
          ),
          productId: fc.option(fc.integer(), { nil: undefined }),
          warehouseId: fc.option(fc.integer(), { nil: undefined }),
        }),
        (cand) => {
          const filtered = Object.fromEntries(
            Object.entries(cand).filter(([, v]) => v !== undefined)
          );
          if (Object.keys(filtered).length === 0) {
            // Skip empty objects since stockUpdateSchema requires min(1)
            return true;
          }
          const { value } = stockUpdateSchema.validate(cand, {
            convert: true,
            stripUnknown: true,
          });
          expect(stockUpdateSchema.validate(value).error).toBeUndefined();
        }
      )
    );
  });

  it('attendanceCreateSchema accepts generated valid values', () => {
    fc.assert(
      fc.property(
        fc.record({
          employeeId: fc.integer(),
          date: fc.date({ min: new Date(0), max: new Date('2100-01-01') }),
          entryTime: fc.string({ minLength: 1, maxLength: 5 }),
          exitTime: fc.string({ minLength: 1, maxLength: 5 }),
          workedHours: fc.float({
            min: Math.fround(0.01),
            max: Math.fround(1000),
            noNaN: true,
          }),
        }),
        (cand) => {
          const { value } = attendanceCreateSchema.validate(cand, {
            convert: true,
            stripUnknown: true,
          });
          expect(attendanceCreateSchema.validate(value).error).toBeUndefined();
        }
      )
    );
  });
});
