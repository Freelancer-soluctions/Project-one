import { describe, it, expect } from 'vitest';
import { buildCreatePayload } from './buildCreatePayload';

describe('buildCreatePayload', () => {
  it('keeps only the fields the create endpoint accepts', () => {
    const payload = buildCreatePayload(
      {
        clientId: '3',
        total: 10,
        details: [{ productId: 1, quantity: 2, price: 5 }],
        paymentMethod: 'CASH',
        invoiceNumber: 'FAC-1',
        // Audit fields kept in the form state for edit mode.
        createdOn: '',
        updatedOn: '',
        userSaleCreatedName: 'someone',
      },
      'clientId'
    );

    expect(payload).toEqual({
      clientId: '3',
      total: 10,
      details: [{ productId: 1, quantity: 2, price: 5 }],
      paymentMethod: 'CASH',
      invoiceNumber: 'FAC-1',
    });
  });

  it('omits the empty payment sentinel and the blank invoice', () => {
    const payload = buildCreatePayload(
      {
        providerId: '1',
        total: 5,
        details: [],
        paymentMethod: 'NONE',
        invoiceNumber: '',
        userPurchaseCreated: '',
      },
      'providerId'
    );

    expect(payload).toEqual({ providerId: '1', total: 5, details: [] });
  });
});
