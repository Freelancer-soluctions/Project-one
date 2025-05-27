import { z } from 'zod'

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
   
    
  })
  .passthrough(); // Allows other fields not explicitly defined in the schema

export const ExpensesFiltersSchema = z.object({
  description: z.string().optional(),
  category: z.string().optional() 
});