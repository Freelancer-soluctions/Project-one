import { z } from 'zod';
import { getZodErrorMessage, getZodMessage } from '@/utils/zod-i18n-map';

export const ExpenseSchema = z
  .object({
    description: z.string().min(1, {
      error: getZodErrorMessage('zod.expenses.description.empty'),
    }),
    total: z.preprocess(
      (val) =>
        val === '' || val === null || val === undefined
          ? undefined
          : parseFloat(String(val)),
      z
        .number({
          // zod v4: un solo `error` para todos los issues del tipo; se
          // distingue el campo vacío del valor no numérico.
          error: (issue) =>
            issue.input === undefined
              ? getZodMessage('zod.expenses.total.required')
              : getZodMessage('zod.expenses.total.invalid'),
        })
        .positive({
          error: getZodErrorMessage('zod.expenses.total.positive'),
        })
    ),
    category: z.string().min(1, {
      error: getZodErrorMessage('zod.expenses.category.empty'),
    }),
  })
  .passthrough(); // Allows other fields not explicitly defined in the schema

export const ExpensesFiltersSchema = z.object({
  description: z.string().optional(),
  category: z.string().optional(),
});
