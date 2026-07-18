import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const ProvidersDialogSchema = z
  .object({
    name: z.string().min(1, {
      message: getZodMessage('zod.providers.name.empty'),
    }),
    status: z.boolean({ message: getZodMessage('zod.providers.status.required') }),
  })
  .passthrough(); // Permite otros campos
