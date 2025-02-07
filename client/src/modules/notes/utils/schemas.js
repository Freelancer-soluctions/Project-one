import { z } from "zod"

export const notesDialogSchema = z.object({
  title: z.string().min(10, {
      message: "Title must be at least 10 characters.",
    }).max(50, "Title must be at most 50 characters." ),
    content: z.string().min(10, {
      message: "Description must be at least 10 characters.",
    }).max(400, "Description must be at most 400 characters." ),
    status: z
    .object({
      id: z.number(), // No validación de mínimo o máximo
      code: z.string(), // No validación de longitud mínima
      title: z.string(), // No validación de longitud mínima
    })
    // .strict()
    // .nonempty({ message: "You must select a valid status." })
  }).passthrough(); // Permite otros campos

