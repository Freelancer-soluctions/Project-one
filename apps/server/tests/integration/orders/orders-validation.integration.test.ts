import { describe, it, expect } from 'vitest';
import {
  clientOrderCreateSchema,
  clientOrderUpdateSchema,
} from '../../../src/modules/clientOrder/schemas/clientOrder.joi.js';
import {
  providerOrderCreateSchema,
  providerOrderUpdateSchema,
} from '../../../src/modules/providerOrder/schemas/providerOrder.joi.js';

/**
 * Order validation integration tests: the Joi layer is the API boundary, so
 * these cover the whitelist (no saleId/purchaseId), monetary precision
 * (RN-ORD-001), required detail lines (RN-ORD-008) and lifecycle values.
 */

const CLIENT_ORDER_PAYLOAD = {
  clientId: 1,
  notes: 'Deliver before noon',
  expectedDeliveryDate: '2026-12-01',
  details: [
    { productId: 1, quantity: 2, unitPrice: 5 },
    { productId: 2, quantity: 1, unitPrice: 3.5 },
  ],
};

const PROVIDER_ORDER_PAYLOAD = {
  supplierId: 1,
  details: [{ productId: 1, quantity: 2, estimatedPrice: 5 }],
};

describe('clientOrder schemas', () => {
  it('accepts a valid create payload', () => {
    const { error } = clientOrderCreateSchema.validate(CLIENT_ORDER_PAYLOAD);
    expect(error).toBeUndefined();
  });

  it('rejects empty details (RN-ORD-008)', () => {
    const { error } = clientOrderCreateSchema.validate({
      ...CLIENT_ORDER_PAYLOAD,
      details: [],
    });
    expect(error).toBeDefined();
    expect(error!.details[0]!.path).toContain('details');
  });

  it('rejects a unit price with more than 2 decimals (RN-ORD-001)', () => {
    const { error } = clientOrderCreateSchema.validate({
      ...CLIENT_ORDER_PAYLOAD,
      details: [{ productId: 1, quantity: 1, unitPrice: 10.123 }],
    });
    expect(error).toBeDefined();
    expect(error!.details[0]!.path).toEqual(['details', 0, 'unitPrice']);
  });

  it('rejects quantity below 1', () => {
    const { error } = clientOrderCreateSchema.validate({
      ...CLIENT_ORDER_PAYLOAD,
      details: [{ productId: 1, quantity: 0, unitPrice: 10 }],
    });
    expect(error).toBeDefined();
  });

  it('rejects saleId on create (conversion-only field)', () => {
    const { error } = clientOrderCreateSchema.validate({
      ...CLIENT_ORDER_PAYLOAD,
      saleId: 7,
    });
    expect(error).toBeDefined();
    expect(error!.details[0]!.type).toBe('object.unknown');
  });

  it('rejects saleId on update (conversion-only field)', () => {
    const { error } = clientOrderUpdateSchema.validate({ saleId: 7 });
    expect(error).toBeDefined();
    expect(error!.details[0]!.type).toBe('object.unknown');
  });

  it('accepts a partial update without details', () => {
    const { error } = clientOrderUpdateSchema.validate({
      status: 'PROCESSING',
    });
    expect(error).toBeUndefined();
  });

  it('rejects an unknown status value', () => {
    const { error } = clientOrderUpdateSchema.validate({ status: 'DELIVERED' });
    expect(error).toBeDefined();
  });
});

describe('providerOrder schemas', () => {
  it('accepts a valid create payload', () => {
    const { error } = providerOrderCreateSchema.validate(
      PROVIDER_ORDER_PAYLOAD
    );
    expect(error).toBeUndefined();
  });

  it('rejects an estimated price with more than 2 decimals (RN-ORD-001)', () => {
    const { error } = providerOrderCreateSchema.validate({
      ...PROVIDER_ORDER_PAYLOAD,
      details: [{ productId: 1, quantity: 1, estimatedPrice: 1.999 }],
    });
    expect(error).toBeDefined();
    expect(error!.details[0]!.path).toEqual(['details', 0, 'estimatedPrice']);
  });

  it('rejects purchaseId on create (conversion-only field)', () => {
    const { error } = providerOrderCreateSchema.validate({
      ...PROVIDER_ORDER_PAYLOAD,
      purchaseId: 3,
    });
    expect(error).toBeDefined();
    expect(error!.details[0]!.type).toBe('object.unknown');
  });

  it('rejects purchaseId on update (conversion-only field)', () => {
    const { error } = providerOrderUpdateSchema.validate({ purchaseId: 3 });
    expect(error).toBeDefined();
    expect(error!.details[0]!.type).toBe('object.unknown');
  });
});
