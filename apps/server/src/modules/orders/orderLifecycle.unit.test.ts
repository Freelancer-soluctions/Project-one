import { describe, it, expect } from 'vitest';
import {
  assertValidStatusTransition,
  computeDetailsTotal,
} from './orderLifecycle.js';
import ClientError from '../../utils/responses&Errors/errors.js';

describe('computeDetailsTotal (RN-ORD-002/003)', () => {
  it('sums price * quantity with exact decimal arithmetic', () => {
    const total = computeDetailsTotal([
      { quantity: 2, price: 5 },
      { quantity: 1, price: 3.5 },
    ]);

    expect(total.toFixed(2)).toBe('13.50');
  });

  it('does not accumulate binary floating point error', () => {
    const total = computeDetailsTotal([
      { quantity: 1, price: 0.1 },
      { quantity: 2, price: 0.2 },
    ]);

    expect(total.toFixed(2)).toBe('0.50');
  });

  it('accepts Decimal strings coming from the API', () => {
    const total = computeDetailsTotal([{ quantity: '3', price: '10.25' }]);

    expect(total.toFixed(2)).toBe('30.75');
  });

  it('returns zero for an empty list', () => {
    expect(computeDetailsTotal([]).toFixed(2)).toBe('0.00');
  });
});

describe('assertValidStatusTransition (RN-ORD-010/011)', () => {
  it.each([
    ['PENDING', 'PROCESSING'],
    ['PROCESSING', 'SHIPPED'],
    ['SHIPPED', 'RECEIVED'],
    ['RECEIVED', 'COMPLETED'],
    ['PENDING', 'CANCELLED'],
    ['PROCESSING', 'CANCELLED'],
    ['SHIPPED', 'CANCELLED'],
    ['RECEIVED', 'CANCELLED'],
  ] as const)('allows %s -> %s', (from, to) => {
    expect(() => assertValidStatusTransition(from, to)).not.toThrow();
  });

  it('treats re-sending the current status as a no-op', () => {
    expect(() =>
      assertValidStatusTransition('PENDING', 'PENDING')
    ).not.toThrow();
  });

  /** Returns the thrown error (or undefined) so assertions stay linear. */
  const captureTransitionError = (
    from: Parameters<typeof assertValidStatusTransition>[0],
    to: Parameters<typeof assertValidStatusTransition>[1]
  ): unknown => {
    try {
      assertValidStatusTransition(from, to);
    } catch (error) {
      return error;
    }
    return undefined;
  };

  it.each([
    ['PENDING', 'COMPLETED'],
    ['PENDING', 'SHIPPED'],
    ['COMPLETED', 'CANCELLED'],
    ['CANCELLED', 'PENDING'],
    ['SHIPPED', 'PROCESSING'],
  ] as const)('rejects %s -> %s with 400', (from, to) => {
    const error = captureTransitionError(from, to);

    expect(error).toBeInstanceOf(ClientError);
    expect((error as ClientError).statusCode).toBe(400);
  });
});
