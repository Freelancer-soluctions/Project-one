import { z } from 'zod'

export const ProvidersDialogSchema = z
  .object({
    name: z.string().min(1, {
      message: 'Provider name is required.'
    }),
    status: z.boolean(),

  })
  .passthrough() // Permite otros campos
