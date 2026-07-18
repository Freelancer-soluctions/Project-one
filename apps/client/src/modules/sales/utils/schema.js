import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const SaleSchema = z
  .object({
    clientId: z.string().min(1, {
      message: getZodMessage('zod.sales.clientId.empty'),
    }),
    total: z
      .string()
      .min(1, { message: getZodMessage('zod.sales.total.empty') })
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .int(getZodMessage('zod.sales.total.integer'))
          .min(0, getZodMessage('zod.sales.total.min'))
      ),
    details: z.array(
      z.object({
        productId: z.string().min(1, {
          message: getZodMessage('zod.sales.details.productId.empty'),
        }),
        quantity: z
          .string()
          .min(1, { message: getZodMessage('zod.sales.details.quantity.empty') })
          .transform((val) => Number(val))
          .pipe(
            z
              .number()
              .int(getZodMessage('zod.sales.details.quantity.integer'))
              .min(1, getZodMessage('zod.sales.details.quantity.min'))
          ),
        price: z
          .string()
          .min(1, { message: getZodMessage('zod.sales.details.price.empty') })
          .transform((val) => Number(val))
          .pipe(
            z
              .number()
              .int(getZodMessage('zod.sales.details.price.integer'))
              .min(0, getZodMessage('zod.sales.details.price.min'))
          ),
      })
    ),
  })
  .passthrough(); // Permite otros campos

export const SalesFiltersSchema = z
  .object({
    clientId: z.string().optional(),
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
      message: getZodMessage('zod.sales.fromDateAfterToDate'),
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
      message: getZodMessage('zod.sales.minTotalGreaterThanMaxTotal'),
      path: ['minTotal'],
    }
  );
