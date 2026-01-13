import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const PayrollSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: 'Employee is required.' })
        .int()
        .positive('Employee must be selected.')
    ),
    month: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: 'Month is required.' })
        .int()
        .min(1, 'Month must be between 1 and 12.')
        .max(12, 'Month must be between 1 and 12.')
    ),
    year: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: 'Year is required.' })
        .int()
        .min(2000, 'Year must be 2000 or later.')
        .max(currentYear + 1, `Year cannot be later than ${currentYear + 1}.`)
    ),
    baseSalary: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: 'Base salary is required.' })
        .positive('Base salary must be positive.')
    ),
    extraHours: z.preprocess(
      (val) => (val === '' ? 0 : Number(val)), // Default to 0 if empty
      z
        .number({ invalid_type_error: 'Extra hours must be a number.' })
        .nonnegative('Extra hours cannot be negative.')
        .optional()
        .default(0)
    ),
    deductions: z.preprocess(
      (val) => (val === '' ? 0 : Number(val)), // Default to 0 if empty
      z
        .number({ invalid_type_error: 'Deductions must be a number.' })
        .nonnegative('Deductions cannot be negative.')
        .optional()
        .default(0)
    ),
    totalPayment: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: 'Total payment is required.' })
        .positive('Total payment must be positive.')
    ),
  })
  // Optional: Add refine logic if totalPayment needs calculation validation
  // .refine((data) => data.totalPayment === data.baseSalary + data.extraHours - data.deductions, {
  //   message: "Total payment calculation is incorrect",
  //   path: ["totalPayment"],
  // })
  .passthrough(); // Allows other fields not defined in the schema
