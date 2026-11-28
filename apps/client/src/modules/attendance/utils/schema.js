import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

export const AttendanceSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)), // Convert empty string to undefined, otherwise to number
      z
        .number({
          error: getZodErrorMessage('zod.attendance.employeeId.required'),
        })
        .int()
        .positive({
          error: getZodErrorMessage('zod.attendance.employeeId.positive'),
        })
    ),
    date: z.date({
      error: getZodErrorMessage('zod.attendance.date.required'),
    }),
    entryTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      error: getZodErrorMessage('zod.attendance.entryTime.invalid'),
    }),
    exitTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      error: getZodErrorMessage('zod.attendance.exitTime.invalid'),
    }),
    workedHours: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)), // Convert empty string to undefined, otherwise to number
      z
        .number({
          error: getZodErrorMessage('zod.attendance.workedHours.required'),
        })
        .int()
        .positive({
          error: getZodErrorMessage('zod.attendance.workedHours.positive'),
        })
    ),
  })

  .passthrough(); // Allows other fields not defined in the schema
