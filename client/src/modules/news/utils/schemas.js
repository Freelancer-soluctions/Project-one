import { z } from "zod"

export const newsDialogSchema = z.object({
  description: z.string().min(10, {
      message: "Description must be at least 10 characters.",
    }).max(400, "Description must be at most 400 characters." ),
    status: z
    .object({
      id: z.number({ message: "Status ID must be a number." }),
      code: z
        .string()
        .min(3, { message: "Code must be at least 3 characters." }),
      description: z
        .string()
        .min(1, { message: "Description is required." }),
    })
    .refine((status) => !!status.id, {
      message: "You must select a valid status.",
    }),
  }).passthrough(); // Permite otros campos

