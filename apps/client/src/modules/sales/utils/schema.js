import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

export const SaleSchema = z
  .object({
    clientId: z.string().min(1, {
      error: getZodErrorMessage('zod.sales.clientId.empty'),
    }),
    total: z
      .string()
      .min(1, { error: getZodErrorMessage('zod.sales.total.empty') })
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .int({ error: getZodErrorMessage('zod.sales.total.integer') })
          .min(0, { error: getZodErrorMessage('zod.sales.total.min') })
      ),
    paymentMethod: z.string().optional(),
    invoiceNumber: z.string().max(50).optional(),
    details: z.array(
      z.object({
        productId: z.string().min(1, {
          error: getZodErrorMessage('zod.sales.details.productId.empty'),
        }),
        quantity: z
          .string()
          .min(1, {
            error: getZodErrorMessage('zod.sales.details.quantity.empty'),
          })
          .transform((val) => Number(val))
          .pipe(
            z
              .number()
              .int({
                error: getZodErrorMessage('zod.sales.details.quantity.integer'),
              })
              .min(1, {
                error: getZodErrorMessage('zod.sales.details.quantity.min'),
              })
          ),
        price: z
          .string()
          .min(1, {
            error: getZodErrorMessage('zod.sales.details.price.empty'),
          })
          .transform((val) => Number(val))
          .pipe(
            z
              .number()
              .int({
                error: getZodErrorMessage('zod.sales.details.price.integer'),
              })
              .min(0, {
                error: getZodErrorMessage('zod.sales.details.price.min'),
              })
          ),
      })
    ),
  })
  .passthrough(); // Permite otros campos

export const SalesFiltersSchema = z
  .object({
    clientId: z.string().optional(),
    status: z.string().optional(),
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
      error: getZodErrorMessage('zod.sales.fromDateAfterToDate'),
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
      error: getZodErrorMessage('zod.sales.minTotalGreaterThanMaxTotal'),
      path: ['minTotal'],
    }
  );
