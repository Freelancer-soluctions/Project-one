import { z } from 'zod'

export const PurchaseSchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  total: z.string().min(1, 'Total is required'),
  details: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required'),
      quantity: z.string().min(1, 'Quantity is required'),
      price: z.string().min(1, 'Price is required')
    })
  ).min(1, 'At least one detail is required')
}) 