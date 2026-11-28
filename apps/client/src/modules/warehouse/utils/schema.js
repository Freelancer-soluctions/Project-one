import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

export const WarehouseSchema = z
  .object({
    name: z.string().min(1, {
      error: getZodErrorMessage('zod.warehouse.name.empty'),
    }),
    status: z.string().min(1, {
      error: getZodErrorMessage('zod.warehouse.status.empty'),
    }),
  })
  .passthrough(); // Permite otros campos
