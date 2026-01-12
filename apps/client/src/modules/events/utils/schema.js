import { z } from 'zod'

export const EventsDialogSchema = z
  .object({
    title: z.string().min(1, 'Title is required.'),
    description: z.string().min(1, 'Description is required.'),
    speaker: z.string().min(1, 'Speaker is required.'),
    startTime: z.string().min(5, 'StartTIme is required.'),
    endTime: z.string().min(5, 'EndTime is required.'),
    eventDate: z.date().refine(date => !isNaN(date.getTime()), {
      message: 'Invalid date'
    }),
    type: z.string().min(1, 'Type is required')
  })
  .passthrough() // Permite otros campos
