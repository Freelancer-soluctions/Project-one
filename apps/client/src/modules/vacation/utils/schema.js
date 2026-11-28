import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

const VacationStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

export const VacationSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({
          error: getZodErrorMessage('zod.vacation.employeeId.required'),
        })
        .int()
        .positive({
          error: getZodErrorMessage('zod.vacation.employeeId.positive'),
        })
    ),
    startDate: z.date({
      error: getZodErrorMessage('zod.vacation.startDate.required'),
    }),
    endDate: z.date({
      error: getZodErrorMessage('zod.vacation.endDate.required'),
    }),
    status: VacationStatusEnum.default('PENDING'), // Default to PENDING
    reason: z
      .string()
      .max(500, {
        error: getZodErrorMessage('zod.vacation.reason.maxLength', {
          count: 500,
        }),
      })
      .optional()
      .nullable(),
    comments: z
      .string()
      .max(1000, {
        error: getZodErrorMessage('zod.vacation.comments.maxLength', {
          count: 1000,
        }),
      })
      .optional()
      .nullable(),
    paid: z.boolean().default(true),
  })

  .passthrough(); // Allows other fields not defined in the schema
