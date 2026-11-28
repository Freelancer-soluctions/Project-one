import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

const baseDialogSchema = z.object({
  title: z
    .string()
    .min(1, { error: getZodErrorMessage('zod.events.title.empty') }),
  description: z
    .string()
    .min(1, { error: getZodErrorMessage('zod.events.description.empty') }),
  speaker: z
    .string()
    .min(1, { error: getZodErrorMessage('zod.events.speaker.empty') }),
  startTime: z
    .string()
    .min(5, { error: getZodErrorMessage('zod.events.startTime.empty') }),
  endTime: z
    .string()
    .min(5, { error: getZodErrorMessage('zod.events.endTime.empty') }),
  eventDate: z.date().refine((date) => !isNaN(date.getTime()), {
    error: getZodErrorMessage('zod.events.eventDate.invalid'),
  }),
  type: z
    .string()
    .min(1, { error: getZodErrorMessage('zod.events.type.empty') }),
  modality: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID'], {
    error: getZodErrorMessage('zod.events.modality.empty'),
  }),
  meetingUrl: z.string().url().optional(),
  location: z.string().optional(),
});

export const createEventsDialogSchema = (isEditMode = false) =>
  baseDialogSchema
    // `.passthrough()` solo existe en ZodObject: debe encadenarse ANTES de
    // los `.refine()` (que devuelven ZodEffects, sin `.passthrough()`).
    .passthrough()
    .refine((data) => data.startTime < data.endTime, {
      error: getZodErrorMessage('zod.events.startTime.beforeEndTime'),
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
        error: getZodErrorMessage('zod.events.modality.fieldsRequired'),
        path: ['meetingUrl'],
      }
    );

// Legacy export for backward compatibility (non-edit mode)
export const EventsDialogSchema = createEventsDialogSchema(false);
