import { z } from 'zod'

export const SettingsProductCategoriesSchema = z
  .object({
    description: z.string().min(1, {
      message: 'Category description is required.'
    }),
    code: z
      .string()
      .min(1, {
        message: 'Category code is required.'
      })
      .max(3, {
        message: 'Category code must be less than 3 digits.'
      })
  })
  .passthrough() // Permite otros campos
