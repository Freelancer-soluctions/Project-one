import { z } from "zod"

export const newsDialogSchema = z.object({
  description: z.string().min(10, {
      message: "Description must be at least 10 characters.",
    }).max(400),
    status: z.string().min(3, {
      message: "You must  select at least one status.",
    }),
  })

