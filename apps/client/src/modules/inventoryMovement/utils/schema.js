import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';
import { MOVEMENT_TYPES } from './enums';

export const InventoryMovementSchema = z
  .object({
    productId: z.string().min(1, getZodMessage('zod.inventoryMovement.productId.empty')),
    warehouseId: z.string().min(1, getZodMessage('zod.inventoryMovement.warehouseId.empty')),
    quantity: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, {
        message: getZodMessage('zod.inventoryMovement.quantity.positive'),
      }),
    type: z.enum(
      [
        MOVEMENT_TYPES.ENTRY,
        MOVEMENT_TYPES.EXIT,
        MOVEMENT_TYPES.TRANSFERENCE,
        MOVEMENT_TYPES.ADJUSTMENT,
      ],
      {
        required_error: getZodMessage('zod.inventoryMovement.type.required'),
      }
    ),
    reason: z.string().optional(),
    purchaseId: z.string().optional(),
    saleId: z.string().optional(),
  })
  .passthrough();
