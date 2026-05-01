import Joi from 'joi';

export const payrollFiltersSchema = Joi.object({
  employeeId: Joi.number().integer().allow(''),
  month: Joi.number().integer().min(1).max(12).allow(''),
  year: Joi.number().integer().min(1900).max(2100).allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const payrollCreateUpdateSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(1900).max(2100).required(),
  baseSalary: Joi.number().precision(2).positive().required(),
  extraHours: Joi.number().precision(2).min(0).required(),
  deductions: Joi.number().precision(2).min(0).required(),
  totalPayment: Joi.number().precision(2).positive().required(),
});
