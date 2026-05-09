import { z } from 'zod';
import { getZodMessage, getZodMinMaxMessage } from '@/utils/zod-i18n-map';

export const NotesCreateDialogSchema = z
  .object({
    title: z.string().min(1, {
      message: getZodMessage('zod.notes.title.empty'),
    }),
    content: z.string().min(1, {
      message: getZodMessage('zod.notes.content.empty'),
    }),
    status: z.object({
      id: z.number(),
      code: z.string(),
      title: z.string(),
    }),
  })
  .passthrough();

export const notesEditDialogSchema = z
  .object({
    title: z.string().min(1, {
      message: getZodMessage('zod.notes.title.empty'),
    }),
    content: z.string().min(1, {
      message: getZodMessage('zod.notes.content.empty'),
    }),
  })
  .passthrough();
