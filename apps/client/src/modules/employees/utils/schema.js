import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const EmployeeSchema = z
  .object({
    name: z.string().min(1, {
      message: getZodMessage('zod.employees.name.empty'),
    }),
    lastName: z.string().min(1, {
      message: getZodMessage('zod.employees.lastName.empty'),
    }),
    dni: z.string().min(1, {
      message: getZodMessage('zod.employees.dni.empty'),
    }),
    email: z.string().email({
      message: getZodMessage('zod.employees.email.invalid'),
    }),
    phone: z.string().optional(),
    address: z.string().optional(),
    startDate: z.date({
      required_error: getZodMessage('zod.employees.startDate.required'),
    }),
    position: z.string().min(1, {
      message: getZodMessage('zod.employees.position.empty'),
    }),
    department: z.string().min(1, {
      message: getZodMessage('zod.employees.department.empty'),
    }),
    salary: z.string().min(1, {
      message: getZodMessage('zod.employees.salary.empty'),
    }),
  })
  .passthrough(); // Permite otros campos

export const EmployeeFiltersSchema = z.object({
  name: z.string().optional(),
  dni: z.string().optional(),
  email: z
    .string()
    .email({
      message: getZodMessage('zod.employees.email.invalid'),
    })
    .optional(),
});
