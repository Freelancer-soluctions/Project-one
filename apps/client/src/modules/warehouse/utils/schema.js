import { z } from 'zod'

  export const WarehouseSchema = z
  .object({
    name: z.string().min(1, {
      message: 'Warehouse name is required.'
    }),
    status: z.string().min(1, {
      message: 'Warehouse status is required.'
    }),
   

  })
  .passthrough() // Permite otros campos
