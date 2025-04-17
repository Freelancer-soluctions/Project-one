import { z } from 'zod'
import { MOVEMENT_TYPES } from './enums'

export const InventoryMovementSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  quantity: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, {
    message: 'Quantity must be greater than 0'
  }),
  type: z.enum([MOVEMENT_TYPES.ENTRY, MOVEMENT_TYPES.EXIT, MOVEMENT_TYPES.TRANSFERENCE, MOVEMENT_TYPES.ADJUSTMENT], {
    required_error: 'Movement type is required'
  }),
  reason: z.string().optional(),
  purchaseId: z.string().optional(),
  saleId: z.string().optional()
}).passthrough() 