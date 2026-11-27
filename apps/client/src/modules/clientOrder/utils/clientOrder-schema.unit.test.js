import { describe, it, expect } from 'vitest';
import { ClientOrderSchema } from './index';
import { ProviderOrderSchema } from '@/modules/providerOrder/utils';

/**
 * Client-side mirror of the server constraints: at least one detail line,
 * quantity >= 1 and money with at most 2 decimals (RN-ORD-001/008).
 */

const VALID_DETAIL = { productId: 1, quantity: 2, unitPrice: 5 };

describe('ClientOrderSchema', () => {
  it('accepts a payload with one detail line', () => {
    const result = ClientOrderSchema.safeParse({
      clientId: 1,
      status: 'PENDING',
      notes: '',
      expectedDeliveryDate: '',
      details: [VALID_DETAIL],
    });
    expect(result.success).toBe(true);
  });

  it('coerces numeric strings coming from the inputs', () => {
    const result = ClientOrderSchema.safeParse({
      clientId: '1',
      details: [{ productId: '2', quantity: '3', unitPrice: '10.50' }],
    });
    expect(result.success).toBe(true);
    expect(result.data?.details[0]).toEqual({
      productId: 2,
      quantity: 3,
      unitPrice: 10.5,
    });
  });

  it('rejects empty details (RN-ORD-008)', () => {
    const result = ClientOrderSchema.safeParse({
      clientId: 1,
      details: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a quantity below 1', () => {
    const result = ClientOrderSchema.safeParse({
      clientId: 1,
      details: [{ ...VALID_DETAIL, quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a unit price with more than 2 decimals (RN-ORD-001)', () => {
    const result = ClientOrderSchema.safeParse({
      clientId: 1,
      details: [{ ...VALID_DETAIL, unitPrice: 10.123 }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts an exact 2-decimal price', () => {
    const result = ClientOrderSchema.safeParse({
      clientId: 1,
      details: [{ ...VALID_DETAIL, unitPrice: 10.1 }],
    });
    expect(result.success).toBe(true);
  });
});

describe('ProviderOrderSchema', () => {
  it('accepts a payload with one detail line', () => {
    const result = ProviderOrderSchema.safeParse({
      supplierId: 1,
      details: [{ productId: 1, quantity: 2, estimatedPrice: 5 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an estimated price with more than 2 decimals', () => {
    const result = ProviderOrderSchema.safeParse({
      supplierId: 1,
      details: [{ productId: 1, quantity: 1, estimatedPrice: 1.999 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty details array', () => {
    const result = ProviderOrderSchema.safeParse({
      supplierId: 1,
      details: [],
    });
    expect(result.success).toBe(false);
  });
});
