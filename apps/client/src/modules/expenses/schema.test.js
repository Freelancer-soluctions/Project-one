import { describe, it, expect } from 'vitest';
import { ExpenseSchema } from './utils/schema';

describe('ExpenseSchema', () => {
  it('accepts valid expense data', () => {
    const validExpense = {
      description: 'Test expense',
      total: 100,
      category: 'food',
    };

    const result = ExpenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it('rejects expense with empty description', () => {
    const invalidExpense = {
      description: '',
      total: 100,
      category: 'food',
    };

    const result = ExpenseSchema.safeParse(invalidExpense);
    expect(result.success).toBe(false);
  });
});
