import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const PerformanceEvaluationSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ 
          required_error: getZodMessage('zod.performanceEvaluation.employeeId.required') 
        })
        .int()
        .positive(getZodMessage('zod.performanceEvaluation.employeeId.positive'))
    ),
    date: z.date({
      required_error: getZodMessage('zod.performanceEvaluation.date.required'),
    }),
    calification: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ 
          required_error: getZodMessage('zod.performanceEvaluation.calification.required') 
        })
        .int()
        .min(1, getZodMessage('zod.performanceEvaluation.calification.min'))
        .max(10, getZodMessage('zod.performanceEvaluation.calification.max'))
    ),
    comments: z
      .string()
      .max(200, getZodMessage('zod.performanceEvaluation.comments.maxLength'))
      .optional(),
  })
  .passthrough(); // Allows other fields not defined in the schema
