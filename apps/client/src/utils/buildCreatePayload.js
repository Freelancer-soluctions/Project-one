import { NO_PAYMENT_METHOD } from './salePurchaseStatus';

/**
 * Builds a sale/purchase create payload with only the keys the endpoint
 * accepts.
 *
 * The API validates the body with a strict whitelist (`allowUnknown: false`),
 * so audit fields the form state keeps for edit mode (`createdOn`, `updatedOn`,
 * user names) must not be sent. The payment-method sentinel is also dropped.
 *
 * @param {Object} data - Form values.
 * @param {'clientId'|'providerId'} ownerKey - Document owner field.
 * @returns {Object} Create payload.
 */
export const buildCreatePayload = (data, ownerKey) => ({
  [ownerKey]: data[ownerKey],
  total: data.total,
  details: data.details,
  ...(data.paymentMethod &&
    data.paymentMethod !== NO_PAYMENT_METHOD && {
      paymentMethod: data.paymentMethod,
    }),
  ...(data.invoiceNumber && { invoiceNumber: data.invoiceNumber }),
});
