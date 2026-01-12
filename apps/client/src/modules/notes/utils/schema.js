import { z } from 'zod'

export const NotesCreateDialogSchema = z
  .object({
    title: z.string().min(1, {
      message: 'Title is required.'
    }),
    content: z.string().min(1, {
      message: 'Description is required.'
    }),
    status: z.object({
      id: z.number(), // No validación de mínimo o máximo
      code: z.string(), // No validación de longitud mínima
      title: z.string() // No validación de longitud mínima
    })
    // .strict()
    // .nonempty({ message: "You must select a valid status." })
  })
  .passthrough() // Permite otros campos

export const notesEditDialogSchema = z
  .object({
    title: z.string().min(1, {
      message: 'Title is required.'
    }),
    content: z.string().min(1, {
      message: 'Description is required.'
    })
  })
  .passthrough() // Permite otros campos
