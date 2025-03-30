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

  export const SalesFiltersSchema = z.object({
    clientId: z.string().optional(),
    fromDate: z.union([z.date(), z.string()]).optional(),
    toDate: z.union([z.date(), z.string()]).optional(),
    minTotal: z.string().optional(),
    maxTotal: z.string().optional()
  })
  .refine(
    data => {
      if (data.fromDate && data.toDate) {
        const from = data.fromDate instanceof Date ? data.fromDate : new Date(data.fromDate)
        const to = data.toDate instanceof Date ? data.toDate : new Date(data.toDate)
        return from <= to
      }
      return true
    },
    {
      message: 'From date must be before or equal to to date',
      path: ['fromDate']
    }
  )
  .refine(
    data => {
      if (data.minTotal && data.maxTotal) {
        return Number(data.minTotal) <= Number(data.maxTotal)
      }
      return true
    },
    {
      message: 'Minimum total must be less than or equal to maximum total',
      path: ['minTotal']
    }
  ) 