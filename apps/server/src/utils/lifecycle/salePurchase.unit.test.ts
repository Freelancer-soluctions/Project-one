import { describe, it, expect } from 'vitest';

import {
  assertValidPurchaseTransition,
  assertValidSaleTransition,
  compensatingDirection,
} from './salePurchase.js';

describe('sale status lifecycle (RN-SP-001/RN-SP-002)', () => {
  it('allows PENDING -> PAID', () => {
    expect(() => assertValidSaleTransition('PENDING', 'PAID')).not.toThrow();
  });

  it('allows PENDING -> CANCELLED', () => {
    expect(() =>
      assertValidSaleTransition('PENDING', 'CANCELLED')
    ).not.toThrow();
  });

  it('allows PAID -> REFUNDED', () => {
    expect(() => assertValidSaleTransition('PAID', 'REFUNDED')).not.toThrow();
  });

  it('treats a repeated status as an idempotent no-op', () => {
    expect(() => assertValidSaleTransition('PAID', 'PAID')).not.toThrow();
    expect(() =>
      assertValidSaleTransition('CANCELLED', 'CANCELLED')
    ).not.toThrow();
  });

  it('rejects CANCELLED -> PAID with 400', () => {
    expect(() => assertValidSaleTransition('CANCELLED', 'PAID')).toThrowError(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  it('rejects PAID -> PENDING with 400', () => {
    expect(() => assertValidSaleTransition('PAID', 'PENDING')).toThrowError(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  it('keeps REFUNDED terminal', () => {
    expect(() => assertValidSaleTransition('REFUNDED', 'PENDING')).toThrowError(
      expect.objectContaining({ statusCode: 400 })
    );
    expect(() => assertValidSaleTransition('REFUNDED', 'PAID')).toThrowError(
      expect.objectContaining({ statusCode: 400 })
    );
  });
});

describe('purchase status lifecycle (RN-SP-003/RN-SP-004)', () => {
  it('allows PENDING -> RECEIVED -> PAID', () => {
    expect(() =>
      assertValidPurchaseTransition('PENDING', 'RECEIVED')
    ).not.toThrow();
    expect(() =>
      assertValidPurchaseTransition('RECEIVED', 'PAID')
    ).not.toThrow();
  });

  it('allows cancellation from PENDING and from RECEIVED', () => {
    expect(() =>
      assertValidPurchaseTransition('PENDING', 'CANCELLED')
    ).not.toThrow();
    expect(() =>
      assertValidPurchaseTransition('RECEIVED', 'CANCELLED')
    ).not.toThrow();
  });

  it('treats a repeated status as an idempotent no-op', () => {
    expect(() =>
      assertValidPurchaseTransition('CANCELLED', 'CANCELLED')
    ).not.toThrow();
  });

  it('rejects PAID -> CANCELLED with 400', () => {
    expect(() =>
      assertValidPurchaseTransition('PAID', 'CANCELLED')
    ).toThrowError(expect.objectContaining({ statusCode: 400 }));
  });

  it('rejects CANCELLED -> RECEIVED with 400', () => {
    expect(() =>
      assertValidPurchaseTransition('CANCELLED', 'RECEIVED')
    ).toThrowError(expect.objectContaining({ statusCode: 400 }));
  });

  it('rejects RECEIVED -> PENDING with 400', () => {
    expect(() =>
      assertValidPurchaseTransition('RECEIVED', 'PENDING')
    ).toThrowError(expect.objectContaining({ statusCode: 400 }));
  });
});

describe('compensatingDirection (RN-SP-007)', () => {
  it('reverses a sale EXIT with an ENTRY', () => {
    expect(compensatingDirection('EXIT')).toBe('ENTRY');
  });

  it('reverses a purchase ENTRY with an EXIT', () => {
    expect(compensatingDirection('ENTRY')).toBe('EXIT');
  });

  it('marks non-directional movements as ADJUSTMENT', () => {
    expect(compensatingDirection('TRANSFERENCE')).toBe('ADJUSTMENT');
    expect(compensatingDirection('ADJUSTMENT')).toBe('ADJUSTMENT');
  });
});
