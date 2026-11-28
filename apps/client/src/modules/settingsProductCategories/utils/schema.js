import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

export const SettingsProductCategoriesSchema = z
  .object({
    description: z.string().min(1, {
      error: getZodErrorMessage(
        'zod.settingsProductCategories.description.empty'
      ),
    }),
    code: z
      .string()
      .min(1, {
        error: getZodErrorMessage('zod.settingsProductCategories.code.empty'),
      })
      .max(3, {
        error: getZodErrorMessage(
          'zod.settingsProductCategories.code.maxLength'
        ),
      }),
  })
  .passthrough(); // Permite otros campos
