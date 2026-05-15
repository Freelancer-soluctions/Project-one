import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const AttendanceSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)), // Convert empty string to undefined, otherwise to number
      z
        .number({ 
          required_error: getZodMessage('zod.attendance.employeeId.required'),
          invalid_type_error: getZodMessage('zod.attendance.employeeId.required')
        })
        .int()
        .positive(getZodMessage('zod.attendance.employeeId.positive'))
    ),
    date: z.date({
      required_error: getZodMessage('zod.attendance.date.required'),
    }),
    entryTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: getZodMessage('zod.attendance.entryTime.invalid'),
    }),
    exitTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: getZodMessage('zod.attendance.exitTime.invalid'),
    }),
    workedHours: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)), // Convert empty string to undefined, otherwise to number
      z
        .number({ 
          required_error: getZodMessage('zod.attendance.workedHours.required'),
          invalid_type_error: getZodMessage('zod.attendance.workedHours.required')
        })
        .int()
        .positive(getZodMessage('zod.attendance.workedHours.positive'))
    ),
  })

  .passthrough(); // Allows other fields not defined in the schema
