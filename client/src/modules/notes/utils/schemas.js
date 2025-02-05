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
      id: z.number({ message: "Status ID must be a number." }),
      code: z
        .string()
        .min(3, { message: "Code must be at least 3 characters." }),
      title: z
        .string()
        .min(1, { message: "Title is required." }),
    })
    .refine((status) => !!status.id, {
      message: "You must select a valid status.",
    }),
  }).passthrough(); // Permite otros campos

