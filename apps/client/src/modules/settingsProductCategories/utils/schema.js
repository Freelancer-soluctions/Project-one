import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const SettingsProductCategoriesSchema = z
  .object({
    description: z.string().min(1, {
      message: getZodMessage('zod.settingsProductCategories.description.empty'),
    }),
    code: z
      .string()
      .min(1, {
        message: getZodMessage('zod.settingsProductCategories.code.empty'),
      })
      .max(3, {
        message: getZodMessage('zod.settingsProductCategories.code.maxLength'),
      }),
  })
  .passthrough(); // Permite otros campos
