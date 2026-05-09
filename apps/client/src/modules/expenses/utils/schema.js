import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const ExpenseSchema = z
  .object({
    description: z.string().min(1, {
      message: getZodMessage('zod.expenses.description.empty'),
    }),
    total: z.preprocess(
      (val) =>
        val === '' || val === null || val === undefined
          ? undefined
          : parseFloat(String(val)),
      z
        .number({
          required_error: getZodMessage('zod.expenses.total.required'),
          invalid_type_error: getZodMessage('zod.expenses.total.invalid'),
        })
        .positive({
          message: getZodMessage('zod.expenses.total.positive'),
        })
    ),
    category: z.string().min(1, {
      message: getZodMessage('zod.expenses.category.empty'),
    }),
  })
  .passthrough(); // Allows other fields not explicitly defined in the schema

export const ExpensesFiltersSchema = z.object({
  description: z.string().optional(),
  category: z.string().optional(),
});
