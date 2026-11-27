import { Prisma } from '../../config/db.js';
import ClientError from '../../utils/responses&Errors/errors.js';

/**
 * Shared order lifecycle rules for `clientOrder` and `providerOrder`
 * (RN-ORD-002/003/010/011).
 */

export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'RECEIVED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

/**
 * Forward-only lifecycle. Any non-terminal state can be cancelled; COMPLETED
 * and CANCELLED are terminal.
 */
const ALLOWED_TRANSITIONS: Record<
  OrderStatusValue,
  readonly OrderStatusValue[]
> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Statuses that stamp `deliveredOn` when reached (RN-ORD-005). */
export const DELIVERED_STATUSES: readonly OrderStatusValue[] = [
  'RECEIVED',
  'COMPLETED',
];

/**
 * Validates an order status transition (RN-ORD-010/011).
 *
 * Re-sending the current status is a no-op, not a transition.
 *
 * @param {OrderStatusValue} from - Current persisted status.
 * @param {OrderStatusValue} to - Requested target status.
 * @returns {void}
 * @throws {ClientError} 400 when the transition is not in `ALLOWED_TRANSITIONS`.
 */
export const assertValidStatusTransition = (
  from: OrderStatusValue,
  to: OrderStatusValue
): void => {
  if (from === to) return;

  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new ClientError(
      `Invalid status transition from ${from} to ${to}`,
      400
    );
  }
};

/** Detail line shape accepted by `computeDetailsTotal`. */
export interface PricedDetailLine {
  quantity: number | string;
  price: number | string;
}

/**
 * Sums `price * quantity` using Prisma Decimal arithmetic so the persisted
 * total never drifts from the stored Decimal(18,2) line values (RN-ORD-002).
 *
 * @param {readonly PricedDetailLine[]} details - Detail lines with `price` and `quantity`.
 * @returns {Prisma.Decimal} Total with exact base-10 arithmetic (zero for an empty list).
 */
export const computeDetailsTotal = (
  details: readonly PricedDetailLine[]
): Prisma.Decimal =>
  details.reduce(
    (total, line) =>
      total.plus(new Prisma.Decimal(line.price).mul(Number(line.quantity))),
    new Prisma.Decimal(0)
  );
