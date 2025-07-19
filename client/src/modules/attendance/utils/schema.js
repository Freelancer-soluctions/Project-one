import { z } from 'zod'

export const AttendanceSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)), // Convert empty string to undefined, otherwise to number
      z.number({ required_error: 'Employee is required.' }).int().positive('Employee must be selected.')
    ),
    date: z.date({
      required_error: 'Date is required.'
    }),
    entryTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: 'Invalid entry time format (HH:mm).'
    }),
    exitTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: 'Invalid exit time format (HH:mm).'
    }),
    // workedHours could be calculated or entered, assuming entered as a number here
    workedHours: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)), // Convert empty string to undefined, otherwise to number
      z.number({ required_error: 'Worked hours are required.' }).positive('Worked hours must be positive.')
    )
  })

  .passthrough() // Allows other fields not defined in the schema 