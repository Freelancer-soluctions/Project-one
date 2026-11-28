import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

export const PerformanceEvaluationSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({
          error: getZodErrorMessage(
            'zod.performanceEvaluation.employeeId.required'
          ),
        })
        .int()
        .positive({
          error: getZodErrorMessage(
            'zod.performanceEvaluation.employeeId.positive'
          ),
        })
    ),
    date: z.date({
      error: getZodErrorMessage('zod.performanceEvaluation.date.required'),
    }),
    calification: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({
          error: getZodErrorMessage(
            'zod.performanceEvaluation.calification.required'
          ),
        })
        .int()
        .min(1, {
          error: getZodErrorMessage(
            'zod.performanceEvaluation.calification.min'
          ),
        })
        .max(10, {
          error: getZodErrorMessage(
            'zod.performanceEvaluation.calification.max'
          ),
        })
    ),
    comments: z
      .string()
      .max(200, {
        error: getZodErrorMessage(
          'zod.performanceEvaluation.comments.maxLength'
        ),
      })
      .optional(),
  })
  .passthrough(); // Allows other fields not defined in the schema
