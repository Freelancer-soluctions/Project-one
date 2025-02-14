import { z } from "zod"

export const newsDialogSchema = z.object({
  description: z.string().min(1, {
      message: "Description is required.",
    }),
    status: z
    .object({
      id: z.number(), // No validación de mínimo o máximo
      code: z.string(), // No validación de longitud mínima
      description: z.string(), // No validación de longitud mínima
    })
  }).passthrough() // Permite otros campos
 
