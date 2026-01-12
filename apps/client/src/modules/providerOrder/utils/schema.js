import { z } from 'zod'

export const ProviderOrderSchema = z
  .object({
    supplierId: z.number({
      required_error: 'Supplier ID is required.'
    }),
    notes: z.string().optional()
  })
  .passthrough() // Permite otros campos

export const ProviderOrdersFiltersSchema = z.object({
  supplierId: z.number().optional()
})