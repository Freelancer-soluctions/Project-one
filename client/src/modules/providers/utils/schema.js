import { z } from "zod"

export const ProvidersDialogSchema = z.object({
  name: z.string().min(1, {
      message: "Description is required.",
    }),
    status: z.boolean()
    
  }).passthrough() // Permite otros campos
 
