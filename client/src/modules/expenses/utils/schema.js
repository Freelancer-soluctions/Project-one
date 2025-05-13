import { z } from 'zod'

const expenseCategoryEnumValues = [
  'RENTAL',
  'UTILITIES',
  'SALARIES',
  'SUPPLIES',
  'TRANSPORT',
  'MAINTENANCE',
  'MARKETING',
  'SOFTWARE',
  'PROFESSIONAL_SERVICES',
  'TAXES',
  'BANK_FEES',
  'TRAVEL',
  'TRAINING',
  'OTHER'
];

export const ExpenseSchema = z
  .object({
    description: z.string().min(1, {
      message: 'Expense description is required.' // Adapt message key for translation
    }),
    total: z.preprocess(
      val => (val === "" || val === null || val === undefined) ? undefined : parseFloat(String(val)),
      z.number({
        required_error: "Total is required.", // Adapt message key
        invalid_type_error: "Total must be a number." // Adapt message key
      }).positive({
        message: 'Total must be a positive number.' // Adapt message key
      })
    ),
    category: z.string().min(1, {
      message: 'Expense category is required.' // Adapt message key
    }),
    status: z.enum(expenseCategoryEnumValues, { // Using z.enum for status
      required_error: 'Expense status is required.', // Adapt message key
      invalid_type_error: 'Invalid expense status.' // Adapt message key
    })
    // Add other fields like createdOn, updatedOn, userExpenseCreatedName if they are part of the form
    // and need validation, though often they are informational.
    // If they are present in defaultValues and reset, they should be here or passthrough is needed.
  })
  .passthrough(); // Allows other fields not explicitly defined in the schema

export const ExpensesFiltersSchema = z.object({
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(expenseCategoryEnumValues).optional() // Status can be one of the enum values or undefined
});