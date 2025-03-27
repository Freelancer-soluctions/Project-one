import { z } from 'zod'

export const InventoryMovementSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  quantity: z.string().transform(Number).refine(val => val > 0, 'Quantity must be greater than 0'),
  type: z.enum(['ENTRY', 'EXIT', 'TRANSFERENCE', 'ADJUSTMENT'], {
    required_error: 'Movement type is required'
  }),
  reason: z.string().optional(),
  purchaseId: z.string().optional(),
  saleId: z.string().optional()
}).passthrough() 