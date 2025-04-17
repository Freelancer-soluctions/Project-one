import { z } from 'zod'

export const PerformanceEvaluationSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number({ required_error: 'Employee is required.' }).int().positive('Employee must be selected.')
    ),
    date: z.date({
      required_error: 'Evaluation date is required.'
    }),
    calification: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number({ required_error: 'Calification is required.' })
        .int()
        .min(1, 'Calification must be between 1 and 10.') // Assuming a 1-10 scale
        .max(10, 'Calification must be between 1 and 10.')
    ),
    comments: z.string().max(200, 'Comments cannot exceed 200 characters.').optional(),
  })
  .passthrough() // Allows other fields not defined in the schema 