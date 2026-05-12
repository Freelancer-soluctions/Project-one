import { ExpenseSchema } from './utils/schema';
import i18n from '../../config/i18n';

// Simple test to verify the schema works with translation keys
console.log('Testing ExpenseSchema with translation keys...');

// Test that the schema can be imported and used
try {
  // This will test if our changes don't break the schema functionality
  console.log('✅ ExpenseSchema imported successfully');
  
  // Test a valid expense
  const validExpense = {
    description: 'Test expense',
    total: 100,
    category: 'food'
  };
  
  const result = ExpenseSchema.safeParse(validExpense);
  if (result.success) {
    console.log('✅ Valid expense test passed');
  } else {
    console.log('❌ Valid expense test failed:', result.error);
  }
  
  // Test invalid expense (empty description)
  const invalidExpense = {
    description: '',
    total: 100,
    category: 'food'
  };
  
  const result2 = ExpenseSchema.safeParse(invalidExpense);
  if (!result2.success) {
    console.log('✅ Invalid expense test passed - validation working');
  } else {
    console.log('❌ Invalid expense test failed - should have failed validation');
  }
  
  console.log('Schema test completed');
} catch (error) {
  console.error('Error testing schema:', error);
}