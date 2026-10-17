import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

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
          expect(s[i - 1]).toBeLessThanOrEqual(s[i]);
        }
      })
    );
  });

  it('pagination: union equals input without overlap issues conceptually', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer()),
        fc.integer({ min: 1, max: 50 }),
        (xs, size) => {
          const pages = [];
          for (let i = 0; i < xs.length; i += size) {
            pages.push(xs.slice(i, i + size));
          }
          const flat = pages.flat();
          expect(flat).toEqual(xs);
          expect(pages.every((p) => p.length <= size)).toBe(true);
        }
      )
    );
  });
});
