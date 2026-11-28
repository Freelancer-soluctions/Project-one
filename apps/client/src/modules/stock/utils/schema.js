import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

export const StockSchema = z
  .object({
    quantity: z
      .string()
      .min(1, { error: getZodErrorMessage('zod.stock.quantity.empty') })
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .int({ error: getZodErrorMessage('zod.stock.quantity.integer') })
          .min(0, { error: getZodErrorMessage('zod.stock.quantity.min') })
      ),

    minimum: z
      .string()
      .min(1, { error: getZodErrorMessage('zod.stock.minimum.empty') })
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .int({ error: getZodErrorMessage('zod.stock.minimum.integer') })
          .min(0, { error: getZodErrorMessage('zod.stock.minimum.min') })
      ),
    maximum: z
      .string()
      .min(1, { error: getZodErrorMessage('zod.stock.maximum.empty') })
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .int({ error: getZodErrorMessage('zod.stock.maximum.integer') })
          .min(0, { error: getZodErrorMessage('zod.stock.maximum.min') })
      ),
    lot: z
      .string()
      .max(50, { error: getZodErrorMessage('zod.stock.lot.maxLength') })
      .optional()
      .nullable(),
    unitMeasure: z
      .string()
      .min(1, { error: getZodErrorMessage('zod.stock.unitMeasure.empty') })
      .refine(
        (val) => ['PIECES', 'KILOGRAMS', 'LITERS', 'METERS'].includes(val),
        {
          error: getZodErrorMessage('zod.stock.unitMeasure.invalid'),
        }
      ),
    expirationDate: z
      .date()
      .nullable()
      .optional()
      .refine((date) => !date || !isNaN(date.getTime()), {
        error: getZodErrorMessage('zod.stock.expirationDate.invalid'),
      }),
    productId: z
      .string()
      .min(1, { error: getZodErrorMessage('zod.stock.productId.empty') })
      .transform((val) => Number(val)),
    warehouseId: z
      .string()
      .min(1, { error: getZodErrorMessage('zod.stock.warehouseId.empty') })
      .transform((val) => Number(val)),
  })
  .passthrough() // Permite otros campos
  .refine((data) => data.minimum <= data.maximum, {
    error: getZodErrorMessage('zod.stock.minimumGreaterThanMaximum'),
    path: ['minimum'], // Esto hará que el error aparezca en el campo minimum
  })
  .refine((data) => data.quantity <= data.maximum, {
    error: getZodErrorMessage('zod.stock.quantityGreaterThanMaximum'),
    path: ['quantity'], // Esto hará que el error aparezca en el campo minimum
  });
