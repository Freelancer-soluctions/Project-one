import { z } from "zod"

export const eventsDialogSchema = z.object({
  title: z.string().max(50, "Title must be at most 50 characters." ),
  description: z.string().max(200, "Description must be at most 400 characters." ),
  speaker: z.string().max(20, "Speaker must be at most 20 characters." ),
  startTime: z.string().max(5, "Start time is required." ),
  endTime: z.string().max(5, "End time is required." ),
  date: z.date().refine((date) => !isNaN(date.getTime()), {
    message: 'Invalid date',
  }),
  }).passthrough(); // Permite otros campos

