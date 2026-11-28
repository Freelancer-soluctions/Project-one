import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

export const EmployeeSchema = z
  .object({
    name: z.string().min(1, {
      error: getZodErrorMessage('zod.employees.name.empty'),
    }),
    lastName: z.string().min(1, {
      error: getZodErrorMessage('zod.employees.lastName.empty'),
    }),
    dni: z.string().min(1, {
      error: getZodErrorMessage('zod.employees.dni.empty'),
    }),
    email: z.string().email({
      error: getZodErrorMessage('zod.employees.email.invalid'),
    }),
    phone: z.string().optional(),
    address: z.string().optional(),
    startDate: z.date({
      error: getZodErrorMessage('zod.employees.startDate.required'),
    }),
    positionId: z
      .number({
        error: getZodErrorMessage('zod.employees.position.empty'),
      })
      .int()
      .positive({
        error: getZodErrorMessage('zod.employees.position.empty'),
      }),
    departmentId: z
      .number({
        error: getZodErrorMessage('zod.employees.department.empty'),
      })
      .int()
      .positive({
        error: getZodErrorMessage('zod.employees.department.empty'),
      }),
    salary: z.string().min(1, {
      error: getZodErrorMessage('zod.employees.salary.empty'),
    }),
  })
  .passthrough(); // Permite otros campos

export const EmployeeFiltersSchema = z.object({
  name: z.string().optional(),
  dni: z.string().optional(),
  // Catalog filters hold String(id) from the selects (or undefined for "all");
  // the server's Joi coerces them to numbers.
  positionId: z
    .string()
    .regex(/^\d+$/, {
      error: getZodErrorMessage('zod.employees.position.empty'),
    })
    .optional(),
  departmentId: z
    .string()
    .regex(/^\d+$/, {
      error: getZodErrorMessage('zod.employees.department.empty'),
    })
    .optional(),
  email: z
    .string()
    .email({
      error: getZodErrorMessage('zod.employees.email.invalid'),
    })
    .optional(),
});
