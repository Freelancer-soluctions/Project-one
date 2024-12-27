import { z } from "zod"

export const newsDialogSchema = z.object({
  description: z.string().min(400, {
      message: "Description must be at least 400 characters.",
    }),
  })

