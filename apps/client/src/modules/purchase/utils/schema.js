import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const PurchaseSchema = z
  .object({
    providerId: z.string().min(1, {
      message: getZodMessage('zod.purchase.providerId.empty'),
    }),
    total: z
      .string()
      .min(1, { message: getZodMessage('zod.purchase.total.empty') })
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .int(getZodMessage('zod.purchase.total.integer'))
          .min(0, getZodMessage('zod.purchase.total.min'))
      ),
    details: z.array(
      z.object({
        productId: z.string().min(1, {
          message: getZodMessage('zod.purchase.details.productId.empty'),
        }),
        quantity: z
          .string()
          .min(1, { message: getZodMessage('zod.purchase.details.quantity.empty') })
          .transform((val) => Number(val))
          .pipe(
            z
              .number()
              .int(getZodMessage('zod.purchase.details.quantity.integer'))
              .min(1, getZodMessage('zod.purchase.details.quantity.min'))
          ),
        price: z
          .string()
          .min(1, { message: getZodMessage('zod.purchase.details.price.empty') })
          .transform((val) => Number(val))
          .pipe(
            z
              .number()
              .int(getZodMessage('zod.purchase.details.price.integer'))
              .min(0, getZodMessage('zod.purchase.details.price.min'))
          ),
      })
    ),
  })
  .passthrough();

export const PurchaseFiltersSchema = z
  .object({
    providerId: z.string().optional(),
    fromDate: z.union([z.date(), z.string()]).optional(),
    toDate: z.union([z.date(), z.string()]).optional(),
    minTotal: z.string().optional(),
    maxTotal: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.fromDate && data.toDate) {
        const from =
          data.fromDate instanceof Date
            ? data.fromDate
            : new Date(data.fromDate);
        const to =
          data.toDate instanceof Date ? data.toDate : new Date(data.toDate);
        return from <= to;
      }
      return true;
    },
    {
      message: getZodMessage('zod.purchase.fromDateAfterToDate'),
      path: ['fromDate'],
    }
  )
  .refine(
    (data) => {
      if (data.minTotal && data.maxTotal) {
        return Number(data.minTotal) <= Number(data.maxTotal);
      }
      return true;
    },
    {
      message: getZodMessage('zod.purchase.minTotalGreaterThanMaxTotal'),
      path: ['minTotal'],
    }
  );
