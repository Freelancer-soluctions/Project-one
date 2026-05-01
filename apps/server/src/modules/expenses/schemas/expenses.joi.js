import Joi from 'joi';

// {{ Expense Schemas START }}
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
  'OTHER',
];

export const expenseFiltersSchema = Joi.object({
  description: Joi.string().max(255).allow('').optional(),
  category: Joi.string().max(100).allow('').optional(),
  status: Joi.string()
    .valid(...expenseCategoryEnumValues)
    .allow('')
    .optional(),
  // Optional date filters
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().min(Joi.ref('fromDate')).optional(),
  // Optional total range filters
  minTotal: Joi.number().min(0).optional(),
  maxTotal: Joi.number()
    .when('minTotal', {
      is: Joi.exist(),
      then: Joi.number().min(Joi.ref('minTotal')),
      otherwise: Joi.number().min(0),
    })
    .optional(),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const expenseCreateUpdateSchema = Joi.object({
  description: Joi.string().max(255).required(),
  total: Joi.number().precision(2).positive().required(), // .positive() ensures it's > 0
  category: Joi.string()
    .valid(...expenseCategoryEnumValues)
    .required(),
});
// {{ Expense Schemas END }}
