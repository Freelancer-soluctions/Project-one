import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { getSafePagination } from '../../../src/utils/pagination/pagination.js';

describe('logic properties', () => {
  it('array sort is idempotent', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (xs) => {
        const s1 = [...xs].sort((a, b) => a - b);
        const s2 = [...s1].sort((a, b) => a - b);
        expect(s2).toEqual(s1);
      })
    );
  });

  it('array sort produces non-decreasing sequence', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (xs) => {
        const s = [...xs].sort((a, b) => a - b);
        for (let i = 1; i < s.length; i++) {
          expect(s[i - 1] as number).toBeLessThanOrEqual(s[i] as number);
        }
      })
    );
  });

  it('getSafePagination: take <= MAX (100) and skip >= 0', () => {
    fc.assert(
      fc.property(
        fc.option(fc.integer()),
        fc.option(fc.integer()),
        (page, limit) => {
          const { take, skip } = getSafePagination({ page, limit });
          expect(take).toBeGreaterThan(0);
          expect(take).toBeLessThanOrEqual(100);
          expect(skip).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(skip)).toBe(true);
        }
      )
    );
  });

  it('getSafePagination: page 1 skip is 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (limit) => {
        const { skip } = getSafePagination({ page: 1, limit });
        expect(skip).toBe(0);
      })
    );
  });
});
