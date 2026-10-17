import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

describe('smoke properties', () => {
  it('addition commutativity', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 1_000_000n }),
        fc.bigInt({ min: 0n, max: 1_000_000n }),
        (a, b) => {
          expect(a + b).toBe(b + a);
        }
      )
    );
  });
});
