import ClientError from '../responses&Errors/errors.js';

/**
 * Lifecycle rules shared by `sale` and `purchase` (capability
 * `sale-purchase-status`, RN-SP-001..RN-SP-005).
 *
 * `sale` and `purchase` do NOT reuse `orderStatus`: SHIPPED/RECEIVED make no
 * sense for a sale and a purchase never ships (design D1).
 */

export const SALE_STATUSES = [
  'PENDING',
  'PAID',
  'CANCELLED',
  'REFUNDED',
] as const;

export type SaleStatusValue = (typeof SALE_STATUSES)[number];

export const PURCHASE_STATUSES = [
  'PENDING',
  'RECEIVED',
  'PAID',
  'CANCELLED',
] as const;

export type PurchaseStatusValue = (typeof PURCHASE_STATUSES)[number];

export const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER', 'OTHER'] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

/**
 * PENDING can be collected or dropped; a collected sale can only be refunded.
 * CANCELLED and REFUNDED are terminal (RN-SP-001).
 */
const SALE_ALLOWED_TRANSITIONS: Record<
  SaleStatusValue,
  readonly SaleStatusValue[]
> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

/**
 * A purchase is received then paid, and can be cancelled until it is paid.
 * CANCELLED is terminal (RN-SP-003/RN-SP-004).
 */
const PURCHASE_ALLOWED_TRANSITIONS: Record<
  PurchaseStatusValue,
  readonly PurchaseStatusValue[]
> = {
  PENDING: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

/**
 * Validates a sale status transition (RN-SP-002).
 *
 * Re-sending the current status is an idempotent no-op, not a transition, so a
 * repeated cancel never writes a second compensating movement.
 *
 * @param {SaleStatusValue} from - Current persisted status.
 * @param {SaleStatusValue} to - Requested target status.
 * @returns {void}
 * @throws {ClientError} 400 when the transition is not allowed.
 */
export const assertValidSaleTransition = (
  from: SaleStatusValue,
  to: SaleStatusValue
): void => {
  if (from === to) return;

  if (!SALE_ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new ClientError(
      `Invalid sale status transition from ${from} to ${to}`,
      400
    );
  }
};

/**
 * Validates a purchase status transition (RN-SP-002).
 *
 * @param {PurchaseStatusValue} from - Current persisted status.
 * @param {PurchaseStatusValue} to - Requested target status.
 * @returns {void}
 * @throws {ClientError} 400 when the transition is not allowed.
 */
export const assertValidPurchaseTransition = (
  from: PurchaseStatusValue,
  to: PurchaseStatusValue
): void => {
  if (from === to) return;

  if (!PURCHASE_ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new ClientError(
      `Invalid purchase status transition from ${from} to ${to}`,
      400
    );
  }
};

/**
 * Direction a movement has to take to undo the original one when its document
 * is cancelled (RN-SP-007). `ADJUSTMENT` rows are already manual corrections
 * and are never reversed.
 *
 * @param {string} type - Original `movementType`.
 * @returns {'ENTRY' | 'EXIT' | 'ADJUSTMENT'} Compensating direction.
 */
export const compensatingDirection = (
  type: string
): 'ENTRY' | 'EXIT' | 'ADJUSTMENT' => {
  if (type === 'EXIT') return 'ENTRY';
  if (type === 'ENTRY') return 'EXIT';
  return 'ADJUSTMENT';
};
