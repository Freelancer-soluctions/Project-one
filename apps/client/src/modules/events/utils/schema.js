import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const EventsDialogSchema = z
  .object({
    title: z.string().min(1, getZodMessage('zod.events.title.empty')),
    description: z.string().min(1, getZodMessage('zod.events.description.empty')),
    speaker: z.string().min(1, getZodMessage('zod.events.speaker.empty')),
    startTime: z.string().min(5, getZodMessage('zod.events.startTime.empty')),
    endTime: z.string().min(5, getZodMessage('zod.events.endTime.empty')),
    eventDate: z.date().refine((date) => !isNaN(date.getTime()), {
      message: getZodMessage('zod.events.eventDate.invalid'),
    }),
    type: z.string().min(1, getZodMessage('zod.events.type.empty')),
  })
  .passthrough(); // Permite otros campos
