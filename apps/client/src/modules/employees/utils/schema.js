import { z } from 'zod'

export const EmployeeSchema = z
  .object({
    name: z.string().min(1, {
      message: 'Employee name is required.'
    }),
    lastName: z.string().min(1, {
      message: 'Employee last name is required.'
    }),
    dni: z.string().min(1, {
      message: 'DNI is required.'
    }),
    email: z.string().email({
      message: 'Invalid email format.'
    }),
    phone: z.string().optional(),
    address: z.string().optional(),
    startDate: z.date({
      required_error: 'Start date is required.'
    }),
    position: z.string().min(1, {
      message: 'Position is required.'
    }),
    department: z.string().min(1, {
      message: 'Department is required.'
    }),
    salary: z.string().min(1, {
      message: 'Salary is required.'
    })
  })
  .passthrough() // Permite otros campos

export const EmployeeFiltersSchema = z.object({
  name: z.string().optional(),
  dni: z.string().optional(),
  email: z
    .string()
    .email({
      message: 'Invalid email format.'
    })
    .optional()
})
