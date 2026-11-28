import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

export const ProvidersDialogSchema = z
  .object({
    name: z.string().min(1, {
      error: getZodErrorMessage('zod.providers.name.empty'),
    }),
    status: z.boolean({
      error: getZodErrorMessage('zod.providers.status.required'),
    }),
  })
  .passthrough(); // Permite otros campos
