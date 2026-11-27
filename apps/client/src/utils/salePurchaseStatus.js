/**
 * Client-side mirrors of the sale/purchase lifecycle rules.
 *
 * Keep in sync with `apps/server/src/utils/lifecycle/salePurchase.ts`: the
 * server is the source of truth (it rejects invalid transitions with 400), and
 * these constants only drive the UI (filters, badges and allowed actions).
 */

export const SALE_STATUS_OPTIONS = ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'];

export const PURCHASE_STATUS_OPTIONS = [
  'PENDING',
  'RECEIVED',
  'PAID',
  'CANCELLED',
];

export const PAYMENT_METHOD_OPTIONS = ['CASH', 'CARD', 'TRANSFER', 'OTHER'];

/** Radix `Select` cannot use an empty string value, so "no method" gets a sentinel. */
export const NO_PAYMENT_METHOD = 'NONE';

const ALLOWED_TRANSITIONS = {
  sale: {
    PENDING: ['PAID', 'CANCELLED'],
    PAID: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
  },
  purchase: {
    PENDING: ['RECEIVED', 'CANCELLED'],
    RECEIVED: ['PAID', 'CANCELLED'],
    PAID: [],
    CANCELLED: [],
  },
};

/** Status options of a document kind (`sale` | `purchase`). */
export const getStatusOptions = (kind) =>
  kind === 'purchase' ? PURCHASE_STATUS_OPTIONS : SALE_STATUS_OPTIONS;

/** Statuses reachable from `status`; empty for terminal ones. */
export const getAllowedTransitions = (kind, status) =>
  ALLOWED_TRANSITIONS[kind]?.[status] ?? [];

/** i18n key for a status label. */
export const statusLabelKey = (status) =>
  `status_${String(status || '').toLowerCase()}`;

/**
 * i18n key for a transition button.
 *
 * Cancelling voids the document, so its label names the document
 * ("Cancel sale") instead of the bare "Cancel" used to close dialogs.
 */
export const transitionLabelKey = (kind, target) => {
  if (target === 'CANCELLED') {
    return kind === 'purchase' ? 'cancel_purchase' : 'cancel_sale';
  }
  return `status_action_${String(target || '').toLowerCase()}`;
};

/** i18n key for a payment method label. */
export const paymentMethodLabelKey = (paymentMethod) =>
  `payment_${String(paymentMethod || '').toLowerCase()}`;

/** Badge variant that matches the semantic weight of each status. */
export const statusBadgeVariant = (status) => {
  if (status === 'CANCELLED') return 'destructive';
  if (status === 'REFUNDED') return 'outline';
  if (status === 'PENDING') return 'secondary';
  return 'default';
};
