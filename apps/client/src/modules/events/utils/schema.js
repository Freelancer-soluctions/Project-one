import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

const baseDialogSchema = z.object({
  title: z.string().min(1, getZodMessage('zod.events.title.empty')),
  description: z.string().min(1, getZodMessage('zod.events.description.empty')),
  speaker: z.string().min(1, getZodMessage('zod.events.speaker.empty')),
  startTime: z.string().min(5, getZodMessage('zod.events.startTime.empty')),
  endTime: z.string().min(5, getZodMessage('zod.events.endTime.empty')),
  eventDate: z.date().refine((date) => !isNaN(date.getTime()), {
    message: getZodMessage('zod.events.eventDate.invalid'),
  }),
  type: z.string().min(1, getZodMessage('zod.events.type.empty')),
  modality: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID'], {
    required_error: getZodMessage('zod.events.modality.empty'),
  }),
  meetingUrl: z.string().url().optional(),
  location: z.string().optional(),
});

export const createEventsDialogSchema = (isEditMode = false) =>
  baseDialogSchema
    .refine((data) => data.startTime < data.endTime, {
      message: getZodMessage('zod.events.startTime.beforeEndTime'),
      path: ['startTime'],
    })
    .refine(
      (data) => {
        if (!data.modality) return true;
        if (data.modality === 'ONLINE') return !!data.meetingUrl;
        if (data.modality === 'IN_PERSON') {
          if (isEditMode) return true; // allow legacy null location on edit
          return !!data.location;
        }
        if (data.modality === 'HYBRID') {
          if (isEditMode) return !!data.meetingUrl; // meetingUrl required, location optional on edit
          return !!data.meetingUrl && !!data.location;
        }
        return true;
      },
      {
        message: getZodMessage('zod.events.modality.fieldsRequired'),
        path: ['meetingUrl'],
      }
    )
    .passthrough();

// Legacy export for backward compatibility (non-edit mode)
export const EventsDialogSchema = createEventsDialogSchema(false);
