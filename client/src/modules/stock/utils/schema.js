import { z } from 'zod'

export const StockSchema = z
  .object({
    quantity: z
    .string()
    .min(1, { message: 'Quantity is required.' })
    .transform((val) => Number(val))
    .pipe(
      z.number()
        .int('Quantity must be an integer')
        .min(0, 'Quantity cannot be negative')
    ),
  
    minimum: z
      .string()
      .min(1, { message: 'Minimum quantity is required.' })
      .transform((val) => Number(val))
      .pipe(
        z.number()
          .int('Minimum quantity must be an integer')
          .min(0, 'Minimum quantity cannot be negative')
      ),
    maximum: z
      .string()
      .min(1, { message: 'Maximum quantity is required.' })
      .transform((val) => Number(val))
      .pipe(
        z.number()
          .int('Maximum quantity must be an integer')
          .min(0, 'Maximum quantity cannot be negative')
      ),
    lot: z
      .string()
      .max(50, { message: 'Lot number cannot exceed 50 characters.' })
      .optional()
      .nullable(),
    unitMeasure: z
      .string()
      .min(1, { message: 'Unit measure is required.' })
      .refine((val) => ['PIECES', 'KILOGRAMS', 'LITERS', 'METERS'].includes(val), {
        message: 'Invalid unit measure.'
      }),
    expirationDate: z
      .date()
      .nullable()
      .optional()
      .refine((date) => !date || !isNaN(date.getTime()), {
        message: 'Invalid date'
      }),
    productId: z
      .string()
      .min(1, { message: 'Product is required.' })
      .transform((val) => Number(val)),
    warehouseId: z
      .string()
      .min(1, { message: 'Warehouse is required.' })
      .transform((val) => Number(val))
  }).passthrough() // Permite otros campos
  .refine((data) => data.minimum <= data.maximum, {
    message: 'Minimum quantity cannot be greater than maximum quantity',
    path: ['minimum'] // Esto hará que el error aparezca en el campo minimum
  }).refine((data) => data.quantity <= data.maximum, {
    message: 'Quantity cannot be greater than maximum quantity',
    path: ['quantity'] // Esto hará que el error aparezca en el campo minimum
  })


