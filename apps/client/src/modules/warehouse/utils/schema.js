import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const WarehouseSchema = z
  .object({
    name: z.string().min(1, {
      message: getZodMessage('zod.warehouse.name.empty'),
    }),
    status: z.string().min(1, {
      message: getZodMessage('zod.warehouse.status.empty'),
    }),
  })
  .passthrough(); // Permite otros campos
