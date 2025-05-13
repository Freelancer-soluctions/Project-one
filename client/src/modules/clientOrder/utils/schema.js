import { z } from 'zod'

export const ClientOrderSchema = z
  .object({
    clientId: z.string().min(1, {
      message: 'Client ID is required.'
    }),
    status: z.string().optional(),
    notes: z.string().optional(),
    saleId: z.string().optional()
  })
  .passthrough() // Permite otros campos 

  export const ClientOrderFiltersSchema = z.object({
    clientId: z.string().optional(),
    status: z.string().optional()
  })