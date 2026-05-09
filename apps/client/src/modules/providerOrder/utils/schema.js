import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const ProviderOrderSchema = z
  .object({
    supplierId: z.number({
      required_error: getZodMessage('zod.providerOrder.supplierId.required'),
    }),
    notes: z.string().optional(),
  })
  .passthrough(); // Permite otros campos

export const ProviderOrdersFiltersSchema = z.object({
  supplierId: z.number().optional(),
});
