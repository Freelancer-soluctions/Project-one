import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

/**
 * Provider order form schema. `estimatedPrice` is a Decimal string on reads
 * and a string from the inputs, so numeric fields are coerced (RN-ORD-001).
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
    z.number({ error: message })
  );

const requiredMoney = () =>
  requiredNumber(
    getZodErrorMessage('zod.providerOrder.estimatedPrice.required')
  )
    .refine((value) => value >= 0, {
      error: getZodErrorMessage('zod.providerOrder.estimatedPrice.invalid'),
    })
    .refine(hasAtMostTwoDecimals, {
      error: getZodErrorMessage('zod.providerOrder.estimatedPrice.invalid'),
    });

export const ProviderOrderDetailSchema = z.object({
  productId: requiredNumber(
    getZodErrorMessage('zod.providerOrder.details.productId.required')
  ).refine((value) => Number.isInteger(value) && value > 0, {
    error: getZodErrorMessage('zod.providerOrder.details.productId.required'),
  }),
  quantity: requiredNumber(
    getZodErrorMessage('zod.providerOrder.details.quantity.required')
  ).refine((value) => Number.isInteger(value) && value >= 1, {
    error: getZodErrorMessage('zod.providerOrder.details.quantity.min'),
  }),
  estimatedPrice: requiredMoney(),
});

export const ProviderOrderSchema = z
  .object({
    supplierId: requiredNumber(
      getZodErrorMessage('zod.providerOrder.supplierId.required')
    ).refine((value) => Number.isInteger(value) && value > 0, {
      error: getZodErrorMessage('zod.providerOrder.supplierId.required'),
    }),
    status: z.enum(ORDER_STATUSES).optional(),
    notes: z.string().max(500).optional(),
    expectedDeliveryDate: z.string().optional(),
    details: z.array(ProviderOrderDetailSchema).min(1, {
      error: getZodErrorMessage('zod.providerOrder.details.min'),
    }),
  })
  .strict();

export const ProviderOrdersFiltersSchema = z
  .object({
    supplierId: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();
