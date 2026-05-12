import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

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
    assignedUser: z.object({
      id: z.number(),
      name: z.string(),
    }).optional(),
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
    assignedUser: z.object({
      id: z.number(),
      name: z.string(),
    }).optional(),
  })
  .passthrough();
