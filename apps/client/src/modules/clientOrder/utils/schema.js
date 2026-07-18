import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const ClientOrderSchema = z
  .object({
    clientId: z.string().min(1, {
      message: getZodMessage('zod.clientOrder.clientId.empty'),
    }),
    status: z.string().optional(),
    notes: z.string().optional(),
    saleId: z.string().optional(),
  })
  .passthrough(); // Permite otros campos

export const ClientOrderFiltersSchema = z.object({
  clientId: z.string().optional(),
  status: z.string().optional(),
});
