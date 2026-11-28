import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

const currentYear = new Date().getFullYear();

export const PayrollSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({
          error: getZodErrorMessage('zod.payroll.employeeId.required'),
        })
        .int()
        .positive({
          error: getZodErrorMessage('zod.payroll.employeeId.positive'),
        })
    ),
    month: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ error: getZodErrorMessage('zod.payroll.month.required') })
        .int()
        .min(1, { error: getZodErrorMessage('zod.payroll.month.invalid') })
        .max(12, { error: getZodErrorMessage('zod.payroll.month.invalid') })
    ),
    year: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ error: getZodErrorMessage('zod.payroll.year.required') })
        .int()
        .min(2000, { error: getZodErrorMessage('zod.payroll.year.min') })
        .max(currentYear + 1, {
          error: getZodErrorMessage('zod.payroll.year.max', {
            count: currentYear + 1,
          }),
        })
    ),
    baseSalary: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({
          error: getZodErrorMessage('zod.payroll.baseSalary.required'),
        })
        .positive({
          error: getZodErrorMessage('zod.payroll.baseSalary.positive'),
        })
    ),
    extraHours: z.preprocess(
      (val) => (val === '' ? 0 : Number(val)), // Default to 0 if empty
      z
        .number({
          error: getZodErrorMessage('zod.payroll.extraHours.invalid'),
        })
        .nonnegative({
          error: getZodErrorMessage('zod.payroll.extraHours.nonnegative'),
        })
        .optional()
        .default(0)
    ),
    deductions: z.preprocess(
      (val) => (val === '' ? 0 : Number(val)), // Default to 0 if empty
      z
        .number({
          error: getZodErrorMessage('zod.payroll.deductions.invalid'),
        })
        .nonnegative({
          error: getZodErrorMessage('zod.payroll.deductions.nonnegative'),
        })
        .optional()
        .default(0)
    ),
    totalPayment: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({
          error: getZodErrorMessage('zod.payroll.totalPayment.required'),
        })
        .positive({
          error: getZodErrorMessage('zod.payroll.totalPayment.positive'),
        })
    ),
  })
  // Optional: Add refine logic if totalPayment needs calculation validation
  // .refine((data) => data.totalPayment === data.baseSalary + data.extraHours - data.deductions, {
  //   message: "Total payment calculation is incorrect",
  //   path: ["totalPayment"],
  // })
  .passthrough(); // Allows other fields not defined in the schema
