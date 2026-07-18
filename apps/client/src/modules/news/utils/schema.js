import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const NewsDialogSchema = z
  .object({
    description: z.string().min(1, {
      message: getZodMessage('zod.news.description.empty'),
    }),
    status: z.object({
      id: z.number(), // No validación de mínimo o máximo
      code: z.string(), // No validación de longitud mínima
      description: z.string(), // No validación de longitud mínima
    }),
  })
  .passthrough(); // Permite otros campos

export const NewsFiltersSchema = z
  .object({
    description: z.string().optional(),
    fdate: z.union([z.date(), z.string()]).optional(),
    tdate: z.union([z.date(), z.string()]).optional(),
    statusNews: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.fdate && data.tdate) {
        const from =
          data.fdate instanceof Date ? data.fdate : new Date(data.fdate);
        const to =
          data.tdate instanceof Date ? data.tdate : new Date(data.tdate);
        return from <= to;
      }
      return true;
    },
    {
      message: getZodMessage('zod.news.fdateAfterTdate'),
      path: ['fdate'],
    }
  );
