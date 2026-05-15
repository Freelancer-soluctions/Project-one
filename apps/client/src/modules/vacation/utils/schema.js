import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

const VacationStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const VacationSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: getZodMessage('zod.vacation.employeeId.required') })
        .int()
        .positive(getZodMessage('zod.vacation.employeeId.positive'))
    ),
    startDate: z.date({
      required_error: getZodMessage('zod.vacation.startDate.required'),
    }),
    endDate: z.date({
      required_error: getZodMessage('zod.vacation.endDate.required'),
    }),
    status: VacationStatusEnum.default('PENDING'), // Default to PENDING
  })

  .passthrough(); // Allows other fields not defined in the schema
