import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

const currentYear = new Date().getFullYear();

export const PayrollSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: getZodMessage('zod.payroll.employeeId.required') })
        .int()
        .positive(getZodMessage('zod.payroll.employeeId.positive'))
    ),
    month: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: getZodMessage('zod.payroll.month.required') })
        .int()
        .min(1, getZodMessage('zod.payroll.month.invalid'))
        .max(12, getZodMessage('zod.payroll.month.invalid'))
    ),
    year: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: getZodMessage('zod.payroll.year.required') })
        .int()
        .min(2000, getZodMessage('zod.payroll.year.min'))
        .max(currentYear + 1, getZodMessage('zod.payroll.year.max', { count: currentYear + 1 }))
    ),
baseSalary: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: getZodMessage('zod.payroll.baseSalary.required') })
        .positive(getZodMessage('zod.payroll.baseSalary.positive'))
    ),
extraHours: z.preprocess(
      (val) => (val === '' ? 0 : Number(val)), // Default to 0 if empty
      z
        .number({ invalid_type_error: getZodMessage('zod.payroll.extraHours.invalid') })
        .nonnegative(getZodMessage('zod.payroll.extraHours.nonnegative'))
        .optional()
        .default(0)
    ),
deductions: z.preprocess(
      (val) => (val === '' ? 0 : Number(val)), // Default to 0 if empty
      z
        .number({ invalid_type_error: getZodMessage('zod.payroll.deductions.invalid') })
        .nonnegative(getZodMessage('zod.payroll.deductions.nonnegative'))
        .optional()
        .default(0)
    ),
    totalPayment: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: getZodMessage('zod.payroll.totalPayment.required') })
        .positive(getZodMessage('zod.payroll.totalPayment.positive'))
    ),
  })
  // Optional: Add refine logic if totalPayment needs calculation validation
  // .refine((data) => data.totalPayment === data.baseSalary + data.extraHours - data.deductions, {
  //   message: "Total payment calculation is incorrect",
  //   path: ["totalPayment"],
  // })
  .passthrough(); // Allows other fields not defined in the schema
