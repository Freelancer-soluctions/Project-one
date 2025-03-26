import { z } from 'zod'

export const SaleSchema = z
  .object({
    clientId: z.string().min(1, {
      message: 'Client is required.'
    }),
    total: z
    .string()
    .min(1, { message: 'Total is required.' })
    .transform((val) => Number(val))
    .pipe(
      z.number()
        .int('Total must be an integer')
        .min(0, 'Total cannot be negative')
    ),
    details: z.array(z.object({
      productId: z.string().min(1, {
        message: 'Product is required.'
      }),
      quantity: z
      .string()
      .min(1, { message: 'Quantity is required.' })
      .transform((val) => Number(val))
      .pipe(
        z.number()
          .int('Quantity must be an integer')
          .min(1, 'Quantity must be greater than 0')
      ),
      price: z
      .string()
      .min(1, { message: 'Price is required.' })
      .transform((val) => Number(val))
      .pipe(
        z.number()
          .int('Price must be an integer')
          .min(0, 'Price cannot be negative')
      )
    }))
  })
  .passthrough() // Permite otros campos
