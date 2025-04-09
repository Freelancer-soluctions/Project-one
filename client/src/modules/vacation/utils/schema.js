import { z } from 'zod'

const VacationStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export const VacationSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number({ required_error: 'Employee is required.' }).int().positive('Employee must be selected.')
    ),
    startDate: z.date({
      required_error: 'Start date is required.'
    }),
    endDate: z.date({
      required_error: 'End date is required.'
    }),
    status: VacationStatusEnum.default('PENDING') // Default to PENDING
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be earlier than start date.',
    path: ['endDate'], // Attach error to endDate field
  })
  .passthrough() // Allows other fields not defined in the schema 