import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

/**
 * Client order form schema. Money arrives as Decimal strings from the API but
 * as strings from the inputs, so numbers are coerced. Precision is validated
 * with a tolerance because `value * 100` is not exact for every decimal
 * (RN-ORD-001).
 */

export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'RECEIVED',
  'COMPLETED',
  'CANCELLED',
];

const hasAtMostTwoDecimals = (value) =>
  Math.abs(Math.round(value * 100) - value * 100) < 1e-9;

const requiredNumber = (message) =>
  z.preprocess(
    (value) =>
      value === '' || value === null || value === undefined
        ? undefined
        : Number(value),
    z.number({ required_error: message })
  );

const requiredMoney = () =>
  requiredNumber(getZodMessage('zod.clientOrder.unitPrice.required'))
    .refine((value) => value >= 0, {
      message: getZodMessage('zod.clientOrder.unitPrice.invalid'),
    })
    .refine(hasAtMostTwoDecimals, {
      message: getZodMessage('zod.clientOrder.unitPrice.invalid'),
    });

export const ClientOrderDetailSchema = z.object({
  productId: requiredNumber(
    getZodMessage('zod.clientOrder.details.productId.required')
  ).refine((value) => Number.isInteger(value) && value > 0, {
    message: getZodMessage('zod.clientOrder.details.productId.required'),
  }),
  quantity: requiredNumber(
    getZodMessage('zod.clientOrder.details.quantity.required')
  ).refine((value) => Number.isInteger(value) && value >= 1, {
    message: getZodMessage('zod.clientOrder.details.quantity.min'),
  }),
  unitPrice: requiredMoney(),
});

export const ClientOrderSchema = z
  .object({
    clientId: requiredNumber(
      getZodMessage('zod.clientOrder.clientId.empty')
    ).refine((value) => Number.isInteger(value) && value > 0, {
      message: getZodMessage('zod.clientOrder.clientId.empty'),
    }),
    status: z.enum(ORDER_STATUSES).optional(),
    notes: z.string().max(500).optional(),
    expectedDeliveryDate: z.string().optional(),
    details: z.array(ClientOrderDetailSchema).min(1, {
      message: getZodMessage('zod.clientOrder.details.min'),
    }),
  })
  .passthrough();

export const ClientOrderFiltersSchema = z
  .object({
    clientId: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();
