import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const StockSchema = z
  .object({
    quantity: z
      .string()
      .min(1, { message: getZodMessage('zod.stock.quantity.empty') })
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .int(getZodMessage('zod.stock.quantity.integer'))
          .min(0, getZodMessage('zod.stock.quantity.min'))
      ),

    minimum: z
      .string()
      .min(1, { message: getZodMessage('zod.stock.minimum.empty') })
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .int(getZodMessage('zod.stock.minimum.integer'))
          .min(0, getZodMessage('zod.stock.minimum.min'))
      ),
    maximum: z
      .string()
      .min(1, { message: getZodMessage('zod.stock.maximum.empty') })
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .int(getZodMessage('zod.stock.maximum.integer'))
          .min(0, getZodMessage('zod.stock.maximum.min'))
      ),
    lot: z
      .string()
      .max(50, { message: getZodMessage('zod.stock.lot.maxLength') })
      .optional()
      .nullable(),
    unitMeasure: z
      .string()
      .min(1, { message: getZodMessage('zod.stock.unitMeasure.empty') })
      .refine(
        (val) => ['PIECES', 'KILOGRAMS', 'LITERS', 'METERS'].includes(val),
        {
          message: getZodMessage('zod.stock.unitMeasure.invalid'),
        }
      ),
    expirationDate: z
      .date()
      .nullable()
      .optional()
      .refine((date) => !date || !isNaN(date.getTime()), {
        message: getZodMessage('zod.stock.expirationDate.invalid'),
      }),
    productId: z
      .string()
      .min(1, { message: getZodMessage('zod.stock.productId.empty') })
      .transform((val) => Number(val)),
    warehouseId: z
      .string()
      .min(1, { message: getZodMessage('zod.stock.warehouseId.empty') })
      .transform((val) => Number(val)),
  })
  .passthrough() // Permite otros campos
  .refine((data) => data.minimum <= data.maximum, {
    message: getZodMessage('zod.stock.minimumGreaterThanMaximum'),
    path: ['minimum'], // Esto hará que el error aparezca en el campo minimum
  })
  .refine((data) => data.quantity <= data.maximum, {
    message: getZodMessage('zod.stock.quantityGreaterThanMaximum'),
    path: ['quantity'], // Esto hará que el error aparezca en el campo minimum
  });
